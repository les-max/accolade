# Event Registration Design

**Date:** 2026-05-29
**Status:** Approved

## Problem

The `event` show type has no registration mechanism. For events like Awards Night, organizers need a simple public signup form with a total seat cap, email collection, and an optional path to create a family account.

## Goals

- Anyone can register without an account (name, email, party size)
- Total seats across all registrations are capped at a configurable limit
- Remaining seat count shown on the form at page load
- Confirmation email sent on registration
- Optional post-registration prompt to create a family account
- Admin can configure the cap and view the registrations list

## Non-Goals

- Real-time seat counter (page-load only is sufficient)
- Cancel/edit registration via UI (handled in Supabase directly for now)
- Waitlist support
- Paid registration (free events only)

---

## Data Model

### Migration: add `registration_capacity` to `shows`

```sql
ALTER TABLE shows ADD COLUMN registration_capacity integer;
```

Null = no cap. An integer value enforces the seat limit.

### Migration: new `show_registrations` table

```sql
CREATE TABLE show_registrations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id    uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  name       text NOT NULL,
  email      text NOT NULL,
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size >= 1),
  family_id  uuid REFERENCES families(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON show_registrations (show_id);
```

RLS: insert allowed for all (public); select/delete for admins via service role only.

### Seat-count enforcement

The server action checks capacity inside a transaction:

```sql
BEGIN;
SELECT COALESCE(SUM(party_size), 0) FROM show_registrations WHERE show_id = $1 FOR UPDATE;
-- if sum + incoming party_size > registration_capacity: ROLLBACK and return error
INSERT INTO show_registrations ...;
COMMIT;
```

This prevents race conditions when two registrations are submitted simultaneously.

---

## Public Registration Form

**Route:** `/register/[show-slug]`

### Page states

| State | Displayed |
|---|---|
| Cap not set or seats remain | Full form |
| Registration full | "Registration is now full" message, no form |
| Show not found / not active | 404 |

### Form fields

| Field | Type | Notes |
|---|---|---|
| Name | text | Required |
| Email | email | Required |
| Party size | number | Min 1, required |

### Seat counter

Shown above the form: **"X seats remaining"** — calculated server-side at page render as `registration_capacity - SUM(party_size)`. Not polled or real-time.

### Server action: `registerForShow(showSlug, formData)`

1. Load show by slug, verify status is `active`
2. If `registration_capacity` is set: check seats remaining in a transaction; reject with error if insufficient
3. Insert `show_registrations` row
4. Send confirmation email via Resend (event title, date, party size, "see you there")
5. Redirect to `/register/[show-slug]/confirmation`

### Confirmation page

- "You're registered! We'll see you there."
- Event name and date
- Soft account prompt: "Have a family account? Sign in. New here? Create an account." (links to existing `/auth/login` and `/auth/signup`)

---

## Admin Interface

### Registration tab

Added to the existing tabbed admin event editor at `/admin/events/[slug]`.

**Configuration section**
- "Seat cap" number input (blank = unlimited)
- Save button

**Registrations list**
- Summary: "X of Y seats claimed" (or "X seats claimed, no cap set")
- Table columns: Name, Email, Party size, Registered at
- Sorted newest first
- No inline editing — deletions handled in Supabase directly for now

---

## Email

Confirmation email sent via existing Resend integration. Contents:
- Subject: "You're registered for [Event Title]"
- Body: name, event title, date/venue, party size confirmation
- Footer: link to create an account at Accolade Theatre

---

## File Plan (for implementation)

| File | Change |
|---|---|
| `supabase/migrations/032_event_registration.sql` | New migration |
| `app/(public)/register/[show-slug]/page.tsx` | Public registration page |
| `app/(public)/register/[show-slug]/actions.ts` | `registerForShow` server action |
| `app/(public)/register/[show-slug]/confirmation/page.tsx` | Confirmation page |
| `app/(admin)/admin/events/[slug]/RegistrationTab.tsx` | Admin registrations tab |
| `app/(admin)/admin/events/[slug]/page.tsx` | Add Registration tab to tab list |
| `emails/registration-confirmation.tsx` | Confirmation email template |
