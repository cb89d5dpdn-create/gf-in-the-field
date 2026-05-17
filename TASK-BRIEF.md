# GF In The Field — Build Brief for Forge

## Overview
Mobile-first web platform for Field Sales Managers (FSMs) at Goodman Fielder to conduct structured coaching observations on Regional Sales Managers (RSMs). FSM selects RSM, rates across 9 areas (1-5), adds comments, Claude AI generates coaching summary, emailed to FSM.

## CRITICAL: Project Isolation
- **New GitHub repo:** KMBV810/gf-in-the-field
- **New Supabase project:** gf-in-the-field (dedicated, not shared)
- **New Vercel project:** separate deployment
- **Separate .env files:** never mix with other projects
- **Domain:** gfinthefield.com.au (registered)

## Tech Stack
| Layer | Choice |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL + Auth) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Email | Resend — sender: coach@gfinthefield.com.au |
| Hosting | Vercel (frontend) + Railway or Render (backend) |

## Repository Structure
```
gf-in-the-field/
├── client/          ← React frontend (Vite)
├── server/          ← Node.js Express backend
├── supabase/        ← DB migrations + seed files
├── .env.example     ← Template (no real secrets)
├── README.md        ← Setup instructions + cost notes
└── COSTS.md         ← Running cost breakdown
```

## Users & Roles
| Role | Count | Access |
|---|---|---|
| Admin (Ben) | 1 | Full read across all FSMs, RSMs, observations. Cannot submit observations. |
| FSM | 5 | Sees own state's RSMs only. Submits and views observations. |
| RSM | 34 | No login. Coaching is about them, not by them. |

Role stored as `role` field on `fsm_profiles`: `'admin'` | `'fsm'`

## RSM Counts by State
- NSW: 10 RSMs
- VIC: 9 RSMs
- QLD: 6 RSMs
- SA/NT: 5 RSMs (single FSM covers both)
- WA: 4 RSMs
- Total: 34 RSMs across 5 FSMs

## Database Schema

### organisations
```sql
CREATE TABLE organisations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```
Include even though V1 has only one org. Multi-tenancy hook for future SaaS.

### fsm_profiles
```sql
CREATE TABLE fsm_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  org_id uuid REFERENCES organisations(id) NOT NULL,
  name text NOT NULL,
  state text NOT NULL, -- 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA/NT'
  role text NOT NULL DEFAULT 'fsm', -- 'fsm' | 'admin'
  created_at timestamp with time zone DEFAULT now()
);
```

### rsms
```sql
CREATE TABLE rsms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organisations(id) NOT NULL,
  fsm_id uuid REFERENCES fsm_profiles(id) NOT NULL,
  name text NOT NULL,
  email text,
  state text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

### observation_areas
```sql
CREATE TABLE observation_areas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organisations(id) NOT NULL,
  order_index integer NOT NULL,
  group_name text NOT NULL, -- 'Visit Prep & Data' | 'In-Store'
  label text NOT NULL,
  description text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
```

### observations
```sql
CREATE TABLE observations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organisations(id) NOT NULL,
  fsm_id uuid REFERENCES fsm_profiles(id) NOT NULL,
  rsm_id uuid REFERENCES rsms(id) NOT NULL,
  visit_date date NOT NULL,
  location text,
  status text DEFAULT 'draft', -- 'draft' | 'generated' | 'sent'
  ai_summary text,
  edited_summary text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### observation_scores
```sql
CREATE TABLE observation_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  observation_id uuid REFERENCES observations(id) NOT NULL,
  area_id uuid REFERENCES observation_areas(id) NOT NULL,
  score integer CHECK (score >= 1 AND score <= 5),
  comments text
);
```

## Observation Areas — Seed Data
```sql
INSERT INTO observation_areas (org_id, order_index, group_name, label, description, is_active) VALUES
(ORG_ID, 1, 'Visit Prep & Data', 'Visit Preparation', 'Reviews prior notes, requirements and supporting data before the visit', true),
(ORG_ID, 2, 'Visit Prep & Data', 'Commercial Insight', 'Identifies relevant trends, gaps and opportunities from available data', true),
(ORG_ID, 3, 'Visit Prep & Data', 'Conversation Planning', 'Defines objective, success measures and likely retailer response', true),
(ORG_ID, 4, 'Visit Prep & Data', 'Engagement Readiness', 'Prepares supporting data/materials for retailer engagement', true),
(ORG_ID, 5, 'In-Store', 'Visit Setup', 'Communicates clear visit purpose and objectives to retailer', true),
(ORG_ID, 6, 'In-Store', 'Store Observation', 'Identifies compliance, ranging, stock and merchandising opportunities', true),
(ORG_ID, 7, 'In-Store', 'Commercial Engagement', 'Uses data and insights to support retailer conversation', true),
(ORG_ID, 8, 'In-Store', 'Execution', 'Completes to required standards, activations and commitments', true),
(ORG_ID, 9, 'In-Store', 'Follow-through/Hygiene', 'Confirms next steps and captures relevant visit notes', true);
```

