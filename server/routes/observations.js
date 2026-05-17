const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')
const Anthropic = require('@anthropic-ai/sdk')
const { Resend } = require('resend')

const SCORE_LABELS = {
  1: 'Needs Dev',
  2: 'Developing',
  3: 'Competent',
  4: 'Proficient',
  5: 'Expert',
}

// POST /api/observations — create draft
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    if (profile.role === 'admin') return res.status(403).json({ error: 'Admin cannot submit observations' })

    const { rsm_id, visit_date, location } = req.body
    if (!rsm_id || !visit_date) return res.status(400).json({ error: 'rsm_id and visit_date required' })

    // Verify RSM belongs to this FSM + org
    const { data: rsm, error: rsmError } = await supabaseAdmin
      .from('rsms')
      .select('id')
      .eq('id', rsm_id)
      .eq('org_id', profile.org_id)
      .eq('fsm_id', profile.id)
      .single()

    if (rsmError || !rsm) return res.status(404).json({ error: 'RSM not found' })

    const { data: observation, error } = await supabaseAdmin
      .from('observations')
      .insert({
        org_id: profile.org_id,
        fsm_id: profile.id,
        rsm_id,
        visit_date,
        location: location || null,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ observation })
  } catch (err) {
    next(err)
  }
})

// GET /api/observations/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    let query = supabaseAdmin
      .from('observations')
      .select(`
        id, visit_date, location, status, ai_summary, edited_summary,
        observation_scores(area_id, score, comments, observation_areas(label, group_name)),
        rsms(name)
      `)
      .eq('id', id)
      .eq('org_id', profile.org_id)

    if (profile.role !== 'admin') {
      query = query.eq('fsm_id', profile.id)
    }

    const { data: obs, error } = await query.single()
    if (error || !obs) return res.status(404).json({ error: 'Observation not found' })

    res.json({ observation: obs })
  } catch (err) {
    next(err)
  }
})

