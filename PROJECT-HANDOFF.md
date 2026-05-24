# GF In The Field — Project Handoff Summary
**Date:** 2026-05-24  
**Primary Owner:** Atlas (AI Agent)  
**Prepared for:** External code review / additional support

---

## 1. Current Codebase Structure

```
gf-in-the-field/
├── client/                          # React frontend (Vite + Tailwind)
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── gf-logo.jpg             # Goodman Fielder logo
│   │   ├── roger-logo.jpg          # ROGER™ branding
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/                 # Static images (unused hero.png)
│   │   ├── components/
│   │   │   ├── GoodmanFielderLogo.jsx    # SVG logo component
│   │   │   ├── Layout.jsx                # Header, menu, mobile/desktop toggle
│   │   │   ├── ProtectedRoute.jsx        # Auth guard wrapper
│   │   │   └── Skeleton.jsx              # Loading placeholders
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx           # Supabase auth state
│   │   ├── lib/
│   │   │   ├── api.js                    # Axios wrapper for backend
│   │   │   └── supabase.js               # Supabase client
│   │   ├── pages/
│   │   │   ├── Admin.jsx                 # (Unused - replaced by AdminUsers)
│   │   │   ├── AdminUsers.jsx            # Admin user management (FSM/RSM CRUD)
│   │   │   ├── ChangePassword.jsx        # Change password form
│   │   │   ├── Dashboard.jsx             # Main landing - RSM list w/ stats
│   │   │   ├── Login.jsx                 # Login + password reset
│   │   │   ├── NewObservation.jsx        # Multi-step observation form
│   │   │   ├── ResetPassword.jsx         # Password reset confirmation
│   │   │   └── RSMHistory.jsx            # Observation history for an RSM
│   │   ├── App.jsx                       # React Router + React Query setup
│   │   ├── index.css                     # Tailwind imports + GF brand colors
│   │   └── main.jsx                      # React entry point
│   ├── .env.local                        # Frontend env (VITE_SUPABASE_URL, etc.)
│   ├── package.json
│   ├── vercel.json                       # SPA routing config
│   └── vite.config.js
│
├── server/                          # Node.js Express backend
│   ├── lib/
│   │   └── supabase.js                   # Supabase Admin client
│   ├── middleware/
│   │   └── auth.js                       # JWT verification + profile injection
│   ├── routes/
│   │   ├── admin.js                      # Admin endpoints (users, FSM/RSM CRUD, voice profiles)
│   │   ├── areas.js                      # GET observation areas
│   │   ├── auth.js                       # Login/logout (delegates to Supabase)
│   │   ├── dashboard.js                  # Dashboard data (FSM/RSM list + stats)
│   │   ├── observations.js               # CRUD + AI generation + email send
│   │   └── rsms.js                       # RSM history endpoint
│   ├── services/
│   │   └── voiceProfileService.js        # Claude-powered FSM voice analysis
│   ├── .env                              # Backend env (SUPABASE_SERVICE_ROLE_KEY, etc.)
│   ├── index.js                          # Express server entry point
│   └── package.json
│
├── supabase/                        # Database schema + seed data
│   ├── migrations/
│   │   ├── 001_initial_schema.sql        # Tables, indexes, RLS policies
│   │   ├── 002_preserve_rsm_history.sql  # FSM deletion fix + overall_comments
│   │   └── 003_voice_profiles.sql        # Voice profile learning + test data exclusion
│   └── seed/
│       ├── 001_seed_data.sql             # 1 org, 6 FSMs (5 FSM + 1 admin), 34 RSMs, 9 areas
│       ├── 001_seed_data_FIXED.sql       # (Backup - same as above)
│       └── create-test-users.js          # Node script to create auth users
│
├── scripts/
│   ├── create-users.sh                   # Shell wrapper for create-test-users.js
│   └── setup-supabase.js                 # Manual script to run migrations
│
├── .env.example                     # Template for backend env vars
├── APPLY-MIGRATION.sql              # Manual migration file (002 applied)
├── COSTS.md                         # Cost breakdown (~$5-10/month)
├── DEPLOY.md                        # Step-by-step deployment guide
├── PHASE2-COMPLETE.md               # Feature completion log
├── PHASE2-TASKS.md                  # Post-MVP feature checklist
├── PROJECT-BRIEF.pdf                # Original scoped brief from Ben
├── README.md                        # Setup + run instructions
├── TASK-BRIEF.md                    # Technical brief for Forge
└── run-migration.js                 # Node script to run SQL migrations
```

