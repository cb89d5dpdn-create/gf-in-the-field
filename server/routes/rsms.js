const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')

// GET /api/rsms
// Returns FSM's RSMs (or all RSMs for admin)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req

    let query = supabaseAdmin
      .from('rsms')
      .select('id, name, state, email')
      .eq('org_id', profile.org_id)
      .order('name')

    if (profile.role !== 'admin') {
      query = query.eq('fsm_id', profile.id)
    }

    const { data: rsms, error } = await query
    if (error) throw error

    res.json({ rsms })
  } catch (err) {
    next(err)
  }
})

// GET /api/rsms/:id/history
// Returns all observations for an RSM — FSM must own the RSM (or be admin)
router.get('/:id/history', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    // Verify RSM belongs to this org (and FSM if not admin)
    let rsmQuery = supabaseAdmin
      .from('rsms')
      .select('id, name, state')
      .eq('id', id)
      .eq('org_id', profile.org_id)

    if (profile.role !== 'admin') {
      rsmQuery = rsmQuery.eq('fsm_id', profile.id)
    }

    const { data: rsm, error: rsmError } = await rsmQuery.single()
    if (rsmError || !rsm) return res.status(404).json({ error: 'RSM not found' })

    // Fetch regular observations with scores
    const { data: observations, error: obsError } = await supabaseAdmin
      .from('observations')
      .select(`
        id, visit_date, location, status, ai_summary, edited_summary, overall_comments,
        observation_scores(
          area_id, score, comments,
          observation_areas(label, group_name)
        ),
        fsm_profiles(name, state, role)
      `)
      .eq('org_id', profile.org_id)
      .eq('rsm_id', id)
      .order('visit_date', { ascending: false })

    if (obsError) throw obsError

    // Fetch Work Behind observations
    const { data: workBehind, error: wbError } = await supabaseAdmin
      .from('work_behind_observations')
      .select(`
        id, visit_date, location, status, edited_summary,
        overall_comments, compliance_score, compliance_notes,
        store_hygiene_score, store_hygiene_notes, aob_score, aob_notes,
        work_behind_images(id, public_url),
        fsm_profiles(name, state, role)
      `)
      .eq('org_id', profile.org_id)
      .eq('rsm_id', id)
      .order('visit_date', { ascending: false })

    if (wbError) throw wbError

    // Enrich regular observations
    const enriched = observations.map((obs) => {
      const scores = obs.observation_scores || []
      const avg_score = scores.length
        ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
        : null
      return {
        ...obs,
        kind: 'observation',
        avg_score,
        scores: scores.map((s) => ({
          area_id: s.area_id,
          score: s.score,
          comments: s.comments,
          area_label: s.observation_areas?.label,
          group_name: s.observation_areas?.group_name,
        })),
      }
    })

    // Enrich Work Behind observations
    const enrichedWB = (workBehind || []).map((wb) => {
      const sectionScores = [wb.compliance_score, wb.store_hygiene_score, wb.aob_score].filter(Boolean)
      const avg_score = sectionScores.length
        ? sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length
        : null
      return { ...wb, kind: 'work_behind', avg_score }
    })

    // Merge + sort by visit_date desc
    const all = [...enriched, ...enrichedWB].sort(
      (a, b) => new Date(b.visit_date) - new Date(a.visit_date)
    )

    res.json({ rsm, observations: all })
  } catch (err) {
    next(err)
  }
})

module.exports = router
