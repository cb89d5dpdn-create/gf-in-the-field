const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')

// GET /api/dashboard
// Returns the FSM's profile + RSM cards with visit summary.
// For admins: returns FSMs with nested RSMs. For regular FSMs: flat RSM list.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req

    // Calculate YTD and MTD date boundaries
    const now = new Date()
    const ytdStart = `${now.getFullYear()}-01-01`
    const mtdStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    if (profile.role === 'admin') {
      // Admin view: group RSMs by FSM
      const { data: fsms, error: fsmsError } = await supabaseAdmin
        .from('fsm_profiles')
        .select('id, name, state')
        .eq('org_id', profile.org_id)
        .eq('role', 'fsm')
        .order('name')

      if (fsmsError) throw fsmsError

      // For each FSM, get their RSMs with visit data + YTD/MTD counts
      const enrichedFsms = await Promise.all(
        fsms.map(async (fsm) => {
          const { data: rsms } = await supabaseAdmin
            .from('rsms')
            .select('id, name, state')
            .eq('org_id', profile.org_id)
            .eq('fsm_id', fsm.id)
            .order('name')

          // Get all observations for this FSM's RSMs (for YTD/MTD counts)
          const rsmIds = (rsms || []).map(r => r.id)
          
          // YTD/MTD: only count observations this FSM personally submitted
          const { data: allObs } = await supabaseAdmin
            .from('observations')
            .select('id, visit_date')
            .eq('org_id', profile.org_id)
            .eq('fsm_id', fsm.id)
            .in('status', ['generated', 'sent'])

          const ytdCount = (allObs || []).filter(o => o.visit_date >= ytdStart).length
          const mtdCount = (allObs || []).filter(o => o.visit_date >= mtdStart).length

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

              // Calculate overall average across ALL observations (not just last one)
              let avg_score = null
              if (obs && obs.length > 0) {
                const observationAverages = obs.map(observation => {
                  const scores = observation.observation_scores?.map(s => s.score) || []
                  if (scores.length === 0) return null
                  return scores.reduce((a, b) => a + b, 0) / scores.length
                }).filter(avg => avg !== null)

                if (observationAverages.length > 0) {
                  avg_score = observationAverages.reduce((a, b) => a + b, 0) / observationAverages.length
                }
              }

              return { ...rsm, total_visits, last_visit_date, avg_score }
            })
          )

          // WBO count — only this FSM's own work behind observations
          const { count: wboCount } = await supabaseAdmin
            .from('work_behind_observations')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', profile.org_id)
            .eq('fsm_id', fsm.id)
            .in('status', ['sent', 'generated'])

          return { ...fsm, rsms: enrichedRsms, ytd_count: ytdCount, mtd_count: mtdCount, wbo_count: wboCount || 0 }
        })
      )

      // Calculate total YTD/MTD for admin profile display
      const adminYtd = enrichedFsms.reduce((sum, f) => sum + f.ytd_count, 0)
      const adminMtd = enrichedFsms.reduce((sum, f) => sum + f.mtd_count, 0)

      res.json({ profile: { ...profile, ytd_count: adminYtd, mtd_count: adminMtd }, fsms: enrichedFsms })
    } else {
      // Regular FSM view: flat RSM list
      const { data: rsms, error: rsmsError } = await supabaseAdmin
        .from('rsms')
        .select('id, name, state')
        .eq('org_id', profile.org_id)
        .eq('fsm_id', profile.id)
        .order('name')

      if (rsmsError) throw rsmsError

      // Get all observations for YTD/MTD counts
      const rsmIds = rsms.map(r => r.id)
      const { data: allObs } = rsmIds.length > 0 ? await supabaseAdmin
        .from('observations')
        .select('id, visit_date')
        .eq('org_id', profile.org_id)
        .in('rsm_id', rsmIds)
        .in('status', ['generated', 'sent']) : { data: [] }

      const ytdCount = (allObs || []).filter(o => o.visit_date >= ytdStart).length
      const mtdCount = (allObs || []).filter(o => o.visit_date >= mtdStart).length

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

          // Calculate overall average across ALL observations (not just last one)
          let avg_score = null
          if (obs && obs.length > 0) {
            const observationAverages = obs.map(observation => {
              const scores = observation.observation_scores?.map(s => s.score) || []
              if (scores.length === 0) return null
              return scores.reduce((a, b) => a + b, 0) / scores.length
            }).filter(avg => avg !== null)

            if (observationAverages.length > 0) {
              avg_score = observationAverages.reduce((a, b) => a + b, 0) / observationAverages.length
            }
          }

          return { ...rsm, total_visits, last_visit_date, avg_score }
        })
      )

      // WBO count for this FSM
      const { count: wboCount } = await supabaseAdmin
        .from('work_behind_observations')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .eq('fsm_id', profile.id)
        .in('status', ['sent', 'generated'])

      res.json({ profile: { ...profile, ytd_count: ytdCount, mtd_count: mtdCount, wbo_count: wboCount || 0 }, rsms: enriched })
    }
  } catch (err) {
    next(err)
  }
})

module.exports = router
