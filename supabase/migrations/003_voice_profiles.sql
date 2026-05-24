-- Migration 003: FSM Voice Profile Learning
-- Enables personalised AI coaching summaries that match each FSM's writing style

-- Add exclusion flag to observations (marks test/seed data)
ALTER TABLE observations 
ADD COLUMN exclude_from_voice_profile boolean DEFAULT false;

-- Flag all existing observations as excluded (test data)
UPDATE observations 
SET exclude_from_voice_profile = true 
WHERE created_at < NOW();

-- Create voice profiles table
CREATE TABLE fsm_voice_profiles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fsm_id              uuid NOT NULL REFERENCES fsm_profiles(id) ON DELETE CASCADE,
    org_id              uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    profile_text        text NOT NULL,
    observations_analysed integer NOT NULL DEFAULT 0,
    gf_terms_detected   text[],
    last_generated_at   timestamp with time zone DEFAULT now(),
    created_at          timestamp with time zone DEFAULT now(),
    updated_at          timestamp with time zone DEFAULT now(),
    UNIQUE(fsm_id)
);

-- Create indexes for performance
CREATE INDEX idx_fsm_voice_profiles_fsm_id ON fsm_voice_profiles(fsm_id);
CREATE INDEX idx_fsm_voice_profiles_org_id ON fsm_voice_profiles(org_id);

-- RLS: FSM can read their own profile only
ALTER TABLE fsm_voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FSM can read own voice profile"
    ON fsm_voice_profiles FOR SELECT
    USING (fsm_id = (SELECT id FROM fsm_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage all voice profiles"
    ON fsm_voice_profiles FOR ALL
    USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE fsm_voice_profiles IS 'Stores learned writing style profiles for FSMs to personalise AI-generated coaching summaries';
COMMENT ON COLUMN observations.exclude_from_voice_profile IS 'When true, this observation is excluded from voice profile learning (used for test/seed data)';
