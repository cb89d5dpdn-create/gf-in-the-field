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

    const { rsm_id, visit_date, location } = req.body
    if (!rsm_id || !visit_date) return res.status(400).json({ error: 'rsm_id and visit_date required' })

    // Verify RSM belongs to org (admin can access any RSM, FSM only their own)
    let rsmQuery = supabaseAdmin
      .from('rsms')
      .select('id')
      .eq('id', rsm_id)
      .eq('org_id', profile.org_id)

    if (profile.role !== 'admin') {
      rsmQuery = rsmQuery.eq('fsm_id', profile.id)
    }

    const { data: rsm, error: rsmError } = await rsmQuery.single()

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
        id, visit_date, location, status, ai_summary, edited_summary, overall_comments,
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

// PUT /api/observations/:id — update scores + comments + overall_comments (save draft)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params
    const { scores, overall_comments } = req.body // [{ area_id, score, comments }], overall_comments

    // Verify ownership (admin can access any, FSM only their own)
    let obsQuery = supabaseAdmin
      .from('observations')
      .select('id, status')
      .eq('id', id)
      .eq('org_id', profile.org_id)

    if (profile.role !== 'admin') {
      obsQuery = obsQuery.eq('fsm_id', profile.id)
    }

    const { data: obs, error: obsError } = await obsQuery.single()

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

    // Update overall_comments and updated_at
    await supabaseAdmin
      .from('observations')
      .update({
        overall_comments: overall_comments || null,
        updated_at: new Date().toISOString()
      })
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

    // Load full observation with scores + overall_comments (admin can access any)
    let genQuery = supabaseAdmin
      .from('observations')
      .select(`
        id, visit_date, location, status, overall_comments,
        rsms(name),
        observation_scores(
          score, comments,
          observation_areas(id, label, group_name, order_index)
        )
      `)
      .eq('id', id)
      .eq('org_id', profile.org_id)

    if (profile.role !== 'admin') {
      genQuery = genQuery.eq('fsm_id', profile.id)
    }

    const { data: obs, error: obsError } = await genQuery.single()

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

    // Build overall comments section if present
    const overallCommentsSection = obs.overall_comments
      ? `\n\nOVERALL VISIT COMMENTS (FSM)\n${obs.overall_comments}\n\n⚠️ CRITICAL: The FSM's overall comments above are the PRIMARY SOURCE for your summary. Use their language, observations, and specific examples. The scores below provide context, but the FSM's written comments should drive 70-80% of your content.`
      : ''

    const userPrompt = `You have just completed a field observation with ${rsmName} on ${visitDate}${locationStr}.

The observation covers two phases: Visit Prep & Data (pre-store preparation) and In-Store (performance during the visit).${overallCommentsSection}

VISIT PREP & DATA
${formatScores(prepScores)}

IN-STORE
${formatScores(storeScores)}

Overall average: ${overallAvg.toFixed(1)}/5
Visit Prep & Data average: ${prepAvg.toFixed(1)}/5
In-Store average: ${storeAvg.toFixed(1)}/5

Write a coaching summary (3–4 paragraphs) that:
1. Opens with an overall observation of the visit (reference both phases if they differ)
2. Recognizes genuine strengths by name — HEAVILY reference the FSM's written comments and use their specific examples
3. Identifies 1–2 growth opportunities as observations for future development — use the FSM's language and observations
4. Closes with a collaborative coaching focus for next visit

⚠️ WRITING RULES:
• Use the FSM's own words, phrases, and specific examples from their comments — this is 70-80% of your content
• Scores provide context only — the FSM's written observations are the primary source
• When FSM comments are detailed, reflect their observations closely
• When FSM comments are brief, you may expand slightly but stay grounded in what they wrote
• Connected paragraphs only. No bullets in output.
• Use "observations" and "opportunities" language
• Tone by average: 1.0–2.4 supportive/developmental | 2.5–3.4 balanced/constructive | 3.5–4.4 affirming/building capability | 4.5–5.0 reinforcing strong performance`

    const systemPrompt = `You are an expert field sales coach writing a post-visit coaching summary for a Regional Sales Manager in an FMCG field sales team.

Your primary job is to synthesize and professionally present the Field Sales Manager's own observations and comments. You are translating their field notes into a polished coaching summary — NOT generating new insights.

Your tone is warm, professional, and developmental — like a respected mentor who sees potential and wants to help unlock it.

You frame feedback as observations and opportunities for growth, not criticisms or deficiencies.

You never use corporate jargon or filler phrases.

Write in second person ("you demonstrated", "your approach to...").

CRITICAL: When the FSM has written detailed comments, use their language, specific examples, and observations as the foundation of your summary. The scores provide context, but the FSM's words are your primary source material.`

    // Call Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
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

// DELETE /api/observations/:id — delete observation
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    // Verify ownership (admin can delete any, FSM only their own)
    let obsQuery = supabaseAdmin
      .from('observations')
      .select('id')
      .eq('id', id)
      .eq('org_id', profile.org_id)

    if (profile.role !== 'admin') {
      obsQuery = obsQuery.eq('fsm_id', profile.id)
    }

    const { data: obs, error: obsError } = await obsQuery.single()

    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    // Delete (cascade will handle observation_scores)
    const { error: deleteError } = await supabaseAdmin
      .from('observations')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    res.json({ success: true })
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

    // Load full observation (admin can access any)
    let sendQuery = supabaseAdmin
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

    if (profile.role !== 'admin') {
      sendQuery = sendQuery.eq('fsm_id', profile.id)
    }

    const { data: obs, error: obsError } = await sendQuery.single()

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

    // Build RSM-friendly summary (no numeric scores shown to RSM)
    // Identify 1-2 key focus areas based on lowest scores
    const allScoresWithLabels = scores.map(s => ({
      label: s.observation_areas.label,
      score: s.score
    })).sort((a, b) => a.score - b.score)
    
    const focusArea1 = allScoresWithLabels[0]
    const focusArea2 = allScoresWithLabels[1]
    
    const emailText = `Hi ${profile.name},

Here is your coaching summary from today's field visit.

───────────────────────────────
RSM:      ${rsmName}
Date:     ${visitDate}
Location: ${obs.location || 'Not recorded'}
───────────────────────────────

KEY FOCUS AREAS FOR DEVELOPMENT
• ${focusArea1.label}
• ${focusArea2.label}

───────────────────────────────
COACHING SUMMARY

${finalSummary}

───────────────────────────────
GF In The Field — gfinthefield.com.au

Note: Detailed scoring metrics are available in your FSM dashboard for tracking purposes.`

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
