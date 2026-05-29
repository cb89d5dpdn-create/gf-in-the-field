-- Migration 004: Login Activity Tracking
-- Tracks user logins for admin analytics (Ben-only visibility)

CREATE TABLE login_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    fsm_id uuid REFERENCES fsm_profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_login_events_user_id ON login_events(user_id);
CREATE INDEX idx_login_events_fsm_id ON login_events(fsm_id);
CREATE INDEX idx_login_events_org_id ON login_events(org_id);
CREATE INDEX idx_login_events_created_at ON login_events(created_at);

-- RLS: Only service role can read/write (admin API only)
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage login events"
    ON login_events FOR ALL
    USING (auth.role() = 'service_role');

COMMENT ON TABLE login_events IS 'Tracks user login activity for admin analytics';