## Test/Seed Accounts
```
Admin:    admin@gfinthefield.com.au  /  Admin1234!    ← Ben changes on first login
FSM NSW:  fsm.nsw@test.com           /  Test1234!
FSM VIC:  fsm.vic@test.com           /  Test1234!
FSM QLD:  fsm.qld@test.com           /  Test1234!
FSM WA:   fsm.wa@test.com            /  Test1234!
FSM SANT: fsm.sant@test.com          /  Test1234!
```

Create 2-3 RSMs per FSM with realistic Australian names.
Create 2-3 sample completed observations per RSM with realistic scores and AI summaries.
Dashboard and history views must render real data from first login.

## Application Screens

### Login Page
- Goodman Fielder logo centred (placeholder until Ben supplies asset)
- "GF In The Field" platform name below logo
- Email + password fields
- "Login" button — full width
- "Forgot password?" link → Supabase reset email
- No self-registration — admin creates all accounts
- Footer: gfinthefield.com.au
- Design: white, clean, corporate-minimal

### Password Management
- Forgot password (login page): email → reset link → new password
- Change password (in-app): profile menu → Change Password → current + new + confirm
- Both via Supabase Auth natively

### FSM Dashboard
- Header: FSM name + state
- "Start New Observation" button — prominent at top
- RSM cards (one per team member) showing:
  - Name, total visits, last visit date, last visit avg score
  - Colour dot: 🔴 < 2.5 | 🟡 2.5–3.9 | 🟢 4.0+
- Tap card → RSM history view

### New Observation Flow
1. Select RSM (tappable list with search)
2. Enter date (default: today) + optional location/store name
3. Observation form — 9 areas across 2 grouped sections:
```
━━━ VISIT PREP & DATA ━━━
[ Area label ]
[ Behaviour description — small grey text ]
  1=Needs Dev  2=Developing  3=Competent  4=Proficient  5=Expert
  (large pill buttons, full width)
[ Key observations / examples... ] ← optional free text

━━━ IN-STORE ━━━
[ ... same pattern ... ]
```
4. Progress indicator: "6 of 9 areas scored"
5. "Generate Report" button — activates only when all 9 scored
6. AI generates coaching summary (5–10 sec spinner)
7. Review screen: score table + editable AI summary
8. "Send to My Email" → email fires → redirect to dashboard with success toast

### RSM History View
- All past observations for selected RSM (date, location, avg score)
- Tap any observation → read-only view of scores + summary

### Admin View (/admin route)
- Platform-wide stats: total visits, avg score, most/least active FSM
- All 5 FSMs listed with: total obs, team size, last activity
- Drill into FSM → their team + all observations (read-only)
- Drill into RSM → all observations across time (read-only)
- Admin cannot submit observations

## AI Prompt

### System Prompt
```
You are an expert field sales coach writing a post-visit coaching summary
for a Regional Sales Manager in an FMCG field sales team.

Your tone is direct, professional, and constructive — like a respected
leader who genuinely wants to develop their team.

You never use corporate jargon or filler phrases.

Write in second person ("you demonstrated", "your approach to...").

This summary is for the Field Sales Manager's coaching records only —
it is a development tool, not a formal performance review.
```

### User Prompt Template
```
You have just completed a field observation with [RSM Name] on [Date][, at [Location]].

The observation covers two phases: Visit Prep & Data (pre-store preparation)
and In-Store (performance during the visit).

VISIT PREP & DATA
Area: Visit Preparation | Score: X/5 (Label) | Comments: "..."
Area: Commercial Insight | Score: X/5 (Label) | Comments: "..."
Area: Conversation Planning | Score: X/5 (Label) | Comments: "..."
Area: Engagement Readiness | Score: X/5 (Label) | Comments: "..."

IN-STORE
Area: Visit Setup | Score: X/5 (Label) | Comments: "..."
Area: Store Observation | Score: X/5 (Label) | Comments: "..."
Area: Commercial Engagement | Score: X/5 (Label) | Comments: "..."
Area: Execution | Score: X/5 (Label) | Comments: "..."
Area: Follow-through/Hygiene | Score: X/5 (Label) | Comments: "..."

Overall average: X.X/5
Visit Prep & Data average: X.X/5
In-Store average: X.X/5

Write a coaching summary (3–4 paragraphs) that:
1. Opens with an overall read of the visit (reference both phases if they differ)
2. Calls out genuine strengths (4–5 scores) by name, with reference to comments
3. Names 1–2 development areas (lowest scores) as opportunities, not criticisms
4. Closes with a specific, observable coaching focus for next visit

Tone by average: 1.0–2.4 empathetic/honest | 2.5–3.4 balanced | 3.5–4.4 encouraging/high standards | 4.5–5.0 reinforcing excellence
Rules: Connected paragraphs only. No bullets. No "overall", "in conclusion", "moving forward".
If prep vs in-store averages differ by >1.0 point, name that contrast — it's the key insight.
```