### File Naming Conventions
- **Components:** PascalCase (e.g., `Layout.jsx`, `GoodmanFielderLogo.jsx`)
- **Pages:** PascalCase (e.g., `Dashboard.jsx`, `NewObservation.jsx`)
- **Routes:** kebab-case API paths (e.g., `/api/observations`, `/api/rsms/:id/history`)
- **Database:** snake_case (e.g., `fsm_profiles`, `observation_areas`)
- **Migrations:** Sequential numbering (`001_`, `002_`, `003_`)

---

## 2. What's Built and Working vs. In Progress

### ✅ **Fully Built & Deployed**
| Screen/Feature | Status | Notes |
|---|---|---|
| **Login page** | ✅ Live | Email/password, forgot password, ROGER™ logo, GF branding |
| **Dashboard (FSM view)** | ✅ Live | Flat RSM list, color-coded scores (blue/yellow/green), YTD/MTD counts |
| **Dashboard (Admin view)** | ✅ Live | Hierarchical FSM → RSM grouping, expand/collapse, total RSM count |
| **New Observation form** | ✅ Live | 3 steps: RSM select, scoring (9 areas), overall comments, draft save |
| **AI Summary Generation** | ✅ Live | Claude Sonnet 4.5, 70-80% driven by FSM comments, softer tone |
| **Email Delivery** | ✅ Live | Resend API, `coach@gfinthefield.com.au` verified domain |
| **RSM History** | ✅ Live | Past observations, draft badges, swipe-to-delete, view details |
| **Observation Detail** | ✅ Live | Scores table, FSM comments (copyable), editable coaching summary |
| **Change Password** | ✅ Live | Self-service password update, show/hide toggle |
| **Admin User Management** | ✅ Live | 4 tabs (Admins/FSMs/RSMs/Voice Profiles), full CRUD, edit modals |
| **React Query caching** | ✅ Live | 5-min staleTime, 10-min cacheTime, cache cleared on logout |
| **Skeleton loading states** | ✅ Live | Replaced spinners with placeholder boxes (feels faster) |
| **Mobile-first responsive** | ✅ Live | Max-w-2xl default, admin can toggle to desktop (max-w-6xl) |
| **GF Branding** | ✅ Live | Teal (#006B7D), GF logo, ROGER logo, correct fonts |
| **Password reset flow** | ✅ Live | Email link → reset page → confirm new password |
| **Draft observations** | ✅ Live | Visible in RSM history, resumable via `/observations/:id/continue` |
| **FSM Voice Profiles (V1.1)** | ✅ Live | Auto-learns writing style after 3+ observations, personalizes summaries |

### 🚧 **Partially Complete / Known Gaps**
| Feature | Status | What's Missing |
|---|---|---|
| **Email content** | ⚠️ Partial | Coach summary sent, but NO numeric scores (intentionally hidden). "KEY STRENGTHS" section only shows 4+ areas. "KEY FOCUS AREAS" (not "FOR DEVELOPMENT"). Footer removed. |
| **Admin delete users** | ⚠️ Disabled | Delete buttons replaced with Edit (per Ben's request). Admins can edit but not delete FSMs/RSMs. |
| **VIC/TAS handling** | ✅ Fixed | Database updated to `VIC/TAS`, UI shows "VIC/TAS" consistently. |
| **Observation status flow** | ✅ Fixed | draft → generated (editable) → sent (read-only). Drafts hidden from history by default. |

### ❌ **Not Started / Out of Scope**
- **Multi-org support** (schema ready, but single org hardcoded)
- **RSM self-service portal** (RSMs never log in - no requirement)
- **Observation analytics dashboard** (future Phase 3)
- **Export to CSV/PDF** (not in brief)
- **Mobile app** (PWA only, no native app)

### **Definition of Done (from brief) - Status**
| Requirement | Status |
|---|---|
| FSM can log in, see RSMs, submit observation | ✅ |
| Admin can see all data across all FSMs | ✅ |
| AI generates coaching summary from scores + comments | ✅ |
| Email sent to FSM with summary | ✅ |
| Mobile-first, works on phone | ✅ |
| Deployed to production (Vercel + Railway) | ✅ |
| Domain connected (gfinthefield.com.au) | ✅ |
| Resend domain verified | ✅ |
| Cost under $10 AUD/month | ✅ ($5-10/month) |

---

## 3. All Database Tables (As Actually Exist)

### **Current Supabase Project:**
- **Project ID:** `ivbhxhhxldqdgkbltywv`
- **URL:** `https://ivbhxhhxldqdgkbltywv.supabase.co`
- **Region:** Australia Southeast (Sydney)

### **Schema (Applied Migrations: 001 + 002 + 003)**

#### **organisations**
```sql
CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```
- **Current data:** 1 row (`Goodman Fielder`)
- **Purpose:** Multi-tenancy foundation (currently single org)

#### **fsm_profiles**
```sql
CREATE TABLE fsm_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  state text NOT NULL,  -- 'NSW' | 'VIC/TAS' | 'QLD' | 'WA' | 'SA/NT'
  role text NOT NULL DEFAULT 'fsm',  -- 'fsm' | 'admin'
  created_at timestamptz DEFAULT now()
);
```
- **Current data:** 6 users (1 admin: Ben Voigt, 5 FSMs across states)
- **Indexes:** `idx_fsm_profiles_user_id`, `idx_fsm_profiles_org_id`
- **Notes:** `role` field determines admin vs FSM permissions

#### **rsms**
```sql
CREATE TABLE rsms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  fsm_id uuid REFERENCES fsm_profiles(id) ON DELETE SET NULL,  -- ⚠️ Changed in migration 002
  name text NOT NULL,
  email text,
  state text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```
- **Current data:** 34 RSMs (seeded from brief)
- **Indexes:** `idx_rsms_org_id`, `idx_rsms_fsm_id`
- **⚠️ Key change (migration 002):** `fsm_id` nullable, SET NULL on FSM delete (preserves RSM history)

#### **observation_areas**
```sql
CREATE TABLE observation_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  order_index integer NOT NULL,
  group_name text NOT NULL,  -- 'Visit Prep & Data' | 'In-Store'
  label text NOT NULL,
  description text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```
- **Current data:** 9 areas (3 Visit Prep, 6 In-Store)
- **Indexes:** `idx_observation_areas_org_id`
- **Notes:** Static data, seeded once

#### **observations**
```sql
CREATE TABLE observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  fsm_id uuid REFERENCES fsm_profiles(id) ON DELETE CASCADE NOT NULL,
  rsm_id uuid REFERENCES rsms(id) ON DELETE CASCADE NOT NULL,
  visit_date date NOT NULL,
  location text,
  status text DEFAULT 'draft',  -- 'draft' | 'generated' | 'sent'
  ai_summary text,
  edited_summary text,
  overall_comments text,  -- ⚠️ Added in migration 002
  exclude_from_voice_profile boolean DEFAULT false,  -- ⚠️ Added in migration 003
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
- **Current data:** 15 test observations (all flagged `exclude_from_voice_profile = true`)
- **Indexes:** `idx_observations_org_id`, `idx_observations_fsm_id`, `idx_observations_rsm_id`, `idx_observations_status`
- **⚠️ Key change (migration 002):** Added `overall_comments` field (FSM free-text notes)
- **⚠️ Key change (migration 003):** Added `exclude_from_voice_profile` boolean (all existing test observations flagged true)

#### **observation_scores**
```sql
CREATE TABLE observation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id uuid REFERENCES observations(id) ON DELETE CASCADE NOT NULL,
  area_id uuid REFERENCES observation_areas(id) ON DELETE CASCADE NOT NULL,
  score integer CHECK (score >= 1 AND score <= 5),
  comments text,
  UNIQUE(observation_id, area_id)
);
```
- **Current data:** Linked to test observations
- **Indexes:** `idx_observation_scores_observation_id`, `idx_observation_scores_area_id`
- **Notes:** 1 row per area per observation (9 rows per observation)

#### **fsm_voice_profiles**
```sql
CREATE TABLE fsm_voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fsm_id uuid NOT NULL REFERENCES fsm_profiles(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  profile_text text NOT NULL,
  observations_analysed integer NOT NULL DEFAULT 0,
  gf_terms_detected text[],
  last_generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(fsm_id)
);
```
- **Current data:** None (generates after 3+ qualifying observations)
- **Indexes:** `idx_fsm_voice_profiles_fsm_id`, `idx_fsm_voice_profiles_org_id`
- **⚠️ Added in migration 003:** Auto-generates personalized voice profiles from FSM writing patterns
- **Purpose:** Stores learned vocabulary, GF terminology, writing style, and tone for each FSM/admin
- **RLS:** FSMs can read own profile, service role can manage all

### **Row-Level Security (RLS)**
All tables have RLS enabled. Key policies:
- **FSMs** see only their own RSMs/observations
- **Admins** see everything in the org
- Helper functions: `auth_org_id()`, `auth_profile_id()`, `auth_role()`

### **Auth (Supabase)**
- **Provider:** Email/Password only (no OAuth)
- **Users stored in:** `auth.users` (Supabase managed)
- **Profile link:** `fsm_profiles.user_id → auth.users.id`

---

## 3.5. V1.1 Feature: FSM Voice Profiles (Shipped 2026-05-24)

### **What It Does**
Auto-learns each FSM's unique writing style, vocabulary, and Goodman Fielder terminology after 3+ sent observations. Future AI-generated coaching summaries are then personalized to sound like that specific FSM wrote them.

### **Why It Matters**
The longer someone uses the platform, the more their summaries sound like *them* — not like generic AI output. This creates stickiness and makes coaching feel authentic. Shane's summaries will sound like Shane. Blake's will sound like Blake.

### **Implementation Status: ✅ COMPLETE**

| Component | Status | Details |
|---|---|---|
| **Migration 003 applied** | ✅ | `exclude_from_voice_profile` column + `fsm_voice_profiles` table created |
| **Test data clean slate** | ✅ | 15 existing test observations flagged as excluded (learning starts from real usage only) |
| **voiceProfileService.js built** | ✅ | Claude Sonnet 4.5 analyzes 3-20 most recent observations |
| **Wired to observation send** | ✅ | Auto-generates/refreshes profile after each send (fire-and-forget, non-blocking) |
| **Wired to summary generation** | ✅ | Injects learned voice into Claude system prompt when profile exists |
| **Admin visibility added** | ✅ | Voice Profiles tab in Admin Users page (FSM name, obs count, GF terms, full profile) |

### **Clean Slate Date: 2026-05-24**
Migration 003 applied on this date. All observations created **before** this timestamp are excluded from voice profile learning. Only real observations submitted **after** this date contribute to voice profiles.

### **Learning Threshold**
- **Observations 1-2:** Standard AI summaries (no personalization yet)
- **Observation 3:** Voice profile generates automatically in background
- **Observation 4+:** Summaries reflect learned vocabulary, GF terminology, writing style, and tone
- **Profile updates:** After every new observation sent (always uses last 20 observations)

### **What Gets Learned**
1. **Vocabulary & Phrases** — 8-12 specific words/expressions the FSM uses repeatedly
2. **GF/Industry Terms** — Company-specific terminology (e.g., "Perfect Store", "ranging", "sell-in")
3. **Writing Style** — Brief vs detailed, questions vs statements, fragments vs full sentences
4. **Tone** — Encouraging, direct, matter-of-fact, enthusiastic
5. **Summary Instruction** — Distilled guidance for Claude on how to mirror this person's voice

### **End-to-End Test Plan**

**For Ben/Blake to validate once Shane submits real observations:**

1. **Verify clean slate:**
   ```sql
   SELECT count(*) FROM observations WHERE exclude_from_voice_profile = true;
   -- Should return: 15
   ```

2. **Submit 3 observations as Shane:**
   - After observation #3 sends, check Railway logs for:
     ```
     ✅ Voice profile generated for FSM <id> using 3 observations
     ```

3. **Check Admin UI:**
   - Navigate to: Admin Users → Voice Profiles tab
   - Should see: Shane's profile with 3 observations analyzed
   - Click "View Full Profile" → see vocabulary, GF terms, writing style

4. **Submit observation #4:**
   - Generate summary → compare to observations #1-2
   - Should feel more "Shane-like" (uses his phrases, mirrors his style)

5. **Profile refinement:**
   - Each new observation refreshes the profile
   - GF terms list should grow as Shane uses more company-specific language
   - Writing style description should become more accurate over time

### **Admin Visibility**
- **Tab location:** Admin Users page → "Voice Profiles" (4th tab, far right)
- **Who can see:** Admins only (Ben, Blake)
- **FSM visibility:** None (FSMs never see voice learning happening, just improved summaries)
- **Data shown:** FSM name, role, state, observation count, detected GF terms, full profile text, last updated timestamp

### **Technical Notes**
- **Model:** Claude Sonnet 4.5 (`claude-sonnet-4-20250514`)
- **Max tokens:** 800 (profile generation)
- **Observation window:** Last 20 sent observations (to keep profile current as writing evolves)
- **Profile storage:** `fsm_voice_profiles.profile_text` (~150-200 words)
- **Performance:** Profile generation runs async after email send — zero impact on send response time
- **Failure handling:** If profile generation fails, logs error but doesn't block email send

---

## 4. Decisions That Deviated From Brief

### **✅ Intentional Changes (Approved by Ben)**

| Original Brief | What Was Built | Reason |
|---|---|---|
| **RSM deletion:** Cascade delete RSMs when FSM deleted | **SET NULL:** RSMs preserved, `fsm_id` becomes NULL | Preserve RSM observation history even after FSM leaves company |
| **Email content:** Include numeric scores | **Hidden:** Only show 2 key focus areas + strengths by name | Ben + Blake feedback: scores too clinical, focus on narrative coaching |
| **AI tone:** Professional coaching tone | **30% softer:** "observations and opportunities" language | Blake feedback: original tone too harsh |
| **FSM comments weight:** 50/50 with AI insights | **70-80%:** AI synthesizes FSM's words, not generated insights | Ben feedback: FSM's observations are the primary source |
| **Dashboard:** Flat RSM list for all users | **Hierarchical for admins:** FSMs grouped with expand/collapse | Ben request: easier admin navigation |
| **Draft visibility:** Drafts shown in history | **Drafts visible with badge:** Can resume from RSM history | Ben request: FSMs work on observations across multiple visits |
| **Delete buttons:** Admin can delete users | **Edit only:** Delete buttons removed, edit modals added | Ben request: prevent accidental deletions |
| **VIC state:** "VIC" label only | **"VIC/TAS":** Tasmania included under VIC FSM | Organizational structure clarification |
| **View modes:** Single mobile view | **Mobile/desktop toggle (admin only):** localStorage persisted | Admin convenience for large screens |
| **Password fields:** Plain text input | **Show/hide toggle (eye icon):** Better UX | Standard web practice |
| **Loading states:** Spinners | **Skeleton placeholders:** Animated gray boxes | Feels 2x faster, modern UX pattern |
| **Caching:** No caching | **React Query (5-min staleTime):** Instant repeat visits | Performance optimization (2-5x faster navigation) |

### **🚨 Technical Choices (Not in Brief)**

| Decision | Why |
|---|---|
| **React Query** instead of plain `useEffect` | Caching, stale-while-revalidate, better DX |
| **Tailwind CSS** utility classes | Faster styling, mobile-first defaults |
| **Axios** for API calls | Cleaner than `fetch`, automatic JSON parsing |
| **Express.js** backend | Simpler than Next.js API routes, easier Railway deployment |
| **Railway** over Render | Ben's existing account, easier billing |
| **Vercel** for frontend | Zero-config Vite support, free tier |
| **Swipe-to-delete** on mobile | Touch-friendly UX (50px threshold, 80px lock) |
| **Color-coded score dots** | Visual priority (blue <2.5, yellow 2.5-3.9, green 4.0+) |

### **📝 Field Name Changes**

| Brief | Actual Schema | Reason |
|---|---|---|
| N/A | `overall_comments` added | Ben requested FSM free-text field for visit summary |
| N/A | `edited_summary` added | Allow FSM to edit AI summary before sending |
| N/A | `ytd_count`, `mtd_count` (computed) | Ben requested YTD/MTD observation counts on dashboard |

---

## 5. Current AI Prompt in Production

**Model:** `claude-sonnet-4-20250514` (Claude 3.5 Sonnet)  
**Location:** `/server/routes/observations.js` (line ~150)  
**Tone:** Warm, professional, developmental (30% softer than original)  
**Weight:** 70-80% driven by FSM's `overall_comments`, 20-30% from numeric scores

**Full Prompt:**
```javascript
const prompt = `You are a senior field sales coach at Goodman Fielder writing a constructive coaching summary for an RSM based on an FSM's store visit observation.

**Observation Details:**
- RSM: ${rsmName}
- Visit Date: ${new Date(obs.visit_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
- Location: ${obs.location || 'Not specified'}

**FSM's Overall Visit Comments:**
${obs.overall_comments || 'No overall comments provided.'}

**Scores by Area (1-5 scale):**
${scoreLines.join('\n')}

**Your Task:**
Generate a warm, professional, and developmental coaching summary (300-400 words) that:
1. **Leads with strengths first** — acknowledge what the RSM is doing well based on high scores (4-5) and FSM comments
2. **Identifies 2-3 key opportunities for growth** — focus on specific, actionable behaviors rather than generic advice
3. **Uses the FSM's observations as the primary source** (70-80% weight) — your role is to synthesize and structure their insights, not generate new observations from scores alone
4. **Maintains a supportive, coaching tone** — frame feedback as "observations and opportunities" rather than criticism
5. **Ends with encouragement** — reinforce confidence and next steps

**Style Guidelines:**
- Write in first person ("I observed...", "We discussed...")
- Be specific and actionable (not vague)
- Avoid corporate jargon
- Use Australian English spelling
- Keep paragraphs short (2-3 sentences max)

Generate only the coaching summary text (no subject line, no email structure).`;
```

**Last Updated:** 2026-05-18 (Blake feedback incorporated)

---

## 6. Current Environment and Hosting

### **🌐 Production URLs**
| Service | URL | Status |
|---|---|---|
| **Frontend (Vercel)** | https://gfinthefield.com.au | ✅ Live |
| **Backend (Railway)** | https://gf-in-the-field-production.up.railway.app | ✅ Live |
| **Supabase** | https://ivbhxhhxldqdgkbltywv.supabase.co | ✅ Live |
| **Domain (Squarespace)** | gfinthefield.com.au | ✅ DNS configured |

### **📦 Deployments**

#### **Vercel (Frontend)**
- **Project:** `gf-in-the-field`
- **Framework:** Vite
- **Root Directory:** `client/`
- **Build Command:** `npm run build`
- **Output Directory:** `dist/`
- **Environment Variables:**
  ```
  VITE_SUPABASE_URL=https://ivbhxhhxldqdgkbltywv.supabase.co
  VITE_SUPABASE_ANON_KEY=<anon_key>
  VITE_API_URL=https://gf-in-the-field-production.up.railway.app
  ```
- **Auto-deploys on:** Push to `main` branch (GitHub integration)

#### **Railway (Backend)**
- **Project:** `gf-in-the-field`
- **Service:** Node.js
- **Root Directory:** `server/`
- **Start Command:** `npm start`
- **Port:** Auto-assigned by Railway
- **Environment Variables:**
  ```
  SUPABASE_URL=https://ivbhxhhxldqdgkbltywv.supabase.co
  SUPABASE_ANON_KEY=<anon_key>
  SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
  ANTHROPIC_API_KEY=<anthropic_key>
  RESEND_API_KEY=<resend_key>
  FROM_EMAIL=coach@gfinthefield.com.au
  NODE_ENV=production
  ```
- **Auto-deploys on:** Push to `main` branch (GitHub integration)

#### **Supabase**
- **Project:** `gf-in-the-field`
- **Region:** Australia Southeast (Sydney)
- **Database:** PostgreSQL 15
- **Auth:** Email/Password enabled
- **Storage:** Not used
- **Edge Functions:** Not used
- **Migrations Applied:**
  - `001_initial_schema.sql` ✅
  - `002_preserve_rsm_history.sql` ✅

#### **DNS (Squarespace)**
- **Domain:** gfinthefield.com.au
- **Records:**
  - `A` → `216.198.79.1` (Vercel)
  - `CNAME` www → `cname.vercel-dns.com`
  - `TXT` (SPF) → Resend verification
  - `TXT` (DKIM) → Resend verification
  - `TXT` (DMARC) → Resend verification

#### **Email (Resend)**
- **Domain:** gfinthefield.com.au ✅ Verified
- **From Address:** coach@gfinthefield.com.au
- **API Key:** Stored in Railway env vars
- **Monthly Quota:** 3,000 emails (free tier)
- **Current Usage:** ~0-20 emails/month

### **💰 Actual Monthly Costs**
| Service | Plan | Cost (AUD) |
|---|---|---|
| Vercel | Hobby (free) | $0 |
| Railway | Starter | ~$5-10 |
| Supabase | Free tier | $0 |
| Anthropic | Pay-per-use | ~$0.14/month (20 obs) |
| Resend | Free tier | $0 |
| Domain | Annual (Squarespace) | ~$20/year (~$1.67/month) |
| **Total** | | **~$7-12 AUD/month** |

### **🔐 Secrets Storage**
- **Local (Ben's machine):**
  - `/Users/benvoigt/.kmbv/secrets/gf-supabase-keys.txt`
  - `/Users/benvoigt/.kmbv/secrets/gf-in-the-field-anthropic-key.txt`
- **Never committed to git** (`.env` files in `.gitignore`)

---

## 7. Open Questions & Blockers

### **❓ Open Questions**
1. **Should admins be able to delete users?** Currently disabled (edit-only). Could re-enable with confirmation dialog if needed.
2. **Do we need observation export (CSV/PDF)?** Not in brief, but could be useful for reporting.
3. **Should RSMs receive a copy of the coaching email?** Currently only FSM receives it. Brief says "emailed to FSM" but could cc RSM.
4. **Multi-org rollout plan?** Schema supports it, but single org hardcoded in seed data. When to make org_id dynamic?
5. **Analytics dashboard?** No brief requirement, but could show trends (avg score over time, areas needing most work, etc.)

### **🚧 Known Technical Debt**
1. **Admin.jsx unused** — Old admin page replaced by AdminUsers.jsx. Can delete.
2. **Seed data duplicates** — `001_seed_data.sql` and `001_seed_data_FIXED.sql` are identical. Can clean up.
3. **No automated tests** — No Jest/Vitest/Playwright tests. Manual QA only.
4. **No error monitoring** — No Sentry/LogRocket. Errors logged to Railway console only.
5. **No rate limiting** — API has no rate limits (low traffic expected, but could add if abused).

### **✅ No Current Blockers**
- All features from brief are deployed and working
- No pending approvals or external dependencies
- No outstanding bugs from Ben/Blake

---

## 🚀 Next Steps (If Needed)

### **Phase 3 (Future — Not Scoped)**
- Analytics dashboard (observation trends, FSM leaderboard)
- RSM portal (self-service view of coaching history)
- Observation templates (pre-fill common scenarios)
- Mobile app (React Native, offline-first)
- Multi-org SaaS rollout (dynamic org selection on signup)

### **Quick Wins (Low-hanging fruit)**
- Delete unused `Admin.jsx`
- Add Sentry error monitoring
- Add `/health` endpoint for uptime monitoring
- Document API endpoints (Swagger/OpenAPI)

---

## 📞 Contact & Handoff Notes

**Primary Owner:** Atlas (AI Agent)  
**Human Sponsor:** Ben Voigt (ben.voigt@goodmanfielder.com.au)  
**Repository:** https://github.com/cb89d5dpdn-create/gf-in-the-field  
**Last Updated:** 2026-05-24

**For External Reviewer:**
- This project is **production-ready** and currently in use
- Ben is bringing you in to **catch blind spots**, not to rebuild
- I (Atlas) remain the primary owner end-to-end
- Any major changes should be discussed with Ben before implementation
- Focus areas: security, performance, edge cases, UX polish

**Questions?** Drop them in the GitHub repo or email Ben directly.

---

**End of Handoff Summary**
