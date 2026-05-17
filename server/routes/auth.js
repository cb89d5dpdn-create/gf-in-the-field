const router = require('express').Router()
const { supabaseAnon } = require('../lib/supabase')

// POST /api/auth/login
// Client can also authenticate directly via Supabase client-side SDK.
// This endpoint is provided for server-side or external integrations.
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })
    if (error) return res.status(401).json({ error: error.message })

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