## Email Template

**From:** coach@gfinthefield.com.au
**Subject:** GF In The Field | Coaching Observation — [RSM Name] — [Date]

```
Hi [FSM Name],

Here is your coaching summary from today's field visit.

───────────────────────────────
RSM:      [Name]
Date:     [Date]
Location: [Location or "Not recorded"]
───────────────────────────────

VISIT PREP & DATA
Visit Preparation       X/5 — Label
Commercial Insight       X/5 — Label
Conversation Planning    X/5 — Label
Engagement Readiness     X/5 — Label
Group Average: X.X/5

IN-STORE
Visit Setup              X/5 — Label
Store Observation        X/5 — Label
Commercial Engagement    X/5 — Label
Execution                X/5 — Label
Follow-through/Hygiene   X/5 — Label
Group Average: X.X/5

Overall Average: X.X/5

───────────────────────────────
COACHING SUMMARY

[AI summary paragraphs here]

───────────────────────────────
GF In The Field — gfinthefield.com.au
```

## API Endpoints
```
POST  /api/auth/login
GET   /api/dashboard                    FSM team + visit summary
GET   /api/rsms                         FSM's RSMs
GET   /api/rsms/:id/history             Past observations for RSM
POST  /api/observations                 Create draft observation
GET   /api/observations/:id             Get observation
PUT   /api/observations/:id             Update scores/comments
POST  /api/observations/:id/generate    Trigger Claude AI summary
POST  /api/observations/:id/send        Send email + mark sent
GET   /api/areas                        Active observation areas

-- Admin only
GET   /api/admin/overview               Platform-wide stats
GET   /api/admin/fsms                   All FSMs + activity
GET   /api/admin/fsms/:id               FSM detail + team
GET   /api/admin/rsms/:id               RSM full history
```

## Mobile UI Requirements
- Minimum 44px tap targets on all interactive elements
- Score buttons: large pill-style, full row width, clearly labelled
- Font minimum 16px on inputs (prevents iOS auto-zoom)
- No horizontal scrolling on any screen
- Sticky CTA button at bottom of long screens
- Loading states on all async actions (AI generation, email send)
- Toast notifications for success/error states

## Environment Variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
FROM_EMAIL=coach@gfinthefield.com.au
NODE_ENV=production
```

## V1 Scope
| Feature | V1 | V1.1 | Future |
|---|---|---|---|
| Email/password login | ✅ | | |
| FSM self-serve password change | ✅ | | |
| Forgot password reset | ✅ | | |
| FSM state-scoped view | ✅ | | |
| Admin full visibility | ✅ | | |
| 9-area observation form | ✅ | | |
| AI coaching summary (Claude) | ✅ | | |
| FSM edits summary pre-send | ✅ | | |
| Email to FSM on send | ✅ | | |
| FSM dashboard + RSM cards | ✅ | | |
| RSM observation history | ✅ | | |
| Score trend charts per RSM | | ✅ | |
| Observation area management UI | | ✅ | |
| HTML email template | | ✅ | |
| PDF export of coaching report | | ✅ | |
| Multi-org / SaaS mode | | | ✅ |
| SSO / Goodman Fielder auth | | | ✅ |
| Native mobile app | | | ✅ |
| RSM receives email copy | ❌ Not in scope | | |

## Scale & Multi-tenancy Requirements
- `organisations` table must exist in V1 (non-negotiable)
- ALL DB queries must filter by `org_id`
- Auth middleware must validate org_id matches logged-in user's org
- No hardcoded org names, colours, or logos
- Observation areas are per-org (different companies can have different frameworks)

## Definition of Done — V1
- All 5 FSM test accounts can log in and submit a full observation
- AI summary generates successfully and is editable
- Email delivers to FSM email address with correct content
- Admin account can view all FSMs, RSMs, and observations
- Password change and forgot password both work
- Dashboard renders correct visit counts and colour indicators
- RSM history shows all past observations
- Mobile layout works correctly on iPhone (Safari) and Android (Chrome)
- All environment variables documented in .env.example
- README includes local setup instructions
- COSTS.md exists with running cost estimate
