# Playbill Bio Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let parents submit a playbill bio for each of their children in a show, with an admin view to read all bios and download them as CSV.

**Architecture:** New `show_bios` table (one row per family member per show). Parent-facing form at `/account/shows/[slug]/bio` shows one form card per family member, pre-filling grade from `family_members`. Submission is completion — no admin approval. Admin view at `/admin/events/[slug]/bios` lists all submissions with a CSV download route.

**Tech Stack:** Next.js 16 App Router, Supabase (anon + service client), React 19 server/client components, server actions (existing pattern). No testing framework — skip TDD steps, just commit after each task.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/022_show_bios.sql` | Create | `show_bios` table + RLS |
| `app/(public)/account/shows/[slug]/bio/bio-actions.ts` | Create | Server action: upsert bio |
| `app/(public)/account/shows/[slug]/bio/BioForm.tsx` | Create | Client component: one bio form per child |
| `app/(public)/account/shows/[slug]/bio/page.tsx` | Create | Server page: lists all family members + their forms |
| `app/(admin)/admin/events/[slug]/bios/page.tsx` | Create | Admin: list all submitted bios |
| `app/(admin)/admin/events/[slug]/bios/download/route.ts` | Create | GET route returning CSV |
| `app/(admin)/admin/events/[slug]/page.tsx` | Modify | Add Playbill Bios link card for shows |

---

## Existing patterns to follow

- Server actions: `app/(admin)/admin/events/[slug]/roster-actions.ts`
- Supabase client: `import { createClient } from '@/lib/supabase/server'`
- Admin link cards: see Communications card in `app/(admin)/admin/events/[slug]/page.tsx` lines 177–194
- Client form with `useTransition`: `app/(public)/auditions/[show-slug]/AuditionForm.tsx`
- CSS variables in use: `--layer`, `--border`, `--warm-white`, `--muted`, `--muted-dim`, `--gold`, `--teal`, `--rose`
- Button class: `className="btn-primary"` wraps a `<span>` child

## Key schema facts

- `family_members`: `id UUID`, `family_id UUID`, `name TEXT NOT NULL`, `age INTEGER`, `grade TEXT`
- `families`: `id UUID`, `user_id UUID`, `email TEXT`, `parent_name TEXT`
- `shows`: `id UUID`, `slug TEXT`, `title TEXT`, `event_type TEXT`
- `admin_users`: `user_id UUID` — admin check: `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())`
- Next migration number: **022**

---

## Task 1: Migration — show_bios table

**Files:**
- Create: `supabase/migrations/022_show_bios.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Playbill bio submissions: one per family member per show

CREATE TABLE show_bios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id          UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  family_id        UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  role             TEXT NOT NULL,
  age              INTEGER NOT NULL,
  grade            TEXT NOT NULL,
  bio              TEXT NOT NULL,
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(show_id, family_member_id)
);

ALTER TABLE show_bios ENABLE ROW LEVEL SECURITY;

-- Families can read and write their own bios
DROP POLICY IF EXISTS "show_bios_family_all" ON show_bios;
CREATE POLICY "show_bios_family_all" ON show_bios
  FOR ALL USING (
    family_id = (SELECT id FROM families WHERE user_id = auth.uid() LIMIT 1)
  );

-- Admins can read and write all bios
DROP POLICY IF EXISTS "show_bios_admin_all" ON show_bios;
CREATE POLICY "show_bios_admin_all" ON show_bios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Paste and execute the migration in the Supabase dashboard SQL Editor. Confirm no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/022_show_bios.sql
git commit -m "feat: add show_bios table for playbill bio submissions"
```

---

## Task 2: Bio server action

**Files:**
- Create: `app/(public)/account/shows/[slug]/bio/bio-actions.ts`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p "app/(public)/account/shows/[slug]/bio"
```

Write `app/(public)/account/shows/[slug]/bio/bio-actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type BioResult =
  | { success: true }
  | { success: false; error: string }

export async function submitBio(
  showId: string,
  slug: string,
  familyMemberId: string,
  data: {
    first_name: string
    last_name: string
    role: string
    age: number
    grade: string
    bio: string
  }
): Promise<BioResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not signed in' }

  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!family) return { success: false, error: 'Family not found' }

  const { error } = await supabase.from('show_bios').upsert(
    {
      show_id: showId,
      family_id: family.id,
      family_member_id: familyMemberId,
      ...data,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'show_id,family_member_id' }
  )

  if (error) return { success: false, error: error.message }
  revalidatePath(`/account/shows/${slug}/bio`)
  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(public)/account/shows/[slug]/bio/bio-actions.ts"
git commit -m "feat: add bio server action"
```

---

## Task 3: BioForm client component

