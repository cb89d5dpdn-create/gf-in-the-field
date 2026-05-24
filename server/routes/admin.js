const router = require('express').Router()
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin)

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { profile } = req

    // Get all FSMs with their auth emails
    const { data: fsmProfiles } = await supabaseAdmin
      .from('fsm_profiles')
      .select('id, user_id, name, state, role')
      .eq('org_id', profile.org_id)
      .order('name')

    const fsms = await Promise.all(
      (fsmProfiles || []).map(async (fsm) => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(fsm.user_id)
        return {
          id: fsm.id,
          name: fsm.name,
          email: user?.email || 'N/A',
          state: fsm.state,
          role: fsm.role,
        }
      })
    )

    // Get all RSMs with their FSM assignments
    const { data: rsms } = await supabaseAdmin
      .from('rsms')
      .select('id, name, state, email, fsm_id, fsm_profiles(name)')
      .eq('org_id', profile.org_id)
      .order('name')

    const enrichedRsms = (rsms || []).map((rsm) => ({
      id: rsm.id,
      name: rsm.name,
      email: rsm.email || null,
      state: rsm.state,
      fsm_id: rsm.fsm_id,
      fsm_name: rsm.fsm_profiles?.name || null,
    }))

    res.json({ fsms, rsms: enrichedRsms })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/overview
