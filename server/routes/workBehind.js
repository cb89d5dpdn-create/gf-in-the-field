const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')
const { Resend } = require('resend')

const SCORE_LABELS = { 1: 'Needs Dev', 2: 'Developing', 3: 'Competent', 4: 'Proficient', 5: 'Expert' }
const scoreStr = (s) => s ? `${s}/5 — ${SCORE_LABELS[s]}` : 'Not scored'

// POST /api/work-behind — create draft
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { rsm_id, visit_date, location } = req.body
    if (!rsm_id || !visit_date) return res.status(400).json({ error: 'rsm_id and visit_date required' })

    let rsmQuery = supabaseAdmin.from('rsms').select('id').eq('id', rsm_id).eq('org_id', profile.org_id)
    if (profile.role !== 'admin') rsmQuery = rsmQuery.eq('fsm_id', profile.id)
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

// POST /api/work-behind/:id/send — email with scores + image attachments
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

    const visitDate = new Date(obs.visit_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const rsmName = obs.rsms.name
    const finalSummary = edited_summary || ''
    const images = obs.work_behind_images || []

    const scores = [obs.compliance_score, obs.store_hygiene_score, obs.aob_score].filter(Boolean)
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null

    const emailText = [
      `Hi ${profile.name},`,
      '',
      `Here is your Work Behind observation from today's field visit.`,
      '',
      '───────────────────────────────',
      `RSM:      ${rsmName}`,
      `Date:     ${visitDate}`,
      `Location: ${obs.location || 'Not recorded'}`,
      avg ? `Average:  ${avg}/5` : '',
      '───────────────────────────────',
      '',
      'OVERALL VISIT COMMENTS',
      obs.overall_comments || '(No overall comments recorded)',
      '',
      '───────────────────────────────',
      '',
      '1. COMPLIANCE',
      'Planogram · Off Locations · Tickets · Campaigns',
      `Score: ${scoreStr(obs.compliance_score)}`,
      '',
      obs.compliance_notes || '(No notes recorded)',
      '',
      '───────────────────────────────',
      '',
      '2. STORE HYGIENE',
      'POS Visuals · Product Placement · Stock Rotation',
      `Score: ${scoreStr(obs.store_hygiene_score)}`,
      '',
      obs.store_hygiene_notes || '(No notes recorded)',
      '',
      '───────────────────────────────',
      '',
      '3. ANY OTHER BUSINESS',
      `Score: ${scoreStr(obs.aob_score)}`,
      '',
      obs.aob_notes || '(No notes recorded)',
      finalSummary ? '\n───────────────────────────────\nADDITIONAL NOTES\n\n' + finalSummary : '',
      '',
      '───────────────────────────────',
      images.length ? `📷 ${images.length} photo${images.length > 1 ? 's' : ''} attached` : '',
      '',
      'GF In The Field — gfinthefield.com.au',
    ].filter((line) => line !== undefined).join('\n')

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
      edited_summary: finalSummary || null,
      status: 'sent',
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
