# PM Email Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the production manager a way to manage the show's cast/crew roster (with custom group names like "Cast A", "Cast B", "Pit Band", "Parent Volunteers") and send targeted emails to any subset of show participants directly from the admin event detail page.

**Architecture:** Two new sections on the existing show detail page (`/admin/events/[slug]`): a Roster Manager (add families to `show_members` by email + free-text group label) and a Communications page (compose + send via Resend). `show_members.show_role` is changed to free text — PM defines their own group names. Recipients are resolved server-side from `show_members` (by group) and/or `auditions` (registered). No new nav items — both live under the existing event workflow.

**Tech Stack:** Next.js 16 App Router, Supabase (existing `show_members` + `families` + `auditions` tables), Resend (already installed), React server/client components, server actions (existing pattern).

**Note:** No testing framework exists in this project. Skip all TDD steps. Commit after each task.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/021_show_members_rls.sql` | Create | Enable RLS + policies on `show_members` |
| `app/(admin)/admin/events/[slug]/RosterManager.tsx` | Create | Client component — add/remove show members |
| `app/(admin)/admin/events/[slug]/roster-actions.ts` | Create | Server actions — add/remove from `show_members` |
| `app/(admin)/admin/events/[slug]/communications/page.tsx` | Create | Server page — fetch members + auditioners for show |
| `app/(admin)/admin/events/[slug]/communications/EmailComposer.tsx` | Create | Client component — compose + send UI |
| `app/(admin)/admin/events/[slug]/communications/send-actions.ts` | Create | Server action — resolve recipients + send via Resend |
| `lib/email/pm-emails.ts` | Create | PM broadcast email template |
| `app/(admin)/admin/events/[slug]/page.tsx` | Modify | Add RosterManager + Communications link for shows |

---

## Task 1: Enable RLS on `show_members`

**Files:**
- Create: `supabase/migrations/021_show_members_rls.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Enable RLS on show_members
-- Also drop the CHECK constraint so show_role can hold any label (Cast A, Cast B, Pit Band, etc.)

ALTER TABLE show_members DROP CONSTRAINT IF EXISTS show_members_show_role_check;

ALTER TABLE show_members ENABLE ROW LEVEL SECURITY;

-- Members can read their own show membership
CREATE POLICY "show_members_family_read" ON show_members
  FOR SELECT USING (
    family_id = (SELECT id FROM families WHERE user_id = auth.uid() LIMIT 1)
  );

-- Admins can do everything
CREATE POLICY "show_members_admin_all" ON show_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Paste and execute `021_show_members_rls.sql` in the Supabase dashboard SQL Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/021_show_members_rls.sql
git commit -m "feat: enable RLS on show_members"
```

---

## Task 2: Roster server actions

**Files:**
- Create: `app/(admin)/admin/events/[slug]/roster-actions.ts`

- [ ] **Step 1: Create the server actions file**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addShowMember(
  showId: string,
  slug: string,
  email: string,
  role: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Look up family by email
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!family) throw new Error(`No account found for ${email}`)

  const { error } = await supabase.from('show_members').upsert(
    { show_id: showId, family_id: family.id, show_role: role },
    { onConflict: 'show_id,family_id' }
  )
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function removeShowMember(memberId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('show_members').delete().eq('id', memberId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/events/\[slug\]/roster-actions.ts
git commit -m "feat: add roster server actions"
```

---

## Task 3: RosterManager client component

