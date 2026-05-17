const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')

// GET /api/dashboard
// Returns the FSM's profile + RSM cards with visit summary.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req

    // Admin redirect hint — admin should use /api/admin/overview
    if (profile.role === 'admin') {
      return res.json({ profile, rsms: [], isAdmin: true })
    }

    // Fetch RSMs for this FSM
    const { data: rsms, error: rsmsError } = await supabaseAdmin
      .from('rsms')
      .select('id, name, state')
      .eq('org_id', profile.org_id)
      .eq('fsm_id', profile.id)
      .order('name')

    if (rsmsError) throw rsmsError

    // For each RSM, get visit count + last visit avg score
    const enriched = await Promise.all(
      rsms.map(async (rsm) => {
        const { data: obs } = await supabaseAdmin
          .from('observations')
          .select('id, visit_date, observation_scores(score)')
          .eq('org_id', profile.org_id)
          .eq('rsm_id', rsm.id)
          .in('status', ['generated', 'sent'])
          .order('visit_date', { ascending: false })

        const total_visits = obs?.length || 0
        const last_visit_date = obs?.[0]?.visit_date || null

        let last_avg_score = null
        if (obs?.[0]?.observation_scores?.length > 0) {
          const scores = obs[0].observation_scores.map((s) => s.score)
          last_avg_score = scores.reduce((a, b) => a + b, 0) / scores.length
        }

        return { ...rsm, total_visits, last_visit_date, last_avg_score }
      })
    )

    res.json({ profile, rsms: enriched })
  } catch (err) {
    next(err)
  }
})

module.exports = router
