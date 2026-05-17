-- ============================================================
-- GF In The Field — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE organisations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE fsm_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  state text NOT NULL, -- 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA/NT'
  role text NOT NULL DEFAULT 'fsm', -- 'fsm' | 'admin'
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE rsms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  fsm_id uuid REFERENCES fsm_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  state text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE observation_areas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  order_index integer NOT NULL,
  group_name text NOT NULL, -- 'Visit Prep & Data' | 'In-Store'
  label text NOT NULL,
  description text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE observations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  fsm_id uuid REFERENCES fsm_profiles(id) ON DELETE CASCADE NOT NULL,
  rsm_id uuid REFERENCES rsms(id) ON DELETE CASCADE NOT NULL,
  visit_date date NOT NULL,
  location text,
  status text DEFAULT 'draft', -- 'draft' | 'generated' | 'sent'
  ai_summary text,
  edited_summary text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE observation_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  observation_id uuid REFERENCES observations(id) ON DELETE CASCADE NOT NULL,
  area_id uuid REFERENCES observation_areas(id) ON DELETE CASCADE NOT NULL,
  score integer CHECK (score >= 1 AND score <= 5),
  comments text,
  UNIQUE(observation_id, area_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- fsm_profiles
CREATE INDEX idx_fsm_profiles_user_id ON fsm_profiles(user_id);
CREATE INDEX idx_fsm_profiles_org_id ON fsm_profiles(org_id);

-- rsms
CREATE INDEX idx_rsms_org_id ON rsms(org_id);
CREATE INDEX idx_rsms_fsm_id ON rsms(fsm_id);

-- observation_areas
CREATE INDEX idx_observation_areas_org_id ON observation_areas(org_id);

-- observations
CREATE INDEX idx_observations_org_id ON observations(org_id);
CREATE INDEX idx_observations_fsm_id ON observations(fsm_id);
CREATE INDEX idx_observations_rsm_id ON observations(rsm_id);
CREATE INDEX idx_observations_status ON observations(status);

-- observation_scores
CREATE INDEX idx_observation_scores_observation_id ON observation_scores(observation_id);
CREATE INDEX idx_observation_scores_area_id ON observation_scores(area_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fsm_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsms ENABLE ROW LEVEL SECURITY;
ALTER TABLE observation_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE observation_scores ENABLE ROW LEVEL SECURITY;

-- Helper function: get the calling user's org_id from their profile
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM fsm_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper function: get the calling user's profile id
CREATE OR REPLACE FUNCTION auth_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM fsm_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper function: get the calling user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM fsm_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- organisations: users can only see their own org
CREATE POLICY "Users see own org"
  ON organisations FOR SELECT
  USING (id = auth_org_id());

-- fsm_profiles: users can see profiles in their org
CREATE POLICY "Users see profiles in own org"
  ON fsm_profiles FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Users can update own profile"
  ON fsm_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- rsms: FSMs see own RSMs; admins see all in org
CREATE POLICY "FSMs see own RSMs, admins see all"
  ON rsms FOR SELECT
  USING (
    org_id = auth_org_id()
    AND (auth_role() = 'admin' OR fsm_id = auth_profile_id())
  );

-- observation_areas: all authenticated users in org can read
CREATE POLICY "Users see org observation areas"
  ON observation_areas FOR SELECT
  USING (org_id = auth_org_id());

-- observations: FSMs see own; admins see all in org
CREATE POLICY "FSMs see own observations, admins see all"
  ON observations FOR SELECT
  USING (
    org_id = auth_org_id()
    AND (auth_role() = 'admin' OR fsm_id = auth_profile_id())
  );

CREATE POLICY "FSMs can insert own observations"
  ON observations FOR INSERT
  WITH CHECK (
    org_id = auth_org_id()
    AND fsm_id = auth_profile_id()
    AND auth_role() = 'fsm'
  );

CREATE POLICY "FSMs can update own observations"
  ON observations FOR UPDATE
  USING (
    org_id = auth_org_id()
    AND fsm_id = auth_profile_id()
    AND auth_role() = 'fsm'
  );

-- observation_scores: access via parent observation
CREATE POLICY "Users see scores for accessible observations"
  ON observation_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM observations o
      WHERE o.id = observation_scores.observation_id
        AND o.org_id = auth_org_id()
        AND (auth_role() = 'admin' OR o.fsm_id = auth_profile_id())
    )
  );

CREATE POLICY "FSMs can insert scores for own observations"
  ON observation_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM observations o
      WHERE o.id = observation_scores.observation_id
        AND o.org_id = auth_org_id()
        AND o.fsm_id = auth_profile_id()
        AND auth_role() = 'fsm'
    )
  );

CREATE POLICY "FSMs can update scores for own observations"
  ON observation_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM observations o
      WHERE o.id = observation_scores.observation_id
        AND o.org_id = auth_org_id()
        AND o.fsm_id = auth_profile_id()
        AND auth_role() = 'fsm'
    )
  );

CREATE POLICY "FSMs can delete scores for own observations"
  ON observation_scores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM observations o
      WHERE o.id = observation_scores.observation_id
        AND o.org_id = auth_org_id()
        AND o.fsm_id = auth_profile_id()
        AND auth_role() = 'fsm'
    )
  );
