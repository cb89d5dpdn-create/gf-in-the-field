const { createClient } = require('@supabase/supabase-js')

// Admin client — bypasses RLS for server-side operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Anon client — for user-scoped operations with JWT
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

module.exports = { supabaseAdmin, supabaseAnon }
