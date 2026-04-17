'use client'

import { useRouter, usePathname } from 'next/navigation'

type Registration = {
  id: string
  status: string
  waitlist_position: number | null
  auditioner_name: string
  auditioner_age: number | null
  auditioner_grade: string | null
  parent_name: string | null
  parent_email: string
  parent_phone: string | null
  is_adult: boolean
  role_preference: string | null
  accept_other_roles: boolean
  conflicts: string | null
  created_at: string
  audition_slots: { label: string } | null
}

type Slot = { id: string; label: string }

const STATUS_COLOR: Record<string, string> = {
  registered: 'var(--gold)',
  waitlisted:  'var(--teal)',
  cancelled:   'var(--muted)',
}

const STATUS_BORDER: Record<string, string> = {
  registered: 'rgba(212,168,83,0.35)',
  waitlisted:  'rgba(61,158,140,0.35)',
  cancelled:   'rgba(160,160,181,0.2)',
}

export default function RegistrationsTable({
  registrations,
  slots,
  slug,
  currentSlot,
  currentStatus,
}: {
  registrations: Registration[]
  slots: Slot[]
  slug: string
  currentSlot: string
  currentStatus: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams()
    if (key !== 'slot'   && currentSlot)   params.set('slot', currentSlot)
    if (key !== 'status' && currentStatus && currentStatus !== 'all') params.set('status', currentStatus)
    if (value && value !== 'all') params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--layer)',
    border: '1px solid var(--border)',
    borderRadius: '2px',
    padding: '9px 14px',
    color: 'var(--warm-white)',
    fontSize: '0.78rem',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select value={currentSlot} onChange={e => updateFilter('slot', e.target.value)} style={selectStyle}>
          <option value="">All Slots</option>
          {slots.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={currentStatus} onChange={e => updateFilter('status', e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="registered">Registered</option>
          <option value="waitlisted">Waitlisted</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {(currentSlot || (currentStatus && currentStatus !== 'all')) && (
          <button
            onClick={() => router.push(pathname)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--muted)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '9px 14px', cursor: 'pointer' }}
          >
            Clear Filters
          </button>
        )}
        <p style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)', alignSelf: 'center' }}>
          {registrations.length} result{registrations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      {registrations.length === 0 ? (
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No registrations match these filters.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 160px 100px 120px',
            padding: '12px 24px', gap: '16px',
            background: 'var(--layer)', borderBottom: '1px solid var(--border)',
          }}>
            {['Auditioner', 'Slot', 'Contact', 'Status', 'Registered'].map(h => (
              <span key={h} style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {registrations.map((reg, i) => {
            const isLast = i === registrations.length - 1
            const date = new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            return (
              <details key={reg.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                <summary style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 160px 100px 120px',
                  padding: '16px 24px', gap: '16px',
                  alignItems: 'center', cursor: 'pointer', listStyle: 'none',
                }}>
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 500 }}>{reg.auditioner_name}</p>
                    {reg.auditioner_age && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                        Age {reg.auditioner_age}{reg.auditioner_grade ? ` · ${reg.auditioner_grade}` : ''}
                      </p>
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {reg.audition_slots?.label ?? '—'}
                  </p>
                  <div>
                    <p style={{ fontSize: '0.78rem' }}>{reg.parent_email}</p>
                    {reg.parent_phone && <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>{reg.parent_phone}</p>}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    border: `1px solid ${STATUS_BORDER[reg.status] ?? STATUS_BORDER.cancelled}`,
                    borderRadius: '2px',
                    fontSize: '0.6rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: STATUS_COLOR[reg.status] ?? STATUS_COLOR.cancelled,
                  }}>
                    {reg.status === 'waitlisted' && reg.waitlist_position ? `#${reg.waitlist_position} waitlist` : reg.status}
                  </span>
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{date}</p>
                </summary>

                {/* Expanded detail */}
                <div style={{
                  padding: '0 24px 20px',
                  background: 'rgba(0,0,0,0.15)',
                  borderTop: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', padding: '20px 0' }}>
                    {reg.parent_name && (
                      <div>
                        <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
                          {reg.is_adult ? 'Auditioner' : 'Parent / Guardian'}
                        </p>
                        <p style={{ fontSize: '0.85rem' }}>{reg.parent_name}</p>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>Role Preference</p>
                      <p style={{ fontSize: '0.85rem' }}>{reg.role_preference ?? 'Any Role'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>Accepts Other Roles</p>
                      <p style={{ fontSize: '0.85rem' }}>{reg.accept_other_roles ? 'Yes' : 'No'}</p>
                    </div>
                    {reg.conflicts && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>Conflicts</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--warm-white)', lineHeight: 1.6 }}>{reg.conflicts}</p>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
