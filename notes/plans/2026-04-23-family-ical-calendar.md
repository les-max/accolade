# Family iCal Calendar Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each family a subscribable iCal feed URL that auto-syncs their Accolade commitments (auditions, rehearsals, performances, events) into iOS Calendar, Google Calendar, or any Android calendar app.

**Architecture:** A secret per-family `calendar_token` UUID on the `families` table acts as an auth-free URL key. A Next.js route handler at `/api/calendar/[token]` fetches that family's auditions and show events, generates a standards-compliant iCal string, and returns it as `text/calendar`. The dashboard gets an agenda view (upcoming events list) and a subscribe button.

**Tech Stack:** Next.js 15 App Router route handlers, Supabase (service client for the feed endpoint, regular server client for the dashboard), iCal 2.0 RFC 5545 (generated as plain text — no library).

> **Note:** No automated test framework exists in this project. Verification steps are manual.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/011_show_events_and_calendar_token.sql` | Create | `show_events` table + `calendar_token` on families + RLS |
| `lib/ical.ts` | Create | Pure iCal string generation — no side effects |
| `app/api/calendar/[token]/route.ts` | Create | Feed endpoint — fetches + returns `.ics` |
| `app/(public)/account/calendar/page.tsx` | Create | Agenda view + subscribe URL for dashboard |
| `app/(public)/account/AccountNav.tsx` | Modify | Add "Calendar" nav link |
| `app/(public)/account/page.tsx` | Modify | Add upcoming events card |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/011_show_events_and_calendar_token.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- show_events: rehearsals, tech week, performances, etc.
-- ============================================================
CREATE TABLE show_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id    UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('rehearsal', 'tech_rehearsal', 'performance', 'event', 'other')),
  title      TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time   TIMESTAMPTZ,
  location   TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_show_events_show_id    ON show_events(show_id);
CREATE INDEX idx_show_events_start_time ON show_events(start_time);

ALTER TABLE show_events ENABLE ROW LEVEL SECURITY;

-- Families who are members of the show can read its events
CREATE POLICY "show_events_select_member" ON show_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM show_members sm
      JOIN families f ON f.id = sm.family_id
      WHERE sm.show_id = show_events.show_id
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "show_events_all_admin" ON show_events FOR ALL
  USING  (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ============================================================
-- calendar_token: secret UUID per family for iCal feed URL
-- ============================================================
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS calendar_token UUID NOT NULL DEFAULT gen_random_uuid();

-- Existing rows get unique tokens automatically via the DEFAULT
CREATE UNIQUE INDEX idx_families_calendar_token ON families(calendar_token);
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with the SQL above, project id `wxcfxzqlzecyopnqgona`.

- [ ] **Step 3: Verify in Supabase**

Run:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'families' AND column_name = 'calendar_token';
```
Expected: one row returned.

```sql
SELECT COUNT(*) FROM families WHERE calendar_token IS NULL;
```
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/011_show_events_and_calendar_token.sql
git commit -m "feat: add show_events table and calendar_token to families"
```

---

## Task 2: iCal generation utility

**Files:**
- Create: `lib/ical.ts`

- [ ] **Step 1: Create `lib/ical.ts`**

```typescript
export type CalEvent = {
  uid: string
  summary: string
  start: Date
  end: Date
  description?: string
  location?: string
}

function formatDt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// RFC 5545 line folding: max 75 octets per line, fold with CRLF + space
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  let result = ''
  let i = 0
  while (i < line.length) {
    const chunk = line.slice(i, i + 75)
    result += (i === 0 ? '' : '\r\n ') + chunk
    i += 75
  }
  return result
}

