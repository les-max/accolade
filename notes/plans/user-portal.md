# Plan — User Portal & Authenticated Features

## Overview

Everything in this plan lives behind a login. Build in layers: auth first, then the portal shell, then plug in each module. Nothing in layers 2+ can ship without layer 1 done.

---

## Layer 1 — Auth + Roles (foundational, blocks everything else)

Four permission levels:

| Level | Name | What they can do |
|-------|------|-----------------|
| 1 | User | View show info, rehearsal schedules, their own signups/payments/orders |
| 2 | Organizer | Everything in L1 + create/manage volunteer signup lists |
| 3 | Business | Everything in L2 + manage ticketing and anything money-related |
| 4 | Admin | Everything |

**Env vars needed (not yet added):**
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase project settings → API. Required for invite flow and user deletion.
- `NEXT_PUBLIC_SITE_URL` — full site URL (e.g. `https://accolade-theatre.vercel.app`). Required for invite redirect.
Add to Vercel env vars and `.env.local` before testing the invite flow.

**Decided:**
- Auth provider: Supabase Auth (already integrated — middleware, login route, and client all in place; magic link as primary login method)
- Account creation: hybrid — admin/organizer adds adults to a show roster, system sends invite email, user completes signup from that link
- Accounts are adult-only to start (parents, cast, crew). Student accounts deferred.

---

## Layer 2 — User Portal Shell

Single authenticated area for cast, crew, and parents. Same shell, role-gated content.

**What every user sees:**
- Shows they are in (or their kid is in, since parents hold the account)
- Rehearsal schedule for those shows
- Volunteer signups they've claimed
- Payments due / payment history
- Merch/t-shirt orders
- Post-show: links to official photo gallery

**Design note:** This is a dashboard, not separate "user pages" and a "dashboard" — they're the same thing.

---

## Layer 3 — Show-Connected Modules

Each module ties to a specific show. Build after portal shell exists.

### Volunteer Signups
- Organizer creates lists connected to a show
- Lists have positions (overall show, per-rehearsal, tech week, etc.)
- Users claim positions from their dashboard
- Flexible structure — positions defined per show, not a fixed schema

### Merch Orders
- Per-show merch (t-shirts, etc.)
- User places order from dashboard
- Admin sees orders in admin area
- Needs Stripe before it can take payment

### Payments / Tuition
- Already on punch list: $50/child (first 2), $25/child (3rd+)
- Displayed as "balance due" in user dashboard
- Needs Stripe (already planned)

### Ticketing
- Already on punch list
- Business-level role manages this
- Per-show: enable/disable, external URL fallback, flat price
- Needs Stripe

**Build order for modules:** Volunteer signups (no Stripe needed) → Stripe → Tuition → Merch → Ticketing

---

## Layer 4 — Photographer Upload + Photo Linking

- Dedicated upload page for photographers (no login required, or separate photographer role?)
- Photos land in Google Photos
- Link automatically populates on the show's page in the user portal
- Users see photo gallery from their dashboard after show wraps

**Open question:** Does the photographer need a login, or is it a secret/token URL?

---

## Email / Mailchimp

**Near term:** Sync Clerk → Mailchimp via webhook. When a user account is created, they're added to the Mailchimp list automatically. Avoids manual imports and duplicate lists.

**Long term:** Replace Mailchimp entirely with a self-hosted list (Resend for delivery). The portal already owns the subscriber list at that point — just need campaign tools. Motivation: cut the Mailchimp bill.

Overlap note: many portal users will already be on Mailchimp. The sync should check for existing subscribers before adding to avoid duplicates.

---

## Dependencies on Existing Punch List

- Volunteer page quick wins (form cleanup, bento) are the *public* page — ship those independently, no conflict
- Stripe Payments and Ticketing in punch list "Larger Features" — these modules plug into that work