**Files:**
- Create: `app/(admin)/admin/events/[slug]/RosterManager.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { addShowMember, removeShowMember } from './roster-actions'

type Member = {
  id: string
  show_role: string
  families: { parent_name: string; email: string }
}

const ROLE_COLORS: Record<string, string> = {
  cast:   'var(--teal)',
  crew:   'var(--gold)',
  parent: 'var(--muted)',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '10px 14px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  flex: 1,
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '10px 10px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  colorScheme: 'dark',
  cursor: 'pointer',
}

const ROLE_SUGGESTIONS = ['Cast A', 'Cast B', 'Crew', 'Pit Band', 'Orchestra', 'Parent Volunteer', 'Stage Crew', 'Light/Sound']

export default function RosterManager({
  showId,
  slug,
  members,
}: {
  showId: string
  slug: string
  members: Member[]
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Cast')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !role.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await addShowMember(showId, slug, email, role.trim())
        setEmail('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add member')
      }
    })
  }

  function handleRemove(memberId: string) {
    startTransition(async () => {
      await removeShowMember(memberId, slug)
    })
  }

  // Group members by their show_role label
  const groups = Array.from(new Set(members.map(m => m.show_role))).sort()
  const byRole = Object.fromEntries(groups.map(g => [g, members.filter(m => m.show_role === g)]))

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Cast &amp; Crew Roster
          </p>
        </div>

        {/* Member list grouped by role label */}
        {members.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No members added yet.</p>
          </div>
        ) : (
          <div>
            {groups.map(r => {
              const group = byRole[r]
              return (
                <div key={r} style={{ borderBottom: '1px solid var(--border)' }}>
                  <div style={{ padding: '10px 24px', background: 'rgba(0,0,0,0.2)' }}>
                    <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--teal)' }}>
                      {r} ({group.length})
                    </span>
                  </div>
                  {group.map(m => (
                    <div key={m.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div>
                        <p style={{ fontSize: '0.88rem' }}>{m.families.parent_name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>{m.families.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(m.id)}
                        disabled={isPending}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} style={{ padding: '20px 24px', borderTop: members.length > 0 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: error ? '8px' : 0 }}>
            <input
              type="email"
              required
              placeholder="family@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ ...inputStyle, minWidth: '220px' }}
            />
            {/* Free-text group input with suggestions */}
            <input
              type="text"
              required
              list="role-suggestions"
              placeholder="Group (e.g. Cast A)"
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ ...inputStyle, minWidth: '140px', flex: '0 1 auto' }}
            />
            <datalist id="role-suggestions">
              {ROLE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              {/* Also suggest existing groups used in this show */}
              {groups.filter(g => !ROLE_SUGGESTIONS.includes(g)).map(g => <option key={g} value={g} />)}
            </datalist>
            <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '10px 20px', opacity: isPending ? 0.6 : 1, whiteSpace: 'nowrap' }}>
              <span>{isPending ? 'Adding…' : '+ Add'}</span>
            </button>
          </div>
          {error && <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginTop: '6px' }}>{error}</p>}
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '8px' }}>
            Enter the email address of a family with an existing account. Type any group name or choose from suggestions.
          </p>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/events/\[slug\]/RosterManager.tsx
git commit -m "feat: add RosterManager component for cast/crew"
```

---

## Task 4: Wire RosterManager into show detail page

**Files:**
- Modify: `app/(admin)/admin/events/[slug]/page.tsx`

- [ ] **Step 1: Add import at top of file**

After the existing imports, add:
```typescript
import RosterManager from './RosterManager'
```

- [ ] **Step 2: Fetch show members in the existing Promise.all block**

The current block fetches 6 data sources. Add a 7th:

```typescript
// Inside the Promise.all, add:
supabase.from('show_members')
  .select('id, show_role, families(parent_name, email)')
  .eq('show_id', show.id)
  .order('show_role')
```

Destructure it:
```typescript
const [
  { data: slotsData },
  { data: rolesData },
  { data: regCounts },
  { data: performancesData },
  { data: venuesData },
  { data: parentShowsData },
  { data: membersData },   // ← new
] = await Promise.all([...])
```

- [ ] **Step 3: Add RosterManager below TicketManager, for shows only**

In the JSX, after the existing `{show.event_type === 'show' && <TicketManager ... />}` block, add:

```tsx
{show.event_type === 'show' && (
  <RosterManager
    showId={show.id}
    slug={slug}
    members={(membersData ?? []) as {
      id: string
      show_role: string
      families: { parent_name: string; email: string }
    }[]}
  />
)}
```

- [ ] **Step 4: Add Communications link below RosterManager**

```tsx
{show.event_type === 'show' && (
  <div style={{ marginBottom: '32px' }}>
    <Link
      href={`/admin/events/${slug}/communications`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px',
        background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
        textDecoration: 'none',
      }}
    >
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        Communications
      </p>
      <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>Send Email →</span>
    </Link>
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add app/\(admin\)/admin/events/\[slug\]/page.tsx
git commit -m "feat: wire RosterManager and Communications link into show detail"
```

---

## Task 5: PM email template

**Files:**
- Create: `lib/email/pm-emails.ts`

- [ ] **Step 1: Create the template file**

