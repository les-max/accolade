# Show Staff Roles & Tabbed Show Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-show director/production_manager role assignments and redesign the show detail admin page into a tabbed layout with role-aware access controls.

**Architecture:** A new `show_staff` join table records which director or production_manager is assigned to which show. Role is resolved at the server component level via a shared utility and passed as a prop into each tab's content. Tab navigation uses URL search params (`?tab=overview` etc.) so the page stays fully server-rendered. This plan scopes tabs to `event_type = 'show'` only; auditions/camps/workshops keep their existing flat layout.

**Tech Stack:** Next.js 15 app router (server components), Supabase (RLS), TypeScript

**Permission model:**

| Tab | Admin | Director | Prod. Manager |
|---|---|---|---|
| Overview | full | full | full |
| Details | full edit | dates + venue editable, rest read-only | read-only |
| Schedule & Tickets | full edit | read-only | read-only |
| Cast & Crew | full edit | full edit | full edit |
| Finances | full edit | coupon codes only | read-only |
| Comms & Waivers | full | full | full |

---

## Task 1: DB Migration 025 — Role Enum + show_staff Table

**Files:**
- Create: `supabase/migrations/025_show_staff.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/025_show_staff.sql

-- 1. Drop unused show_id column from admin_users (never used in app code)
ALTER TABLE admin_users DROP COLUMN IF EXISTS show_id;

-- 2. Update role check constraint
--    Remove: executive_director, stage_manager
--    Add:    production_manager
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('admin', 'director', 'production_manager'));

-- 3. Create per-show staff assignment table
CREATE TABLE show_staff (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id        UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  admin_user_id  UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('director', 'production_manager')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (show_id, admin_user_id)
);

-- 4. RLS for show_staff
ALTER TABLE show_staff ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage show_staff" ON show_staff
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Directors/PMs can read their own assignments
CREATE POLICY "Staff view own assignments" ON show_staff
  FOR SELECT
  USING (
    admin_user_id IN (
      SELECT id FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- 5. Index for fast show lookups
CREATE INDEX idx_show_staff_show_id ON show_staff(show_id);
CREATE INDEX idx_show_staff_admin_user_id ON show_staff(admin_user_id);
```

- [ ] **Step 2: Apply the migration**

```bash
supabase db push
```

Expected: migration applied with no errors. If a director or stage_manager role exists in the table, the constraint update will fail — check first with:
```bash
supabase db query "SELECT DISTINCT role FROM admin_users"
```
If `executive_director` or `stage_manager` rows exist, update them before running the migration:
```bash
supabase db query "UPDATE admin_users SET role = 'director' WHERE role IN ('executive_director', 'stage_manager')"
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/025_show_staff.sql
git commit -m "feat: add show_staff table and update admin role enum"
```

---

## Task 2: Staff Role Utilities

**Files:**
- Create: `lib/staff.ts`

- [ ] **Step 1: Create the utilities file**

```typescript
// lib/staff.ts
import { createClient } from '@/lib/supabase/server'

export type StaffRole = 'admin' | 'director' | 'production_manager'

export interface SessionStaff {
  adminUserId: string
  orgRole: StaffRole
}

/**
 * Returns the current user's admin_users record (org-level role).
 * Returns null if the user is not in admin_users.
 */
export async function getSessionStaff(): Promise<SessionStaff | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!data) return null
  return { adminUserId: data.id, orgRole: data.role as StaffRole }
}

/**
 * Returns the effective role for the current user on a specific show.
 * - Admins always get 'admin' regardless of show_staff.
 * - Directors/PMs must have a show_staff entry for this show.
 * - Returns null if the user has no access to this show.
 */
export async function getShowRole(showId: string): Promise<StaffRole | null> {
  const supabase = await createClient()
  const staff = await getSessionStaff()
  if (!staff) return null
  if (staff.orgRole === 'admin') return 'admin'

  const { data: assignment } = await supabase
    .from('show_staff')
    .select('role')
    .eq('show_id', showId)
    .eq('admin_user_id', staff.adminUserId)
    .single()

  if (!assignment) return null
  return assignment.role as StaffRole
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/staff.ts
git commit -m "feat: add staff role resolution utilities"
```

---

