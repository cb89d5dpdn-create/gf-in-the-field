const router = require('express').Router()
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')

// All analytics routes require auth + admin role
router.use(requireAuth, requireAdmin)

// GET /api/admin/analytics/state-trends
// Returns weekly avg scores per state over time
router.get('/analytics/state-trends', async (req, res, next) => {
  try {
    const { profile } = req

    const { data, error } = await supabaseAdmin.rpc('analytics_state_trends', {
      p_org_id: profile.org_id,
    })

    if (error) throw error

    res.json({ trends: data || [] })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/analytics/rsm-trend/:rsmId
// Returns per-visit avg score for a single RSM
router.get('/analytics/rsm-trend/:rsmId', async (req, res, next) => {
  try {
    const { profile } = req
    const { rsmId } = req.params

    // Verify RSM belongs to this org before querying
    const { data: rsm, error: rsmError } = await supabaseAdmin
      .from('rsms')
      .select('id, name')
      .eq('id', rsmId)
      .eq('org_id', profile.org_id)
      .single()

    if (rsmError || !rsm) {
      return res.status(404).json({ error: 'RSM not found' })
    }

    const { data, error } = await supabaseAdmin.rpc('analytics_rsm_trend', {
      p_rsm_id: rsmId,
      p_org_id: profile.org_id,
    })

    if (error) throw error

    res.json({ rsm, visits: data || [] })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/analytics/category-breakdown
// Avg score by active area label, optionally filtered by state or rsmId
router.get('/analytics/category-breakdown', async (req, res, next) => {
  try {
    const { profile } = req
    const { state, rsmId } = req.query

    const { data, error } = await supabaseAdmin.rpc('analytics_category_breakdown', {
      p_org_id: profile.org_id,
      p_state:  state  || null,
      p_rsm_id: rsmId  || null,
    })

    if (error) throw error

    res.json({ breakdown: data || [] })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/analytics/trend-summary
// Trend direction (improving / flat / declining) per state and RSM
router.get('/analytics/trend-summary', async (req, res, next) => {
  try {
    const { profile } = req

    const { data, error } = await supabaseAdmin.rpc('analytics_trend_summary', {
      p_org_id: profile.org_id,
    })

    if (error) throw error

    // data is a JSON object: { states: [...], rsms: [...] }
    res.json(data || { states: [], rsms: [] })
  } catch (err) {
    next(err)
  }
})

module.exports = router
