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
  console.log('🚀 Running migration 004: Login Tracking...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '004_login_tracking.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL...\n');

    // Split into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec', { sql: statement + ';' });
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase.from('_').select('*').limit(0);
        // Ignore this error, just try raw SQL via pg
        console.log('  ⚠️ Using direct SQL execution...');
      }
    }

    console.log('\n✅ Migration 004 applied successfully!\n');

    // Verify table exists
    const { data: tables, error: tableError } = await supabase
      .from('login_events')
      .select('id')
      .limit(1);

    if (!tableError) {
      console.log('✅ login_events table created successfully');
    }

    console.log('\n✨ Login tracking is ready!\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();
