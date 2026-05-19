-- ============================================================
-- GF In The Field — Seed Data
-- Run AFTER creating Auth users in Supabase dashboard
-- or using the Supabase Auth Admin API.
--
-- Test Accounts (create in Supabase Auth first):
--   admin@gfinthefield.com.au  /  Admin1234!
--   fsm.nsw@test.com           /  Test1234!
--   fsm.vic@test.com           /  Test1234!
--   fsm.qld@test.com           /  Test1234!
--   fsm.wa@test.com            /  Test1234!
--   fsm.sant@test.com          /  Test1234!
--
-- After creating auth users, replace the UUIDs below with the
-- actual user IDs from auth.users.
-- ============================================================

-- ============================================================
-- STEP 1: Organisation
-- ============================================================

INSERT INTO organisations (id, name) VALUES
('00000000-0000-0000-0000-000000000001', 'Goodman Fielder')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 2: FSM Profiles
-- NOTE: Replace user_id values with actual Supabase Auth user IDs
-- after creating the test accounts.
-- ============================================================

-- These are placeholder UUIDs — replace with real auth.users IDs
-- The setup script (scripts/create-test-users.js) can automate this

INSERT INTO fsm_profiles (id, user_id, org_id, name, state, role) VALUES
('10000000-0000-0000-0000-000000000001', 'bb125db8-e6e7-4f32-af66-523186c2d47e', '00000000-0000-0000-0000-000000000001', 'Ben Voigt', 'NSW', 'admin'),
('10000000-0000-0000-0000-000000000002', '53561f57-cf37-4ab7-ad1c-4e98c42a7ffc', '00000000-0000-0000-0000-000000000001', 'Sarah Mitchell', 'NSW', 'fsm'),
('10000000-0000-0000-0000-000000000003', '74d039a6-2f50-4ee4-a976-5f2dbe716211', '00000000-0000-0000-0000-000000000001', 'James Thornton', 'VIC', 'fsm'),
('10000000-0000-0000-0000-000000000004', '9355bf41-3c94-4175-8f40-d5baf1abe429', '00000000-0000-0000-0000-000000000001', 'Kylie Brennan', 'QLD', 'fsm'),
('10000000-0000-0000-0000-000000000005', '0d5964d0-f245-4678-b992-cd2dd0be0099', '00000000-0000-0000-0000-000000000001', 'Mark Paterson', 'WA', 'fsm'),
('10000000-0000-0000-0000-000000000006', '05e77a1d-9eba-4d8e-953a-08d700d88236', '00000000-0000-0000-0000-000000000001', 'Donna Clarke', 'SA/NT', 'fsm')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 3: RSMs — 34 total distributed by state
-- NSW: 10, VIC: 9, QLD: 6, WA: 4, SA/NT: 5
-- ============================================================

INSERT INTO rsms (id, org_id, fsm_id, name, email, state) VALUES
-- NSW (10) — FSM: Sarah Mitchell
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Tom Nguyen', 'tom.nguyen@gf.com.au', 'NSW'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Rebecca Walsh', 'rebecca.walsh@gf.com.au', 'NSW'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Aaron Fitzgerald', 'aaron.fitzgerald@gf.com.au', 'NSW'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Chloe Dawson', 'chloe.dawson@gf.com.au', 'NSW'),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Daniel Harper', 'daniel.harper@gf.com.au', 'NSW'),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Jessica Lam', 'jessica.lam@gf.com.au', 'NSW'),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Nathan Bourke', 'nathan.bourke@gf.com.au', 'NSW'),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Megan Ross', 'megan.ross@gf.com.au', 'NSW'),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Patrick Connelly', 'patrick.connelly@gf.com.au', 'NSW'),
('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Simone Burke', 'simone.burke@gf.com.au', 'NSW'),

-- VIC (9) — FSM: James Thornton
('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Liam O''Brien', 'liam.obrien@gf.com.au', 'VIC'),
('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Emma Stafford', 'emma.stafford@gf.com.au', 'VIC'),
('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Chris Patel', 'chris.patel@gf.com.au', 'VIC'),
('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Natalie Grant', 'natalie.grant@gf.com.au', 'VIC'),
('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Scott Morrison', 'scott.morrison@gf.com.au', 'VIC'),
('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Alicia Huang', 'alicia.huang@gf.com.au', 'VIC'),
('20000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Brett Lawson', 'brett.lawson@gf.com.au', 'VIC'),
('20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Vanessa Kim', 'vanessa.kim@gf.com.au', 'VIC'),
('20000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Ryan Collis', 'ryan.collis@gf.com.au', 'VIC'),

