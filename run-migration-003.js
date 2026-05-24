import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection
const supabaseUrl = 'https://ivbhxhhxldqdgkbltywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2Ymh4aGh4bGRxZGdrYmx0eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4NDA3MSwiZXhwIjoyMDk0NzYwMDcxfQ.jmaagSwUhXw4E5skfr3zqV2t__hLXodXw8YsiCP3moM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running migration 003: Voice Profiles...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '003_voice_profiles.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL...\n');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration 003 applied successfully!\n');

    // Verify results
    console.log('🔍 Verifying migration...\n');

    // Check that observations column was added
    const { data: obsData, error: obsError } = await supabase
      .from('observations')
      .select('exclude_from_voice_profile')
      .limit(1);

    if (obsError) {
      console.error('⚠️  Could not verify observations column:', obsError.message);
    } else {
      console.log('✅ observations.exclude_from_voice_profile column exists');
    }

    // Check existing observations were flagged
    const { count: flaggedCount } = await supabase
      .from('observations')
      .select('*', { count: 'exact', head: true })
      .eq('exclude_from_voice_profile', true);

    console.log(`✅ ${flaggedCount || 0} existing observations flagged as excluded from voice profile`);

    // Check voice profiles table exists
    const { data: vpData, error: vpError } = await supabase
      .from('fsm_voice_profiles')
      .select('id')
      .limit(1);

    if (vpError && vpError.code !== 'PGRST116') {
      console.error('⚠️  Could not verify fsm_voice_profiles table:', vpError.message);
    } else {
      console.log('✅ fsm_voice_profiles table created');
    }

    console.log('\n✨ Migration complete! Voice profile learning is ready.\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();
