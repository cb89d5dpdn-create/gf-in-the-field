const { supabaseAdmin } = require('../lib/supabase')

/**
 * Validates the Supabase JWT, loads the FSM profile (includes org_id + role),
 * and attaches both to req.user and req.profile.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  const token = authHeader.slice(7)

  // Verify JWT via Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  // Load FSM profile — includes org_id + role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('fsm_profiles')
    .select('id, org_id, name, state, role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return res.status(403).json({ error: 'No profile found for this user' })
  }

  req.user = user
  req.profile = profile
  next()
}

/**
 * Requires the authenticated user to have role = 'admin'.
 * Must be used after requireAuth.
 */
function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

module.exports = { requireAuth, requireAdmin }
