# Session & Authentication Configuration

_Last updated: 2026-07-31_

## JWT / Session Lifecycle

Authentication is handled by Supabase Auth (GoTrue). The following token configuration is in effect:

| Token | Duration | Notes |
|---|---|---|
| Access token (JWT) | **1 hour** | Supabase default. Sent as `Bearer` header on every API request. |
| Refresh token | **7 days** | Used by the client to obtain a new access token silently. |
| Session inactivity | 7 days | If the app is not used for 7 days, the user must log in again. |

These are Supabase platform defaults. No custom JWT expiry is configured in application code.

## Token Revocation / Offboarding

When an employee leaves the team or account access needs to be revoked:

1. Log in to [supabase.com](https://supabase.com) → Project: `Gf-in-the-field`
2. Navigate to **Authentication → Users**
3. Find the user by email
4. Click **Delete user** — this immediately invalidates all active sessions and refresh tokens for that user
5. No further action required — the next API request with their JWT will return 401

> **Note:** The access token is valid for up to 1 hour after deletion (until it expires naturally). For immediate revocation of high-privilege accounts, Supabase Pro plan offers a `signOut(userId)` admin API call. Consider upgrading if instant revocation is required.

## MFA Requirement for Admin Accounts

Admin-role accounts must have TOTP MFA enabled. The `requireAdmin` middleware enforces this at the API level — any admin API call without a verified MFA factor (`aal2` claim) will be rejected with HTTP 403.

**To enable MFA on an admin account:**
1. Log in to the app at gfinthefield.com.au
2. Navigate to account settings
3. Enable Authenticator App (TOTP) — any standard TOTP app (Google Authenticator, Authy, 1Password) works
4. Complete MFA setup — future logins will require the TOTP code

## Rate Limiting

The API enforces the following rate limits per IP address:

| Endpoint group | Limit |
|---|---|
| All `/api/` endpoints | 100 requests per 15 minutes |
| `/api/auth/` (login) | 10 requests per 15 minutes |

Responses include `RateLimit-*` headers. Clients that exceed limits receive HTTP 429.
