const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')

// GET /api/areas
// Returns active observation areas for the user's org, ordered by order_index
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req

    const { data: areas, error } = await supabaseAdmin
      .from('observation_areas')
      .select('id, order_index, group_name, label, description')
      .eq('org_id', profile.org_id)
      .eq('is_active', true)
      .order('order_index')

    if (error) throw error

    res.json({ areas })
  } catch (err) {
    next(err)
  }
})

module.exports = router