// PUT /api/observations/:id — update scores + comments
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params
    const { scores } = req.body // [{ area_id, score, comments }]

    if (profile.role === 'admin') return res.status(403).json({ error: 'Admin cannot update observations' })

    // Verify ownership
    const { data: obs, error: obsError } = await supabaseAdmin
      .from('observations')
      .select('id, status')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .eq('fsm_id', profile.id)
      .single()

    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    // Delete existing scores and re-insert
    await supabaseAdmin.from('observation_scores').delete().eq('observation_id', id)

    if (scores?.length) {
      const rows = scores.map((s) => ({
        observation_id: id,
        area_id: s.area_id,
        score: s.score,
        comments: s.comments || null,
      }))
      const { error: insertError } = await supabaseAdmin.from('observation_scores').insert(rows)
      if (insertError) throw insertError
    }

    // Update updated_at
    await supabaseAdmin
      .from('observations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/observations/:id/generate — trigger Claude AI summary
router.post('/:id/generate', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    if (profile.role === 'admin') return res.status(403).json({ error: 'Admin cannot generate summaries' })

    // Load full observation with scores
    const { data: obs, error: obsError } = await supabaseAdmin
      .from('observations')
      .select(`
        id, visit_date, location, status,
        rsms(name),
        observation_scores(
          score, comments,
          observation_areas(label, group_name, order_index)
        )
      `)
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .eq('fsm_id', profile.id)
      .single()

    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    const scores = obs.observation_scores
      .slice()
      .sort((a, b) => a.observation_areas.order_index - b.observation_areas.order_index)

    if (scores.length < 9) return res.status(400).json({ error: 'All 9 areas must be scored before generating' })

    // Build prompt
    const rsmName = obs.rsms.name
    const visitDate = new Date(obs.visit_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const locationStr = obs.location ? `, at ${obs.location}` : ''

    const prepScores = scores.filter((s) => s.observation_areas.group_name === 'Visit Prep & Data')
    const storeScores = scores.filter((s) => s.observation_areas.group_name === 'In-Store')

    const prepAvg = prepScores.reduce((sum, s) => sum + s.score, 0) / prepScores.length
    const storeAvg = storeScores.reduce((sum, s) => sum + s.score, 0) / storeScores.length
    const overallAvg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length

    const formatScores = (arr) =>
      arr.map((s) => `Area: ${s.observation_areas.label} | Score: ${s.score}/5 (${SCORE_LABELS[s.score]}) | Comments: "${s.comments || 'None'}"`)
        .join('\n')

    const userPrompt = `You have just completed a field observation with ${rsmName} on ${visitDate}${locationStr}.

The observation covers two phases: Visit Prep & Data (pre-store preparation) and In-Store (performance during the visit).

VISIT PREP & DATA
${formatScores(prepScores)}

IN-STORE
${formatScores(storeScores)}

Overall average: ${overallAvg.toFixed(1)}/5
Visit Prep & Data average: ${prepAvg.toFixed(1)}/5
In-Store average: ${storeAvg.toFixed(1)}/5

Write a coaching summary (3–4 paragraphs) that:
1. Opens with an overall read of the visit (reference both phases if they differ)
2. Calls out genuine strengths (4–5 scores) by name, with reference to comments
3. Names 1–2 development areas (lowest scores) as opportunities, not criticisms
4. Closes with a specific, observable coaching focus for next visit

Tone by average: 1.0–2.4 empathetic/honest | 2.5–3.4 balanced | 3.5–4.4 encouraging/high standards | 4.5–5.0 reinforcing excellence
Rules: Connected paragraphs only. No bullets. No "overall", "in conclusion", "moving forward".
If prep vs in-store averages differ by >1.0 point, name that contrast — it's the key insight.`

    const systemPrompt = `You are an expert field sales coach writing a post-visit coaching summary for a Regional Sales Manager in an FMCG field sales team.

Your tone is direct, professional, and constructive — like a respected leader who genuinely wants to develop their team.

You never use corporate jargon or filler phrases.

Write in second person ("you demonstrated", "your approach to...").

This summary is for the Field Sales Manager's coaching records only — it is a development tool, not a formal performance review.`

    // Call Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const summary = message.content[0].text

    // Save AI summary + update status
    await supabaseAdmin
      .from('observations')
      .update({ ai_summary: summary, status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', id)

    // Return observation scores with labels for review screen
    const scoredAreas = scores.map((s) => ({
      area_id: s.observation_areas.id,
      area_label: s.observation_areas.label,
      group_name: s.observation_areas.group_name,
      score: s.score,
      comments: s.comments,
    }))

    res.json({
      summary,
      observation: {
        id,
        rsm_name: rsmName,
        visit_date: obs.visit_date,
        location: obs.location,
        scores: scoredAreas,
        overall_avg: overallAvg,
        prep_avg: prepAvg,
        store_avg: storeAvg,
      },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/observations/:id/send — save edited summary + send email
router.post('/:id/send', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params
    const { edited_summary } = req.body

    if (profile.role === 'admin') return res.status(403).json({ error: 'Admin cannot send observations' })

    // Load full observation
    const { data: obs, error: obsError } = await supabaseAdmin
      .from('observations')
      .select(`
        id, visit_date, location, ai_summary,
        rsms(name),
        observation_scores(
          score,
          observation_areas(label, group_name, order_index)
        )
      `)
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .eq('fsm_id', profile.id)
      .single()

    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    const finalSummary = edited_summary || obs.ai_summary
    if (!finalSummary) return res.status(400).json({ error: 'No summary to send' })

    const scores = obs.observation_scores
      .slice()
      .sort((a, b) => a.observation_areas.order_index - b.observation_areas.order_index)

    const prepScores = scores.filter((s) => s.observation_areas.group_name === 'Visit Prep & Data')
    const storeScores = scores.filter((s) => s.observation_areas.group_name === 'In-Store')

    const prepAvg = prepScores.reduce((sum, s) => sum + s.score, 0) / prepScores.length
    const storeAvg = storeScores.reduce((sum, s) => sum + s.score, 0) / storeScores.length
    const overallAvg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length

    const visitDate = new Date(obs.visit_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const rsmName = obs.rsms.name

    const formatScoreBlock = (arr) =>
      arr.map((s) => `${s.observation_areas.label.padEnd(25)} ${s.score}/5 — ${SCORE_LABELS[s.score]}`).join('\n')

    const emailText = `Hi ${profile.name},

Here is your coaching summary from today's field visit.

───────────────────────────────
RSM:      ${rsmName}
Date:     ${visitDate}
Location: ${obs.location || 'Not recorded'}
───────────────────────────────

VISIT PREP & DATA
${formatScoreBlock(prepScores)}
Group Average: ${prepAvg.toFixed(1)}/5

IN-STORE
${formatScoreBlock(storeScores)}
Group Average: ${storeAvg.toFixed(1)}/5

Overall Average: ${overallAvg.toFixed(1)}/5

───────────────────────────────
COACHING SUMMARY

${finalSummary}

───────────────────────────────
GF In The Field — gfinthefield.com.au`

    // Get FSM email from Supabase Auth
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(req.user.id)
    const fsmEmail = user.email

    // Send via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'coach@gfinthefield.com.au',
      to: fsmEmail,
      subject: `GF In The Field | Coaching Observation — ${rsmName} — ${visitDate}`,
      text: emailText,
    })

    // Update observation status
    await supabaseAdmin
      .from('observations')
      .update({
        edited_summary: finalSummary,
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