export function generateIcal(events: CalEvent[], calName: string): string {
  const stamp = formatDt(new Date())
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Accolade Community Theatre//Family Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
    'X-WR-TIMEZONE:America/Chicago',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
  ]

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatDt(event.start)}`,
      `DTEND:${formatDt(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
    )
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    if (event.location)    lines.push(`LOCATION:${escapeText(event.location)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
```

- [ ] **Step 2: Manual smoke test**

In a scratch Next.js route or the browser console (after Step 3 below exists), verify:
- Output starts with `BEGIN:VCALENDAR` and ends with `END:VCALENDAR\r\n`
- A long SUMMARY line gets folded at 75 chars with `\r\n ` continuation
- Special characters (`,` `\n` `;`) are escaped correctly

- [ ] **Step 3: Commit**

```bash
git add lib/ical.ts
git commit -m "feat: add iCal generation utility"
```

---

## Task 3: iCal feed endpoint

**Files:**
- Create: `app/api/calendar/[token]/route.ts`

- [ ] **Step 1: Create the route handler**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateIcal, CalEvent } from '@/lib/ical'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token) return new NextResponse('Not found', { status: 404 })

  const supabase = createServiceClient()

  const { data: family } = await supabase
    .from('families')
    .select('id, parent_name')
    .eq('calendar_token', token)
    .single()

  if (!family) return new NextResponse('Not found', { status: 404 })

  const events: CalEvent[] = []

  // ── Auditions ────────────────────────────────────────────
  const { data: auditions } = await supabase
    .from('auditions')
    .select('id, auditioner_name, audition_slots(label, start_time), shows(title)')
    .eq('family_id', family.id)
    .eq('status', 'registered')

  for (const a of auditions ?? []) {
    const slot = a.audition_slots as { label: string; start_time: string | null } | null
    const show = a.shows as { title: string } | null
    if (!slot?.start_time) continue
    const start = new Date(slot.start_time)
    const end   = new Date(start.getTime() + 30 * 60 * 1000)
    events.push({
      uid:         `audition-${a.id}@accoladetheatre.org`,
      summary:     `Audition – ${show?.title ?? 'Accolade Theatre'}`,
      start,
      end,
      description: `Auditioner: ${a.auditioner_name}\nSlot: ${slot.label}`,
    })
  }

  // ── Show events (rehearsals, performances, etc.) ─────────
  const { data: memberships } = await supabase
    .from('show_members')
    .select('show_id')
    .eq('family_id', family.id)

  const showIds = (memberships ?? []).map(m => m.show_id)

  if (showIds.length > 0) {
    const { data: showEvents } = await supabase
      .from('show_events')
      .select('id, title, event_type, start_time, end_time, location, notes, shows(title)')
      .in('show_id', showIds)
      .order('start_time')

    for (const e of showEvents ?? []) {
      const start = new Date(e.start_time)
      const end   = e.end_time
        ? new Date(e.end_time)
        : new Date(start.getTime() + 2 * 60 * 60 * 1000)
      const show = e.shows as { title: string } | null
      events.push({
        uid:         `show-event-${e.id}@accoladetheatre.org`,
        summary:     `${e.title} – ${show?.title ?? 'Accolade Theatre'}`,
        start,
        end,
        description: e.notes ?? undefined,
        location:    e.location ?? undefined,
      })
    }
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime())

  const ical = generateIcal(events, 'Accolade Community Theatre')

  return new NextResponse(ical, {
    headers: {
      'Content-Type':        'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="accolade-calendar.ics"',
      'Cache-Control':       'no-cache, no-store, must-revalidate',
    },
  })
}
```

- [ ] **Step 2: Verify locally**

1. Get a `calendar_token` value from Supabase: `SELECT calendar_token FROM families LIMIT 1;`
2. Visit `http://localhost:3000/api/calendar/[that-token]` in the browser
3. Should download or display a text file starting with `BEGIN:VCALENDAR`
4. If the family has registered auditions with slot times, those should appear as VEVENTs

- [ ] **Step 3: Commit**

```bash
git add app/api/calendar/[token]/route.ts
git commit -m "feat: add iCal feed endpoint"
```

