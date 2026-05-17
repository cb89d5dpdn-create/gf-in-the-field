# GF In The Field — Running Cost Estimates

Estimates assume 5 FSMs, 34 RSMs, ~20 observations/month (4 per FSM).

---

## Hosting

| Service | Plan | Monthly Cost |
|---|---|---|
| Vercel (frontend) | Hobby (free) | $0 |
| Railway or Render (backend) | Starter | ~$5–10 |

## Database

| Service | Plan | Monthly Cost |
|---|---|---|
| Supabase | Free tier (500 MB DB, 1 GB storage) | $0 |
| Supabase | Pro (if exceeded) | $25 |

At 20 observations/month with scores and AI summaries, the free tier is sufficient for V1.

---

## AI (Anthropic Claude)

Model: `claude-sonnet-4-20250514`

Pricing (as of May 2025):
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens

Per observation generation:
- Input prompt: ~600 tokens × $3/M = **$0.0018**
- Output summary (3–4 paragraphs): ~350 tokens × $15/M = **$0.0053**
- **Cost per observation: ~$0.007**

Monthly at 20 observations:
- **~$0.14/month**

Annual at 20 obs/month:
- **~$1.70/year**

Even at 10× usage (200 obs/month): ~$1.40/month.

---

## Email (Resend)

| Plan | Free Tier | Cost |
|---|---|---|
| Resend | 3,000 emails/month | $0 |
| Resend Pro | 50,000 emails/month | $20/month |

At 20 observations/month → 20 emails/month. Free tier is sufficient indefinitely for V1.

---

## Domain

- **gfinthefield.com.au** — registered separately
- Renewal: ~$20–30 AUD/year

---

## Total Monthly Cost — V1 at Current Scale

| Item | Monthly |
|---|---|
| Backend hosting (Railway/Render) | ~$7 |
| Database (Supabase free) | $0 |
| AI (Claude Sonnet) | ~$0.14 |
| Email (Resend free) | $0 |
| Frontend (Vercel free) | $0 |
| **Total** | **~$7–10 AUD/month** |

---

## Scale Notes

- The `organisations` table and `org_id` scoping on all queries is in place for future SaaS expansion.
- Adding a second organisation would add no infrastructure cost until usage triggers paid tiers.
- Claude cost scales linearly with observation volume — even at 1,000 obs/month it remains under $10/month.
