# Event Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public RSVP/registration form for `event`-type shows with a configurable seat cap, confirmation email, and admin management view.

**Architecture:** A new `show_registrations` table stores registrations; a Postgres RPC function handles the atomic seat-count check. The public form lives at `/register/[show-slug]`. The admin view is a new route at `/admin/events/[slug]/registrations`, plus a `RegistrationConfig` component added to the flat admin layout for `event`-type shows.

**Tech Stack:** Next.js App Router, Supabase (Postgres + service role client), Resend (HTML email), React `useActionState`

---

## File Map

| File | Action |
|---|---|
| `supabase/migrations/032_event_registration.sql` | Create |
| `lib/email/base-template.ts` | Create (extract shared HTML wrapper from audition-emails) |
| `lib/email/audition-emails.ts` | Modify (import baseTemplate from base-template.ts) |
| `lib/email/registration-emails.ts` | Create |
| `app/(public)/register/[show-slug]/actions.ts` | Create |
| `app/(public)/register/[show-slug]/RegisterForm.tsx` | Create |
| `app/(public)/register/[show-slug]/page.tsx` | Create |
| `app/(public)/register/[show-slug]/confirmation/page.tsx` | Create |
| `app/(admin)/admin/events/[slug]/actions.ts` | Modify (add saveRegistrationCapacity) |
| `app/(admin)/admin/events/[slug]/RegistrationConfig.tsx` | Create |
| `app/(admin)/admin/events/[slug]/registrations/page.tsx` | Create |
| `app/(admin)/admin/events/[slug]/page.tsx` | Modify (add RegistrationConfig for event type) |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/032_event_registration.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 032_event_registration.sql
-- Adds event registration: seat cap column, registrations table, and atomic RPC

ALTER TABLE shows ADD COLUMN IF NOT EXISTS registration_capacity integer;

CREATE TABLE IF NOT EXISTS show_registrations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id    uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  name       text NOT NULL,
  email      text NOT NULL,
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size >= 1),
  family_id  uuid REFERENCES families(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS show_registrations_show_id_idx
  ON show_registrations (show_id);

ALTER TABLE show_registrations ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) may insert registrations
CREATE POLICY "Anyone can register"
  ON show_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Atomic capacity check + insert — runs as SECURITY DEFINER to read shows + registrations
-- regardless of RLS, then insert the row. Lock on the show row prevents concurrent overselling.
CREATE OR REPLACE FUNCTION register_for_show(
  p_show_id    uuid,
  p_name       text,
  p_email      text,
  p_party_size integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity integer;
  v_claimed  integer;
  v_id       uuid;
BEGIN
  SELECT registration_capacity INTO v_capacity
  FROM shows WHERE id = p_show_id FOR UPDATE;

  IF v_capacity IS NOT NULL THEN
    SELECT COALESCE(SUM(party_size), 0) INTO v_claimed
    FROM show_registrations WHERE show_id = p_show_id;

    IF v_claimed + p_party_size > v_capacity THEN
      RETURN jsonb_build_object(
        'error', 'Not enough seats remaining',
        'remaining', v_capacity - v_claimed
      );
    END IF;
  END IF;

  INSERT INTO show_registrations (show_id, name, email, party_size)
  VALUES (p_show_id, p_name, p_email, p_party_size)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id::text);
END;
$$;
```

- [ ] **Step 2: Apply the migration in Supabase**

In the Supabase dashboard → SQL Editor, paste and run the full contents of `supabase/migrations/032_event_registration.sql`.

Verify by running:

```sql
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'shows' AND column_name = 'registration_capacity';

SELECT table_name FROM information_schema.tables
  WHERE table_name = 'show_registrations';
```

Both should return one row each.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/032_event_registration.sql
git commit -m "feat: add event registration migration (032)"
```

---

## Task 2: Extract shared email base template

The `baseTemplate` HTML wrapper is private in `audition-emails.ts`. Extract it so both email files can share it without duplication.

