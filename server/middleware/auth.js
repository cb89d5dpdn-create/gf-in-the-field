const jwt = require('jsonwebtoken')
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

  // Decode JWT to extract claims (verification happens via Supabase getUser below)
  const decoded = jwt.decode(token)

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
  req.aal = decoded?.aal ?? null  // Authentication Assurance Level from JWT claims
  next()
}

/**
 * Requires the authenticated user to have role = 'admin'.
 * Enforces MFA (AAL2) only for accounts that have enrolled a verified TOTP factor.
 * Accounts without any MFA factors enrolled are allowed through (aal1) — this allows
 * graceful onboarding: enroll at /mfa-setup, then enforcement kicks in automatically.
 * Must be used after requireAuth.
 */
async function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  try {
    // Check if this user has any verified MFA factors enrolled
    const { data, error } = await supabaseAdmin.auth.admin.listFactors({
      userId: req.user.id,
    })

    const hasEnrolledMfa = !error && data?.factors?.some(
      (f) => f.factor_type === 'totp' && f.status === 'verified'
    )

    // Only enforce aal2 if the account has MFA enrolled
    // Accounts without MFA factors are allowed through (pending enrollment)
    if (hasEnrolledMfa && req.aal !== 'aal2') {
      return res.status(403).json({ error: 'Admin access requires multi-factor authentication. Please complete MFA verification.' })
    }
  } catch (err) {
    // Non-blocking: if the factor check fails, log and allow through
    console.error('MFA factor check failed (non-blocking):', err.message)
  }

  next()
}

module.exports = { requireAuth, requireAdmin }