## Task 3: Admin Layout — Fetch Role + Pass to Nav

**Files:**
- Modify: `app/(admin)/admin/layout.tsx`
- Modify: `app/(admin)/admin/AdminNav.tsx`

- [ ] **Step 1: Update AdminNav to accept and use role prop**

In `AdminNav.tsx`, change the props and nav items:

```typescript
// Replace the existing props and navItems with:
export default function AdminNav({ userEmail, role }: { userEmail: string; role: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Directors and PMs only see Events
  const navItems = role === 'admin'
    ? [
        { label: 'Events',   href: '/admin/events' },
        { label: 'Venues',   href: '/admin/venues' },
        { label: 'Sponsors', href: '/admin/sponsors' },
        { label: 'Users',    href: '/admin/users' },
      ]
    : [
        { label: 'Events', href: '/admin/events' },
      ]
  // ... rest of existing render unchanged
```

- [ ] **Step 2: Update admin layout to fetch role and pass it**

In `app/(admin)/admin/layout.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from './AdminNav'
import Nav from '@/components/Nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin-login')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  const BOOTSTRAP_EMAILS = ['les@lesbrowndesign.com']
  if (!adminUser && !BOOTSTRAP_EMAILS.includes(user.email ?? '')) redirect('/')

  const role = adminUser?.role ?? 'admin'

  return (
    <>
      <Nav />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--ink)', paddingTop: '64px' }}>
        <AdminNav userEmail={user.email ?? ''} role={role} />
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <main style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(admin)/admin/layout.tsx app/(admin)/admin/AdminNav.tsx
git commit -m "feat: pass staff role to admin nav, hide org-level links for director/PM"
```

---

## Task 4: Events List — Filter by Show Assignment

**Files:**
- Modify: `app/(admin)/admin/events/page.tsx`

- [ ] **Step 1: Fetch staff role and filter events accordingly**

Replace the current query block in `events/page.tsx` (lines 20–34) with:

```typescript
import { getSessionStaff } from '@/lib/staff'

// Inside the component, after getting searchParams:
const supabase = await createClient()
const staff = await getSessionStaff()

let showIds: string[] | null = null

if (staff && staff.orgRole !== 'admin') {
  // Director/PM: only shows they're assigned to
  const { data: assignments } = await supabase
    .from('show_staff')
    .select('show_id')
    .eq('admin_user_id', staff.adminUserId)
  showIds = (assignments ?? []).map(a => a.show_id)
}

let query = supabase
  .from('shows')
  .select('id, slug, title, event_type, start_date, status, archived')
  .order('start_date', { ascending: false })

if (!includeArchived) query = query.eq('archived', false)
if (showIds !== null) query = query.in('id', showIds)

const { data: shows } = await query
```

Also remove the "New Event" button and "Show Archived" toggle for non-admin roles:

```typescript
// Wrap the header action buttons:
{staff?.orgRole === 'admin' && (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    <Link href={...}>...</Link>
    <Link href="/admin/events/new" className="btn-primary">...</Link>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(admin)/admin/events/page.tsx"
git commit -m "feat: filter events list by show_staff assignment for director/PM"
```

---

## Task 5: Tab Shell — ShowTabNav Component + Page Restructure

**Files:**
- Create: `app/(admin)/admin/events/[slug]/ShowTabNav.tsx`
- Modify: `app/(admin)/admin/events/[slug]/page.tsx`

- [ ] **Step 1: Create ShowTabNav**

```typescript
// app/(admin)/admin/events/[slug]/ShowTabNav.tsx
import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

export type ShowTab = 'overview' | 'details' | 'schedule' | 'people' | 'finances' | 'comms'

const TABS: { id: ShowTab; label: string }[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'details',   label: 'Details' },
  { id: 'schedule',  label: 'Schedule & Tickets' },
  { id: 'people',    label: 'Cast & Crew' },
  { id: 'finances',  label: 'Finances' },
  { id: 'comms',     label: 'Comms & Waivers' },
]

export default function ShowTabNav({
  slug,
  activeTab,
}: {
  slug: string
  activeTab: ShowTab
  role: StaffRole
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      borderBottom: '1px solid var(--border)',
      marginBottom: '32px',
      overflowX: 'auto',
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <Link
            key={tab.id}
            href={`/admin/events/${slug}?tab=${tab.id}`}
            style={{
              padding: '12px 20px',
              fontSize: '0.68rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              color: isActive ? 'var(--gold)' : 'var(--muted)',
              borderBottom: `2px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Restructure page.tsx for shows**

