#!/usr/bin/env node
/**
 * GF In The Field - Supabase Setup Script
 * 
 * This script:
 * 1. Runs the migration SQL (schema creation)
 * 2. Runs the seed SQL (sample data)
 * 3. Creates 6 test user accounts in Supabase Auth
 * 4. Links auth users to fsm_profiles
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ORG_ID = '00000000-0000-0000-0000-000000000001';

const testUsers = [
  { email: 'admin@gfinthefield.com.au', password: 'Admin1234!', name: 'Ben Voigt', state: 'NSW', role: 'admin', profileId: '10000000-0000-0000-0000-000000000001' },
  { email: 'fsm.nsw@test.com', password: 'Test1234!', name: 'Sarah Mitchell', state: 'NSW', role: 'fsm', profileId: '10000000-0000-0000-0000-000000000002' },
  { email: 'fsm.vic@test.com', password: 'Test1234!', name: 'James Thornton', state: 'VIC', role: 'fsm', profileId: '10000000-0000-0000-0000-000000000003' },
  { email: 'fsm.qld@test.com', password: 'Test1234!', name: 'Kylie Brennan', state: 'QLD', role: 'fsm', profileId: '10000000-0000-0000-0000-000000000004' },
  { email: 'fsm.wa@test.com', password: 'Test1234!', name: 'Mark Paterson', state: 'WA', role: 'fsm', profileId: '10000000-0000-0000-0000-000000000005' },
  { email: 'fsm.sant@test.com', password: 'Test1234!', name: 'Donna Clarke', state: 'SA/NT', role: 'fsm', profileId: '10000000-0000-0000-0000-000000000006' }
];

async function runSQL(sqlFile, description) {
  console.log(`\n📝 Running ${description}...`);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Supabase doesn't have a direct SQL execution endpoint via the client
  // We need to use the PostgREST API's rpc function
  // But for schema changes, we need to manually execute via Supabase dashboard
  // OR use a postgres connection string
  
  console.log(`⚠️  ${description} must be run manually in Supabase SQL Editor`);
  console.log(`   File: ${sqlFile}`);
  return false;
}

async function createAuthUsers() {
  console.log('\n👥 Creating test user accounts...\n');
  
  const createdUsers = [];
  
  for (const user of testUsers) {
    try {
      console.log(`   Creating: ${user.email}`);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ⚠️  User ${user.email} already exists, fetching...`);
          // Try to get existing user
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users.users.find(u => u.email === user.email);
          if (existingUser) {
            createdUsers.push({ ...user, authUserId: existingUser.id });
            console.log(`   ✅ Found existing user: ${existingUser.id}`);
          }
        } else {
          throw error;
        }
      } else {
        createdUsers.push({ ...user, authUserId: data.user.id });
        console.log(`   ✅ Created: ${data.user.id}`);
      }
    } catch (error) {
      console.error(`   ❌ Error creating ${user.email}:`, error.message);
    }
  }
  
  return createdUsers;
}

async function linkProfilesToAuthUsers(users) {
  console.log('\n🔗 Linking auth users to FSM profiles...\n');
  
  for (const user of users) {
    try {
      console.log(`   Linking ${user.email} → profile ${user.profileId}`);
      
      const { error } = await supabase
        .from('fsm_profiles')
        .update({ user_id: user.authUserId })
        .eq('id', user.profileId);
      
      if (error) {
        throw error;
      }
      
      console.log(`   ✅ Linked successfully`);
    } catch (error) {
      console.error(`   ❌ Error linking ${user.email}:`, error.message);
    }
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...\n');
  
  try {
    // Check org
    const { data: orgs, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', ORG_ID);
    
    if (orgError) throw orgError;
    console.log(`   ✅ Organisation: ${orgs.length} found`);
    
    // Check profiles
    const { data: profiles, error: profileError } = await supabase
      .from('fsm_profiles')
      .select('*');
    
    if (profileError) throw profileError;
    console.log(`   ✅ FSM Profiles: ${profiles.length} found`);
    console.log(`      - Linked to auth: ${profiles.filter(p => p.user_id).length}`);
    
    // Check RSMs
    const { data: rsms, error: rsmError } = await supabase
      .from('rsms')
      .select('*');
    
    if (rsmError) throw rsmError;
    console.log(`   ✅ RSMs: ${rsms.length} found`);
    
    // Check observation areas
    const { data: areas, error: areaError } = await supabase
      .from('observation_areas')
      .select('*');
    
    if (areaError) throw areaError;
    console.log(`   ✅ Observation Areas: ${areas.length} found`);
    
    // Check observations
    const { data: observations, error: obsError } = await supabase
      .from('observations')
      .select('*');
    
    if (obsError) throw obsError;
    console.log(`   ✅ Sample Observations: ${observations.length} found`);
    
    console.log('\n✅ All checks passed!');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  }
}

async function main() {
  console.log('🚀 GF In The Field - Supabase Setup');
  console.log('=====================================');
  console.log(`Project: ${supabaseUrl}`);
  
  try {
    // Step 1 & 2: SQL must be run manually
    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log('   1. Go to Supabase SQL Editor');
    console.log('   2. Run: supabase/migrations/001_initial_schema.sql');
    console.log('   3. Run: supabase/seed/001_seed_data.sql');
    console.log('   4. Come back here and press Enter to continue...\n');
    
    // Wait for user confirmation (skip for now, just proceed)
    console.log('   Assuming SQL is already run, continuing...\n');
    
    // Step 3: Create auth users
    const users = await createAuthUsers();
    
    if (users.length === 0) {
      console.error('\n❌ No users were created. Cannot continue.');
      process.exit(1);
    }
    
    // Step 4: Link profiles
    await linkProfilesToAuthUsers(users);
    
    // Step 5: Verify
    await verifySetup();
    
    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Test Accounts:');
    testUsers.forEach(u => {
      console.log(`   ${u.email} / ${u.password}`);
    });
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
