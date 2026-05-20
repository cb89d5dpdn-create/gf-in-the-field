# GF In The Field - Deployment Guide

## Backend (Railway)

1. Go to https://railway.app
2. New Project → Deploy from GitHub repo
3. Select: `cb89d5dpdn-create/gf-in-the-field`
4. **Root Directory:** `server`
5. **Start Command:** `npm start`
6. **Environment Variables:** (Add all of these - get actual keys from Ben)

```
SUPABASE_URL=https://ivbhxhhxldqdgkbltywv.supabase.co
SUPABASE_ANON_KEY=<get_from_supabase_dashboard>
SUPABASE_SERVICE_ROLE_KEY=<get_from_supabase_dashboard>
ANTHROPIC_API_KEY=<get_from_anthropic>
RESEND_API_KEY=<get_from_resend>
FROM_EMAIL=coach@gfinthefield.com.au
NODE_ENV=production
```

7. Deploy
8. **Copy the Railway public URL** (looks like: `https://your-app.up.railway.app`)

---

## Frontend (Vercel)

1. Go to https://vercel.com
2. New Project → Import Git Repository
3. Select: `cb89d5dpdn-create/gf-in-the-field`
4. **Root Directory:** `client`
5. **Framework Preset:** Vite
6. **Build Command:** `npm run build`
7. **Output Directory:** `dist`
8. **Environment Variables:** (Add all of these)

```
VITE_SUPABASE_URL=https://ivbhxhhxldqdgkbltywv.supabase.co
VITE_SUPABASE_ANON_KEY=<get_from_supabase_dashboard>
VITE_API_URL=<paste_railway_url_from_step_8_above>
```

9. Deploy
10. **Copy the Vercel deployment URL**

---

## Custom Domain (gfinthefield.com.au)

1. In Vercel: Settings → Domains → Add `gfinthefield.com.au`
2. Vercel will show DNS records to add
3. Go to Squarespace DNS settings for gfinthefield.com.au
4. Add the CNAME or A record Vercel provides
5. Wait 5-10 minutes for DNS propagation
6. Vercel will auto-provision SSL certificate

---

## Email Setup (Resend)

1. Go to https://resend.com
2. Add domain: `gfinthefield.com.au`
3. Copy the DKIM/SPF/DMARC records
4. Add them to Squarespace DNS settings
5. Wait for verification (green checkmark in Resend)
6. Create API key → copy it
7. Go back to Railway → Add `RESEND_API_KEY` environment variable
8. Redeploy Railway

---

## Test

Once all deployed:
1. Go to https://gfinthefield.com.au
2. Log in with: `admin@gfinthefield.com.au` / `Admin1234!`
3. Dashboard should load with 0 visits (fresh data)
4. Create a test observation
5. Generate AI summary (should work with Anthropic key)
6. Send email (should work once Resend is configured)

---

## Costs

- Railway: ~$5-10/month (starter plan)
- Vercel: $0 (hobby tier)
- Supabase: $0 (free tier)
- Anthropic: ~$0.14/month (20 observations)
- Resend: $0 (free tier, 3000 emails/month)

**Total: ~$5-10 AUD/month**

---

## Actual Keys

Actual API keys are stored in:
- `/Users/benvoigt/.kmbv/secrets/gf-supabase-keys.txt`
- `/Users/benvoigt/.kmbv/secrets/gf-in-the-field-anthropic-key.txt`

Never commit these to git!