The show detail `page.tsx` gains a `searchParams` prop and routes to tab content for shows. Non-show event types keep their current flat layout unchanged.

Add `searchParams` to the page props and resolve the role at the top:

```typescript
import { getShowRole } from '@/lib/staff'
import type { StaffRole } from '@/lib/staff'
import ShowTabNav, { type ShowTab } from './ShowTabNav'
import { redirect } from 'next/navigation'

export default async function ShowDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { slug } = await params
  const { tab: tabParam } = await searchParams
  const supabase = await createClient()

  const { data: show } = await supabase.from('shows').select('*').eq('slug', slug).single()
  if (!show) notFound()

  const role = await getShowRole(show.id)
  if (!role) redirect('/admin/events') // no access to this show

  // ... existing data fetching unchanged ...

  // For non-show types: keep existing flat layout (unchanged from current)
  if (show.event_type !== 'show') {
    return (
      <div style={{ maxWidth: '860px' }}>
        {/* existing header */}
        {/* existing flat sections */}
      </div>
    )
  }

  // For show type: tabbed layout
  const VALID_TABS: ShowTab[] = ['overview', 'details', 'schedule', 'people', 'finances', 'comms']
  const activeTab: ShowTab = VALID_TABS.includes(tabParam as ShowTab)
    ? (tabParam as ShowTab)
    : 'overview'

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header — always visible */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/admin/events" style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← Events
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>{show.title}</h1>
          <span style={{
            padding: '4px 10px',
            border: `1px solid ${badge.border}`,
            borderRadius: '2px',
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: badge.color,
          }}>
            {show.status}
          </span>
        </div>
      </div>

      {/* Tab navigation */}
      <ShowTabNav slug={slug} activeTab={activeTab} role={role} />

      {/* Tab content */}
      {activeTab === 'overview'  && <OverviewTab  show={show} slug={slug} role={role} performancesData={performancesData} membersData={membersData} />}
      {activeTab === 'details'   && <DetailsTab   show={show} slug={slug} role={role} venuesData={venuesData} parentShowsData={parentShowsData} />}
      {activeTab === 'schedule'  && <ScheduleTab  show={show} slug={slug} role={role} performancesData={performancesData} ticketConfigData={ticketConfigData} />}
      {activeTab === 'people'    && <PeopleTab    show={show} slug={slug} role={role} membersData={membersData} />}
      {activeTab === 'finances'  && <FinancesTab  show={show} slug={slug} role={role} feesConfigData={feesConfigData} couponsData={couponsData} />}
      {activeTab === 'comms'     && <CommsTab     show={show} slug={slug} role={role} />}
    </div>
  )
}
```

Note: The tab components (OverviewTab, DetailsTab, etc.) are created in Tasks 6–12. For now the file won't compile — that's fine until those tasks are done.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/ShowTabNav.tsx"
git commit -m "feat: add ShowTabNav component for show detail page"
```

---

## Task 6: Overview Tab

**Files:**
- Create: `app/(admin)/admin/events/[slug]/tabs/OverviewTab.tsx`

The Overview tab shows: public URL, quick stats, quick-action cards, and (admin-only) the Show Staff Manager placeholder.

- [ ] **Step 1: Create OverviewTab**

```typescript
// app/(admin)/admin/events/[slug]/tabs/OverviewTab.tsx
import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string; slug: string; status: string; event_type: string }
  slug: string
  role: StaffRole
  performancesData: { id: string; type: string }[] | null
  membersData: { id: string }[] | null
}

