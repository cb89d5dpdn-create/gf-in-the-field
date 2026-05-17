# GF In The Field

Mobile-first coaching observation platform for Goodman Fielder Field Sales Managers. FSMs select an RSM, rate across 9 structured areas, Claude AI generates a coaching summary, and it's emailed to the FSM.

---

## Architecture

```
gf-in-the-field/
├── client/          React (Vite) + Tailwind CSS — deployed to Vercel
├── server/          Node.js + Express — deployed to Railway/Render
├── supabase/
│   ├── migrations/  SQL schema (run in Supabase SQL editor)
│   └── seed/        Seed data + test user creation script
├── .env.example     Environment variable template
├── COSTS.md         Running cost breakdown
└── README.md        This file
```

**Tech stack:**
- Frontend: React 18, Vite, Tailwind CSS v4, React Router v6
- Backend: Node.js, Express 5, Supabase JS client
- Database: Supabase (PostgreSQL + Auth)
- AI: Anthropic Claude (`claude-sonnet-4-20250514`)
- Email: Resend
- Hosting: Vercel (client) + Railway or Render (server)

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project (create at supabase.com)
- Anthropic API key (console.anthropic.com)
- Resend API key (resend.com)

### 1. Clone and install

```bash
git clone https://github.com/KMBV810/gf-in-the-field.git
cd gf-in-the-field

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Configure environment variables

**Client** (`client/.env.local`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

**Server** (`.env` in project root or `server/.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
FROM_EMAIL=coach@gfinthefield.com.au
NODE_ENV=development
PORT=3001
```

### 3. Run database migrations

In your Supabase project, open the **SQL Editor** and run:

```
supabase/migrations/001_initial_schema.sql
```

Then run the seed data:

```
supabase/seed/001_seed_data.sql
```

### 4. Create test users

```bash
cd supabase/seed
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node create-test-users.js
```

This creates all 6 test accounts in Supabase Auth and links them to the seed profiles.

### 5. Start development servers

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@gfinthefield.com.au | Admin1234! |
| FSM NSW | fsm.nsw@test.com | Test1234! |
| FSM VIC | fsm.vic@test.com | Test1234! |
| FSM QLD | fsm.qld@test.com | Test1234! |
| FSM WA | fsm.wa@test.com | Test1234! |
| FSM SA/NT | fsm.sant@test.com | Test1234! |

Admin should change their password on first login.

---

## API Endpoints

All endpoints require `Authorization: Bearer <supabase-jwt>` except `/api/auth/login`.

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Sign in |
| GET | /api/dashboard | FSM team + visit summary |
| GET | /api/rsms | FSM's RSMs |
| GET | /api/rsms/:id/history | RSM observation history |
| POST | /api/observations | Create draft |
| GET | /api/observations/:id | Get observation |
| PUT | /api/observations/:id | Update scores |
| POST | /api/observations/:id/generate | Generate AI summary |
| POST | /api/observations/:id/send | Send email |
| GET | /api/areas | Active observation areas |
| GET | /api/admin/overview | Platform stats (admin only) |
| GET | /api/admin/fsms | All FSMs (admin only) |
| GET | /api/admin/fsms/:id | FSM detail (admin only) |
| GET | /api/admin/rsms/:id | RSM full history (admin only) |

---

## Score Labels

| Score | Label |
|---|---|
| 1 | Needs Dev |
| 2 | Developing |
| 3 | Competent |
| 4 | Proficient |
| 5 | Expert |

---

## Deployment

### Vercel (Frontend)

1. Connect the `gf-in-the-field` GitHub repo to Vercel
2. Set root directory to `client/`
3. Set build command: `npm run build`
4. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

### Railway or Render (Backend)

1. Connect repo, set root directory to `server/`
2. Start command: `npm start`
3. Add all server environment variables

### Supabase

- In **Authentication > URL Configuration**, add your Vercel URL as a redirect URL
- Enable email auth in **Authentication > Providers**

---

## Multi-tenancy

All database tables include `org_id`. All queries filter by `org_id`. The application is SaaS-ready — adding a second organisation requires only creating an `organisations` row, creating users, and assigning `org_id`. No code changes needed.

---

See `COSTS.md` for running cost breakdown.