```typescript
import { resend } from './client'

const TEST_EMAIL = process.env.RESEND_TEST_EMAIL || null

const FROM = TEST_EMAIL
  ? 'Accolade Community Theatre <onboarding@resend.dev>'
  : 'Accolade Community Theatre <production@accoladetheatre.org>'
const REPLY_TO = 'info@accoladetheatre.org'
const SITE = 'https://accoladetheatre.org'

function baseTemplate(content: string): string {
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

export async function sendBroadcastEmail({
  recipients,
  subject,
  body,
  showTitle,
}: {
  recipients: { name: string; email: string }[]
  subject: string
  body: string
  showTitle: string
}) {
  if (recipients.length === 0) return { sent: 0 }

  const dest = TEST_EMAIL ? [{ name: recipients[0].name, email: TEST_EMAIL }] : recipients

  // Convert plain text body to simple HTML paragraphs
  const bodyHtml = body
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c8c4d4;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')

  const html = baseTemplate(`
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6880;">${showTitle}</p>
    <h2 style="margin:0 0 28px;font-family:'Georgia',serif;font-size:20px;color:#e8e4dc;font-weight:normal;">${subject}</h2>
    ${bodyHtml}
  `)

  const batch = dest.map(r => ({
    from: FROM,
    to: r.email,
    replyTo: REPLY_TO,
    subject,
    html,
  }))

  await resend.batch.send(batch)
  return { sent: dest.length }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/email/pm-emails.ts
git commit -m "feat: add PM broadcast email template"
```

---

## Task 6: Send email server action

**Files:**
- Create: `app/(admin)/admin/events/[slug]/communications/send-actions.ts`

- [ ] **Step 1: Create the server action**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { sendBroadcastEmail } from '@/lib/email/pm-emails'

