# Phase 2: Backend Implementation & Deployment

## Pre-requisites
Before coding can proceed, these accounts/services must be set up:

### 1. Supabase Project
- [ ] Create new Supabase project at https://supabase.com/dashboard
- [ ] Name: `gf-in-the-field`
- [ ] Region: Australia (Sydney) - closest to users
- [ ] Database password: Generate strong password, save securely
- [ ] Once created, go to Project Settings > API
  - [ ] Copy Project URL → `SUPABASE_URL`
  - [ ] Copy `anon` public key → `SUPABASE_ANON_KEY`
  - [ ] Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
- [ ] In SQL Editor, run `supabase/migrations/001_initial_schema.sql`
- [ ] In SQL Editor, run `supabase/seed/001_seed_data.sql`
- [ ] Run `node supabase/seed/create-test-users.js` locally with env vars set

### 2. Anthropic API Key
- [ ] Log into https://console.anthropic.com
- [ ] Create new API key
- [ ] Name: `gf-in-the-field` (for cost tracking)
- [ ] Copy key → `ANTHROPIC_API_KEY`

### 3. Resend Account
- [ ] Sign up at https://resend.com (or use existing account)
- [ ] Add domain: `gfinthefield.com.au`
- [ ] Copy DNS records (DKIM, SPF) → give to Ben for Squarespace
- [ ] Once verified, create API key → `RESEND_API_KEY`
- [ ] Set sending address: `coach@gfinthefield.com.au`

### 4. Railway Account (Backend Hosting)
- [ ] Sign up at https://railway.app (or use existing)
- [ ] Connect GitHub account
- [ ] Prepare to deploy `server/` directory

### 5. Vercel Account (Frontend Hosting)
- [ ] Sign up at https://vercel.com (or use existing)
- [ ] Connect GitHub account
- [ ] Prepare to deploy `client/` directory

---

## Implementation Tasks

### Backend: Implement All API Routes

Currently all routes return stubs. Make them functional:

#### `routes/auth.js`
- [ ] POST `/api/auth/login` — validate credentials via Supabase Auth
- [ ] Return JWT token + user profile (fsm_id, org_id, role, name, state)
- [ ] Handle errors (invalid credentials, account disabled)

#### `routes/dashboard.js`
- [ ] GET `/api/dashboard` — return FSM's team summary
  - [ ] All RSMs for FSM's state + org
  - [ ] For each RSM: name, total visits, last visit date, last visit avg score
  - [ ] Calculate color indicator (red <2.5, yellow 2.5-3.9, green 4.0+)
  - [ ] Filter by org_id from auth token

#### `routes/rsms.js`
- [ ] GET `/api/rsms` — return all RSMs for FSM's state + org
- [ ] GET `/api/rsms/:id/history` — return all observations for RSM
  - [ ] Include: date, location, avg score, observation_id
  - [ ] Order by date desc
  - [ ] Validate RSM belongs to FSM's org + state (or user is admin)

#### `routes/areas.js`
- [ ] GET `/api/areas` — return all active observation areas for org
  - [ ] Filter by org_id, is_active=true
  - [ ] Order by order_index
  - [ ] Group by group_name (Visit Prep & Data | In-Store)

#### `routes/observations.js`
- [ ] POST `/api/observations` — create new draft observation
  - [ ] Insert observation row (org_id, fsm_id, rsm_id, visit_date, location, status=draft)
  - [ ] Return observation_id
- [ ] GET `/api/observations/:id` — get observation + scores
  - [ ] Validate observation belongs to FSM's org (or admin)
  - [ ] Join observation_scores + observation_areas
  - [ ] Return full observation with area labels and scores
- [ ] PUT `/api/observations/:id` — update scores/comments
  - [ ] Upsert observation_scores for each area
  - [ ] Validate all scores 1-5
  - [ ] Return success
- [ ] POST `/api/observations/:id/generate` — **AI Integration**
  - [ ] Fetch observation + all scores
  - [ ] Build prompt from template in TASK-BRIEF.md
  - [ ] Call Anthropic Claude API (`claude-sonnet-4-20250514`)
  - [ ] Save response to `ai_summary` field
  - [ ] Update status to `generated`
  - [ ] Return summary
