const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')
const { Resend } = require('resend')
const Anthropic = require('@anthropic-ai/sdk')
const { logUsage } = require('../lib/logUsage')

const SCORE_LABELS = { 1: 'Needs Dev', 2: 'Developing', 3: 'Competent', 4: 'Proficient', 5: 'Expert' }
const scoreStr = (s) => s ? `${s}/5 — ${SCORE_LABELS[s]}` : 'Not scored'

// POST /api/work-behind — create draft
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { rsm_id, visit_date, location } = req.body
    if (!rsm_id || !visit_date) return res.status(400).json({ error: 'rsm_id and visit_date required' })

    // Any FSM in the org can coach any RSM (visiting support)
    const rsmQuery = supabaseAdmin.from('rsms').select('id').eq('id', rsm_id).eq('org_id', profile.org_id)
    const { data: rsm, error: rsmError } = await rsmQuery.single()
    if (rsmError || !rsm) return res.status(404).json({ error: 'RSM not found' })

    const { data: observation, error } = await supabaseAdmin
      .from('work_behind_observations')
      .insert({ org_id: profile.org_id, fsm_id: profile.id, rsm_id, visit_date, location: location || null, status: 'draft' })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ observation })
  } catch (err) {
    next(err)
  }
})

// PUT /api/work-behind/:id — update notes + scores (save draft)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params
    const {
      overall_comments,
      compliance_score, compliance_notes,
      store_hygiene_score, store_hygiene_notes,
      aob_score, aob_notes,
    } = req.body

    let query = supabaseAdmin.from('work_behind_observations').select('id').eq('id', id).eq('org_id', profile.org_id)
    if (profile.role !== 'admin') query = query.eq('fsm_id', profile.id)
    const { data: obs, error: obsError } = await query.single()
    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    await supabaseAdmin.from('work_behind_observations').update({
      overall_comments: overall_comments || null,
      compliance_score: compliance_score || null,
      compliance_notes: compliance_notes || null,
      store_hygiene_score: store_hygiene_score || null,
      store_hygiene_notes: store_hygiene_notes || null,
      aob_score: aob_score || null,
      aob_notes: aob_notes || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/work-behind/:id/generate — Claude AI summary
router.post('/:id/generate', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    let query = supabaseAdmin
      .from('work_behind_observations')
      .select('*, rsms(name)')
      .eq('id', id)
      .eq('org_id', profile.org_id)
    if (profile.role !== 'admin') query = query.eq('fsm_id', profile.id)

    const { data: obs, error: obsError } = await query.single()
    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    const visitDate = new Date(obs.visit_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const rsmName = obs.rsms.name
    const locationStr = obs.location ? ` at ${obs.location}` : ''

    const scores = [obs.compliance_score, obs.store_hygiene_score, obs.aob_score].filter(Boolean)
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null

    const userPrompt = `You are summarising a Work Behind store observation completed by a Field Sales Manager (FSM).

This was a solo visit — the RSM was NOT present. The FSM observed the store independently.

VISIT DETAILS
RSM: ${rsmName}
Date: ${visitDate}${locationStr}
${avg ? `Overall average: ${avg}/5` : ''}

OVERALL VISIT COMMENTS (FSM's own notes)
${obs.overall_comments || 'None provided'}

SECTION 1 — COMPLIANCE (Planogram / Off Locations / Tickets / Campaigns)
Score: ${scoreStr(obs.compliance_score)}
Notes: ${obs.compliance_notes || 'None'}

SECTION 2 — STORE HYGIENE (POS Visuals / Product Placement / Stock Rotation)
Score: ${scoreStr(obs.store_hygiene_score)}
Notes: ${obs.store_hygiene_notes || 'None'}

SECTION 3 — COMPETITOR ACTIVITY (Off Locations / Share of Shelf / Activations)
Score: ${scoreStr(obs.aob_score)}
Notes: ${obs.aob_notes || 'None'}

Write a short, professional Work Behind observation email summary. Use the following guidelines:

TONE & LANGUAGE
• Written from the FSM's first-person perspective ("I observed", "When I visited I noticed", "I would suggest", "This needs to be addressed on your next visit")
• Observational and direct — this is a compliance/inspection report, not a coaching summary
• Warm but clear about what needs attention
• Reference the RSM by name once at the opening

FORMAT
• 3–5 bullet points only (no long paragraphs)
• Each bullet = one clear observation or action item
• Lead bullets with the strongest observations first
• End with one forward-looking action bullet: what the RSM should do on their next store visit

RULES
• Use the FSM's own notes as the primary source — do not fabricate detail
• Do not include scores or numerical ratings in the output
• Keep it brief — 5 bullets max, concise prose within each
• No corporate jargon or filler phrases`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 600,
      system: `You are helping a Field Sales Manager write a clear, professional Work Behind store observation summary. Your output is the bullet point body of an email — no subject line, no greeting, no sign-off. Just the bullet points. Start directly with the first bullet.`,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const summary = message.content[0].text

    // Log usage (fire-and-forget)
    logUsage({ orgId: profile.org_id, fsmId: profile.id, type: 'work_behind', model: 'claude-sonnet-4-5-20250929', usage: message.usage })

    // Save the AI summary
    await supabaseAdmin.from('work_behind_observations').update({
      edited_summary: summary,
      status: 'generated',
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    res.json({ summary })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/work-behind/:id — delete a work behind observation
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    let query = supabaseAdmin
      .from('work_behind_observations')
      .select('id')
      .eq('id', id)
      .eq('org_id', profile.org_id)
    if (profile.role !== 'admin') query = query.eq('fsm_id', profile.id)
    const { data: obs, error: obsError } = await query.single()
    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    // Delete images from storage first
    const { data: images } = await supabaseAdmin
      .from('work_behind_images')
      .select('storage_path')
      .eq('observation_id', id)
    if (images?.length) {
      await supabaseAdmin.storage.from('work-behind-images').remove(images.map(i => i.storage_path))
    }

    // Delete observation (cascade handles work_behind_images rows)
    const { error: delError } = await supabaseAdmin
      .from('work_behind_observations')
      .delete()
      .eq('id', id)
    if (delError) throw delError

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/work-behind/:id/images — save image record after client-side upload
router.post('/:id/images', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params
    const { storage_path, public_url } = req.body
    if (!storage_path || !public_url) return res.status(400).json({ error: 'storage_path and public_url required' })

    let query = supabaseAdmin.from('work_behind_observations').select('id').eq('id', id).eq('org_id', profile.org_id)
    if (profile.role !== 'admin') query = query.eq('fsm_id', profile.id)
    const { data: obs, error: obsError } = await query.single()
    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    const { data: image, error } = await supabaseAdmin
      .from('work_behind_images')
      .insert({ observation_id: id, storage_path, public_url })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ image })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/work-behind/:id/images/:imageId
router.delete('/:id/images/:imageId', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id, imageId } = req.params

    let query = supabaseAdmin.from('work_behind_observations').select('id').eq('id', id).eq('org_id', profile.org_id)
    if (profile.role !== 'admin') query = query.eq('fsm_id', profile.id)
    const { data: obs, error: obsError } = await query.single()
    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    const { data: img } = await supabaseAdmin.from('work_behind_images').select('storage_path').eq('id', imageId).single()
    if (img) {
      await supabaseAdmin.storage.from('work-behind-images').remove([img.storage_path])
      await supabaseAdmin.from('work_behind_images').delete().eq('id', imageId)
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/work-behind/:id/send — email with AI summary + image attachments
router.post('/:id/send', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params
    const { edited_summary } = req.body

    let query = supabaseAdmin
      .from('work_behind_observations')
      .select('*, rsms(name), work_behind_images(id, public_url, storage_path)')
      .eq('id', id)
      .eq('org_id', profile.org_id)
    if (profile.role !== 'admin') query = query.eq('fsm_id', profile.id)

    const { data: obs, error: obsError } = await query.single()
    if (obsError || !obs) return res.status(404).json({ error: 'Observation not found' })

    if (!edited_summary) return res.status(400).json({ error: 'No summary to send' })

    const visitDate = new Date(obs.visit_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const rsmName = obs.rsms.name
    const images = obs.work_behind_images || []

    const scores = [obs.compliance_score, obs.store_hygiene_score, obs.aob_score].filter(Boolean)
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null

    const emailText = [
      `Hi ${profile.name},`,
      '',
      `Here is your Work Behind observation summary from ${visitDate}.`,
      '',
      '───────────────────────────────',
      `RSM:      ${rsmName}`,
      `Date:     ${visitDate}`,
      `Location: ${obs.location || 'Not recorded'}`,
      avg ? `Average:  ${avg}/5` : '',
      '───────────────────────────────',
      '',
      'WORK BEHIND OBSERVATION',
      '',
      edited_summary,
      '',
      '───────────────────────────────',
      `Scores`,
      `• Compliance:    ${scoreStr(obs.compliance_score)}`,
      `• Store Hygiene: ${scoreStr(obs.store_hygiene_score)}`,
      `• Competitor Activity: ${scoreStr(obs.aob_score)}`,
      '',
      '───────────────────────────────',
      images.length ? `📷 ${images.length} photo${images.length > 1 ? 's' : ''} attached` : '',
      '',
      'GF In The Field — gfinthefield.com.au',
    ].filter((l) => l !== undefined).join('\n')

    // Download images and build Resend attachments
    const attachments = []
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      try {
        const { data: fileData, error: dlError } = await supabaseAdmin.storage
          .from('work-behind-images')
          .download(img.storage_path)
        if (dlError) { console.error('Image download error:', dlError); continue }
        const buffer = Buffer.from(await fileData.arrayBuffer())
        const ext = img.storage_path.split('.').pop() || 'jpg'
        attachments.push({
          filename: `photo-${i + 1}.${ext}`,
          content: buffer.toString('base64'),
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          disposition: 'attachment',
        })
      } catch (e) {
        console.error('Failed to attach image:', e)
      }
    }

    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(req.user.id)
    const fsmEmail = user.email

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'coach@gfinthefield.com.au',
      to: fsmEmail,
      subject: `GF In The Field | Work Behind — ${rsmName} — ${visitDate}`,
      text: emailText,
      attachments: attachments.length ? attachments : undefined,
    })

    await supabaseAdmin.from('work_behind_observations').update({
      edited_summary,
      status: 'sent',
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