export default function OverviewTab({ show, slug, role, performancesData, membersData }: Props) {
  const publicPath = `/shows/${slug}`
  const performanceCount = (performancesData ?? []).filter(p => p.type === 'performance').length
  const memberCount = (membersData ?? []).length

  const quickLinks = [
    { label: 'Communications', href: `/admin/events/${slug}/communications`, cta: 'Send Email →' },
    { label: 'Playbill Bios',  href: `/admin/events/${slug}/bios`,           cta: 'View Bios →' },
    { label: 'Waivers',        href: `/admin/events/${slug}/waivers`,         cta: 'View Signatures →' },
    { label: 'Fee Orders',     href: `/admin/events/${slug}/fees`,            cta: 'View Orders →' },
  ]

  return (
    <div>
      {/* Public URL */}
      <div style={{
        background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
        padding: '16px 20px', marginBottom: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Public Event URL
          </span>
          <p style={{ fontSize: '0.85rem', color: 'var(--warm-white)', marginTop: '4px' }}>{publicPath}</p>
        </div>
        <Link href={publicPath} target="_blank" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Preview →
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Cast & Crew', value: memberCount },
          { label: 'Performances', value: performanceCount },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            padding: '20px 24px',
          }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: '1.6rem', fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick-action links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px',
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            textDecoration: 'none',
          }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {link.label}
            </p>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>{link.cta}</span>
          </Link>
        ))}
      </div>

      {/* Show Staff section — admin only, implemented in Task 7 */}
      {role === 'admin' && (
        <div style={{ marginTop: '16px' }}>
          {/* ShowStaffManager inserted here in Task 7 */}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/tabs/OverviewTab.tsx"
git commit -m "feat: add Overview tab for show detail page"
```

---

## Task 7: Show Staff Manager (Admin-Only)

**Files:**
- Create: `app/(admin)/admin/events/[slug]/staff-actions.ts`
- Create: `app/(admin)/admin/events/[slug]/ShowStaffManager.tsx`
- Modify: `app/(admin)/admin/events/[slug]/tabs/OverviewTab.tsx`
- Modify: `app/(admin)/admin/events/[slug]/page.tsx`

This gives admins a UI to assign directors and production managers to a show.

- [ ] **Step 1: Create server actions**

```typescript
// app/(admin)/admin/events/[slug]/staff-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addShowStaff(showId: string, adminUserId: string, role: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: caller } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (caller?.role !== 'admin') throw new Error('Unauthorized')

  const { error } = await supabase
    .from('show_staff')
    .insert({ show_id: showId, admin_user_id: adminUserId, role })
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/events/${slug}`)
}

export async function removeShowStaff(staffId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: caller } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (caller?.role !== 'admin') throw new Error('Unauthorized')

  const { error } = await supabase.from('show_staff').delete().eq('id', staffId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/events/${slug}`)
}
```

- [ ] **Step 2: Create ShowStaffManager component**

```typescript
// app/(admin)/admin/events/[slug]/ShowStaffManager.tsx
'use client'

import { useTransition, useState } from 'react'
import { addShowStaff, removeShowStaff } from './staff-actions'

interface StaffMember {
  id: string
  role: string
  admin_users: { id: string; email: string }
}

interface AvailableStaff {
  id: string
  email: string
  role: string
}

interface Props {
  showId: string
  slug: string
  currentStaff: StaffMember[]
  availableStaff: AvailableStaff[] // director/PM admin_users not yet assigned
}

export default function ShowStaffManager({ showId, slug, currentStaff, availableStaff }: Props) {
  const [pending, startTransition] = useTransition()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'director' | 'production_manager'>('director')
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    if (!selectedUserId) return
    setError(null)
    startTransition(async () => {
      try {
        await addShowStaff(showId, selectedUserId, selectedRole, slug)
        setSelectedUserId('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to add staff')
      }
    })
  }

  function handleRemove(staffId: string) {
    startTransition(async () => {
      await removeShowStaff(staffId, slug)
    })
  }

  const LABEL: Record<string, string> = {
    director: 'Director',
    production_manager: 'Production Manager',
  }

  return (
    <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px' }}>
      <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
        Show Staff
      </p>

      {/* Current assignments */}
      {currentStaff.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentStaff.map(member => (
            <div key={member.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>{member.admin_users.email}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginLeft: '12px' }}>
                  {LABEL[member.role] ?? member.role}
                </span>
              </div>
              <button
                onClick={() => handleRemove(member.id)}
                disabled={pending}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.1em',
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add staff */}
      {availableStaff.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            style={{
              flex: 1, minWidth: '180px', padding: '8px 10px',
              background: 'var(--ink)', border: '1px solid var(--border)',
              borderRadius: '2px', color: 'var(--warm-white)', fontSize: '0.8rem',
            }}
          >
            <option value="">Select staff member</option>
            {availableStaff.map(s => (
              <option key={s.id} value={s.id}>{s.email}</option>
            ))}
          </select>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value as 'director' | 'production_manager')}
            style={{
              padding: '8px 10px',
              background: 'var(--ink)', border: '1px solid var(--border)',
              borderRadius: '2px', color: 'var(--warm-white)', fontSize: '0.8rem',
            }}
          >
            <option value="director">Director</option>
            <option value="production_manager">Production Manager</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={pending || !selectedUserId}
            className="btn-primary"
            style={{ fontSize: '0.72rem' }}
          >
            <span>Add</span>
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--rose)', marginTop: '8px' }}>{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Wire ShowStaffManager into OverviewTab**

