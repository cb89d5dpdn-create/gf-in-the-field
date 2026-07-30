# User Offboarding Process

_Last updated: 2026-07-31_

This document covers the steps required when an FSM, RSM, or admin leaves the team or requires account deactivation.

---

## When to action

- Employee leaves Goodman Fielder
- Employee changes role and no longer requires access
- Account security concern or policy breach

---

## Steps (takes < 5 minutes)

### 1. Delete Supabase Auth user

1. Log in to [supabase.com](https://supabase.com) → Project: `Gf-in-the-field`
2. Go to **Authentication → Users**
3. Search for the user's work email
4. Click the user row → **Delete user**
5. Confirm deletion

This immediately invalidates all sessions and refresh tokens. Their access token will stop being accepted within 1 hour (JWT expiry).

### 2. Remove or reassign the FSM profile (if FSM)

If the departing user is an FSM with RSMs assigned:

1. In the app admin panel (gfinthefield.com.au → Admin → Users), reassign the FSM's RSMs to another FSM, **or** leave them unassigned temporarily
2. Alternatively: via Supabase Table Editor → `rsms` table → set `fsm_id = null` for their RSMs

### 3. Retain observation records

Do **not** delete observation records. Historical coaching data should be retained for continuity. The records remain linked to the RSM profile and are accessible to admins.

### 4. Log the offboarding

Record the offboarding action in your team admin notes, including:
- Date actioned
- Who requested it
- Which user was removed

---

## Notes

- RSM accounts (read-only, no login) do not have Supabase Auth entries — no action needed for RSMs
- Admin accounts: same process as above, plus rotate any shared credentials if applicable
- Currently a manual process. Automation (e.g. HRMS-triggered offboarding) is on the post-approval roadmap

---

## Emergency access revocation

If immediate access removal is required (e.g. security incident):

1. Complete step 1 above immediately
2. In Supabase Auth settings, you can also **disable** the user (without deletion) to prevent login while preserving their data
3. Contact the platform maintainer (Ben Voigt) if further action is needed
