# Migration 004: Login Tracking

## ⚠️ MANUAL MIGRATION REQUIRED

The `login_events` table needs to be created in Supabase before the login tracking system will work.

## Steps:

1. Go to https://supabase.com
2. Select the **GF In The Field** project (`ivbhxhhxldqdgkbltywv`)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the SQL below
6. Click **Run**

## SQL to Execute:

```sql
-- Migration 004: Login Activity Tracking
CREATE TABLE IF NOT EXISTS login_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    fsm_id uuid REFERENCES fsm_profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_fsm_id ON login_events(fsm_id);
CREATE INDEX IF NOT EXISTS idx_login_events_org_id ON login_events(org_id);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON login_events(created_at);

-- RLS: Only service role can read/write (admin API only)
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage login events" ON login_events;
CREATE POLICY "Service role can manage login events"
    ON login_events FOR ALL
    USING (auth.role() = 'service_role');
```

## Verify:

After running the migration:

1. In Supabase, click **Table Editor** in the left sidebar
2. You should see `login_events` in the list of tables
3. Click it to verify the columns exist:
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key to auth.users)
   - `org_id` (uuid, foreign key to organisations)
   - `fsm_id` (uuid, foreign key to fsm_profiles)
   - `created_at` (timestamp)

## What This Enables:

- **Silent login tracking**: Every user login is recorded automatically
- **Admin analytics**: Ben can view login activity at `/admin/login-stats`
- **Usage insights**: See who's using the platform and how often

## Privacy:

- Only Ben can view login stats (hardcoded user ID check)
- FSMs have no visibility of tracking
- Doesn't affect any existing functionality
