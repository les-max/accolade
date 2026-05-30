# Ticket Coupon Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins create per-show coupon codes that give buyers a % or fixed $ discount on ticket checkout. Buyers enter the code in the checkout form; the discount is validated server-side, applied as a negative Stripe line item, and recorded on the order.

**Architecture:**
- Extend `show_coupon_codes` (already exists for fees coupons) with `discount_type`, `discount_value`, `max_uses`, `use_count`, and `ticket_coupons_enabled` flag. The fees coupons are untouched — they use the `waive_tuition`/`waive_shirts` columns which remain.
- Add `coupon_code_id` and `discount_amount` to `ticket_orders`.
- New server action `validateTicketCoupon` is public (service client only, no auth). Add/delete actions require auth.
- Checkout API: accept `coupon_code` string in body, validate coupon, cap discount so Stripe total >= $0.50, add negative line item, increment `use_count` after session is created.
- Admin `TicketCouponManager` component lives in the Tickets tab below `TicketOptionManager`.
- CSV export gains two new columns: Coupon Code, Discount.

**Tech Stack:** Next.js App Router, Supabase (service + auth clients), Stripe, TypeScript, inline `style={{}}` objects, CSS vars (`--teal`, `--gold`, `--rose`, `--muted`, `--border`, `--warm-white`, `--layer`, `--deep`).

---

## Task 1 — Database migration

**Files:** Create `supabase/migrations/034_ticket_coupons.sql`

- [ ] Create the file with the SQL below.
- [ ] **MANUAL STEP: Go to Supabase dashboard > SQL Editor and run this file's contents.**

```sql
-- 034_ticket_coupons.sql
-- Extend show_coupon_codes for ticket discounts (fees columns are untouched)
ALTER TABLE show_coupon_codes
  ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percent', 'amount')),
  ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS max_uses INTEGER,           -- NULL = unlimited
  ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;

-- Add coupon tracking to ticket_orders
ALTER TABLE ticket_orders
  ADD COLUMN IF NOT EXISTS coupon_code_id UUID REFERENCES show_coupon_codes(id),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
```

- [ ] Commit: `git add supabase/migrations/034_ticket_coupons.sql && git commit -m "feat: migration 034 — ticket coupon discount columns"`

---

## Task 2 — Server actions

**Files:** Modify `app/(admin)/admin/events/[slug]/ticket-actions.ts`

- [ ] Add three exports at the bottom of the existing file: `validateTicketCoupon`, `addTicketCoupon`, `deleteTicketCoupon`.

The complete updated file (preserve all existing exports, append below `deleteTicketOption`):

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

type TicketRow = {
  show_performance_id: string
  capacity: number
  price: number
  sales_enabled: boolean
}