In `OverviewTab.tsx`, add the staff data to props and render ShowStaffManager:

```typescript
// Add to Props interface:
staffAssignments: { id: string; role: string; admin_users: { id: string; email: string } }[]
availableDirectorStaff: { id: string; email: string; role: string }[]

// Replace the admin-only placeholder in the return:
{role === 'admin' && (
  <ShowStaffManager
    showId={show.id}
    slug={slug}
    currentStaff={staffAssignments}
    availableStaff={availableDirectorStaff}
  />
)}
```

- [ ] **Step 4: Fetch show_staff data in page.tsx**

In the main page data-fetching block, add:

```typescript
// Add to the Promise.all:
supabase
  .from('show_staff')
  .select('id, role, admin_users(id, email)')
  .eq('show_id', show.id),

// Get all director/PM admin_users not yet assigned to this show
supabase
  .from('admin_users')
  .select('id, email, role')
  .in('role', ['director', 'production_manager']),
```

Then filter out already-assigned ones before passing to the component:

```typescript
const assignedIds = new Set((staffData ?? []).map(s => s.admin_users.id))
const availableStaff = (allStaff ?? []).filter(s => !assignedIds.has(s.id))
```

Pass to OverviewTab:
```typescript
{activeTab === 'overview' && (
  <OverviewTab
    show={show}
    slug={slug}
    role={role}
    performancesData={performancesData}
    membersData={membersData}
    staffAssignments={staffData ?? []}
    availableDirectorStaff={availableStaff}
  />
)}
```

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/staff-actions.ts" \
        "app/(admin)/admin/events/[slug]/ShowStaffManager.tsx" \
        "app/(admin)/admin/events/[slug]/tabs/OverviewTab.tsx" \
        "app/(admin)/admin/events/[slug]/page.tsx"
git commit -m "feat: show staff assignment UI in overview tab (admin only)"
```

---

## Task 8: Details Tab — Role-Aware EventDetailsManager

**Files:**
- Create: `app/(admin)/admin/events/[slug]/tabs/DetailsTab.tsx`
- Modify: `app/(admin)/admin/events/[slug]/EventDetailsManager.tsx`

Director can only edit `start_date`, `end_date`, `venue_id`. Everything else is read-only for director and PM.

- [ ] **Step 1: Add `role` prop to EventDetailsManager**

In `EventDetailsManager.tsx`, update the `Props` type and function signature:

```typescript
// Add to Props type (line 87):
  role: import('@/lib/staff').StaffRole

