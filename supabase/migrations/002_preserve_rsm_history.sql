-- ============================================================
-- GF In The Field — Preserve RSM History & Add Overall Comments
-- Migration: 002_preserve_rsm_history.sql
-- ============================================================

-- 1. Fix RSM cascade delete - preserve RSMs when FSM is deleted
ALTER TABLE rsms
  DROP CONSTRAINT rsms_fsm_id_fkey,
  ADD CONSTRAINT rsms_fsm_id_fkey
    FOREIGN KEY (fsm_id)
    REFERENCES fsm_profiles(id)
    ON DELETE SET NULL;

-- Make fsm_id nullable since it can be orphaned
ALTER TABLE rsms
  ALTER COLUMN fsm_id DROP NOT NULL;

-- 2. Add overall_comments field to observations
ALTER TABLE observations
  ADD COLUMN overall_comments text;

-- 3. Update RLS policies for orphaned RSMs
-- Drop old policy
DROP POLICY IF EXISTS "FSMs see own RSMs, admins see all" ON rsms;

-- Create new policy that allows viewing orphaned RSMs
CREATE POLICY "FSMs see assigned RSMs, admins see all"
  ON rsms FOR SELECT
  USING (
    org_id = auth_org_id()
    AND (
      auth_role() = 'admin'
      OR fsm_id = auth_profile_id()
      OR fsm_id IS NULL  -- Allow viewing orphaned RSMs
    )
  );

-- Add comment
COMMENT ON COLUMN rsms.fsm_id IS 'FSM who manages this RSM. NULL if FSM was deleted (preserve RSM history).';
COMMENT ON COLUMN observations.overall_comments IS 'FSM overall comments for the visit (free text, used heavily in AI summary).';