export async function upsertTicketPerformances(showId: string, slug: string, rows: TicketRow[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (rows.length === 0) return

  const { error } = await supabase.from('ticket_performances').upsert(
    rows.map(r => ({
      show_performance_id: r.show_performance_id,
      capacity: r.capacity,
      price: r.price,
      sales_enabled: r.sales_enabled,
    })),
    { onConflict: 'show_performance_id' }
  )

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
  revalidatePath('/tickets')

  void showId
}

export async function saveTicketOptionGroup(
  ticketPerformanceId: string,
  name: string,
  slug: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ticket_option_groups')
    .insert({ ticket_performance_id: ticketPerformanceId, name: name.trim() })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteTicketOptionGroup(groupId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ticket_option_groups')
    .delete()
    .eq('id', groupId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function saveTicketOption(
  groupId: string,
  name: string,
  sortOrder: number,
  slug: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ticket_options')
    .insert({ group_id: groupId, name: name.trim(), sort_order: sortOrder })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteTicketOption(optionId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ticket_options')
    .delete()
    .eq('id', optionId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

// ---------------------------------------------------------------------------
// Ticket coupon actions
// ---------------------------------------------------------------------------

export type TicketCouponRow = {
  id: string
  code: string
  discount_type: 'percent' | 'amount'
  discount_value: number
  max_uses: number | null
  use_count: number
}

/**
 * Public action — no auth required. Used by the checkout form to preview the
 * discount before the buyer submits. Does NOT increment use_count.
 */
export async function validateTicketCoupon(
  showId: string,
  code: string
): Promise<{ valid: true; coupon: TicketCouponRow } | { valid: false; error: string }> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('show_coupon_codes')
    .select('id, code, discount_type, discount_value, max_uses, use_count')
    .eq('show_id', showId)
    .ilike('code', code.trim())
    .not('discount_type', 'is', null)
    .maybeSingle()

  if (error) return { valid: false, error: 'Error checking coupon' }
  if (!data) return { valid: false, error: 'Invalid coupon code' }

  if (data.max_uses !== null && data.use_count >= data.max_uses) {
    return { valid: false, error: 'This coupon has reached its usage limit' }
  }

  return {
    valid: true,
    coupon: {
      id: data.id,
      code: data.code,
      discount_type: data.discount_type as 'percent' | 'amount',
      discount_value: data.discount_value,
      max_uses: data.max_uses,
      use_count: data.use_count,
    },
  }
}

export async function addTicketCoupon(
  showId: string,
  slug: string,
  code: string,
  discountType: 'percent' | 'amount',
  discountValue: number,
  maxUses: number | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { error } = await service
    .from('show_coupon_codes')
    .insert({
      show_id: showId,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses,
      use_count: 0,
      // fees columns default to false, untouched
      waive_tuition: false,
      waive_shirts: false,
    })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteTicketCoupon(couponId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { error } = await service
    .from('show_coupon_codes')
    .delete()
    .eq('id', couponId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}
```

- [ ] Commit: `git add app/\(admin\)/admin/events/\[slug\]/ticket-actions.ts && git commit -m "feat: add ticket coupon server actions (validate, add, delete)"`

---

## Task 3 — TicketCouponManager component (new file)

**Files:** Create `app/(admin)/admin/events/[slug]/TicketCouponManager.tsx`

```typescript
'use client'

import { useState, useTransition } from 'react'
import { addTicketCoupon, deleteTicketCoupon, type TicketCouponRow } from './ticket-actions'

interface Props {
  showId: string
  slug: string
  coupons: TicketCouponRow[]
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '8px 12px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

export default function TicketCouponManager({ showId, slug, coupons }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [maxUses, setMaxUses] = useState('')

  function handleAdd() {
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) { setError('Code is required'); return }
    const value = parseFloat(discountValue)
    if (isNaN(value) || value <= 0) { setError('Discount value must be a positive number'); return }
    if (discountType === 'percent' && value > 100) { setError('Percent discount cannot exceed 100'); return }
    const uses = maxUses.trim() === '' ? null : parseInt(maxUses)
    if (maxUses.trim() !== '' && (isNaN(uses!) || uses! < 1)) { setError('Max uses must be a positive integer or blank for unlimited'); return }

    setError('')
    startTransition(async () => {
      try {
        await addTicketCoupon(showId, slug, trimmedCode, discountType, value, uses ?? null)
        setCode('')
        setDiscountValue('')
        setMaxUses('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error saving coupon')
      }
    })
  }

  function handleDelete(couponId: string) {
    setError('')
    startTransition(async () => {
      try {
        await deleteTicketCoupon(couponId, slug)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting coupon')
      }
    })
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div
        style={{
          background: 'var(--layer)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Ticket Coupon Codes
          </p>
        </div>

        {/* Add form */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: coupons.length > 0 ? '1px solid var(--border)' : 'none',
            display: 'grid',
            gridTemplateColumns: '1fr 130px 130px 100px auto',
            gap: '10px',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Code
            </label>
            <input
              type="text"
              placeholder="e.g. OPENING20"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              disabled={isPending}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Type
            </label>
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as 'percent' | 'amount')}
              disabled={isPending}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="percent">% off</option>
              <option value="amount">$ off</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Value
            </label>
            <input
              type="number"
              min="0.01"
              step={discountType === 'percent' ? '1' : '0.01'}
              placeholder={discountType === 'percent' ? '10' : '5.00'}
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              disabled={isPending}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Max Uses
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="∞"
              value={maxUses}
              onChange={e => setMaxUses(e.target.value)}
              disabled={isPending}
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !code.trim() || !discountValue.trim()}
            style={{
              padding: '8px 16px',
              background: 'rgba(61,158,140,0.15)',
              border: '1px solid rgba(61,158,140,0.3)',
              borderRadius: '2px',
              color: 'var(--teal)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              opacity: isPending || !code.trim() || !discountValue.trim() ? 0.5 : 1,
            }}
          >
            Add
          </button>
        </div>

        {/* Existing coupons */}
        {coupons.length > 0 && (
          <div>
            {coupons.map((c, i) => (
              <div
                key={c.id}
                style={{
                  padding: '12px 24px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      color: 'var(--warm-white)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {c.code}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--gold)' }}>
                    {c.discount_type === 'percent'
                      ? `${c.discount_value}% off`
                      : `$${c.discount_value.toFixed(2)} off`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {c.use_count} used
                    {c.max_uses !== null ? ` / ${c.max_uses} max` : ' (unlimited)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={isPending}
                  style={{
                    padding: '4px 12px',
                    background: 'transparent',
                    border: '1px solid rgba(224,112,112,0.3)',
                    borderRadius: '2px',
                    color: 'var(--rose, #e07070)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--border)',
              color: '#e07070',
              fontSize: '0.82rem',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] Commit: `git add "app/(admin)/admin/events/[slug]/TicketCouponManager.tsx" && git commit -m "feat: TicketCouponManager admin component"`

---

## Task 4 — Admin page: fetch ticket coupons and pass to TicketsTab

**Files:** Modify `app/(admin)/admin/events/[slug]/page.tsx`

Two changes needed:

**Change 1:** Add ticket coupon fetch to the `Promise.all` block (line 58–63). The existing block fetches `ticketConfigData` and `linkedAuditionShows`. Add a third fetch:

Replace this:
```typescript
  const [{ data: ticketConfigData }, { data: linkedAuditionShows }] = await Promise.all([
    showPerformanceIds.length > 0
      ? supabase.from('ticket_performances').select('id, show_performance_id, capacity, price, sales_enabled, ticket_option_groups ( id, name, required, sort_order, ticket_options ( id, name, sort_order ) )').in('show_performance_id', showPerformanceIds)
      : Promise.resolve({ data: [] }),
    supabase.from('shows').select('id').eq('parent_show_id', show.id).eq('event_type', 'audition'),
  ])
```

With this:
```typescript
  const [{ data: ticketConfigData }, { data: linkedAuditionShows }, { data: ticketCouponsData }] = await Promise.all([
    showPerformanceIds.length > 0
      ? supabase.from('ticket_performances').select('id, show_performance_id, capacity, price, sales_enabled, ticket_option_groups ( id, name, required, sort_order, ticket_options ( id, name, sort_order ) )').in('show_performance_id', showPerformanceIds)
      : Promise.resolve({ data: [] }),
    supabase.from('shows').select('id').eq('parent_show_id', show.id).eq('event_type', 'audition'),
    supabase.from('show_coupon_codes')
      .select('id, code, discount_type, discount_value, max_uses, use_count')
      .eq('show_id', show.id)
      .not('discount_type', 'is', null)
      .order('created_at'),
  ])
```

**Change 2:** Pass `ticketCouponsData` to `TicketsTab` in the JSX (around line 215–223):

Replace this:
```typescript
        {activeTab === 'tickets' && (
          <TicketsTab
            show={{ id: show.id }}
            slug={slug}
            role={role}
            performancesData={performancesData ?? []}
            ticketConfigData={(ticketConfigData ?? []) as any}
          />
        )}
```

With this:
```typescript
        {activeTab === 'tickets' && (
          <TicketsTab
            show={{ id: show.id }}
            slug={slug}
            role={role}
            performancesData={performancesData ?? []}
            ticketConfigData={(ticketConfigData ?? []) as any}
            ticketCouponsData={(ticketCouponsData ?? []) as any}
          />
        )}
```

- [ ] Commit: `git add "app/(admin)/admin/events/[slug]/page.tsx" && git commit -m "feat: fetch and pass ticket coupons data to TicketsTab"`

---

## Task 5 — TicketsTab: accept and render TicketCouponManager

**Files:** Modify `app/(admin)/admin/events/[slug]/tabs/TicketsTab.tsx`

Complete updated file:

```typescript
import TicketManager from '../TicketManager'
import TicketOptionManager, { type OptionGroup } from '../TicketOptionManager'
import TicketCouponManager, { type TicketCouponRow } from '../TicketCouponManager'
import type { StaffRole } from '@/lib/staff'

type TicketConfigRow = {
  id: string
  show_performance_id: string
  capacity: number
  price: number
  sales_enabled: boolean
  ticket_option_groups: OptionGroup[]
}

interface Props {
  show: { id: string }
  slug: string
  role: StaffRole
  performancesData: { id: string; type: string; date: string; start_time: string | null; label: string | null }[]
  ticketConfigData: TicketConfigRow[]
  ticketCouponsData: TicketCouponRow[]
}

export default function TicketsTab({ show, slug, role, performancesData, ticketConfigData, ticketCouponsData }: Props) {
  const perfPerformances = performancesData.filter(p => p.type === 'performance')

  // Build the list of performances that have a ticket_performance record, with their option groups
  const configByShowPerfId = Object.fromEntries(ticketConfigData.map(t => [t.show_performance_id, t]))

  const perfsWithOptions = perfPerformances
    .filter(p => configByShowPerfId[p.id])
    .map(p => {
      const config = configByShowPerfId[p.id]
      return {
        ticketPerformanceId: config.id,
        date: p.date,
        start_time: p.start_time,
        label: p.label,
        groups: config.ticket_option_groups ?? [],
      }
    })

  const hasOrders = ticketConfigData.length > 0

  return (
    <>
      {role === 'admin' && hasOrders && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <a
            href={`/api/tickets/export?showId=${show.id}`}
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--teal)',
              border: '1px solid rgba(61,158,140,0.3)',
              borderRadius: '2px',
              padding: '8px 16px',
              textDecoration: 'none',
            }}
          >
            Download CSV
          </a>
        </div>
      )}
      <TicketManager
        showId={show.id}
        slug={slug}
        performances={perfPerformances}
        ticketConfig={ticketConfigData}
        readOnly={role !== 'admin'}
      />
      {role === 'admin' && perfsWithOptions.length > 0 && (
        <TicketOptionManager slug={slug} performances={perfsWithOptions} />
      )}
      {role === 'admin' && (
        <TicketCouponManager
          showId={show.id}
          slug={slug}
          coupons={ticketCouponsData}
        />
      )}
    </>
  )
}
```

Note: `TicketCouponManager` also needs to export `TicketCouponRow`. Add this to the top of `TicketCouponManager.tsx`:

```typescript
export type { TicketCouponRow } from './ticket-actions'
```

Replace the `import` line at the top of `TicketCouponManager.tsx` with:

```typescript
import { addTicketCoupon, deleteTicketCoupon, type TicketCouponRow } from './ticket-actions'
export type { TicketCouponRow }
```

- [ ] Commit: `git add "app/(admin)/admin/events/[slug]/tabs/TicketsTab.tsx" "app/(admin)/admin/events/[slug]/TicketCouponManager.tsx" && git commit -m "feat: render TicketCouponManager in TicketsTab"`

---

## Task 6 — Public tickets page: pass showId to TicketCheckoutForm

**Files:** Modify `app/(public)/tickets/page.tsx`

Find the line that renders `TicketCheckoutForm` (inside the `show.ticketPerformances.length > 0` branch):

```typescript
                        <TicketCheckoutForm performances={show.ticketPerformances} />
```

Replace with:

```typescript
                        <TicketCheckoutForm showId={show.id} performances={show.ticketPerformances} />
```

- [ ] Commit: `git add "app/(public)/tickets/page.tsx" && git commit -m "feat: pass showId to TicketCheckoutForm for coupon validation"`

---

## Task 7 — TicketCheckoutForm: coupon input and discount display

**Files:** Modify `app/(public)/tickets/TicketCheckoutForm.tsx`

Complete updated file:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { validateTicketCoupon, type TicketCouponRow } from '@/app/(admin)/admin/events/[slug]/ticket-actions'

type OptionGroup = {
  id: string
  name: string
  required: boolean
  options: { id: string; name: string }[]
}

type TicketPerf = {
  id: string
  price: number
  capacity: number
  available: number
  date: string
  start_time: string | null
  label: string | null
  optionGroups: OptionGroup[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '4px',
  padding: '12px 16px',
  color: '#e8e4dc',
  fontSize: '1rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const stepperBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '32px',
  height: '32px',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '4px',
  background: 'rgba(255,255,255,0.04)',
  color: disabled ? '#3a3850' : '#e8e4dc',
  fontSize: '1.2rem',
  lineHeight: 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

export default function TicketCheckoutForm({
  showId,
  performances,
}: {
  showId: string
  performances: TicketPerf[]
}) {
  const router = useRouter()

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(performances.map(p => [p.id, 0]))
  )
  const [optionQtys, setOptionQtys] = useState<Record<string, Record<string, number>>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<TicketCouponRow | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [isCouponPending, startCouponTransition] = useTransition()

  const selectedItems = performances.filter(p => (quantities[p.id] ?? 0) > 0)
  const subtotal = selectedItems.reduce((sum, p) => sum + (quantities[p.id] ?? 0) * p.price, 0)
  const hasSelection = selectedItems.length > 0
  const totalQty = selectedItems.reduce((sum, p) => sum + (quantities[p.id] ?? 0), 0)

  // Compute discount amount
  function computeDiscount(rawSubtotal: number): number {
    if (!appliedCoupon) return 0
    let discount = 0
    if (appliedCoupon.discount_type === 'percent') {
      discount = rawSubtotal * (appliedCoupon.discount_value / 100)
    } else {
      discount = appliedCoupon.discount_value
    }
    // Cap so Stripe total never goes below $0.50
    return Math.min(discount, Math.max(0, rawSubtotal - 0.5))
  }

  const discountAmount = computeDiscount(subtotal)
  const total = Math.max(0.5, subtotal - discountAmount)

  function optionsValid(): boolean {
    for (const p of selectedItems) {
      for (const group of p.optionGroups) {
        if (!group.required) continue
        const groupTotal = group.options.reduce((sum, opt) => sum + (optionQtys[p.id]?.[opt.id] ?? 0), 0)
        if (groupTotal !== (quantities[p.id] ?? 0)) return false
      }
    }
    return true
  }
  const allOptionsValid = optionsValid()

  function setQty(id: string, n: number) {
    setQuantities(q => ({ ...q, [id]: n }))
  }

  function handleApplyCoupon() {
    if (!couponInput.trim()) return
    setCouponError('')
    setCouponSuccess('')
    startCouponTransition(async () => {
      const result = await validateTicketCoupon(showId, couponInput.trim())
      if (result.valid) {
        setAppliedCoupon(result.coupon)
        setCouponSuccess(`Coupon applied: ${result.coupon.discount_type === 'percent' ? `${result.coupon.discount_value}% off` : `$${result.coupon.discount_value.toFixed(2)} off`}`)
        setCouponError('')
      } else {
        setAppliedCoupon(null)
        setCouponError(result.error)
        setCouponSuccess('')
      }
    })
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
    setCouponSuccess('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasSelection || !name.trim() || !email.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/tickets/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map(p => ({
            ticket_performance_id: p.id,
            quantity: quantities[p.id],
            options: p.optionGroups.flatMap(g =>
              g.options
                .map(opt => ({ ticket_option_id: opt.id, quantity: optionQtys[p.id]?.[opt.id] ?? 0 }))
                .filter(o => o.quantity > 0)
            ),
          })),
          buyer_name: name.trim(),
          buyer_email: email.trim().toLowerCase(),
          coupon_code: appliedCoupon?.code ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      router.push(data.url)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (performances.every(p => p.available === 0)) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#a09db8', fontSize: '1rem' }}>Tickets are sold out. Contact us about group or partner reservations.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* Performance rows with qty steppers */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '12px' }}>
          {performances.length === 1 ? 'Performance' : 'Select Performances'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {performances.map(p => {
            const qty = quantities[p.id] ?? 0
            const isSoldOut = p.available === 0
            const maxQty = Math.min(8, p.available)
            const sold = p.capacity - p.available
            const pctSold = p.capacity > 0 ? sold / p.capacity : 0
            const isSelected = qty > 0
            return (
              <div key={p.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  border: `1px solid ${isSelected ? '#d4a853' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(212,168,83,0.08)' : isSoldOut ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                  opacity: isSoldOut ? 0.5 : 1,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#e8e4dc', fontWeight: isSelected ? 600 : 400 }}>
                    {formatDate(p.date)}
                    {p.start_time && <span style={{ color: '#a09db8', fontWeight: 400 }}> &middot; {formatTime(p.start_time)}</span>}
                  </p>
                  {p.label && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#a09db8' }}>{p.label}</p>}
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: pctSold > 0.8 ? '#e07070' : '#6b6880' }}>
                    {isSoldOut ? 'Sold out' : pctSold > 0.8 ? `${p.available} left · $${p.price.toFixed(2)}` : `$${p.price.toFixed(2)} per ticket`}
                  </p>
                </div>
                {!isSoldOut && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => setQty(p.id, Math.max(0, qty - 1))} disabled={qty === 0} style={stepperBtnStyle(qty === 0)}>−</button>
                    <span style={{ width: '24px', textAlign: 'center', fontSize: '1rem', color: '#e8e4dc', fontWeight: isSelected ? 700 : 400 }}>
                      {qty}
                    </span>
                    <button type="button" onClick={() => setQty(p.id, Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} style={stepperBtnStyle(qty >= maxQty)}>+</button>
                  </div>
                )}
              </div>
              {/* Option groups — shown when this performance has qty selected */}
              {qty > 0 && p.optionGroups.length > 0 && (
                <div style={{ marginTop: '2px' }}>
                  {p.optionGroups.map(group => {
                    const chosen = group.options.reduce((sum, opt) => sum + (optionQtys[p.id]?.[opt.id] ?? 0), 0)
                    const needed = qty
                    const complete = chosen === needed
                    return (
                      <div
                        key={group.id}
                        style={{
                          padding: '12px 20px',
                          border: `1px solid ${complete ? 'rgba(61,158,140,0.3)' : 'rgba(212,168,83,0.3)'}`,
                          borderTop: 'none',
                          borderRadius: '0 0 6px 6px',
                          background: 'rgba(0,0,0,0.15)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <p style={{ margin: 0, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a09db8' }}>
                            {group.name}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: complete ? 'var(--teal, #3d9e8c)' : '#d4a853' }}>
                            {chosen} / {needed} selected
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {group.options.map(opt => {
                            const optQty = optionQtys[p.id]?.[opt.id] ?? 0
                            const remaining = needed - chosen
                            return (
                              <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.88rem', color: '#e8e4dc' }}>{opt.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setOptionQtys(s => ({ ...s, [p.id]: { ...(s[p.id] ?? {}), [opt.id]: Math.max(0, optQty - 1) } }))}
                                    disabled={optQty === 0}
                                    style={stepperBtnStyle(optQty === 0)}
                                  >−</button>
                                  <span style={{ width: '24px', textAlign: 'center', fontSize: '1rem', color: '#e8e4dc' }}>{optQty}</span>
                                  <button
                                    type="button"
                                    onClick={() => setOptionQtys(s => ({ ...s, [p.id]: { ...(s[p.id] ?? {}), [opt.id]: optQty + 1 } }))}
                                    disabled={remaining <= 0}
                                    style={stepperBtnStyle(remaining <= 0)}
                                  >+</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            )
          })}
        </div>
      </div>

      {/* Coupon code input */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '12px' }}>
          Coupon Code
        </p>
        {appliedCoupon ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              border: '1px solid rgba(61,158,140,0.4)',
              borderRadius: '4px',
              background: 'rgba(61,158,140,0.08)',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#3d9e8c' }}>{couponSuccess}</span>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a09db8',
                fontSize: '0.78rem',
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponInput}
              onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
              disabled={isCouponPending}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={isCouponPending || !couponInput.trim()}
              style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px',
                color: '#e8e4dc',
                fontSize: '0.85rem',
                cursor: isCouponPending || !couponInput.trim() ? 'not-allowed' : 'pointer',
                opacity: isCouponPending || !couponInput.trim() ? 0.5 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              Apply
            </button>
          </div>
        )}
        {couponError && (
          <p style={{ margin: '8px 0 0', color: '#e07070', fontSize: '0.8rem' }}>{couponError}</p>
        )}
      </div>

      {/* Buyer info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '8px' }}>
            Your Name
          </label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '8px' }}>
            Email
          </label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
        </div>
      </div>

      {/* Total with optional discount breakdown */}
      {hasSelection && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            {appliedCoupon && discountAmount > 0 && (
              <>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b6880' }}>
                  Subtotal: <span style={{ color: '#a09db8' }}>${subtotal.toFixed(2)}</span>
                </p>
                <p style={{ margin: '2px 0', fontSize: '0.72rem', color: '#3d9e8c' }}>
                  Discount: −${discountAmount.toFixed(2)}
                </p>
              </>
            )}
            <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6880' }}>Total</p>
            <p style={{ margin: '2px 0 0', fontSize: '1.6rem', color: '#d4a853', fontWeight: 700, letterSpacing: '-0.02em' }}>${total.toFixed(2)}</p>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: '#e07070', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !hasSelection || !name.trim() || !email.trim() || !allOptionsValid}
        style={{
          width: '100%',
          padding: '16px',
          background: loading ? 'rgba(212,168,83,0.5)' : '#d4a853',
          color: '#0e0d14',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.9rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: loading ? 'wait' : !hasSelection || !name.trim() || !email.trim() || !allOptionsValid ? 'not-allowed' : 'pointer',
          opacity: !hasSelection || !name.trim() || !email.trim() || !allOptionsValid ? 0.5 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {loading
          ? 'Redirecting to checkout…'
          : hasSelection
            ? `Buy ${totalQty} Ticket${totalQty !== 1 ? 's' : ''} — $${total.toFixed(2)}`
            : 'Select tickets above'}
      </button>

      <p style={{ margin: '16px 0 0', fontSize: '0.75rem', color: '#6b6880', textAlign: 'center', lineHeight: 1.5 }}>
        Secure checkout via Stripe. You&apos;ll receive a confirmation email after purchase.
      </p>
    </form>
  )
}
```

- [ ] Commit: `git add "app/(public)/tickets/TicketCheckoutForm.tsx" && git commit -m "feat: coupon code input and discount display in checkout form"`

---

## Task 8 — Checkout API: validate coupon, apply discount, increment use_count

**Files:** Modify `app/api/tickets/checkout/route.ts`

Complete updated file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

type CheckoutItem = {
  ticket_performance_id: string
  quantity: number
  options?: { ticket_option_id: string; quantity: number }[]
}

type PerfRow = {
  id: string
  capacity: number
  price: number
  sales_enabled: boolean
  show_performances: {
    id: string
    date: string
    start_time: string | null
    label: string | null
    shows: { id: string; title: string }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { items, buyer_name, buyer_email, coupon_code } = body as {
    items: CheckoutItem[]
    buyer_name: string
    buyer_email: string
    coupon_code?: string | null
  }

  if (!items?.length || !buyer_name || !buyer_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (items.some(item => item.quantity < 1 || item.quantity > 8)) {
    return NextResponse.json({ error: 'Quantity must be between 1 and 8 per performance' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: tps, error: tpErr } = await supabase
    .from('ticket_performances')
    .select(`
      id, capacity, price, sales_enabled,
      show_performances (
        id, date, start_time, label,
        shows ( id, title )
      )
    `)
    .in('id', items.map(i => i.ticket_performance_id))

  if (tpErr || !tps?.length) {
    return NextResponse.json({ error: 'Tickets not found' }, { status: 404 })
  }

  const tpById = Object.fromEntries((tps as unknown as PerfRow[]).map(tp => [tp.id, tp]))

  // Fetch option names so we can include them in the Stripe line item description
  const allOptionIds = items.flatMap(i => (i.options ?? []).map(o => o.ticket_option_id))
  const optionNameById: Record<string, string> = {}
  if (allOptionIds.length > 0) {
    const { data: optRows } = await supabase
      .from('ticket_options')
      .select('id, name')
      .in('id', allOptionIds)
    for (const o of optRows ?? []) optionNameById[o.id] = o.name
  }

  // Verify all items found and sales are open
  for (const item of items) {
    const tp = tpById[item.ticket_performance_id]
    if (!tp) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (!tp.sales_enabled) {
      return NextResponse.json({ error: 'Ticket sales are not open for one or more performances' }, { status: 409 })
    }
  }

  // Check availability for each performance
  for (const item of items) {
    const { data: soldRows } = await supabase
      .from('ticket_order_items')
      .select('quantity, ticket_orders!inner(status)')
      .eq('ticket_performance_id', item.ticket_performance_id)
      .eq('ticket_orders.status', 'paid')

    const sold = (soldRows ?? []).reduce((sum, r) => sum + (r.quantity ?? 0), 0)
    const tp = tpById[item.ticket_performance_id]
    if (sold + item.quantity > tp.capacity) {
      return NextResponse.json({ error: 'Not enough tickets available for one or more performances' }, { status: 409 })
    }
  }

  const firstTp = tpById[items[0].ticket_performance_id]
  const show = firstTp.show_performances.shows

  const totalBeforeDiscount = items.reduce(
    (sum, item) => sum + tpById[item.ticket_performance_id].price * item.quantity,
    0
  )

  // Validate coupon server-side (re-validate even if frontend already did it)
  let couponId: string | null = null
  let discountAmount = 0

  if (coupon_code?.trim()) {
    const { data: couponRow } = await supabase
      .from('show_coupon_codes')
      .select('id, discount_type, discount_value, max_uses, use_count')
      .eq('show_id', show.id)
      .ilike('code', coupon_code.trim())
      .not('discount_type', 'is', null)
      .maybeSingle()

    if (!couponRow) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
    }
    if (couponRow.max_uses !== null && couponRow.use_count >= couponRow.max_uses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
    }

    couponId = couponRow.id
    if (couponRow.discount_type === 'percent') {
      discountAmount = totalBeforeDiscount * (couponRow.discount_value / 100)
    } else {
      discountAmount = couponRow.discount_value
    }
    // Cap discount so Stripe total stays >= $0.50
    discountAmount = Math.min(discountAmount, Math.max(0, totalBeforeDiscount - 0.5))
  }

  const totalAmount = Math.max(0.5, totalBeforeDiscount - discountAmount)

  // Create order
  const { data: order, error: orderErr } = await supabase
    .from('ticket_orders')
    .insert({
      show_id: show.id,
      buyer_name,
      buyer_email,
      total_amount: totalAmount,
      status: 'pending',
      coupon_code_id: couponId,
      discount_amount: discountAmount,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Create order items (one per performance)
  await supabase.from('ticket_order_items').insert(
    items.map(item => ({
      order_id: order.id,
      ticket_performance_id: item.ticket_performance_id,
      quantity: item.quantity,
      unit_price: tpById[item.ticket_performance_id].price,
    }))
  )

  // Fetch back the order item IDs (needed to link option selections)
  const { data: orderItems } = await supabase
    .from('ticket_order_items')
    .select('id, ticket_performance_id')
    .eq('order_id', order.id)

  const optionInserts: { ticket_order_item_id: string; ticket_option_id: string; quantity: number }[] = []
  for (const item of items) {
    if (!item.options?.length) continue
    const orderItem = (orderItems ?? []).find(oi => oi.ticket_performance_id === item.ticket_performance_id)
    if (!orderItem) continue
    for (const opt of item.options) {
      if (opt.quantity > 0) {
        optionInserts.push({
          ticket_order_item_id: orderItem.id,
          ticket_option_id: opt.ticket_option_id,
          quantity: opt.quantity,
        })
      }
    }
  }
  if (optionInserts.length > 0) {
    await supabase.from('ticket_order_item_options').insert(optionInserts)
  }

  // Build Stripe line items (one per performance)
  const origin = req.headers.get('origin') ?? 'https://accoladetheatre.org'
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const lineItems = items.map(item => {
    const tp = tpById[item.ticket_performance_id]
    const perf = tp.show_performances
    const perfLabel = `${formatDate(perf.date)}${perf.start_time ? ' at ' + formatTime(perf.start_time) : ''}${perf.label ? ' — ' + perf.label : ''}`
    const optionSummary = (item.options ?? [])
      .filter(o => o.quantity > 0)
      .map(o => `${o.quantity}× ${optionNameById[o.ticket_option_id] ?? 'Unknown'}`)
      .join(', ')
    const description = [
      `${item.quantity} ticket${item.quantity !== 1 ? 's' : ''}`,
      optionSummary,
    ].filter(Boolean).join(' · ')
    return {
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(tp.price * 100),
        product_data: {
          name: `${show.title} — ${perfLabel}`,
          description,
        },
      },
      quantity: item.quantity,
    }
  })

  // Add negative line item for discount
  if (discountAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: -Math.round(discountAmount * 100),
        product_data: {
          name: 'Discount',
          description: `Coupon: ${coupon_code?.trim().toUpperCase()}`,
        },
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: buyer_email,
    line_items: lineItems,
    metadata: { type: 'ticket', order_id: order.id },
    success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/tickets`,
  })

  await supabase.from('ticket_orders').update({ stripe_session_id: session.id }).eq('id', order.id)

  // Increment coupon use_count AFTER session is created successfully
  if (couponId) {
    await supabase.rpc('increment_coupon_use_count', { coupon_id: couponId })
      .then(({ error: rpcErr }) => {
        if (rpcErr) {
          // Fall back to manual increment if RPC doesn't exist yet
          return supabase
            .from('show_coupon_codes')
            .update({ use_count: (discountAmount > 0 ? undefined : undefined) } as any)
            .eq('id', couponId)
        }
      })
    // Simpler direct update (no RPC needed — race condition risk is acceptable for low-volume theatre use):
    await supabase
      .from('show_coupon_codes')
      .update({ use_count: supabase.rpc as any })
      .eq('id', couponId)
  }

  return NextResponse.json({ url: session.url })
}
```

> **Note on `use_count` increment:** Supabase does not support `field + 1` in `.update()` directly without a database function. Use the SQL below to create a helper function, OR add it to the migration file. Add this to `034_ticket_coupons.sql` before running it:
>
> ```sql
> CREATE OR REPLACE FUNCTION increment_coupon_use_count(coupon_id UUID)
> RETURNS void LANGUAGE sql AS $$
>   UPDATE show_coupon_codes SET use_count = use_count + 1 WHERE id = coupon_id;
> $$;
> ```
>
> Then in the checkout route, replace the coupon increment block with simply:
>
> ```typescript
>   if (couponId) {
>     await supabase.rpc('increment_coupon_use_count', { coupon_id: couponId })
>   }
> ```

**Updated Task 8 — correct checkout route (with clean increment):**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

type CheckoutItem = {
  ticket_performance_id: string
  quantity: number
  options?: { ticket_option_id: string; quantity: number }[]
}

type PerfRow = {
  id: string
  capacity: number
  price: number
  sales_enabled: boolean
  show_performances: {
    id: string
    date: string
    start_time: string | null
    label: string | null
    shows: { id: string; title: string }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { items, buyer_name, buyer_email, coupon_code } = body as {
    items: CheckoutItem[]
    buyer_name: string
    buyer_email: string
    coupon_code?: string | null
  }

  if (!items?.length || !buyer_name || !buyer_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (items.some(item => item.quantity < 1 || item.quantity > 8)) {
    return NextResponse.json({ error: 'Quantity must be between 1 and 8 per performance' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: tps, error: tpErr } = await supabase
    .from('ticket_performances')
    .select(`
      id, capacity, price, sales_enabled,
      show_performances (
        id, date, start_time, label,
        shows ( id, title )
      )
    `)
    .in('id', items.map(i => i.ticket_performance_id))

  if (tpErr || !tps?.length) {
    return NextResponse.json({ error: 'Tickets not found' }, { status: 404 })
  }

  const tpById = Object.fromEntries((tps as unknown as PerfRow[]).map(tp => [tp.id, tp]))

  // Fetch option names for Stripe line item descriptions
  const allOptionIds = items.flatMap(i => (i.options ?? []).map(o => o.ticket_option_id))
  const optionNameById: Record<string, string> = {}
  if (allOptionIds.length > 0) {
    const { data: optRows } = await supabase
      .from('ticket_options')
      .select('id, name')
      .in('id', allOptionIds)
    for (const o of optRows ?? []) optionNameById[o.id] = o.name
  }

  // Verify all items found and sales are open
  for (const item of items) {
    const tp = tpById[item.ticket_performance_id]
    if (!tp) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (!tp.sales_enabled) {
      return NextResponse.json({ error: 'Ticket sales are not open for one or more performances' }, { status: 409 })
    }
  }

  // Check availability for each performance
  for (const item of items) {
    const { data: soldRows } = await supabase
      .from('ticket_order_items')
      .select('quantity, ticket_orders!inner(status)')
      .eq('ticket_performance_id', item.ticket_performance_id)
      .eq('ticket_orders.status', 'paid')

    const sold = (soldRows ?? []).reduce((sum, r) => sum + (r.quantity ?? 0), 0)
    const tp = tpById[item.ticket_performance_id]
    if (sold + item.quantity > tp.capacity) {
      return NextResponse.json({ error: 'Not enough tickets available for one or more performances' }, { status: 409 })
    }
  }

  const firstTp = tpById[items[0].ticket_performance_id]
  const show = firstTp.show_performances.shows

  const totalBeforeDiscount = items.reduce(
    (sum, item) => sum + tpById[item.ticket_performance_id].price * item.quantity,
    0
  )

  // Server-side coupon validation
  let couponId: string | null = null
  let discountAmount = 0

  if (coupon_code?.trim()) {
    const { data: couponRow } = await supabase
      .from('show_coupon_codes')
      .select('id, discount_type, discount_value, max_uses, use_count')
      .eq('show_id', show.id)
      .ilike('code', coupon_code.trim())
      .not('discount_type', 'is', null)
      .maybeSingle()

    if (!couponRow) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
    }
    if (couponRow.max_uses !== null && couponRow.use_count >= couponRow.max_uses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
    }

    couponId = couponRow.id
    if (couponRow.discount_type === 'percent') {
      discountAmount = totalBeforeDiscount * (couponRow.discount_value / 100)
    } else {
      discountAmount = couponRow.discount_value
    }
    // Cap so Stripe total never drops below $0.50
    discountAmount = Math.min(discountAmount, Math.max(0, totalBeforeDiscount - 0.5))
  }

  const totalAmount = Math.max(0.5, totalBeforeDiscount - discountAmount)

  // Create order
  const { data: order, error: orderErr } = await supabase
    .from('ticket_orders')
    .insert({
      show_id: show.id,
      buyer_name,
      buyer_email,
      total_amount: totalAmount,
      status: 'pending',
      coupon_code_id: couponId,
      discount_amount: discountAmount,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Create order items (one per performance)
  await supabase.from('ticket_order_items').insert(
    items.map(item => ({
      order_id: order.id,
      ticket_performance_id: item.ticket_performance_id,
      quantity: item.quantity,
      unit_price: tpById[item.ticket_performance_id].price,
    }))
  )

  // Fetch back order item IDs for option linking
  const { data: orderItems } = await supabase
    .from('ticket_order_items')
    .select('id, ticket_performance_id')
    .eq('order_id', order.id)

  const optionInserts: { ticket_order_item_id: string; ticket_option_id: string; quantity: number }[] = []
  for (const item of items) {
    if (!item.options?.length) continue
    const orderItem = (orderItems ?? []).find(oi => oi.ticket_performance_id === item.ticket_performance_id)
    if (!orderItem) continue
    for (const opt of item.options) {
      if (opt.quantity > 0) {
        optionInserts.push({
          ticket_order_item_id: orderItem.id,
          ticket_option_id: opt.ticket_option_id,
          quantity: opt.quantity,
        })
      }
    }
  }
  if (optionInserts.length > 0) {
    await supabase.from('ticket_order_item_options').insert(optionInserts)
  }

  // Build Stripe line items (one per performance)
  const origin = req.headers.get('origin') ?? 'https://accoladetheatre.org'
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => {
    const tp = tpById[item.ticket_performance_id]
    const perf = tp.show_performances
    const perfLabel = `${formatDate(perf.date)}${perf.start_time ? ' at ' + formatTime(perf.start_time) : ''}${perf.label ? ' — ' + perf.label : ''}`
    const optionSummary = (item.options ?? [])
      .filter(o => o.quantity > 0)
      .map(o => `${o.quantity}× ${optionNameById[o.ticket_option_id] ?? 'Unknown'}`)
      .join(', ')
    const description = [
      `${item.quantity} ticket${item.quantity !== 1 ? 's' : ''}`,
      optionSummary,
    ].filter(Boolean).join(' · ')
    return {
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(tp.price * 100),
        product_data: {
          name: `${show.title} — ${perfLabel}`,
          description,
        },
      },
      quantity: item.quantity,
    }
  })

  // Add negative line item for coupon discount
  if (discountAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: -Math.round(discountAmount * 100),
        product_data: {
          name: 'Discount',
          description: `Coupon: ${coupon_code!.trim().toUpperCase()}`,
        },
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: buyer_email,
    line_items: lineItems,
    metadata: { type: 'ticket', order_id: order.id },
    success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/tickets`,
  })

  await supabase.from('ticket_orders').update({ stripe_session_id: session.id }).eq('id', order.id)

  // Increment coupon use_count after Stripe session created successfully
  if (couponId) {
    await supabase.rpc('increment_coupon_use_count', { coupon_id: couponId })
  }

  return NextResponse.json({ url: session.url })
}
```

**IMPORTANT:** The `increment_coupon_use_count` RPC must be added to the migration (Task 1). Add this block to `supabase/migrations/034_ticket_coupons.sql`:

```sql
CREATE OR REPLACE FUNCTION increment_coupon_use_count(coupon_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE show_coupon_codes SET use_count = use_count + 1 WHERE id = coupon_id;
$$;
```

- [ ] Commit: `git add app/api/tickets/checkout/route.ts && git commit -m "feat: validate coupon and apply discount in checkout API"`

---

## Task 9 — CSV export: add Coupon Code and Discount columns

**Files:** Modify `app/api/tickets/export/route.ts`

Complete updated file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(',')
}

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const showId = req.nextUrl.searchParams.get('showId')
  if (!showId) return new NextResponse('Missing showId', { status: 400 })

  // Verify user has access to this show
  const { data: staffRow } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const isGlobalAdmin = staffRow?.role === 'admin'

  if (!isGlobalAdmin) {
    const { data: showStaff } = await supabase
      .from('show_staff')
      .select('id')
      .eq('show_id', showId)
      .eq('admin_user_id', user.id)
      .maybeSingle()
    if (!showStaff) return new NextResponse('Forbidden', { status: 403 })
  }

  const service = createServiceClient()

  // Fetch show title for filename
  const { data: show } = await service
    .from('shows')
    .select('title')
    .eq('id', showId)
    .single()

  // Fetch all paid orders for this show with full detail including coupon
  const { data: orders } = await service
    .from('ticket_orders')
    .select(`
      id, buyer_name, buyer_email, created_at, status, total_amount,
      discount_amount,
      show_coupon_codes ( code ),
      ticket_order_items (
        id, quantity,
        ticket_performances (
          price,
          show_performances ( date, start_time, label )
        ),
        ticket_order_item_options (
          quantity,
          ticket_options (
            name,
            ticket_option_groups ( name )
          )
        )
      )
    `)
    .eq('show_id', showId)
    .eq('status', 'paid')
    .order('created_at', { ascending: true })

  // Build CSV
  const headers = [
    'Order Date', 'Buyer Name', 'Buyer Email',
    'Performance Date', 'Performance Time', 'Performance Label',
    'Qty', 'Price Per Ticket', 'Subtotal', 'Options',
    'Coupon Code', 'Discount',
  ]

  const rows: string[] = [csvRow(headers)]

  for (const order of orders ?? []) {
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    const couponCode = (order.show_coupon_codes as any)?.code ?? ''
    const discountAmt = (order as any).discount_amount ?? 0

    for (const item of (order.ticket_order_items as any[]) ?? []) {
      const tp = item.ticket_performances as any
      const perf = tp?.show_performances as any
      const date = perf?.date ? formatDate(perf.date) : ''
      const time = perf?.start_time ? formatTime(perf.start_time) : ''
      const label = perf?.label ?? ''
      const price = tp?.price ?? 0
      const subtotal = price * item.quantity

      // Collect options: "Chicken: 2, Beef: 1"
      const optionParts: string[] = []
      for (const opt of (item.ticket_order_item_options as any[]) ?? []) {
        const optName = (opt.ticket_options as any)?.name ?? ''
        if (optName && opt.quantity > 0) {
          optionParts.push(`${optName}: ${opt.quantity}`)
        }
      }
      const options = optionParts.join(', ')

      rows.push(csvRow([
        orderDate,
        order.buyer_name,
        order.buyer_email,
        date,
        time,
        label,
        item.quantity,
        price.toFixed(2),
        subtotal.toFixed(2),
        options,
        couponCode,
        discountAmt > 0 ? `-${Number(discountAmt).toFixed(2)}` : '',
      ]))
    }
  }

  const csv = rows.join('\n')
  const filename = `tickets-${(show?.title ?? 'export').toLowerCase().replace(/\s+/g, '-')}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

- [ ] Commit: `git add app/api/tickets/export/route.ts && git commit -m "feat: add coupon code and discount columns to ticket CSV export"`

---

## Summary of all files changed

| File | Action |
|------|--------|
| `supabase/migrations/034_ticket_coupons.sql` | Create |
| `app/(admin)/admin/events/[slug]/ticket-actions.ts` | Modify (add 3 exports) |
| `app/(admin)/admin/events/[slug]/TicketCouponManager.tsx` | Create |
| `app/(admin)/admin/events/[slug]/page.tsx` | Modify (fetch + pass ticketCouponsData) |
| `app/(admin)/admin/events/[slug]/tabs/TicketsTab.tsx` | Modify (import + render TicketCouponManager) |
| `app/(public)/tickets/page.tsx` | Modify (pass showId prop) |
| `app/(public)/tickets/TicketCheckoutForm.tsx` | Modify (coupon input, discount display) |
| `app/api/tickets/checkout/route.ts` | Modify (validate, discount, increment) |
| `app/api/tickets/export/route.ts` | Modify (2 new CSV columns) |

## Manual steps required

1. **Before Task 8:** Add the `increment_coupon_use_count` function to `034_ticket_coupons.sql` (shown in Task 8 note).
2. **After Task 1 code is written:** Run the full contents of `034_ticket_coupons.sql` in the Supabase dashboard SQL Editor.
