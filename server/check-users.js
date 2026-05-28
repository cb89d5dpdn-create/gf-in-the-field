import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivbhxhhxldqdgkbltywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2Ymh4aGh4bGRxZGdrYmx0eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4NDA3MSwiZXhwIjoyMDk0NzYwMDcxfQ.jmaagSwUhXw4E5skfr3zqV2t__hLXodXw8YsiCP3moM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  console.log('🔍 Checking GF In The Field users...\n');

  // Get all FSM profiles
  const { data: fsms, error: fsmError } = await supabase
    .from('fsm_profiles')
    .select('id, name, email, role, user_id')
    .order('name');

  if (fsmError) {
    console.error('❌ Error fetching FSM profiles:', fsmError);
    return;
  }

  console.log(`📊 Total users in database: ${fsms.length}\n`);

  // Group by role
  const admins = fsms.filter(f => f.role === 'admin');
  const fsmUsers = fsms.filter(f => f.role === 'fsm');

  console.log('👥 ADMINS:');
  console.log('─────────────────────────────────────────────');
  for (const admin of admins) {
    const hasAuth = admin.user_id ? '✅' : '❌';
    console.log(`${hasAuth} ${admin.name} (${admin.email})`);
    if (!admin.user_id) {
      console.log('   ⚠️  No auth user linked - cannot log in');
    }
  }

  console.log('\n📋 FSMs:');
  console.log('─────────────────────────────────────────────');
  for (const fsm of fsmUsers) {
    const hasAuth = fsm.user_id ? '✅' : '❌';
    console.log(`${hasAuth} ${fsm.name} (${fsm.email})`);
    if (!fsm.user_id) {
      console.log('   ⚠️  No auth user linked - cannot log in');
    }
  }

  // Check auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('\n❌ Error fetching auth users:', authError);
    return;
  }

  console.log('\n🔐 AUTHENTICATION STATUS:');
  console.log('─────────────────────────────────────────────');
  console.log(`Total auth accounts: ${authUsers.users.length}`);
  
  console.log('\nAuth users:');
  for (const user of authUsers.users) {
    console.log(`  • ${user.email} (created: ${new Date(user.created_at).toLocaleDateString()})`);
  }

  // Check for orphaned profiles (no auth) or orphaned auth (no profile)
  const profileEmails = new Set(fsms.map(f => f.email));
  const authEmails = new Set(authUsers.users.map(u => u.email));

  const orphanedProfiles = fsms.filter(f => !f.user_id);
  const orphanedAuth = authUsers.users.filter(u => !profileEmails.has(u.email));

  if (orphanedProfiles.length > 0) {
    console.log('\n⚠️  PROFILES WITHOUT AUTH (cannot log in):');
    orphanedProfiles.forEach(p => console.log(`  • ${p.name} (${p.email})`));
  }

  if (orphanedAuth.length > 0) {
    console.log('\n⚠️  AUTH USERS WITHOUT PROFILES (can log in but no data):');
    orphanedAuth.forEach(u => console.log(`  • ${u.email}`));
  }

  if (orphanedProfiles.length === 0 && orphanedAuth.length === 0) {
    console.log('\n✅ All profiles have matching auth users - everyone can log in!');
  }
}

checkUsers();