**Files:**
- Create: `app/(public)/account/shows/[slug]/bio/BioForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { submitBio, BioResult } from './bio-actions'

type FamilyMember = {
  id: string
  name: string
  grade: string | null
}

type ExistingBio = {
  first_name: string
  last_name: string
  role: string
  age: number
  grade: string
  bio: string
} | null

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '10px 14px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  display: 'block',
  marginBottom: '6px',
}

export default function BioForm({
  showId,
  slug,
  member,
  existing,
}: {
  showId: string
  slug: string
  member: FamilyMember
  existing: ExistingBio
}) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<BioResult | null>(null)
  const [firstName, setFirstName] = useState(existing?.first_name ?? '')
  const [lastName, setLastName] = useState(existing?.last_name ?? '')
  const [role, setRole] = useState(existing?.role ?? '')
  const [age, setAge] = useState(String(existing?.age ?? ''))
  const [grade, setGrade] = useState(existing?.grade ?? member.grade ?? '')
  const [bio, setBio] = useState(existing?.bio ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await submitBio(showId, slug, member.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: role.trim(),
        age: parseInt(age, 10),
        grade: grade.trim(),
        bio: bio.trim(),
      })
      setResult(res)
    })
  }

  return (
    <div style={{
      background: 'var(--layer)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Bio for {member.name}
        </p>
        {existing && (
          <span style={{
            fontSize: '0.68rem',
            color: 'var(--teal)',
            padding: '2px 8px',
            border: '1px solid rgba(61,158,140,0.3)',
            borderRadius: '2px',
          }}>
            Submitted
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>First Name *</label>
            <input
              required
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Last Name *</label>
            <input
              required
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Role in the Play *</label>
            <input
              required
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Lead, Ensemble, Stage Manager…"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Age *</label>
            <input
              required
              type="number"
              min={3}
              max={99}
              value={age}
              onChange={e => setAge(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Grade *</label>
            <input
              required
              value={grade}
              onChange={e => setGrade(e.target.value)}
              placeholder="8th"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Bio *</label>
          <textarea
            required
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={6}
            placeholder="Tell us a little about yourself — hobbies, interests, family life, theatre experience, favorite show or role..."
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
        </div>

        {result && !result.success && (
          <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '12px' }}>{result.error}</p>
        )}
        {result?.success && (
          <p style={{ color: 'var(--teal)', fontSize: '0.82rem', marginBottom: '12px' }}>Bio submitted! Thank you.</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
          style={{ padding: '10px 24px', opacity: isPending ? 0.6 : 1 }}
        >
          <span>{isPending ? 'Saving…' : existing ? 'Update Bio' : 'Submit Bio'}</span>
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(public)/account/shows/[slug]/bio/BioForm.tsx"
git commit -m "feat: add BioForm client component"
```

---

## Task 4: Parent bio page

**Files:**
- Create: `app/(public)/account/shows/[slug]/bio/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import BioForm from './BioForm'

export default async function BioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!family) redirect('/account/setup')

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  const [{ data: members }, { data: existingBios }] = await Promise.all([
    supabase
      .from('family_members')
      .select('id, name, grade')
      .eq('family_id', family.id)
      .order('name'),
    supabase
      .from('show_bios')
      .select('family_member_id, first_name, last_name, role, age, grade, bio')
      .eq('show_id', show.id)
      .eq('family_id', family.id),
  ])

  const bioByMember = Object.fromEntries(
    (existingBios ?? []).map(b => [b.family_member_id, b])
  )

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href="/account"
          style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
        >
          ← Dashboard
        </Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
          Playbill Bio
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
          {show.title} — submit a bio for each cast or crew member in your family.
        </p>
      </div>

      {(members ?? []).length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
          No family members found.{' '}
          <Link href="/account/family" style={{ color: 'var(--gold)' }}>Add family members</Link> first.
        </p>
      ) : (
        (members ?? []).map(member => (
          <BioForm
            key={member.id}
            showId={show.id}
            slug={slug}
            member={member}
            existing={bioByMember[member.id] ?? null}
          />
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(public)/account/shows/[slug]/bio/page.tsx"
git commit -m "feat: add parent-facing bio page"
```

---

## Task 5: Admin bios list page

