# Phase 2: Complete

## What Was Built

Phase 2 implementation is complete. Both backend and frontend are fully functional.

---

## Backend — `server/`

All API routes are implemented and connected to Supabase via the admin client (bypasses RLS for server-side safety):

| Route | Description |
|---|---|
| `POST /api/auth/login` | Validates credentials via Supabase Auth, returns JWT + session |
| `GET /api/dashboard` | FSM team summary — RSM cards with visit count, last visit, avg score |
| `GET /api/rsms` | List RSMs for FSM's state + org (admin sees all) |
| `GET /api/rsms/:id/history` | All observations for an RSM, enriched with avg scores |
| `GET /api/areas` | Active observation areas for org, ordered by index |
| `POST /api/observations` | Create draft observation |
| `GET /api/observations/:id` | Get full observation with scores |
| `PUT /api/observations/:id` | Save/update all area scores and comments |
| `POST /api/observations/:id/generate` | Call Claude AI, save summary, return for review |
| `POST /api/observations/:id/send` | Send email via Resend, mark status=sent |
| `GET /api/admin/overview` | Platform-wide stats (admin only) |
| `GET /api/admin/fsms` | All FSMs with activity (admin only) |
| `GET /api/admin/fsms/:id` | FSM detail + RSM team (admin only) |
| `GET /api/admin/rsms/:id` | RSM full history across time (admin only) |

**Auth middleware** (`middleware/auth.js`): Validates Supabase JWT, loads FSM profile (org_id, role, state), attaches to `req.user` + `req.profile`. All routes except `/api/auth/login` are protected. Admin routes additionally require `role = 'admin'`.

**Security**: All DB queries filter by `org_id` from the authenticated user's profile. FSMs can only see their own state's RSMs. Admins see all data within their org.

---

## Frontend — `client/`

All pages are wired up to the backend API:

| Page | Route | Status |
|---|---|---|
| Login | `/login` | Full auth via Supabase + forgot password flow |
| Dashboard | `/` | Live RSM cards with colour-coded scores |
| New Observation | `/observations/new` | Full 4-step form: RSM select → details → scoring → review/send |
| RSM History | `/rsms/:id/history` | All past observations, click-through to detail view |
| Admin | `/admin` | Platform stats + FSM drill-down (admin only) |
| Reset Password | `/reset-password` | Supabase password update flow |

**Auth context** (`contexts/AuthContext.jsx`): Loads and persists Supabase session. Fetches FSM profile from `/api/dashboard` when session is available — including on page refresh. Provides `profileLoading` state so the admin route guard waits before redirecting.

**API client** (`lib/api.js`): Reads Supabase session token on every request, attaches `Authorization: Bearer` header. Base URL from `VITE_API_URL` env var.

---

## AI Integration (Anthropic Claude)

Uses `claude-sonnet-4-20250514` via `@anthropic-ai/sdk`.

The prompt follows the exact template from TASK-BRIEF.md:
- System prompt: expert FMCG field sales coach persona
- User prompt: all 9 area scores + comments + group averages
- Tone calibrated by overall average score
- Requires all 9 areas scored before generation

**Needs real key**: Set `ANTHROPIC_API_KEY` in `server/.env`.

---

## Email Integration (Resend)

Uses `resend` npm package. Sends plain-text coaching summary to the FSM's email address on `POST /api/observations/:id/send`.

Email format matches TASK-BRIEF.md template:
- From: `coach@gfinthefield.com.au`
- Subject: `GF In The Field | Coaching Observation — [RSM Name] — [Date]`
- Body: score table + AI summary

**Needs real key**: Set `RESEND_API_KEY` in `server/.env`. Domain `gfinthefield.com.au` must be verified in Resend dashboard with DKIM/SPF DNS records.

---

## What Still Needs Real API Keys

Before the app will fully function in production, set these environment variables:

### Backend (`server/.env`)
```
SUPABASE_URL=           ← from Supabase project settings
SUPABASE_ANON_KEY=      ← from Supabase project settings
SUPABASE_SERVICE_ROLE_KEY= ← from Supabase project settings (keep secret)
ANTHROPIC_API_KEY=      ← from console.anthropic.com (AI generation)
RESEND_API_KEY=         ← from resend.com (email sending)
FROM_EMAIL=coach@gfinthefield.com.au
NODE_ENV=production
```

### Frontend (`client/.env.local`)
```
VITE_SUPABASE_URL=      ← same as SUPABASE_URL
VITE_SUPABASE_ANON_KEY= ← same as SUPABASE_ANON_KEY
VITE_API_URL=           ← Railway backend URL after deployment
```

---

## Database Setup

Run in Supabase SQL Editor (in order):
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/seed/001_seed_data.sql`
3. `node supabase/seed/create-test-users.js` (locally, with env vars set)

---

## Test Accounts

```
Admin:    admin@gfinthefield.com.au  /  Admin1234!
FSM NSW:  fsm.nsw@test.com          /  Test1234!
FSM VIC:  fsm.vic@test.com          /  Test1234!
FSM QLD:  fsm.qld@test.com          /  Test1234!
FSM WA:   fsm.wa@test.com           /  Test1234!
FSM SANT: fsm.sant@test.com         /  Test1234!
```

---

## Local Development

```bash
# Backend
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev            # runs on port 3001

# Frontend
cd client
cp .env.example .env.local  # fill in your values
npm install
npm run dev            # runs on port 5173
```

---

## Deployment

- **Backend**: Railway — root directory `server/`, start command `npm start`
- **Frontend**: Vercel — root directory `client/`, build command `npm run build`, output `dist/`
- **Domain**: Add `gfinthefield.com.au` as custom domain in Vercel; DNS records via Squarespace
- **Email DNS**: Add DKIM/SPF/DMARC from Resend dashboard to Squarespace DNS