// Update function signature (line 117):
export default function EventDetailsManager({ showId, slug, show, venues, parentShows, role }: Props) {
```

- [ ] **Step 2: Add read-only helpers inside EventDetailsManager**

After the opening of the function body, add:

```typescript
  const isAdmin = role === 'admin'
  const isDirector = role === 'director'
  // Fields a director can edit
  const directorEditable = (field: string) => isDirector && ['start_date', 'end_date', 'venue_id'].includes(field)
  // Whether a field is editable at all
  const canEdit = (field: string) => isAdmin || directorEditable(field)
```

- [ ] **Step 3: Apply read-only to individual fields**

For each form field in EventDetailsManager, wrap or disable based on `canEdit()`. Example for the date fields:

```typescript
// start_date input — editable for admin + director
<input
  type="date"
  value={startDate}
  onChange={e => setStartDate(e.target.value)}
  disabled={!canEdit('start_date')}
  style={{ /* existing styles */, opacity: canEdit('start_date') ? 1 : 0.5, cursor: canEdit('start_date') ? 'text' : 'not-allowed' }}
/>

// Example for a field only admin can edit (e.g., featured toggle):
<input
  type="checkbox"
  checked={featured}
  onChange={e => setFeatured(e.target.checked)}
  disabled={!canEdit('featured')}
/>
```

Apply `disabled={!canEdit('fieldName')}` to every input, select, textarea, and button in the component. For the submit button, disable if no editable fields: `disabled={isPending || (!isAdmin && !isDirector)}`.

- [ ] **Step 4: Create DetailsTab**

```typescript
// app/(admin)/admin/events/[slug]/tabs/DetailsTab.tsx
import EventDetailsManager from '../EventDetailsManager'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: Parameters<typeof EventDetailsManager>[0]['show'] & { id: string; slug: string }
  slug: string
  role: StaffRole
  venuesData: Parameters<typeof EventDetailsManager>[0]['venues']
  parentShowsData: Parameters<typeof EventDetailsManager>[0]['parentShows']
}

export default function DetailsTab({ show, slug, role, venuesData, parentShowsData }: Props) {
  return (
    <EventDetailsManager
      showId={show.id}
      slug={slug}
      show={show}
      venues={venuesData}
      parentShows={parentShowsData}
      role={role}
    />
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/EventDetailsManager.tsx" \
        "app/(admin)/admin/events/[slug]/tabs/DetailsTab.tsx"
git commit -m "feat: role-aware Details tab (director edits dates + venue only)"
```

---

## Task 9: Schedule & Tickets Tab

**Files:**
- Create: `app/(admin)/admin/events/[slug]/tabs/ScheduleTab.tsx`
- Modify: `app/(admin)/admin/events/[slug]/PerformancesManager.tsx`
- Modify: `app/(admin)/admin/events/[slug]/TicketManager.tsx`

Director and PM get read-only views (no add/edit/delete actions).

- [ ] **Step 1: Add `readOnly` prop to PerformancesManager**

```typescript
// In PerformancesManager.tsx, add to props:
readOnly?: boolean

// Hide action buttons when readOnly:
{!readOnly && (
  <button onClick={...}>Add Performance</button>
)}
// Similarly, hide edit/delete controls within each row when readOnly is true
```

- [ ] **Step 2: Add `readOnly` prop to TicketManager**

```typescript
// In TicketManager.tsx, add to props:
readOnly?: boolean

// Hide ticket config forms and save buttons when readOnly:
{!readOnly && (
  // ...ticket price/capacity inputs and save button
)}
```

- [ ] **Step 3: Create ScheduleTab**

```typescript
// app/(admin)/admin/events/[slug]/tabs/ScheduleTab.tsx
import PerformancesManager from '../PerformancesManager'
import TicketManager from '../TicketManager'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string; event_type: string }
  slug: string
  role: StaffRole
  performancesData: { id: string; type: string; date: string; start_time: string; label: string | null }[]
  ticketConfigData: { show_performance_id: string; capacity: number; price: number; sales_enabled: boolean }[]
}

export default function ScheduleTab({ show, slug, role, performancesData, ticketConfigData }: Props) {
  const readOnly = role !== 'admin'

  return (
    <div>
      <PerformancesManager
        showId={show.id}
        slug={slug}
        performances={performancesData}
        eventType={show.event_type}
        readOnly={readOnly}
      />
      <TicketManager
        showId={show.id}
        slug={slug}
        performances={performancesData.filter(p => p.type === 'performance')}
        ticketConfig={ticketConfigData}
        readOnly={readOnly}
      />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/PerformancesManager.tsx" \
        "app/(admin)/admin/events/[slug]/TicketManager.tsx" \
        "app/(admin)/admin/events/[slug]/tabs/ScheduleTab.tsx"
git commit -m "feat: Schedule & Tickets tab with read-only for director/PM"
```

---

## Task 10: Cast & Crew Tab

**Files:**
- Create: `app/(admin)/admin/events/[slug]/tabs/PeopleTab.tsx`

Everyone has full edit on roster. No role controls needed.

- [ ] **Step 1: Create PeopleTab**

```typescript
// app/(admin)/admin/events/[slug]/tabs/PeopleTab.tsx
import RosterManager from '../RosterManager'
import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string }
  slug: string
  role: StaffRole
  membersData: { id: string; show_role: string; families: { parent_name: string; email: string } }[]
}