**Files:**
- Create: `lib/email/base-template.ts`
- Modify: `lib/email/audition-emails.ts`

- [ ] **Step 1: Create `lib/email/base-template.ts`**

```typescript
const SITE = 'https://accoladetheatre.org'

export function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accolade Community Theatre</title>
</head>
<body style="margin:0;padding:0;background:#0e0d14;font-family:Georgia,serif;color:#e8e4dc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0d14;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#1a1828;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#1a1828;border-bottom:2px solid #d4a853;padding:28px 40px;">
              <img src="https://accolade-theatre.vercel.app/accolade-logo.png" alt="Accolade Community Theatre" width="200" style="display:block;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2e2c3e;">
              <p style="margin:0;font-size:12px;color:#6b6880;line-height:1.6;">
                Questions? Reply to this email or visit <a href="${SITE}" style="color:#d4a853;text-decoration:none;">${SITE}</a><br/>
                Accolade Community Theatre &mdash; Richardson, TX
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
```

- [ ] **Step 2: Update `lib/email/audition-emails.ts`**

Replace the top of the file. The current lines 1–53 (the `resend` import, `TEST_EMAIL`, `FROM`, `REPLY_TO`, `SITE` constants, and the private `baseTemplate` function) become:

```typescript
import { resend } from './client'
import { baseTemplate } from './base-template'

const TEST_EMAIL = process.env.RESEND_TEST_EMAIL || null

const FROM = TEST_EMAIL
  ? 'Accolade Community Theatre <onboarding@resend.dev>'
  : 'Accolade Community Theatre <auditions@accoladetheatre.org>'
const REPLY_TO = 'info@accoladetheatre.org'
const SITE = 'https://accoladetheatre.org'
```

The rest of the file (from `export interface AuditionConfirmationParams` onward) is unchanged.

- [ ] **Step 3: Verify the build compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/email/base-template.ts lib/email/audition-emails.ts
git commit -m "refactor: extract email baseTemplate to shared module"
```

---

## Task 3: Registration confirmation email

**Files:**
- Create: `lib/email/registration-emails.ts`

- [ ] **Step 1: Create the file**

```typescript
import { resend } from './client'
import { baseTemplate } from './base-template'

const TEST_EMAIL = process.env.RESEND_TEST_EMAIL || null
const FROM = TEST_EMAIL
  ? 'Accolade Community Theatre <onboarding@resend.dev>'
  : 'Accolade Community Theatre <events@accoladetheatre.org>'
const REPLY_TO = 'info@accoladetheatre.org'
const SITE = 'https://accoladetheatre.org'

export interface RegistrationConfirmationParams {
  email: string
  name: string
  showTitle: string
  partySize: number
}

