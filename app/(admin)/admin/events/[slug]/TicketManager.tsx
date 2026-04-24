'use client'

import { useState, useTransition } from 'react'
import { upsertTicketPerformances } from './ticket-actions'

type Performance = {
  id: string
  date: string
  start_time: string | null
  label: string | null
}

type TicketPerf = {
  show_performance_id: string
  capacity: number
  price: number
  sales_enabled: boolean
}

type RowState = {
  capacity: string
  price: string
  sales_enabled: boolean
}

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

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '8px 12px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  colorScheme: 'dark',
}

export default function TicketManager({
  showId,
  slug,
  performances,
  ticketConfig,
}: {
  showId: string
  slug: string
  performances: Performance[]
  ticketConfig: TicketPerf[]
}) {
  const configByPerfId = Object.fromEntries(ticketConfig.map(t => [t.show_performance_id, t]))

  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {}
    for (const p of performances) {
      const existing = configByPerfId[p.id]
      init[p.id] = {
        capacity: existing ? String(existing.capacity) : '150',
        price: existing ? String(existing.price) : '15.00',
        sales_enabled: existing?.sales_enabled ?? false,
      }
    }
    return init
  })

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function handleSave() {
    setError('')
    setSaved(false)
    const toSave = performances.map(p => ({
      show_performance_id: p.id,
      capacity: Math.max(1, parseInt(rows[p.id]?.capacity) || 1),
      price: Math.max(0, parseFloat(rows[p.id]?.price) || 0),
      sales_enabled: rows[p.id]?.sales_enabled ?? false,
    }))
    startTransition(async () => {
      try {
        await upsertTicketPerformances(showId, slug, toSave)
        setSaved(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  if (performances.length === 0) {
    return (
      <div style={{ marginBottom: '32px' }}>
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>Tickets</p>
          </div>
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Add performance dates above to configure tickets.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>Tickets</p>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 120px 80px',
          padding: '10px 24px',
          gap: '16px',
          background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid var(--border)',
        }}>
          {['Performance', 'Capacity', 'Price', 'Sales'].map(h => (
            <span key={h} style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
          ))}
        </div>

        {performances.map((p, i) => {
          const row = rows[p.id] ?? { capacity: '150', price: '15.00', sales_enabled: false }
          return (
            <div key={p.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 120px 80px',
              padding: '14px 24px',
              gap: '16px',
              alignItems: 'center',
              borderBottom: i < performances.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div>
                <p style={{ fontSize: '0.88rem' }}>{formatDate(p.date)}</p>
                {p.start_time && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{formatTime(p.start_time)}</p>
                )}
                {p.label && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted-dim)', marginTop: '1px' }}>{p.label}</p>
                )}
              </div>

              <input
                type="number"
                min="1"
                value={row.capacity}
                onChange={e => setRows(r => ({ ...r, [p.id]: { ...r[p.id], capacity: e.target.value } }))}
                style={inputStyle}
              />

              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--muted)', fontSize: '0.85rem', pointerEvents: 'none',
                }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={row.price}
                  onChange={e => setRows(r => ({ ...r, [p.id]: { ...r[p.id], price: e.target.value } }))}
                  style={{ ...inputStyle, paddingLeft: '22px' }}
                />
              </div>

              <button
                type="button"
                onClick={() => setRows(r => ({ ...r, [p.id]: { ...r[p.id], sales_enabled: !r[p.id].sales_enabled } }))}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${row.sales_enabled ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: '2px',
                  background: row.sales_enabled ? 'rgba(100,200,180,0.1)' : 'rgba(255,255,255,0.04)',
                  color: row.sales_enabled ? 'var(--teal)' : 'var(--muted)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.sales_enabled ? 'On' : 'Off'}
              </button>
            </div>
          )
        })}

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="btn-primary"
            style={{ padding: '10px 24px', opacity: isPending ? 0.6 : 1 }}
          >
            <span>{isPending ? 'Saving…' : 'Save Tickets'}</span>
          </button>
          {saved && !isPending && <p style={{ fontSize: '0.78rem', color: 'var(--teal)' }}>Saved</p>}
          {error && <p style={{ fontSize: '0.78rem', color: 'var(--rose)' }}>{error}</p>}
        </div>
      </div>
    </div>
  )
}