-- QLD (6) — FSM: Kylie Brennan
('20000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Jake Saunders', 'jake.saunders@gf.com.au', 'QLD'),
('20000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Lauren Mackay', 'lauren.mackay@gf.com.au', 'QLD'),
('20000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Troy Henderson', 'troy.henderson@gf.com.au', 'QLD'),
('20000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Brianna Watts', 'brianna.watts@gf.com.au', 'QLD'),
('20000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Marcus Webb', 'marcus.webb@gf.com.au', 'QLD'),
('20000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Fiona Stanton', 'fiona.stanton@gf.com.au', 'QLD'),

-- WA (4) — FSM: Mark Paterson
('20000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Dean Watkins', 'dean.watkins@gf.com.au', 'WA'),
('20000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Rachel Drummond', 'rachel.drummond@gf.com.au', 'WA'),
('20000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Tyler Cross', 'tyler.cross@gf.com.au', 'WA'),
('20000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Amanda Foley', 'amanda.foley@gf.com.au', 'WA'),

-- SA/NT (5) — FSM: Donna Clarke
('20000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Craig Nolan', 'craig.nolan@gf.com.au', 'SA/NT'),
('20000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Tania Osman', 'tania.osman@gf.com.au', 'SA/NT'),
('20000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Ben Hardwick', 'ben.hardwick@gf.com.au', 'SA/NT'),
('20000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Joanne Sellars', 'joanne.sellars@gf.com.au', 'SA/NT'),
('20000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Owen McIntyre', 'owen.mcintyre@gf.com.au', 'SA/NT')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 4: Observation Areas (9 areas, org-scoped)
-- ============================================================