- [ ] POST `/api/observations/:id/send` — **Email Integration**
  - [ ] Fetch observation + scores + FSM details
  - [ ] Build email from template in TASK-BRIEF.md
  - [ ] Send via Resend API to FSM email
  - [ ] Update status to `sent`
  - [ ] Return success

#### `routes/admin.js`
- [ ] GET `/api/admin/overview` — platform-wide stats (admin only)
  - [ ] Total visits, avg score across all FSMs
  - [ ] Most/least active FSM
  - [ ] Recent activity timeline
- [ ] GET `/api/admin/fsms` — all FSMs + activity (admin only)
  - [ ] List all FSM profiles for org
  - [ ] Include: name, state, team size, total observations, last activity
- [ ] GET `/api/admin/fsms/:id` — FSM detail (admin only)
  - [ ] FSM profile
  - [ ] Their RSM team
  - [ ] All observations (read-only)
- [ ] GET `/api/admin/rsms/:id` — RSM full history (admin only)
  - [ ] All observations across time
  - [ ] Trend data (avg score over time)

#### `middleware/auth.js`
- [ ] Verify Supabase JWT from `Authorization: Bearer <token>` header
- [ ] Extract user_id, fetch fsm_profile (org_id, role, state)
- [ ] Attach to req.user
- [ ] Implement role checks (admin vs fsm)
- [ ] Implement org_id validation (all queries must filter by org)

---

### Frontend: Wire Up API Calls

#### `pages/Login.jsx`
- [ ] POST to `/api/auth/login` on form submit
- [ ] Store JWT in localStorage
- [ ] Redirect to /dashboard on success
- [ ] Show error toast on failure
- [ ] Forgot password → trigger Supabase reset email

#### `pages/Dashboard.jsx`
- [ ] Fetch `/api/dashboard` on mount
- [ ] Render RSM cards with:
  - [ ] Name, total visits, last visit date
  - [ ] Avg score + color dot (red/yellow/green)
  - [ ] Click card → navigate to `/rsm/:id/history`
- [ ] "Start New Observation" button → navigate to `/new-observation`

#### `pages/NewObservation.jsx`
- [ ] Step 1: Fetch `/api/rsms`, render list + search
  - [ ] Select RSM → save to state
- [ ] Step 2: Enter date (default today) + location
- [ ] Step 3: Fetch `/api/areas`, render 9-area form
  - [ ] Group by group_name (Visit Prep & Data | In-Store)
  - [ ] Large pill buttons for scores 1-5
  - [ ] Optional comments textarea per area
  - [ ] Progress indicator: "X of 9 areas scored"
  - [ ] "Generate Report" button active only when all 9 scored
- [ ] Step 4: POST `/api/observations` (create draft)
  - [ ] PUT `/api/observations/:id` (save scores)
  - [ ] POST `/api/observations/:id/generate` (AI summary)
  - [ ] Show spinner during AI generation (5-10 sec)
- [ ] Step 5: Review screen
  - [ ] Show score table
  - [ ] Editable AI summary (textarea)
  - [ ] "Send to My Email" button
  - [ ] POST `/api/observations/:id/send`
  - [ ] Success toast → redirect to /dashboard

#### `pages/RSMHistory.jsx`
- [ ] Fetch `/api/rsms/:id/history` on mount
- [ ] Render list of past observations
  - [ ] Date, location, avg score
  - [ ] Click → view read-only observation detail
- [ ] Back button → /dashboard

#### `pages/Admin.jsx`
- [ ] Fetch `/api/admin/overview` on mount
- [ ] Show platform-wide stats
- [ ] Fetch `/api/admin/fsms`, render FSM list
- [ ] Click FSM → drill into `/api/admin/fsms/:id`
- [ ] Click RSM → drill into `/api/admin/rsms/:id`
- [ ] All views read-only (admin cannot submit observations)

#### `contexts/AuthContext.jsx`
- [ ] Create React Context for auth state
- [ ] Store JWT, user profile (name, role, state, org_id)
- [ ] Provide login/logout functions
- [ ] Persist to localStorage
- [ ] Protected route wrapper (redirect to /login if not authenticated)