// groups: array of show_role label strings (e.g. ['Cast A', 'Crew']) + optional sentinel 'auditioners'
export async function sendShowEmail({
  showId,
  showTitle,
  groups,
  subject,
  body,
}: {
  showId: string
  showTitle: string
  groups: string[]
  subject: string
  body: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  if (!subject.trim() || !body.trim()) throw new Error('Subject and body are required')
  if (groups.length === 0) throw new Error('Select at least one recipient group')

  const emailSet = new Map<string, string>() // email → name

  // Resolve show_members by role label (any free-text group)
  const memberGroups = groups.filter(g => g !== 'auditioners')
  if (memberGroups.length > 0) {
    const { data: members } = await supabase
      .from('show_members')
      .select('families(parent_name, email)')
      .eq('show_id', showId)
      .in('show_role', memberGroups)

    for (const m of members ?? []) {
      const f = m.families as unknown as { parent_name: string; email: string }
      if (f?.email) emailSet.set(f.email.toLowerCase(), f.parent_name ?? f.email)
    }
  }

  // Resolve auditioners (special sentinel group)
  if (groups.includes('auditioners')) {
    const { data: auditions } = await supabase
      .from('auditions')
      .select('parent_name, parent_email')
      .eq('show_id', showId)
      .in('status', ['registered', 'waitlisted'])

    for (const a of auditions ?? []) {
      if (a.parent_email) emailSet.set(a.parent_email.toLowerCase(), a.parent_name ?? a.parent_email)
    }
  }

  const recipients = Array.from(emailSet.entries()).map(([email, name]) => ({ email, name }))
  const { sent } = await sendBroadcastEmail({ recipients, subject, body, showTitle })
  return { sent }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/events/\[slug\]/communications/send-actions.ts
git commit -m "feat: add send email server action"
```

---

## Task 7: EmailComposer client component

**Files:**
- Create: `app/(admin)/admin/events/[slug]/communications/EmailComposer.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { sendShowEmail, RecipientGroup } from './send-actions'

// Groups are dynamic (from show_members) + 'auditioners' sentinel

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '12px 16px',
  color: 'var(--warm-white)',
  fontSize: '0.88rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  display: 'block',
  marginBottom: '8px',
}

export default function EmailComposer({
  showId,
  showTitle,
  memberGroups,
  auditionerCount,
}: {
  showId: string
  showTitle: string
  memberGroups: { label: string; count: number }[]  // dynamic from show_members
  auditionerCount: number
}) {
  // All selectable groups: dynamic roster groups + auditioners sentinel
  const allGroups = [
    ...memberGroups,
    { label: 'auditioners', count: auditionerCount },
  ]

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const [error, setError] = useState('')

  function toggleGroup(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setResult(null)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)
    startTransition(async () => {
      try {
        const res = await sendShowEmail({
          showId,
          showTitle,
          groups: Array.from(selected),
          subject,
          body,
        })
        setResult(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Send failed')
      }
    })
  }

  return (
    <form onSubmit={handleSend} style={{ maxWidth: '680px' }}>

      {/* Recipient groups — dynamic from roster + auditioners */}
      <div style={{ marginBottom: '28px' }}>
        <span style={labelStyle}>Send To</span>
        {allGroups.length === 1 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            No roster members yet. Add cast/crew in the Roster section, or send to Auditioners.
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {allGroups.map(g => {
            const on = selected.has(g.label)
            const displayLabel = g.label === 'auditioners' ? 'Auditioners' : g.label
            return (
              <button
                key={g.label}
                type="button"
                onClick={() => toggleGroup(g.label)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${on ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: '2px',
                  background: on ? 'rgba(61,158,140,0.12)' : 'rgba(255,255,255,0.04)',
                  color: on ? 'var(--teal)' : 'var(--muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {displayLabel}
                <span style={{
                  background: on ? 'rgba(61,158,140,0.2)' : 'rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.68rem',
                  color: on ? 'var(--teal)' : 'var(--muted-dim)',
                }}>
                  {g.count}
                </span>
              </button>
            )
          })}
        </div>
        {selected.size > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '10px' }}>
            {Array.from(selected).map(id => {
              const g = allGroups.find(x => x.label === id)
              return `${g?.count ?? 0} ${id === 'auditioners' ? 'auditioners' : id}`
            }).join(', ')} — deduplicated before send
          </p>
        )}
      </div>

      {/* Subject */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Subject</label>
        <input
          type="text"
          required
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Schedule change for Tuesday rehearsal"
          style={inputStyle}
        />
      </div>

      {/* Body */}
      <div style={{ marginBottom: '28px' }}>
        <label style={labelStyle}>Message</label>
        <textarea
          required
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={10}
          placeholder={"Hi everyone,\n\nJust a reminder that Tuesday's rehearsal has moved to 6:30pm.\n\nSee you there!"}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
        />
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '6px' }}>
          Plain text. Blank lines become paragraph breaks.
        </p>
      </div>

      {error && <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '16px' }}>{error}</p>}
      {result && (
        <p style={{ color: 'var(--teal)', fontSize: '0.82rem', marginBottom: '16px' }}>
          Sent to {result.sent} recipient{result.sent !== 1 ? 's' : ''}.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || selected.size === 0 || !subject.trim() || !body.trim()}
        className="btn-primary"
        style={{ padding: '12px 32px', opacity: (isPending || selected.size === 0) ? 0.5 : 1 }}
      >
        <span>{isPending ? 'Sending…' : 'Send Email'}</span>
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/events/\[slug\]/communications/EmailComposer.tsx
git commit -m "feat: add EmailComposer client component"
```

---

## Task 8: Communications server page

**Files:**
- Create: `app/(admin)/admin/events/[slug]/communications/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EmailComposer from './EmailComposer'

export default async function CommunicationsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, event_type')
    .eq('slug', slug)
    .single()

  if (!show || show.event_type !== 'show') notFound()

  // Distinct groups + counts from show_members
  const { data: members } = await supabase
    .from('show_members')
    .select('show_role')
    .eq('show_id', show.id)

  const countByRole: Record<string, number> = {}
  for (const m of members ?? []) {
    countByRole[m.show_role] = (countByRole[m.show_role] ?? 0) + 1
  }
  const memberGroups = Object.entries(countByRole).map(([label, count]) => ({ label, count }))

  // Auditioner count (registered + waitlisted)
  const { count: auditionerCount } = await supabase
    .from('auditions')
    .select('id', { count: 'exact', head: true })
    .eq('show_id', show.id)
    .in('status', ['registered', 'waitlisted'])

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href={`/admin/events/${slug}`}
          style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
        >
          ← {show.title}
        </Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>
          Communications
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '8px' }}>
          Send an email to any group of participants for {show.title}.
        </p>
      </div>

      <EmailComposer
        showId={show.id}
        showTitle={show.title}
        memberGroups={memberGroups}
        auditionerCount={auditionerCount ?? 0}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/events/\[slug\]/communications/
git commit -m "feat: add Communications page for PM email composer"
```

---

## Task 9: Type-check and smoke test

- [ ] **Step 1: Run TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any type issues before proceeding.

- [ ] **Step 2: Start dev server and verify**

```bash
npm run dev
```

1. Open `/admin/events/[a-show-slug]` — verify Roster Manager section appears for shows (not auditions)
2. Add a family by email → confirm they appear in the roster
3. Click "Send Email →" link → confirm you land on the Communications page
4. Select one or more groups, fill subject + body → click Send
5. Check `RESEND_TEST_EMAIL` inbox (or Resend dashboard) for delivery

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: PM email composer — roster management + targeted broadcast emails"
```

---

## What's next: Plan B — Signup Lists

The next plan (`2026-04-24-pm-signup-lists.md`) covers:
- `signup_lists`, `signup_slots`, `signup_entries` tables
- Admin: create lists with slots (tied to rehearsal dates or freeform)
- PM sends invite link per list via the email composer
- Public page `/signup/[slug]` — anyone signs up with name + email
- Admin view: who signed up for which slot
