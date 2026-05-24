import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection (service role for admin access)
const supabaseUrl = 'https://ivbhxhhxldqdgkbltywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2Ymh4aGh4bGRxZGdrYmx0eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4NDA3MSwiZXhwIjoyMDk0NzYwMDcxfQ.jmaagSwUhXw4E5skfr3zqV2t__hLXodXw8YsiCP3moM';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running migration 003: Voice Profiles...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '003_voice_profiles.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded');
    console.log('📊 Executing via Supabase REST API...\n');

    // Split SQL into individual statements (rough split on semicolons outside of function definitions)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (!statement) continue;

      try {
        // Use rpc to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });
        
        if (error) {
          console.error(`❌ Statement failed: ${statement.substring(0, 60)}...`);
          console.error(`   Error: ${error.message}\n`);
          errorCount++;
        } else {
          console.log(`✅ ${statement.substring(0, 60)}...`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Unexpected error on statement: ${statement.substring(0, 60)}...`);
        console.error(`   ${err.message}\n`);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Results: ${successCount} successful, ${errorCount} failed\n`);

    if (errorCount > 0) {
      console.log('⚠️  Some statements failed. Verifying what succeeded...\n');
    }

    // Verify results
    console.log('🔍 Verifying migration state...\n');

    // Check if exclude_from_voice_profile column exists
    const { data: obsColumns, error: obsError } = await supabase
      .from('observations')
      .select('exclude_from_voice_profile')
      .limit(1);

    if (!obsError) {
      console.log('✅ observations.exclude_from_voice_profile column exists');
      
      // Count flagged observations
      const { count: flaggedCount } = await supabase
        .from('observations')
        .select('*', { count: 'exact', head: true })
        .eq('exclude_from_voice_profile', true);

      console.log(`✅ ${flaggedCount || 0} existing observations flagged as excluded`);
    } else {
      console.log('❌ observations column not found:', obsError.message);
    }

    // Check if fsm_voice_profiles table exists
    const { error: vpError } = await supabase
      .from('fsm_voice_profiles')
      .select('id')
      .limit(0);

    if (!vpError || vpError.code === 'PGRST116') {
      console.log('✅ fsm_voice_profiles table created');
    } else {
      console.log('❌ fsm_voice_profiles table not found:', vpError.message);
    }

    console.log('\n✨ Migration verification complete!\n');

  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

runMigration();