**Files:**
- Create: `app/(admin)/admin/events/[slug]/bios/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ShowBiosPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  const { data: bios } = await supabase
    .from('show_bios')
    .select('id, first_name, last_name, role, age, grade, bio, submitted_at, families(parent_name, email)')
    .eq('show_id', show.id)
    .order('last_name')
    .order('first_name')

  const count = (bios ?? []).length

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href={`/admin/events/${slug}`}
          style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
        >
          ← {show.title}
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>
              Playbill Bios
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '6px' }}>
              {count} bio{count !== 1 ? 's' : ''} submitted
            </p>
          </div>
          {count > 0 && (
            <a
              href={`/admin/events/${slug}/bios/download`}
              style={{
                fontSize: '0.72rem',
                color: 'var(--gold)',
                textDecoration: 'none',
                padding: '8px 16px',
                border: '1px solid rgba(212,168,83,0.3)',
                borderRadius: '2px',
                whiteSpace: 'nowrap',
              }}
            >
              Download CSV ↓
            </a>
          )}
        </div>
      </div>

      {count === 0 ? (
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No bios submitted yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(bios ?? []).map(bio => {
            const family = bio.families as unknown as { parent_name: string; email: string }
            return (
              <div key={bio.id} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '2px' }}>
                      {bio.first_name} {bio.last_name}
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {bio.role} · Age {bio.age} · Grade {bio.grade}
                    </p>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted-dim)' }}>
                    {family?.parent_name} — {family?.email}
                  </p>
                </div>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--warm-white)', whiteSpace: 'pre-wrap' }}>
                  {bio.bio}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/bios/page.tsx"
git commit -m "feat: add admin bios list page"
```

---

## Task 6: CSV download route

**Files:**
- Create: `app/(admin)/admin/events/[slug]/bios/download/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: isAdmin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!isAdmin) return new NextResponse('Forbidden', { status: 403 })

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) return new NextResponse('Not found', { status: 404 })

  const { data: bios } = await supabase
    .from('show_bios')
    .select('first_name, last_name, role, age, grade, bio, submitted_at, families(parent_name, email)')
    .eq('show_id', show.id)
    .order('last_name')
    .order('first_name')

  const escape = (val: string | number | null | undefined) => {
    const str = String(val ?? '')
    return `"${str.replace(/"/g, '""')}"`
  }

  const header = 'Show,First Name,Last Name,Role,Age,Grade,Bio,Parent Name,Parent Email,Submitted'
  const rows = (bios ?? []).map(b => {
    const family = b.families as unknown as { parent_name: string; email: string }
    return [
      escape(show.title),
      escape(b.first_name),
      escape(b.last_name),
      escape(b.role),
      b.age,
      escape(b.grade),
      escape(b.bio),
      escape(family?.parent_name),
      escape(family?.email),
      escape(b.submitted_at ? new Date(b.submitted_at).toLocaleDateString('en-US') : ''),
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="bios-${slug}.csv"`,
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/bios/download/route.ts"
git commit -m "feat: add bio CSV download route"
```

---

## Task 7: Wire Playbill Bios link into show detail page

**Files:**
- Modify: `app/(admin)/admin/events/[slug]/page.tsx`

- [ ] **Step 1: Read the current file**

Read `app/(admin)/admin/events/[slug]/page.tsx` and locate the Communications link block (around lines 177–194). It looks like:

```tsx
{show.event_type === 'show' && (
  <div style={{ marginBottom: '32px' }}>
    <Link href={`/admin/events/${slug}/communications`} ...>
      <p ...>Communications</p>
      <span ...>Send Email →</span>
    </Link>
  </div>
)}
```

- [ ] **Step 2: Add Bios link block directly after the Communications block**

Insert this immediately after the Communications block:

```tsx
{show.event_type === 'show' && (
  <div style={{ marginBottom: '32px' }}>
    <Link
      href={`/admin/events/${slug}/bios`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px',
        background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
        textDecoration: 'none',
      }}
    >
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        Playbill Bios
      </p>
      <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View Bios →</span>
    </Link>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/page.tsx"
git commit -m "feat: add Playbill Bios link to show detail page"
```

---

## Task 8: Type-check

- [ ] **Step 1: Run TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors. Fix any type issues before declaring done.

- [ ] **Step 2: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors in bio form feature"
```

---

## Verification

1. Run migration 022 in Supabase SQL Editor
2. As a parent: navigate to `/account/shows/[a-show-slug]/bio` — see one form card per family member
3. Fill out and submit a bio — see "Submitted" badge appear, form pre-fills on reload
4. As admin: open `/admin/events/[slug]` — see "Playbill Bios" link card
5. Click → `/admin/events/[slug]/bios` — see the submitted bio
6. Click "Download CSV ↓" — confirm file downloads with correct columns and data

---

## What's next

Next plans in sequence:
- `2026-04-24-waivers.md` — typed-name electronic signature, liability + video/image waivers
- `2026-04-24-show-fees.md` — Stripe checkout: tuition + shirt order + Accolade ads + coupon codes
- `2026-04-24-accolade-ad-form.md` — file upload form triggered after ad purchase
- `2026-04-24-dashboard-checklist.md` — per-show checklist on parent dashboard (bio, waiver, fees, ad form, volunteer positions)
