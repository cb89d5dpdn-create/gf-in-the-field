-- ============================================================
-- GF In The Field — Analytics Functions
-- Migration: 005_analytics_functions.sql
-- ============================================================
-- NOTE: observations.fsm_id references fsm_profiles(id), NOT user_id.
-- The join is: fsm_profiles fp ON fp.id = o.fsm_id
-- ============================================================

-- ============================================================
-- 1. State Trends — weekly avg score + visit count per state
-- ============================================================
CREATE OR REPLACE FUNCTION analytics_state_trends(p_org_id uuid)
RETURNS TABLE(
  state       text,
  week        timestamptz,
  avg_score   numeric,
  visit_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    fp.state,
    DATE_TRUNC('week', o.visit_date::timestamp)::timestamptz AS week,
    ROUND(AVG(os.score)::numeric, 2)                         AS avg_score,
    COUNT(DISTINCT o.id)                                     AS visit_count
  FROM observations o
  JOIN observation_scores os  ON os.observation_id = o.id
  JOIN fsm_profiles fp        ON fp.id = o.fsm_id
  JOIN observation_areas oa   ON oa.id = os.area_id
  WHERE o.status IN ('generated', 'sent')
    AND o.org_id = p_org_id
    AND oa.is_active = true
  GROUP BY fp.state, DATE_TRUNC('week', o.visit_date::timestamp)
  ORDER BY week ASC, fp.state ASC;
$$;

-- ============================================================
-- 2. RSM Trend — per-visit avg score for one RSM
-- ============================================================
CREATE OR REPLACE FUNCTION analytics_rsm_trend(p_rsm_id uuid, p_org_id uuid)
RETURNS TABLE(
  id         uuid,
  visit_date date,
  fsm_name   text,
  avg_score  numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    o.id,
    o.visit_date,
    fp.name  AS fsm_name,
    ROUND(AVG(os.score)::numeric, 2) AS avg_score
  FROM observations o
  JOIN observation_scores os  ON os.observation_id = o.id
  JOIN fsm_profiles fp        ON fp.id = o.fsm_id
  JOIN observation_areas oa   ON oa.id = os.area_id
  WHERE o.rsm_id = p_rsm_id
    AND o.org_id = p_org_id
    AND o.status IN ('generated', 'sent')
    AND oa.is_active = true
  GROUP BY o.id, o.visit_date, fp.name
  ORDER BY o.visit_date ASC;
$$;

-- ============================================================
-- 3. Category Breakdown — avg score per active area label
--    Optional filters: state and/or rsmId
-- ============================================================
CREATE OR REPLACE FUNCTION analytics_category_breakdown(
  p_org_id uuid,
  p_state  text    DEFAULT NULL,
  p_rsm_id uuid    DEFAULT NULL
)
RETURNS TABLE(
  area_label  text,
  group_name  text,
  state       text,
  avg_score   numeric,
  score_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    oa.label    AS area_label,
    oa.group_name,
    fp.state,
    ROUND(AVG(os.score)::numeric, 2) AS avg_score,
    COUNT(os.id)                     AS score_count
  FROM observation_scores os
  JOIN observation_areas oa ON oa.id = os.area_id
  JOIN observations o       ON o.id  = os.observation_id
  JOIN fsm_profiles fp      ON fp.id = o.fsm_id
  WHERE o.status IN ('generated', 'sent')
    AND o.org_id = p_org_id
    AND oa.is_active = true
    AND (p_state  IS NULL OR fp.state   = p_state)
    AND (p_rsm_id IS NULL OR o.rsm_id   = p_rsm_id)
  GROUP BY oa.label, oa.group_name, fp.state
  ORDER BY oa.group_name, oa.label, fp.state;
$$;

-- ============================================================
-- 4. Trend Summary — improving/flat/declining per state & RSM
-- ============================================================
CREATE OR REPLACE FUNCTION analytics_trend_summary(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_median_date date;
  v_states      json;
  v_rsms        json;
BEGIN
  -- Median observation date (splits the dataset in half)
  SELECT PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY visit_date)
    INTO v_median_date
  FROM observations
  WHERE status IN ('generated', 'sent')
    AND org_id = p_org_id;

  -- State deltas
  WITH state_halves AS (
    SELECT
      fp.state,
      CASE WHEN o.visit_date <= v_median_date THEN 'first' ELSE 'second' END AS half,
      AVG(os.score) AS avg_score
    FROM observations o
    JOIN observation_scores os ON os.observation_id = o.id
    JOIN observation_areas oa  ON oa.id = os.area_id
    JOIN fsm_profiles fp       ON fp.id = o.fsm_id
    WHERE o.status IN ('generated', 'sent')
      AND o.org_id = p_org_id
      AND oa.is_active = true
    GROUP BY fp.state,
             CASE WHEN o.visit_date <= v_median_date THEN 'first' ELSE 'second' END
  ),
  state_deltas AS (
    SELECT
      state,
      MAX(CASE WHEN half = 'second' THEN avg_score END)
        - MAX(CASE WHEN half = 'first'  THEN avg_score END) AS delta
    FROM state_halves
    GROUP BY state
  )
  SELECT json_agg(
    json_build_object(
      'state',     state,
      'delta',     ROUND(delta::numeric, 2),
      'direction', CASE
                     WHEN delta >  0.2 THEN 'improving'
                     WHEN delta < -0.2 THEN 'declining'
                     ELSE 'flat'
                   END
    ) ORDER BY delta DESC NULLS LAST
  ) INTO v_states
  FROM state_deltas;

  -- RSM deltas
  WITH rsm_halves AS (
    SELECT
      o.rsm_id,
      r.name AS rsm_name,
      CASE WHEN o.visit_date <= v_median_date THEN 'first' ELSE 'second' END AS half,
      AVG(os.score) AS avg_score
    FROM observations o
    JOIN observation_scores os ON os.observation_id = o.id
    JOIN observation_areas oa  ON oa.id = os.area_id
    JOIN rsms r                ON r.id  = o.rsm_id
    WHERE o.status IN ('generated', 'sent')
      AND o.org_id = p_org_id
      AND oa.is_active = true
    GROUP BY o.rsm_id, r.name,
             CASE WHEN o.visit_date <= v_median_date THEN 'first' ELSE 'second' END
  ),
  rsm_obs_counts AS (
    SELECT rsm_id, COUNT(*) AS obs_count
    FROM observations
    WHERE status IN ('generated', 'sent') AND org_id = p_org_id
    GROUP BY rsm_id
  ),
  rsm_deltas AS (
    SELECT
      h.rsm_id,
      h.rsm_name,
      oc.obs_count,
      MAX(CASE WHEN h.half = 'second' THEN h.avg_score END)
        - MAX(CASE WHEN h.half = 'first'  THEN h.avg_score END) AS delta
    FROM rsm_halves h
    JOIN rsm_obs_counts oc ON oc.rsm_id = h.rsm_id
    GROUP BY h.rsm_id, h.rsm_name, oc.obs_count
  )
  SELECT json_agg(
    json_build_object(
      'rsmId',     rsm_id,
      'name',      rsm_name,
      'delta',     ROUND(delta::numeric, 2),
      'direction', CASE
                     WHEN delta >  0.2 THEN 'improving'
                     WHEN delta < -0.2 THEN 'declining'
                     ELSE 'flat'
                   END,
      'obs_count', obs_count
    ) ORDER BY delta DESC NULLS LAST
  ) INTO v_rsms
  FROM rsm_deltas;

  RETURN json_build_object(
    'states', COALESCE(v_states, '[]'::json),
    'rsms',   COALESCE(v_rsms,   '[]'::json)
  );
END;
$$;