---

## Task 4: Dashboard calendar page

**Files:**
- Create: `app/(public)/account/calendar/page.tsx`

- [ ] **Step 1: Create calendar page**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CopyButton from './CopyButton'

export const metadata = { title: 'My Calendar — Accolade Community Theatre' }

const EVENT_TYPE_LABEL: Record<string, string> = {
  rehearsal:      'Rehearsal',
  tech_rehearsal: 'Tech Rehearsal',
  performance:    'Performance',
  event:          'Event',
  other:          'Event',
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: family } = await supabase
    .from('families')
    .select('id, calendar_token')
    .eq('user_id', user.id)
    .single()

  if (!family) redirect('/account/setup')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const feedUrl = `${siteUrl}/api/calendar/${family.calendar_token}`

  // ── Fetch upcoming events ──────────────────────────────
  const now = new Date().toISOString()

  const [{ data: auditions }, { data: memberships }] = await Promise.all([
    supabase
      .from('auditions')
      .select('id, auditioner_name, audition_slots(label, start_time), shows(title, slug)')
      .eq('family_id', family.id)
      .eq('status', 'registered'),
    supabase
      .from('show_members')
      .select('show_id')
      .eq('family_id', family.id),
  ])

  type AgendaItem = {
    id: string
    label: string
    type: string
    date: Date
    detail: string
    href?: string
  }

  const items: AgendaItem[] = []

  for (const a of auditions ?? []) {
    const slot = a.audition_slots as { label: string; start_time: string | null } | null
    const show = a.shows as { title: string; slug: string } | null
    if (!slot?.start_time) continue
    const date = new Date(slot.start_time)
    if (date < new Date(now)) continue
    items.push({
      id:     `audition-${a.id}`,
      label:  show?.title ?? 'Audition',
      type:   'Audition',
      date,
      detail: `${a.auditioner_name} · ${slot.label}`,
      href:   show?.slug ? `/auditions/${show.slug}` : undefined,
    })
  }

  const showIds = (memberships ?? []).map(m => m.show_id)
  if (showIds.length > 0) {
    const { data: showEvents } = await supabase
      .from('show_events')
      .select('id, title, event_type, start_time, end_time, location, shows(title)')
      .in('show_id', showIds)
      .gte('start_time', now)
      .order('start_time')

    for (const e of showEvents ?? []) {
      const show = e.shows as { title: string } | null
      items.push({
        id:     `event-${e.id}`,
        label:  show?.title ?? 'Accolade Theatre',
        type:   EVENT_TYPE_LABEL[e.event_type] ?? 'Event',
        date:   new Date(e.start_time),
        detail: [formatTime(new Date(e.start_time)), e.location].filter(Boolean).join(' · '),
      })
    }
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <section style={{ padding: 'clamp(40px, 8vw, 72px) clamp(20px, 5vw, 48px)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
          My Account
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: '40px' }}>
          My Calendar
        </h1>

        {/* Subscribe card */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px 28px', marginBottom: '40px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
            Subscribe to Calendar
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '20px' }}>
            Add this feed to iOS Calendar, Google Calendar, or any calendar app. It updates automatically when new events are added.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={`webcal://${feedUrl.replace(/^https?:\/\//, '')}`}
              className="btn-primary"
              style={{ fontSize: '0.7rem' }}
            >
              <span>Add to Apple Calendar</span>
            </a>
            <CopyButton url={feedUrl} />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '16px', lineHeight: 1.6 }}>
            For Google Calendar: open Google Calendar → Other calendars → From URL → paste the copied link.
          </p>
        </div>

        {/* Agenda */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Upcoming
            </p>
          </div>
          {items.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No upcoming events.</p>
            </div>
          ) : (
            <div>
              {items.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', gap: '20px', padding: '16px 24px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ minWidth: '80px', textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                      {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6 }}>
                      {item.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
                        {item.type}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `app/(public)/account/calendar/CopyButton.tsx`**

```typescript
'use client'

import { useState } from 'react'

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="btn-ghost"
      style={{ fontSize: '0.7rem' }}
    >
      <span>{copied ? 'Copied!' : 'Copy Feed URL'}</span>
    </button>
  )
}
```

- [ ] **Step 3: Verify locally**

1. Sign in and visit `http://localhost:3000/account/calendar`
2. "Subscribe" section shows with two buttons
3. "Add to Apple Calendar" button uses `webcal://` protocol
4. "Copy Feed URL" button copies to clipboard and shows "Copied!"
5. Agenda shows any upcoming auditions; shows "No upcoming events" if none

- [ ] **Step 4: Commit**

```bash
git add app/(public)/account/calendar/page.tsx app/(public)/account/calendar/CopyButton.tsx
git commit -m "feat: add dashboard calendar page with agenda and subscribe"
```

---

## Task 5: Wire into navigation and dashboard

**Files:**
- Modify: `app/(public)/account/AccountNav.tsx`
- Modify: `app/(public)/account/page.tsx`

- [ ] **Step 1: Read AccountNav.tsx**

Read `app/(public)/account/AccountNav.tsx` to understand its current link structure before editing.

- [ ] **Step 2: Add Calendar link to AccountNav**

In `AccountNav.tsx`, add a Calendar link alongside the existing nav links (Family, Auditions, etc.). Follow the exact same pattern used for existing links in that file.

- [ ] **Step 3: Add upcoming events card to account/page.tsx**

In the 2-column grid in `app/(public)/account/page.tsx`, add a third card below the existing two. Add this fetch after the existing auditions fetch:

```typescript
// Next 3 upcoming events across auditions + show events
type UpcomingItem = { id: string; label: string; type: string; date: string }
const upcoming: UpcomingItem[] = []

for (const a of auditions ?? []) {
  const slot = a.audition_slots as { label: string; start_time: string | null } | null
  const show = a.shows as { title: string; slug: string } | null
  if (!slot?.start_time || new Date(slot.start_time) < new Date()) continue
  upcoming.push({ id: `a-${a.id}`, label: show?.title ?? 'Audition', type: 'Audition', date: slot.start_time })
}
upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
const nextThree = upcoming.slice(0, 3)
```

Then add this card JSX in the grid (full-width, `gridColumn: '1 / -1'` on narrow screens or as third column):

```tsx
{/* Upcoming events card */}
<div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
    <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
      Upcoming
    </p>
    <Link href="/account/calendar" style={{ fontSize: '0.65rem', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.1em' }}>
      Calendar →
    </Link>
  </div>
  {nextThree.length === 0 ? (
    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '16px' }}>No upcoming events.</p>
      <Link href="/account/calendar" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
        Subscribe to calendar →
      </Link>
    </div>
  ) : (
    <div>
      {nextThree.map((item, i) => (
        <div key={item.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px',
          borderBottom: i < nextThree.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <div>
            <p style={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.label}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>{item.type}</p>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      ))}
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)' }}>
        <Link href="/account/calendar" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
          View calendar + subscribe →
        </Link>
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Final end-to-end verification**

1. Sign in → account dashboard shows "Upcoming" card
2. Click "Calendar →" → reaches `/account/calendar`
3. AccountNav has a Calendar link that highlights when on `/account/calendar`
4. Copy the feed URL → paste into browser → downloads `.ics` file
5. On an iPhone: tap "Add to Apple Calendar" → iOS prompts to subscribe
6. Sign out → visiting `/api/calendar/[token]` with a valid token still returns the feed (no auth required — that's by design)
7. Visiting `/api/calendar/invalid-token` returns 404

- [ ] **Step 6: Commit**

```bash
git add app/(public)/account/AccountNav.tsx app/(public)/account/page.tsx
git commit -m "feat: wire calendar into account nav and dashboard"
```
