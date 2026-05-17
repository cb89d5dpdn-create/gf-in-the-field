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

    // Fetch observations with scores
    const { data: observations, error: obsError } = await supabaseAdmin
      .from('observations')
      .select(`
        id, visit_date, location, status, ai_summary, edited_summary,
        observation_scores(
          area_id, score, comments,
          observation_areas(label, group_name)
        )
      `)
      .eq('org_id', profile.org_id)
      .eq('rsm_id', id)
      .order('visit_date', { ascending: false })

    if (obsError) throw obsError

    // Compute avg score + flatten area labels for each observation
    const enriched = observations.map((obs) => {
      const scores = obs.observation_scores || []
      const avg_score = scores.length
        ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
        : null

      return {
        ...obs,
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

    res.json({ rsm, observations: enriched })
  } catch (err) {
    next(err)
  }
})

module.exports = router