#### `lib/api.js`
- [ ] Create API client with base URL from env
- [ ] Attach JWT to all requests
- [ ] Handle 401 (logout + redirect)
- [ ] Handle errors with toast notifications

---

## Deployment

### GitHub
- [ ] Push to GitHub repo: `KMBV810/gf-in-the-field`
  ```bash
  cd /Users/benvoigt/Desktop/Empire/gf-in-the-field
  git remote add origin https://github.com/KMBV810/gf-in-the-field.git
  git push -u origin main
  ```

### Vercel (Frontend)
- [ ] Go to https://vercel.com/new
- [ ] Import `KMBV810/gf-in-the-field` repo
- [ ] Set root directory: `client/`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist/`
- [ ] Add environment variables:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_API_URL` (Railway backend URL)
- [ ] Deploy
- [ ] Copy deployment URL

### Railway (Backend)
- [ ] Go to https://railway.app/new
- [ ] Import `KMBV810/gf-in-the-field` repo
- [ ] Set root directory: `server/`
- [ ] Start command: `npm start`
- [ ] Add environment variables:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `ANTHROPIC_API_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `FROM_EMAIL=coach@gfinthefield.com.au`
  - [ ] `NODE_ENV=production`
  - [ ] `PORT` (Railway auto-provides)
- [ ] Deploy
- [ ] Copy public URL → update `VITE_API_URL` in Vercel

### Domain (DNS Configuration)
- [ ] In Vercel, add custom domain: `gfinthefield.com.au`
- [ ] Vercel will show DNS records (CNAME or A record)
- [ ] Give Ben instructions to add these in Squarespace DNS settings
- [ ] Wait for DNS propagation (~5-10 min)
- [ ] Vercel will auto-provision SSL certificate

### Resend (Email DNS)
- [ ] In Resend dashboard, view DNS records for `gfinthefield.com.au`
- [ ] Give Ben instructions to add DKIM, SPF, DMARC records in Squarespace
- [ ] Wait for verification (green checkmark in Resend)

---

## Testing Checklist

### Auth Flow
- [ ] Login with test FSM account → dashboard loads
- [ ] Login with admin account → admin view loads
- [ ] Invalid credentials → error message
- [ ] Forgot password → reset email sent
- [ ] Change password in app → success

### FSM Workflow
- [ ] Dashboard shows correct RSMs for state
- [ ] RSM cards show correct data (visits, scores, color)
- [ ] Click "Start New Observation" → form loads
- [ ] Select RSM → date/location form shows
- [ ] Score all 9 areas → "Generate Report" activates
- [ ] Click "Generate Report" → AI summary appears in 5-10 sec
- [ ] Edit summary → changes persist
- [ ] Click "Send to My Email" → email delivered to FSM
- [ ] Dashboard updates with new observation

### Admin Workflow
- [ ] Platform overview shows correct stats
- [ ] Can view all FSMs across all states
- [ ] Can drill into FSM → see their team + observations
- [ ] Can drill into RSM → see all their observations
- [ ] Cannot submit observations (button hidden)

### Mobile UI
- [ ] All pages responsive on iPhone Safari
- [ ] All pages responsive on Android Chrome
- [ ] Score buttons easy to tap (44px minimum)
- [ ] No horizontal scrolling
- [ ] Loading states visible
- [ ] Toast notifications appear correctly

---

## Definition of Done

- [ ] All API routes return real data (no stubs)
- [ ] Frontend calls backend successfully
- [ ] AI summary generation works (Claude API)
- [ ] Email sending works (Resend API)
- [ ] All 6 test accounts can log in
- [ ] FSM can complete full observation workflow
- [ ] Admin can view all data
- [ ] Deployed to live URLs (Vercel + Railway)
- [ ] Domain points to Vercel (https://gfinthefield.com.au)
- [ ] SSL certificate active
- [ ] Email DNS verified (coach@gfinthefield.com.au)
- [ ] All environment variables documented
- [ ] README updated with live URLs

---

When complete, send Ben:
1. Live URL: https://gfinthefield.com.au
2. Test credentials (6 accounts)
3. DNS instructions (if not already done)
4. Summary of what's deployed
