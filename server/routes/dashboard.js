const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')

// GET /api/dashboard
// Returns the FSM's profile + RSM cards with visit summary.
// For admins: returns FSMs with nested RSMs. For regular FSMs: flat RSM list.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req

    if (profile.role === 'admin') {
      // Admin view: group RSMs by FSM
      const { data: fsms, error: fsmsError } = await supabaseAdmin
        .from('fsm_profiles')
        .select('id, name, state')
        .eq('org_id', profile.org_id)
        .eq('role', 'fsm')
        .order('name')

      if (fsmsError) throw fsmsError

      // For each FSM, get their RSMs with visit data
      const enrichedFsms = await Promise.all(
        fsms.map(async (fsm) => {
          const { data: rsms } = await supabaseAdmin
            .from('rsms')
            .select('id, name, state')
            .eq('org_id', profile.org_id)
            .eq('fsm_id', fsm.id)
            .order('name')

          // Enrich each RSM with visit stats
          const enrichedRsms = await Promise.all(
            (rsms || []).map(async (rsm) => {
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

          return { ...fsm, rsms: enrichedRsms }
        })
      )

      res.json({ profile, fsms: enrichedFsms })
    } else {
      // Regular FSM view: flat RSM list
      const { data: rsms, error: rsmsError } = await supabaseAdmin
        .from('rsms')
        .select('id, name, state')
        .eq('org_id', profile.org_id)
        .eq('fsm_id', profile.id)
        .order('name')

      if (rsmsError) throw rsmsError

      // Enrich with visit stats
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
    }
  } catch (err) {
    next(err)
  }
})

module.exports = router