export default function PeopleTab({ show, slug, membersData }: Props) {
  return (
    <div>
      <RosterManager
        showId={show.id}
        slug={slug}
        members={membersData as unknown as Parameters<typeof RosterManager>[0]['members']}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
        <Link
          href={`/admin/events/${slug}/bios`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px',
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Playbill Bios
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View Bios →</span>
        </Link>

        <Link
          href={`/admin/events/${slug}/communications`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px',
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Communications
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>Send Email →</span>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/tabs/PeopleTab.tsx"
git commit -m "feat: Cast & Crew tab (full edit for all roles)"
```

---

## Task 11: Finances Tab

**Files:**
- Create: `app/(admin)/admin/events/[slug]/tabs/FinancesTab.tsx`
- Modify: `app/(admin)/admin/events/[slug]/FeesManager.tsx`

Admin: full edit. Director: coupon codes only. PM: read-only.

- [ ] **Step 1: Add `role` prop to FeesManager**

In `FeesManager.tsx`:

```typescript
// Add to FeesManagerProps interface:
  role: import('@/lib/staff').StaffRole

// Update function signature:
export default function FeesManager({ showId, slug, eventType, config, coupons, role }: FeesManagerProps) {
  const isAdmin = role === 'admin'
  const isDirector = role === 'director'
```

- [ ] **Step 2: Apply role controls in FeesManager**

```typescript
// Fee config section (tuition, shirt price, fees_enabled toggle)
// Wrap the entire fee config form section:
{isAdmin ? (
  // existing fee config form (unchanged)
  <form>...</form>
) : (
  // Read-only display of fee config
  <div style={{ opacity: 0.6 }}>
    <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
      Fees Enabled: {config?.fees_enabled ? 'Yes' : 'No'}
    </p>
    {config?.tuition_amount && (
      <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        Tuition: ${config.tuition_amount}
      </p>
    )}
    {config?.shirt_price && (
      <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        Shirt: ${config.shirt_price}
      </p>
    )}
  </div>
)}

// Coupon codes section
// Admin and director can add coupons:
{(isAdmin || isDirector) ? (
  // existing coupon form (unchanged)
  <form>...</form>
) : (
  // PM: read-only coupon list, no add/remove
  <div>
    {coupons.map(c => (
      <p key={c.id} style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        {c.code} {c.used_by_family_id ? '(used)' : '(available)'}
      </p>
    ))}
  </div>
)}

// Remove coupon button: only show for admin and director
{(isAdmin || isDirector) && (
  <button onClick={() => handleRemoveCoupon(coupon.id)}>Remove</button>
)}
```

- [ ] **Step 3: Create FinancesTab**

```typescript
// app/(admin)/admin/events/[slug]/tabs/FinancesTab.tsx
import FeesManager from '../FeesManager'
import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string; event_type: string }
  slug: string
  role: StaffRole
  feesConfigData: { shirt_price: number | null; tuition_amount: number | null; fees_enabled: boolean } | null
  couponsData: { id: string; code: string; waive_tuition: boolean; waive_shirts: boolean; used_by_family_id: string | null }[]
}

export default function FinancesTab({ show, slug, role, feesConfigData, couponsData }: Props) {
  return (
    <div>
      <FeesManager
        showId={show.id}
        slug={slug}
        eventType={show.event_type}
        config={feesConfigData ?? null}
        coupons={couponsData}
        role={role}
      />

      <div style={{ marginTop: '16px' }}>
        <Link
          href={`/admin/events/${slug}/fees`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px',
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Fee Orders
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View Orders →</span>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/FeesManager.tsx" \
        "app/(admin)/admin/events/[slug]/tabs/FinancesTab.tsx"
git commit -m "feat: Finances tab with role controls (director gets coupons only)"
```

---

## Task 12: Comms & Waivers Tab + Final Page Assembly

**Files:**
- Create: `app/(admin)/admin/events/[slug]/tabs/CommsTab.tsx`
- Modify: `app/(admin)/admin/events/[slug]/page.tsx`

- [ ] **Step 1: Create CommsTab**

```typescript
// app/(admin)/admin/events/[slug]/tabs/CommsTab.tsx
import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string }
  slug: string
  role: StaffRole
}

export default function CommsTab({ slug, role }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

      <Link
        href={`/admin/events/${slug}/waivers`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
          textDecoration: 'none',
        }}
      >
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Waivers
        </p>
        <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>
          {role === 'admin' ? 'Manage Signatures →' : 'View Signatures →'}
        </span>
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Assemble all tab imports in page.tsx**

At the top of `page.tsx`, add imports for all tab components:

```typescript
import OverviewTab  from './tabs/OverviewTab'
import DetailsTab   from './tabs/DetailsTab'
import ScheduleTab  from './tabs/ScheduleTab'
import PeopleTab    from './tabs/PeopleTab'
import FinancesTab  from './tabs/FinancesTab'
import CommsTab     from './tabs/CommsTab'
```

Replace the show-type JSX with the fully-wired tab routing:

```typescript
{activeTab === 'overview' && (
  <OverviewTab
    show={{ id: show.id, slug, status: show.status, event_type: show.event_type ?? 'show' }}
    slug={slug}
    role={role}
    performancesData={performancesData}
    membersData={membersData}
    staffAssignments={staffData ?? []}
    availableDirectorStaff={availableStaff}
  />
)}
{activeTab === 'details' && (
  <DetailsTab
    show={{ ...detailsShowProps, id: show.id, slug }}
    slug={slug}
    role={role}
    venuesData={venuesData ?? []}
    parentShowsData={parentShowsData ?? []}
  />
)}
{activeTab === 'schedule' && (
  <ScheduleTab
    show={{ id: show.id, event_type: show.event_type ?? 'show' }}
    slug={slug}
    role={role}
    performancesData={performancesData ?? []}
    ticketConfigData={ticketConfigData ?? []}
  />
)}
{activeTab === 'people' && (
  <PeopleTab
    show={{ id: show.id }}
    slug={slug}
    role={role}
    membersData={(membersData ?? []) as Parameters<typeof PeopleTab>[0]['membersData']}
  />
)}
{activeTab === 'finances' && (
  <FinancesTab
    show={{ id: show.id, event_type: show.event_type ?? 'show' }}
    slug={slug}
    role={role}
    feesConfigData={feesConfigData}
    couponsData={(couponsData ?? []) as Parameters<typeof FinancesTab>[0]['couponsData']}
  />
)}
{activeTab === 'comms' && (
  <CommsTab
    show={{ id: show.id }}
    slug={slug}
    role={role}
  />
)}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors before committing.

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/events/[slug]/tabs/CommsTab.tsx" \
        "app/(admin)/admin/events/[slug]/page.tsx"
git commit -m "feat: complete tabbed show detail page with role-aware content"
```

---

## Self-Review

**Spec coverage check:**
- [x] Remove `executive_director` and `stage_manager` roles → Task 1
- [x] Add `production_manager` role → Task 1
- [x] Per-show director/PM assignment via `show_staff` → Tasks 1, 7
- [x] Admin layout role-aware nav → Tasks 2, 3
- [x] Events list filtered for director/PM → Task 4
- [x] Show detail redirect if no access → Task 5
- [x] Tabbed layout for show detail → Tasks 5–12
- [x] Details: admin full, director dates+venue, PM read-only → Task 8
- [x] Schedule & Tickets: admin full, others read-only → Task 9
- [x] Cast & Crew: full for all → Task 10
- [x] Finances: admin full, director coupons, PM read-only → Task 11
- [x] Comms & Waivers: full for all (waivers label differs by role) → Task 12

**Out of scope for this plan:**
- Waivers sub-page role enforcement (currently just a link — enforce read-only inside that page in a follow-up)
- Tabs for audition/camp/workshop event types (flat layout unchanged)
- Admin UI for creating new director/PM users (done via existing /admin/users invite flow)
