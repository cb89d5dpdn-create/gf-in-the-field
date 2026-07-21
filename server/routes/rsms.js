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

// GET /api/rsms/by-state/:state
// Returns all RSMs in a given state (same org), excluding the current FSM's own RSMs.
// Enriched with ONLY the visiting FSM's own observation stats.
// Used for the travelling FSM feature.
router.get('/by-state/:state', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { state } = req.params

    if (profile.role === 'admin') {
      return res.status(403).json({ error: 'Admins do not use the travelling feature' })
    }

    // All RSMs in requested state, same org, excluding this FSM's own
    const { data: rsms, error: rsmsError } = await supabaseAdmin
      .from('rsms')
      .select('id, name, state')
      .eq('org_id', profile.org_id)
      .eq('state', state)
      .neq('fsm_id', profile.id)
      .order('name')

    if (rsmsError) throw rsmsError

    // Enrich each RSM with ONLY this visiting FSM's own observations
    const enriched = await Promise.all(
      (rsms || []).map(async (rsm) => {
        const { data: obs } = await supabaseAdmin
          .from('observations')
          .select('id, visit_date, observation_scores(score)')
          .eq('org_id', profile.org_id)
          .eq('rsm_id', rsm.id)
          .eq('fsm_id', profile.id)
          .in('status', ['generated', 'sent'])
          .order('visit_date', { ascending: false })

        const total_visits = obs?.length || 0
        const last_visit_date = obs?.[0]?.visit_date || null

        let avg_score = null
        if (obs && obs.length > 0) {
          const obsAvgs = obs
            .map(o => {
              const scores = o.observation_scores?.map(s => s.score) || []
              if (!scores.length) return null
              return scores.reduce((a, b) => a + b, 0) / scores.length
            })
            .filter(a => a !== null)
          if (obsAvgs.length > 0) avg_score = obsAvgs.reduce((a, b) => a + b, 0) / obsAvgs.length
        }

        return { ...rsm, total_visits, last_visit_date, avg_score }
      })
    )

    res.json({ rsms: enriched })
  } catch (err) {
    next(err)
  }
})

// GET /api/rsms/:id/history
// Returns all observations for an RSM.
// Own FSM or admin: sees all observations.
// Visiting FSM (RSM belongs to a different FSM, same org): sees only their own observations.
router.get('/:id/history', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    // Verify RSM belongs to this org (any FSM in org can view — visiting support)
    const { data: rsm, error: rsmError } = await supabaseAdmin
      .from('rsms')
      .select('id, name, state, fsm_id')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single()

    if (rsmError || !rsm) return res.status(404).json({ error: 'RSM not found' })

    // Determine if this is a visiting FSM (not the assigned FSM, not admin)
    const isVisiting = profile.role !== 'admin' && rsm.fsm_id !== profile.id

    // Build observations query — visiting FSMs only see their own sessions
    let obsQuery = supabaseAdmin
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

    if (isVisiting) {
      obsQuery = obsQuery.eq('fsm_id', profile.id)
    }

    const { data: observations, error: obsError } = await obsQuery
    if (obsError) throw obsError

    // Build work_behind query — visiting FSMs only see their own
    let wbQuery = supabaseAdmin
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

    if (isVisiting) {
      wbQuery = wbQuery.eq('fsm_id', profile.id)
    }

    const { data: workBehind, error: wbError } = await wbQuery
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

    res.json({ rsm, observations: all, isVisiting })
  } catch (err) {
    next(err)
  }
})

module.exports = router