INSERT INTO observation_areas (id, org_id, order_index, group_name, label, description, is_active) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'Visit Prep & Data', 'Visit Preparation', 'Reviews prior notes, requirements and supporting data before the visit', true),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2, 'Visit Prep & Data', 'Commercial Insight', 'Identifies relevant trends, gaps and opportunities from available data', true),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 3, 'Visit Prep & Data', 'Conversation Planning', 'Defines objective, success measures and likely retailer response', true),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 4, 'Visit Prep & Data', 'Engagement Readiness', 'Prepares supporting data/materials for retailer engagement', true),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 5, 'In-Store', 'Visit Setup', 'Communicates clear visit purpose and objectives to retailer', true),
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 6, 'In-Store', 'Store Observation', 'Identifies compliance, ranging, stock and merchandising opportunities', true),
('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 7, 'In-Store', 'Commercial Engagement', 'Uses data and insights to support retailer conversation', true),
('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 8, 'In-Store', 'Execution', 'Completes to required standards, activations and commitments', true),
('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 9, 'In-Store', 'Follow-through/Hygiene', 'Confirms next steps and captures relevant visit notes', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 5: Sample Observations
-- 2–3 per RSM for a subset of RSMs to seed realistic data.
-- Using RSMs: Tom Nguyen, Rebecca Walsh (NSW), Liam O'Brien (VIC),
--             Jake Saunders (QLD), Dean Watkins (WA), Craig Nolan (SA/NT)
-- FSM IDs match the profiles above.
-- ============================================================

-- Observations
INSERT INTO observations (id, org_id, fsm_id, rsm_id, visit_date, location, status,
  ai_summary, edited_summary) VALUES

-- Tom Nguyen (NSW) — 3 observations
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 '2026-04-15', 'Woolworths Parramatta', 'sent',
 'Tom, this was a solid visit that showed genuine development across both phases. Your preparation work was noticeably stronger than previous visits — you came in with specific data points on the bread category and used them purposefully in your retailer conversation. The commercial insight you brought around the promotional void stood out and gave the discussion a real edge.',
 NULL),

('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 '2026-03-20', 'Coles Westmead', 'sent',
 'Tom, the in-store execution on this visit was your clearest strength — you identified the off-location opportunity quickly and followed through to get it actioned before leaving. Your conversation planning is an area to build on: defining a cleaner objective upfront will sharpen the quality of your retailer interaction and help you land commitments more consistently.',
 NULL),

('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 '2026-02-28', 'IGA Merrylands', 'sent',
 'Tom, this visit showed a notable gap between your prep and in-store performance. The data you had available before the visit was not fully translated into the store walk — you spotted the ranging issue but didn''t connect it back to the category data to build a commercial argument. That''s the bridge to build: link what you see on shelf to the insight you already hold, and your conversations will shift from observational to persuasive.',
 NULL),

-- Rebecca Walsh (NSW) — 2 observations
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
 '2026-04-22', 'Woolworths Penrith', 'sent',
 'Rebecca, this was one of your best visits to date. Your commercial engagement was outstanding — you brought in share of shelf data, framed it clearly for the store manager and left with a commitment to reinstate two SKUs. The preparation work that underpinned that conversation was equally strong, with clear objectives set and the right supporting materials on hand.',
 NULL),

('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
 '2026-03-12', 'Coles Blacktown', 'sent',
 'Rebecca, your store observation capability continues to be a real strength — you identified four compliance issues in the first ten minutes and prioritised them well. Where there is room to grow is in the follow-through: the visit notes weren''t captured before you left, which risks losing the commitments made. Making that a non-negotiable last step will make your strong in-store work compound over time.',
 NULL),

-- Liam O'Brien (VIC) — 3 observations
('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000011',
 '2026-04-18', 'Coles Doncaster', 'sent',
 'Liam, a very accomplished visit from start to finish. You arrived with a clear objective, used the scan data confidently, and the retailer responded well to your framing of the dairy category opportunity. Your follow-through was equally strong — notes captured, next steps agreed, timeline confirmed. This is exactly the standard to replicate across all your visits.',
 NULL),

('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000011',
 '2026-03-25', 'Woolworths Ringwood', 'sent',
 'Liam, your in-store skills were on full display here — the store walk was methodical, you spotted the secondary display opportunity and actioned it on the day. The one area to sharpen is visit setup: the purpose of the visit wasn''t clearly communicated at the start, which meant a few minutes were lost re-establishing context. A clear opening statement will make your already-strong execution land even harder.',
 NULL),

('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000011',
 '2026-02-14', 'IGA Camberwell', 'sent',
 'Liam, this visit highlighted the value of stronger preparation. Your in-store observation was good — you noted the ranging gap and the promotional compliance issue — but without the commercial context from the data, you weren''t able to build a compelling case with the manager. Spend ten minutes before each visit reviewing the category trends and that data-to-insight bridge will come naturally.',
 NULL),

-- Jake Saunders (QLD) — 2 observations
('40000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000020',
 '2026-04-10', 'Woolworths Chermside', 'sent',
 'Jake, a developing visit with some genuine highlights. Your engagement with the store manager was warm and credible, and you demonstrated good awareness of the ranging situation. The prep phase is where the most growth sits — your conversation objectives were broad rather than specific, which made it harder to land a defined outcome. Sharpening that upfront thinking will convert good visits into great ones.',
 NULL),

('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000020',
 '2026-03-05', 'Coles Carindale', 'sent',
 'Jake, the honest read on this visit is that both phases need consistent attention. Your store observation identified the right issues but the commercial conversation didn''t connect them to category performance, which limited the manager''s motivation to act. The next visit focus is clear: before you walk in, write down one specific commercial outcome you are aiming to achieve and what data supports it.',
 NULL),

-- Dean Watkins (WA) — 2 observations
('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000026',
 '2026-04-14', 'Coles Subiaco', 'sent',
 'Dean, this was a balanced, professional visit. Your prep was thorough and you used the insights well in conversation. The store walk was comprehensive and your execution of the agreed activations was clean. The one note for next time is to arrive with a sharper success measure — knowing what a good outcome looks like before you walk in will help you push further in the retailer conversation rather than accepting the first positive response.',
 NULL),

('40000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000026',
 '2026-03-08', 'Woolworths Cottesloe', 'sent',
 'Dean, you demonstrated real strength in commercial engagement on this visit — the way you used the competitor distribution data to frame the opportunity was clear, confident and landed well. Your follow-through was equally disciplined. The development area is engagement readiness: having a printed one-pager or visual ready for the retailer would elevate an already strong conversation to one that''s harder to say no to.',
 NULL),

-- Craig Nolan (SA/NT) — 2 observations
('40000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000030',
 '2026-04-16', 'Woolworths Norwood', 'sent',
 'Craig, a steady visit with some clear positives. Your visit setup was well-executed — you communicated the purpose clearly and the manager was engaged from the start. Store observation was methodical. Where you can push further is in commercial engagement: you had the data but held back from challenging the ranging decision. Back yourself to use the numbers — managers respect directness when it''s underpinned by evidence.',
 NULL),

('40000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000030',
 '2026-03-19', 'Coles Burnside', 'sent',
 'Craig, this visit showed the impact of strong preparation — you arrived with specific data on the baking category, framed a clear opportunity and the manager committed to reinstating the deleted SKU. That outcome came directly from your prep work. The follow-through needs to keep pace with that quality: confirming the next call date before leaving will lock in the momentum you build in the visit.',
 NULL)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 6: Observation Scores
-- ============================================================

-- Tom Nguyen — Obs 1 (2026-04-15) — avg ~3.9
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 4, 'Reviewed prior call notes and category scan data before visit'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 4, 'Identified promotional void and gap in dairy adjacency'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 4, 'Clear objective set: reinstate secondary display'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 3, 'Had scan data but left sell sheet in the car'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 4, 'Opened visit clearly with stated purpose and timeline'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 4, 'Spotted off-location opportunity and ranging compliance issue'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000007', 4, 'Used data confidently in conversation, manager engaged'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000008', 4, 'Secondary display confirmed and actioned before leaving'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000009', 3, 'Notes captured but next call date not confirmed')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Tom Nguyen — Obs 2 (2026-03-20) — avg ~3.3
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 3, 'Reviewed last visit notes but not latest scan'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 3, 'Some awareness of gap but not quantified'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 2, 'Objective broad — "check compliance and have a chat"'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 3, 'Had tablet available, used it once'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', 3, 'Visit purpose communicated but loosely'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000006', 4, 'Excellent store walk — found off-location and OH&S issue'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000007', 3, 'Conversation was reactive rather than data-led'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000008', 4, 'Off-location actioned, activation completed'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000009', 3, 'Partial notes, no follow-up date set')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Tom Nguyen — Obs 3 (2026-02-28) — avg ~2.6
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 2, 'Minimal prep — no review of prior notes before visit'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 3, 'Identified category trend verbally but no data to support'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 2, 'No defined objective for the visit'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 2, 'No materials prepared'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', 3, 'Visit setup reasonable once in store'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006', 3, 'Found ranging issue but couldn''t recall the data behind it'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000007', 2, 'Couldn''t connect store observation to commercial argument'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000008', 3, 'Actioned existing compliance issue'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000009', 3, 'Notes taken, no next steps agreed')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Rebecca Walsh — Obs 1 (2026-04-22) — avg ~4.4
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 5, 'Thorough prep: reviewed last 3 call notes and current cycle data'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 4, 'Clear identification of share of shelf decline and SKU gap'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 5, 'Objective: reinstate 2 deleted SKUs. Success measure defined.'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 4, 'Printed category one-pager and had scan data on tablet'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', 4, 'Clear, confident visit opening'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000006', 5, 'Outstanding store walk — 5 issues identified and documented'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000007', 5, 'Used data brilliantly — manager committed to both SKU reinstatements'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000008', 4, 'Actioned display and compliance items on the day'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000009', 3, 'Strong visit but left without confirming reinstatement timeline')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Rebecca Walsh — Obs 2 (2026-03-12) — avg ~3.7
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 4, 'Good prep — reviewed scan and prior notes'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 4, 'Identified promotional compliance gap upfront'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 3, 'Objective set but success measure not defined'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', 3, 'Tablet available but sell sheet not updated'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 4, 'Professional visit opening'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000006', 5, 'Exceptional — 4 compliance issues spotted in first 10 minutes'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000007', 4, 'Good commercial discussion'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000008', 4, 'All compliance items actioned'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000009', 2, 'Visit notes not captured before leaving the store')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Liam O'Brien — Obs 1 (2026-04-18) — avg ~4.7
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', 5, 'Comprehensive prep — category data, prior notes, call plan all reviewed'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', 5, 'Clear commercial insight on dairy category opportunity with supporting data'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', 5, 'Precise objective with success measures and anticipated retailer response planned'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004', 4, 'One-pager and tablet ready'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', 5, 'Excellent visit setup — manager fully engaged from the start'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', 5, 'Methodical store walk, all gaps documented'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000007', 5, 'Scan data used expertly — landed secondary display commitment'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000008', 4, 'All activations completed'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000009', 5, 'Notes captured, next steps confirmed, follow-up call booked')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Liam O'Brien — Obs 2 (2026-03-25) — avg ~3.9
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', 4, 'Reviewed category data and prior notes'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000002', 4, 'Good insight on secondary display opportunity'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', 4, 'Clear objective defined'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000004', 4, 'Materials ready'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000005', 2, 'Visit purpose not clearly communicated — 5 mins lost re-establishing context'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000006', 5, 'Strong methodical store walk'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', 4, 'Good commercial engagement once conversation was established'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000008', 4, 'Secondary display actioned and confirmed'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000009', 4, 'Notes captured and next steps agreed')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Liam O'Brien — Obs 3 (2026-02-14) — avg ~2.9
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000001', 2, 'Limited prep — no data reviewed before visit'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000002', 2, 'Identified ranging gap in store but no commercial context'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', 2, 'No defined objective for the visit'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000004', 2, 'No materials prepared'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000005', 4, 'Good in-store setup despite limited prep'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000006', 4, 'Spotted ranging gap and promotional compliance issue'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000007', 3, 'Couldn''t build commercial case without data'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', 3, 'Partial execution — compliance fixed, no commercial outcome'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000009', 4, 'Good notes and follow-up agreed')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Jake Saunders — Obs 1 (2026-04-10) — avg ~3.1
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000001', 3, 'Reviewed prior notes but not current scan data'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000002', 3, 'Aware of ranging situation but no data to support'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', 2, 'Objective too broad — no success measure defined'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000004', 2, 'No materials prepared'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000005', 4, 'Warm, credible visit setup'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000006', 4, 'Good awareness of ranging situation in store'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000007', 3, 'Good energy but conversation not data-led'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000008', 3, 'Partial execution'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', 4, 'Notes captured, next steps discussed')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Jake Saunders — Obs 2 (2026-03-05) — avg ~2.3
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000001', 2, 'Minimal prep'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000002', 2, 'Limited commercial awareness'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000003', 2, 'No clear objective'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000004', 2, 'No supporting materials'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000005', 3, 'Reasonable start to visit'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000006', 3, 'Observed issues but didn''t connect to commercial data'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000007', 2, 'Commercial engagement limited — no data used'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000008', 2, 'Minimal execution'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000009', 3, 'Basic notes taken')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Dean Watkins — Obs 1 (2026-04-14) — avg ~4.0
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000001', 4, 'Thorough review of category data and prior call notes'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000002', 4, 'Clear commercial insight on baking category gap'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000003', 3, 'Objective defined but success measure could be sharper'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000004', 4, 'Tablet and category data ready'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000005', 4, 'Professional, clear visit opening'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000006', 4, 'Comprehensive store walk'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000007', 4, 'Good commercial engagement'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000008', 4, 'Activations completed'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000009', 5, 'Excellent follow-through — notes, next steps, follow-up date all confirmed')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Dean Watkins — Obs 2 (2026-03-08) — avg ~4.1
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000001', 4, 'Good prep with competitor distribution data'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000002', 5, 'Strong use of competitor data to frame opportunity'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000003', 4, 'Clear objective and success criteria'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000004', 3, 'Tablet ready but no printed leave-behind'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000005', 4, 'Strong visit setup'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000006', 4, 'Good store observation'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000007', 5, 'Outstanding commercial engagement — used competitor data confidently'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000008', 4, 'Execution completed'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000009', 4, 'Notes and follow-up confirmed')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Craig Nolan — Obs 1 (2026-04-16) — avg ~3.6
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000001', 4, 'Reviewed prior notes and category data'),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000002', 3, 'Had data but insight not fully formed'),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000003', 4, 'Objective defined, success measure noted'),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000004', 3, 'Had tablet, no printed support'),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000005', 5, 'Excellent visit setup — manager highly engaged from the start'),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000006', 4, 'Methodical store walk, good observations'),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000007', 3, 'Had data but didn''t use it to challenge ranging decision'),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000008', 4, 'Execution items completed'),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000009', 3, 'Notes taken but no follow-up date set')
ON CONFLICT (observation_id, area_id) DO NOTHING;

-- Craig Nolan — Obs 2 (2026-03-19) — avg ~3.7
INSERT INTO observation_scores (observation_id, area_id, score, comments) VALUES
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000001', 5, 'Excellent prep — category data, trend report, prior notes all reviewed'),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000002', 4, 'Clear insight on baking category SKU deletion opportunity'),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000003', 4, 'Well-defined objective: reinstate deleted SKU'),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000004', 4, 'Category data and one-pager prepared'),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000005', 4, 'Good visit opening'),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000006', 3, 'Store walk OK — missed one compliance issue'),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000007', 4, 'Used category data effectively — SKU reinstatement committed'),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000008', 3, 'Execution items started but timeline not confirmed'),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000009', 2, 'Left without confirming next call date')
ON CONFLICT (observation_id, area_id) DO NOTHING;