export async function sendRegistrationConfirmation(params: RegistrationConfirmationParams) {
  const { email, name, showTitle, partySize } = params
  const guestLabel = partySize === 1 ? '1 guest' : `${partySize} guests`

  const content = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#e8e4dc;font-weight:normal;">
      You're registered!
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#d4a853;letter-spacing:1px;text-transform:uppercase;">
      Registration Confirmation
    </p>

    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#c8c4bc;">
      Hi ${name},<br/>
      You're all set for <strong style="color:#e8e4dc;">${showTitle}</strong>. We can't wait to see you there!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0d14;border-radius:6px;margin:0 0 28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Event</p>
          <p style="margin:0 0 16px;font-size:16px;color:#e8e4dc;">${showTitle}</p>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Party Size</p>
          <p style="margin:0;font-size:22px;color:#d4a853;font-family:Georgia,serif;">${guestLabel}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#c8c4bc;">
      Want to manage your registration and stay connected with Accolade?
      <a href="${SITE}/auth/signup" style="color:#d4a853;text-decoration:none;">Create a family account</a>
      or <a href="${SITE}/auth/login" style="color:#d4a853;text-decoration:none;">sign in</a> if you already have one.
    </p>
  `

  return resend.emails.send({
    from: FROM,
    to: TEST_EMAIL ?? email,
    replyTo: REPLY_TO,
    subject: `You're registered for ${showTitle}`,
    html: baseTemplate(content),
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/email/registration-emails.ts
git commit -m "feat: add registration confirmation email"
```

---

## Task 4: Public register server action

**Files:**
- Create: `app/(public)/register/[show-slug]/actions.ts`

- [ ] **Step 1: Create the file**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { sendRegistrationConfirmation } from '@/lib/email/registration-emails'
import { redirect } from 'next/navigation'

export type RegisterResult = { error: string; remaining?: number } | null

export async function registerForShow(
  slug: string,
  _prev: RegisterResult,
  formData: FormData
): Promise<RegisterResult> {
  const supabase = await createClient()

  const name      = (formData.get('name') as string)?.trim()
  const email     = (formData.get('email') as string)?.trim()
  const partySize = parseInt(formData.get('party_size') as string, 10)

  if (!name || !email || !partySize || partySize < 1) {
    return { error: 'Please fill in all fields.' }
  }

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, status')
    .eq('slug', slug)
    .single()

  if (!show || show.status !== 'active') {
    return { error: 'Registration is not available for this event.' }
  }

  const { data: result, error: rpcError } = await supabase.rpc('register_for_show', {
    p_show_id:    show.id,
    p_name:       name,
    p_email:      email,
    p_party_size: partySize,
  })

  if (rpcError) {
    return { error: 'Something went wrong. Please try again.' }
  }

  const payload = result as { error?: string; remaining?: number; id?: string }

  if (payload.error) {
    return {
      error: payload.remaining === 0
        ? 'Sorry, this event is now full.'
        : `Only ${payload.remaining} seat${payload.remaining === 1 ? '' : 's'} remaining — please reduce your party size.`,
      remaining: payload.remaining,
    }
  }

  // Non-blocking — registration succeeds even if the email fails
  sendRegistrationConfirmation({ email, name, showTitle: show.title, partySize }).catch(() => {})

  redirect(`/register/${slug}/confirmation`)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/register/"
git commit -m "feat: add registerForShow server action"
```

---

## Task 5: Public registration page

**Files:**
- Create: `app/(public)/register/[show-slug]/RegisterForm.tsx`
- Create: `app/(public)/register/[show-slug]/page.tsx`

- [ ] **Step 1: Create `RegisterForm.tsx` (client component)**

```tsx
'use client'

import { useActionState } from 'react'
import { registerForShow, type RegisterResult } from './actions'

export default function RegisterForm({
  showId,
  slug,
  seatsRemaining,
}: {
  showId: string
  slug: string
  seatsRemaining: number | null
}) {
  const action = registerForShow.bind(null, slug)
  const [state, formAction, pending] = useActionState<RegisterResult, FormData>(action, null)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <input type="hidden" name="show_id" value={showId} />

      {seatsRemaining !== null && (
        <p style={{ fontSize: '0.85rem', color: 'var(--gold)', margin: 0 }}>
          {seatsRemaining} seat{seatsRemaining === 1 ? '' : 's'} remaining
        </p>
      )}

      {state?.error && (
        <p style={{ fontSize: '0.85rem', color: '#e05555', margin: 0 }}>
          {state.error}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Name
        </label>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 14px', color: 'var(--warm-white)', fontSize: '0.95rem' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 14px', color: 'var(--warm-white)', fontSize: '0.95rem' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Party size
        </label>
        <input
          name="party_size"
          type="number"
          required
          min={1}
          max={seatsRemaining ?? undefined}
          defaultValue={1}
          style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 14px', color: 'var(--warm-white)', fontSize: '0.95rem', width: '100px' }}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          background: 'var(--gold)',
          color: '#0e0d14',
          border: 'none',
          borderRadius: '4px',
          padding: '12px 28px',
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 700,
          cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.7 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {pending ? 'Registering...' : 'Register'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create `page.tsx` (server component)**

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RegisterForm from './RegisterForm'

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ 'show-slug': string }>
}) {
  const { 'show-slug': slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, status, registration_capacity')
    .eq('slug', slug)
    .single()

  if (!show || show.status !== 'active') notFound()

  const capacity = (show as unknown as { registration_capacity: number | null }).registration_capacity

  let seatsRemaining: number | null = null
  if (capacity !== null) {
    const { data: rows } = await supabase
      .from('show_registrations')
      .select('party_size')
      .eq('show_id', show.id)

    const claimed = (rows ?? []).reduce((acc, r) => acc + (r.party_size ?? 0), 0)
    seatsRemaining = Math.max(0, capacity - claimed)
  }

  const isFull = seatsRemaining !== null && seatsRemaining === 0

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '0.04em', marginBottom: '8px' }}>
        {show.title}
      </h1>
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '32px' }}>
        Registration
      </p>

      {isFull ? (
        <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.7 }}>
          Registration for this event is now full.
        </p>
      ) : (
        <RegisterForm showId={show.id} slug={slug} seatsRemaining={seatsRemaining} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/register/"
git commit -m "feat: add public event registration page"
```

---

## Task 6: Confirmation page

**Files:**
- Create: `app/(public)/register/[show-slug]/confirmation/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function RegistrationConfirmationPage({
  params,
}: {
  params: Promise<{ 'show-slug': string }>
}) {
  const { 'show-slug': slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>
        Registration Confirmed
      </p>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '0.04em', marginBottom: '8px' }}>
        You're in!
      </h1>
      <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '32px' }}>
        We'll see you at {show.title}. Check your email for a confirmation.
      </p>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7 }}>
          Have a family account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Sign in</Link>.{' '}
          New here?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Create an account</Link>.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(public)/register/"
git commit -m "feat: add registration confirmation page"
```

---

## Task 7: Admin save-capacity server action

**Files:**
- Modify: `app/(admin)/admin/events/[slug]/actions.ts`

- [ ] **Step 1: Append `saveRegistrationCapacity` to the existing actions file**

Add to the end of `app/(admin)/admin/events/[slug]/actions.ts`:

```typescript
export async function saveRegistrationCapacity(showId: string, slug: string, formData: FormData) {
  const supabase = await createClient()
  const raw = formData.get('registration_capacity') as string
  const registration_capacity = raw === '' ? null : parseInt(raw, 10)
  if (registration_capacity !== null && (isNaN(registration_capacity) || registration_capacity < 1)) {
    throw new Error('Invalid capacity value.')
  }
  const { error } = await supabase
    .from('shows')
    .update({ registration_capacity })
    .eq('id', showId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
  revalidatePath(`/admin/events/${slug}/registrations`)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/actions.ts"
git commit -m "feat: add saveRegistrationCapacity admin action"
```

---

## Task 8: Admin RegistrationConfig component

**Files:**
- Create: `app/(admin)/admin/events/[slug]/RegistrationConfig.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useRef, useState } from 'react'
import { saveRegistrationCapacity } from './actions'

export default function RegistrationConfig({
  showId,
  slug,
  currentCapacity,
}: {
  showId: string
  slug: string
  currentCapacity: number | null
}) {
  const [saved, setSaved] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    await saveRegistrationCapacity(showId, slug, formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ marginBottom: '32px', background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px 28px' }}>
      <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
        Registration
      </p>
      <form ref={formRef} action={handleSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Seat cap
          </label>
          <input
            name="registration_capacity"
            type="number"
            min={1}
            defaultValue={currentCapacity ?? ''}
            placeholder="Unlimited"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '8px 12px',
              color: 'var(--warm-white)',
              fontSize: '0.9rem',
              width: '120px',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '8px 20px',
            fontSize: '0.68rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: saved ? 'var(--gold)' : 'var(--warm-white)',
            cursor: 'pointer',
          }}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </form>
      <p style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--muted)' }}>
        Leave blank for unlimited. Public form: <code style={{ fontSize: '0.7rem' }}>/register/{slug}</code>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/RegistrationConfig.tsx"
git commit -m "feat: add RegistrationConfig admin component"
```

---

## Task 9: Admin registrations list page

**Files:**
- Create: `app/(admin)/admin/events/[slug]/registrations/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getShowRole } from '@/lib/staff'

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, registration_capacity')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  const role = await getShowRole(show.id)
  if (!role) redirect('/admin/events')

  const service = createServiceClient()
  const { data: registrations } = await service
    .from('show_registrations')
    .select('id, name, email, party_size, created_at')
    .eq('show_id', show.id)
    .order('created_at', { ascending: false })

  const rows = registrations ?? []
  const totalClaimed = rows.reduce((acc, r) => acc + (r.party_size ?? 0), 0)
  const capacity = (show as unknown as { registration_capacity: number | null }).registration_capacity

  const summaryText = capacity !== null
    ? `${totalClaimed} of ${capacity} seats claimed`
    : `${totalClaimed} seat${totalClaimed === 1 ? '' : 's'} claimed — no cap set`

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href={`/admin/events/${slug}`} style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← {show.title}
        </Link>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.04em', lineHeight: 1, marginBottom: '8px' }}>
          Registrations
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{summaryText}</p>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No registrations yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Email', 'Party', 'Registered'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--warm-white)' }}>{r.name}</td>
                <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{r.email}</td>
                <td style={{ padding: '10px 12px', color: 'var(--warm-white)', textAlign: 'center' }}>{r.party_size}</td>
                <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/registrations/"
git commit -m "feat: add admin registrations list page"
```

---

## Task 10: Wire RegistrationConfig into the admin event page

**Files:**
- Modify: `app/(admin)/admin/events/[slug]/page.tsx`

- [ ] **Step 1: Add the import**

After the existing imports at the top of `app/(admin)/admin/events/[slug]/page.tsx`, add:

```typescript
import RegistrationConfig from './RegistrationConfig'
```

- [ ] **Step 2: Add RegistrationConfig to the flat layout**

In the flat (non-show) layout section, after the `<PerformancesManager ... />` line (~line 340) and before the `{['camp', 'workshop'].includes(...)}` FeesManager block, add:

```tsx
{show.event_type === 'event' && (
  <RegistrationConfig
    showId={show.id}
    slug={slug}
    currentCapacity={(show as unknown as { registration_capacity: number | null }).registration_capacity}
  />
)}
```

- [ ] **Step 3: Verify TypeScript and build**

```bash
npx tsc --noEmit
npm run build
```

Expected: no errors or warnings.

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/page.tsx"
git commit -m "feat: wire RegistrationConfig into admin event page for event type"
```

---

## Task 11: End-to-end smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Create the Awards Night event**

Go to `http://localhost:3000/admin/events/new`. Create a new event: type `event`, title "Awards Night", status `active`.

- [ ] **Step 3: Set a seat cap**

Open `/admin/events/awards-night`. Verify the Registration section with the seat cap input is present. Set cap to `50` and save. Reload and verify the value persists.

- [ ] **Step 4: Submit a registration**

Go to `http://localhost:3000/register/awards-night`. Verify:
- "50 seats remaining" appears above the form
- Form has Name, Email, Party size fields
- Submit with party_size `3` → redirects to `/register/awards-night/confirmation`
- Confirmation page shows "You're in!" and the sign-in/create-account links

- [ ] **Step 5: Verify the admin registrations list**

Go to `/admin/events/awards-night/registrations`. Verify:
- Summary line reads "3 of 50 seats claimed"
- The registration row shows the correct name, email, party size, and date

- [ ] **Step 6: Test the no-cap path**

Clear the seat cap field and save. Go to `/register/awards-night` — the "X seats remaining" line should not appear.

- [ ] **Step 7: Test capacity enforcement**

Set the cap to `2`. Try to register with party_size `3`. The form should return "Only 2 seats remaining — please reduce your party size."