router.get('/overview', async (req, res, next) => {
  try {
    const { profile } = req

    const { data: obs } = await supabaseAdmin
      .from('observations')
      .select('id, observation_scores(score)')
      .eq('org_id', profile.org_id)
      .in('status', ['generated', 'sent'])

    const total_visits = obs?.length || 0

    let avg_score = null
    if (total_visits > 0) {
      const allScores = obs.flatMap((o) => o.observation_scores.map((s) => s.score))
      avg_score = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null
    }

    const { data: rsms } = await supabaseAdmin
      .from('rsms')
      .select('id')
      .eq('org_id', profile.org_id)

    // Most active FSM
    const { data: fsmActivity } = await supabaseAdmin
      .from('observations')
      .select('fsm_id, fsm_profiles(name)')
      .eq('org_id', profile.org_id)
      .in('status', ['generated', 'sent'])

    let most_active_fsm = null
    if (fsmActivity?.length) {
      const counts = {}
      const names = {}
      fsmActivity.forEach((o) => {
        counts[o.fsm_id] = (counts[o.fsm_id] || 0) + 1
        names[o.fsm_id] = o.fsm_profiles?.name
      })
      const topId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
      most_active_fsm = names[topId]
    }

    res.json({
      total_visits,
      avg_score,
      total_rsms: rsms?.length || 0,
      most_active_fsm,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/fsms
router.get('/fsms', async (req, res, next) => {
  try {
    const { profile } = req

    const { data: fsms, error } = await supabaseAdmin
      .from('fsm_profiles')
      .select('id, name, state, role')
      .eq('org_id', profile.org_id)
      .eq('role', 'fsm')
      .order('state')

    if (error) throw error

    const enriched = await Promise.all(
      fsms.map(async (fsm) => {
        const [{ count: rsm_count }, { data: obs }] = await Promise.all([
          supabaseAdmin
            .from('rsms')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', profile.org_id)
            .eq('fsm_id', fsm.id),
          supabaseAdmin
            .from('observations')
            .select('created_at')
            .eq('org_id', profile.org_id)
            .eq('fsm_id', fsm.id)
            .in('status', ['generated', 'sent'])
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        return {
          ...fsm,
          rsm_count: rsm_count || 0,
          obs_count: 0, // will be updated below
          last_activity: obs?.[0]?.created_at || null,
        }
      })
    )

    // Fill obs_count
    await Promise.all(
      enriched.map(async (fsm, i) => {
        const { count } = await supabaseAdmin
          .from('observations')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', profile.org_id)
          .eq('fsm_id', fsm.id)
          .in('status', ['generated', 'sent'])

        enriched[i].obs_count = count || 0
      })
    )

    res.json({ fsms: enriched })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/fsms/:id
router.get('/fsms/:id', async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    const { data: fsm, error: fsmError } = await supabaseAdmin
      .from('fsm_profiles')
      .select('id, name, state')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single()

    if (fsmError || !fsm) return res.status(404).json({ error: 'FSM not found' })

    const { data: rsms } = await supabaseAdmin
      .from('rsms')
      .select('id, name, state')
      .eq('org_id', profile.org_id)
      .eq('fsm_id', id)
      .order('name')

    // Add obs count per RSM
    const enrichedRSMs = await Promise.all(
      (rsms || []).map(async (rsm) => {
        const { count } = await supabaseAdmin
          .from('observations')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', profile.org_id)
          .eq('rsm_id', rsm.id)
          .in('status', ['generated', 'sent'])

        return { ...rsm, obs_count: count || 0 }
      })
    )

    res.json({ fsm, rsms: enrichedRSMs })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/rsms/:id
router.get('/rsms/:id', async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    const { data: rsm, error: rsmError } = await supabaseAdmin
      .from('rsms')
      .select('id, name, state')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single()

    if (rsmError || !rsm) return res.status(404).json({ error: 'RSM not found' })

    const { data: observations, error: obsError } = await supabaseAdmin
      .from('observations')
      .select(`
        id, visit_date, location, status, ai_summary, edited_summary,
        observation_scores(
          area_id, score, comments,
          observation_areas(label, group_name)
        ),
        fsm_profiles(name)
      `)
      .eq('org_id', profile.org_id)
      .eq('rsm_id', id)
      .order('visit_date', { ascending: false })

    if (obsError) throw obsError

    const enriched = observations.map((obs) => {
      const scores = obs.observation_scores || []
      const avg_score = scores.length
        ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
        : null
      return { ...obs, avg_score }
    })

    res.json({ rsm, observations: enriched })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/admins — create new admin (auth user + profile)
router.post('/admins', async (req, res, next) => {
  try {
    const { profile } = req
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password required' })
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw new Error(authError.message)

    // Create admin profile
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('fsm_profiles')
      .insert({
        org_id: profile.org_id,
        user_id: authData.user.id,
        name,
        state: 'NSW', // Default for admins
        role: 'admin',
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    res.status(201).json({ admin: adminProfile })
  } catch (err) {
    next(err)
  }
})

// PUT /api/admin/admins/:id — update admin
router.put('/admins/:id', async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params
    const { name, email } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email required' })
    }

    // Update profile
    const { data: updatedAdmin, error: updateError } = await supabaseAdmin
      .from('fsm_profiles')
      .update({ name, email })
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .eq('role', 'admin')
      .select()
      .single()

    if (updateError) throw updateError

    res.json({ admin: updatedAdmin })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/admins/:id
router.delete('/admins/:id', async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    // Get admin to find user_id
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('fsm_profiles')
      .select('id, user_id')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .eq('role', 'admin')
      .single()

    if (fetchError || !admin) return res.status(404).json({ error: 'Admin not found' })

    // Delete profile
    const { error: deleteError } = await supabaseAdmin
      .from('fsm_profiles')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(admin.user_id)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/fsms — create new FSM (auth user + profile)
router.post('/fsms', async (req, res, next) => {
  try {
    const { profile } = req
    const { name, email, state, password } = req.body

    if (!name || !email || !state || !password) {
      return res.status(400).json({ error: 'name, email, state, and password required' })
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw new Error(authError.message)

    // Create FSM profile
    const { data: fsmProfile, error: profileError } = await supabaseAdmin
      .from('fsm_profiles')
      .insert({
        org_id: profile.org_id,
        user_id: authData.user.id,
        name,
        state,
        role: 'fsm',
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    res.status(201).json({ fsm: fsmProfile })
  } catch (err) {
    next(err)
  }
})

// PUT /api/admin/fsms/:id — update FSM
router.put('/fsms/:id', async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params
    const { name, email, state } = req.body

    if (!name || !email || !state) {
      return res.status(400).json({ error: 'name, email, and state required' })
    }

    // Update profile
    const { data: updatedFSM, error: updateError } = await supabaseAdmin
      .from('fsm_profiles')
      .update({ name, email, state })
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .eq('role', 'fsm')
      .select()
      .single()

    if (updateError) throw updateError

    res.json({ fsm: updatedFSM })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/fsms/:id
router.delete('/fsms/:id', async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    // Get FSM to find user_id
    const { data: fsm, error: fetchError } = await supabaseAdmin
      .from('fsm_profiles')
      .select('id, user_id')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single()

    if (fetchError || !fsm) return res.status(404).json({ error: 'FSM not found' })

    // Delete profile
    const { error: deleteError } = await supabaseAdmin
      .from('fsm_profiles')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(fsm.user_id)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/rsms — create new RSM
router.post('/rsms', async (req, res, next) => {
  try {
    const { profile } = req
    const { name, state, email, fsm_id } = req.body

    if (!name || !state || !fsm_id) {
      return res.status(400).json({ error: 'name, state, and fsm_id required' })
    }

    const { data: rsm, error } = await supabaseAdmin
      .from('rsms')
      .insert({
        org_id: profile.org_id,
        fsm_id,
        name,
        state,
        email: email || null,
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ rsm })
  } catch (err) {
    next(err)
  }
})

// PUT /api/admin/rsms/:id — update RSM
router.put('/rsms/:id', async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params
    const { name, email, state, fsm_id } = req.body

    if (!name || !state) {
      return res.status(400).json({ error: 'name and state required' })
    }

    // Update RSM
    const { data: updatedRSM, error: updateError } = await supabaseAdmin
      .from('rsms')
      .update({
        name,
        email: email || null,
        state,
        fsm_id: fsm_id || null
      })
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({ rsm: updatedRSM })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/rsms/:id
router.delete('/rsms/:id', async (req, res, next) => {
  try {
    const { profile } = req
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('rsms')
      .delete()
      .eq('id', id)
      .eq('org_id', profile.org_id)

    if (error) throw error

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})


// GET /api/admin/voice-profiles — List all FSM voice profiles for admin visibility
router.get('/voice-profiles', async (req, res, next) => {
  try {
    const { profile } = req

    const { data: profiles, error } = await supabaseAdmin
      .from('fsm_voice_profiles')
      .select(`
        id,
        profile_text,
        observations_analysed,
        gf_terms_detected,
        last_generated_at,
        fsm_profiles!inner(id, name, role, state)
      `)
      .eq('org_id', profile.org_id)
      .order('last_generated_at', { ascending: false })

    if (error) return next(error)

    const formatted = (profiles || []).map(p => ({
      fsm_id: p.fsm_profiles.id,
      fsm_name: p.fsm_profiles.name,
      role: p.fsm_profiles.role,
      state: p.fsm_profiles.state,
      observations_analysed: p.observations_analysed,
      gf_terms: p.gf_terms_detected || [],
      profile_text: p.profile_text,
      last_generated: p.last_generated_at
    }))

    res.json({ profiles: formatted })
  } catch (err) {
    next(err)
  }
})

module.exports = router
