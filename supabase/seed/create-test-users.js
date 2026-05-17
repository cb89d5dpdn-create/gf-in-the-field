/**
 * Creates test auth users in Supabase and patches fsm_profiles.user_id.
 * Run ONCE against a new Supabase project:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed/create-test-users.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const USERS = [
  { email: 'admin@gfinthefield.com.au', password: 'Admin1234!', profileId: '10000000-0000-0000-0000-000000000001' },
  { email: 'fsm.nsw@test.com', password: 'Test1234!', profileId: '10000000-0000-0000-0000-000000000002' },
  { email: 'fsm.vic@test.com', password: 'Test1234!', profileId: '10000000-0000-0000-0000-000000000003' },
  { email: 'fsm.qld@test.com', password: 'Test1234!', profileId: '10000000-0000-0000-0000-000000000004' },
  { email: 'fsm.wa@test.com', password: 'Test1234!', profileId: '10000000-0000-0000-0000-000000000005' },
  { email: 'fsm.sant@test.com', password: 'Test1234!', profileId: '10000000-0000-0000-0000-000000000006' },
]

async function main() {
  for (const u of USERS) {
    console.log(`Creating user: ${u.email}`)
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (error) {
      console.error(`  ERROR: ${error.message}`)
      continue
    }

    const userId = data.user.id
    console.log(`  Created auth user: ${userId}`)

    // Link to fsm_profile
    const { error: updateError } = await supabase
      .from('fsm_profiles')
      .update({ user_id: userId })
      .eq('id', u.profileId)

    if (updateError) {
      console.error(`  ERROR linking profile: ${updateError.message}`)
    } else {
      console.log(`  Linked to profile ${u.profileId}`)
    }
  }
  console.log('\nDone.')
}

main().catch(console.error)
