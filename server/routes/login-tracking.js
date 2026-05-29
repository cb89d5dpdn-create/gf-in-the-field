const router = require('express').Router()
const { supabaseAdmin } = require('../lib/supabase')
const { requireAuth } = require('../middleware/auth')

// POST /api/login-tracking/record — silently record login event
router.post('/record', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req

    // Silently record login event
    await supabaseAdmin
      .from('login_events')
      .insert({
        user_id: req.user.id,
        org_id: profile.org_id,
        fsm_id: profile.id,
      })

    // Return success (no data needed by client)
    res.json({ success: true })
  } catch (err) {
    // Silently fail - don't block login if tracking fails
    console.error('Login tracking error:', err)
    res.json({ success: false })
  }
})

// GET /api/login-tracking/stats — Ben-only login statistics
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const { profile } = req

    // Only Ben can access (check by email or user_id)
    const BEN_USER_ID = 'bb125db8-e6e7-4f32-af66-523186c2d47e' // Ben's user_id from earlier query
    
    if (req.user.id !== BEN_USER_ID) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get all login events with FSM details
    const { data: logins, error } = await supabaseAdmin
      .from('login_events')
      .select(`
        id,
        user_id,
        created_at,
        fsm_profiles(id, name, role, state)
      `)
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate stats per user
    const userStats = {}
    
    logins.forEach(login => {
      const userId = login.user_id
      if (!userStats[userId]) {
        userStats[userId] = {
          user_id: userId,
          name: login.fsm_profiles?.name || 'Unknown',
          role: login.fsm_profiles?.role || 'unknown',
          state: login.fsm_profiles?.state || '',
          total_logins: 0,
          last_login: null,
          logins_this_week: 0,
          logins_this_month: 0,
          login_dates: []
        }
      }

      const loginDate = new Date(login.created_at)
      userStats[userId].total_logins++
      userStats[userId].login_dates.push(loginDate)

      if (!userStats[userId].last_login || loginDate > userStats[userId].last_login) {
        userStats[userId].last_login = loginDate
      }

      // Count this week/month
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      if (loginDate > weekAgo) userStats[userId].logins_this_week++
      if (loginDate > monthAgo) userStats[userId].logins_this_month++
    })

    // Convert to array and sort by total logins
    const stats = Object.values(userStats)
      .sort((a, b) => b.total_logins - a.total_logins)

    res.json({
      stats,
      total_events: logins.length
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
