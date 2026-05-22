const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  'https://ivbhxhhxldqdgkbltywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2Ymh4aGh4bGRxZGdrYmx0eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4NDA3MSwiZXhwIjoyMDk0NzYwMDcxfQ.jmaagSwUhXw4E5skfr3zqV2t__hLXodXw8YsiCP3moM'
)

async function runMigration() {
  const sql = fs.readFileSync('./supabase/migrations/002_preserve_rsm_history.sql', 'utf8')
  
  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'))
  
  for (const stmt of statements) {
    if (stmt) {
      console.log('Running:', stmt.substring(0, 80) + '...')
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt })
      if (error) {
        console.error('Error:', error)
      } else {
        console.log('✓ Success')
      }
    }
  }
  
  console.log('\n✅ Migration complete')
}

runMigration().catch(console.error)
