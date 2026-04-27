'use client'

import { useState, useTransition } from 'react'
import { addPerformance, updatePerformance, deletePerformance } from './actions'

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
  colorScheme: 'dark',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  display: 'block',
  marginBottom: '6px',
}

const TYPE_LABELS: Record<string, string> = {
  performance: 'Performance',
  audition:    'Audition',
  callback:    'Callback',
}

const TYPE_COLORS: Record<string, string> = {
  performance: 'var(--teal)',
  audition:    'var(--gold)',
  callback:    'var(--rose)',
}

type Performance = {
  id: string
  type: string
  date: string
  start_time: string | null
  label: string | null
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

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '9px 10px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  colorScheme: 'dark',
  appearance: 'none',
  cursor: 'pointer',
}

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function TimePicker({ name }: { name: string }) {
  const [hour,  setHour]  = useState('7')
  const [min,   setMin]   = useState('0')
  const [ampm,  setAmpm]  = useState<'AM' | 'PM'>('PM')
  const [enabled, setEnabled] = useState(false)

  const value24 = (() => {
    if (!enabled) return ''
    let h = Number(hour)
    if (ampm === 'PM' && h !== 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  })()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <input type="hidden" name={name} value={value24} />

      {!enabled ? (
        <button
          type="button"
          onClick={() => setEnabled(true)}
          style={{
            padding: '9px 12px',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--muted)',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Add time
        </button>
      ) : (
        <>
          <select value={hour} onChange={e => setHour(e.target.value)} style={selectStyle}>
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1 }}>:</span>
          <select value={min} onChange={e => setMin(e.target.value)} style={selectStyle}>
            {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setAmpm(p => p === 'AM' ? 'PM' : 'AM')}
            style={{
              padding: '9px 10px',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--warm-white)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '46px',
            }}
          >
            {ampm}
          </button>
          <button
            type="button"
            onClick={() => setEnabled(false)}
            style={{
              padding: '9px 10px',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              background: 'none',
              color: 'var(--muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
            title="Remove time"
          >
            × Clear
          </button>
        </>
      )}
    </div>
  )
}

const ALLOWED_TYPES: Record<string, ('performance' | 'audition' | 'callback')[]> = {
  show:     ['performance'],
  audition: ['audition', 'callback'],
  camp:     ['audition', 'callback', 'performance'],
  workshop: ['performance'],
  event:    ['performance'],
}

export default function PerformancesManager({
  showId,
  slug,
  performances,
  eventType,
  readOnly = false,
}: {
  showId: string
  slug: string
  performances: Performance[]
  eventType: string
  readOnly?: boolean
}) {
  const allowedTypes = ALLOWED_TYPES[eventType] ?? ['performance', 'audition', 'callback']
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<'performance' | 'audition' | 'callback'>(allowedTypes[0])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    data.set('type', type)
    startTransition(async () => {
      try {
        await addPerformance(showId, slug, data)
        form.reset()
        setType(allowedTypes[0])
        setShowForm(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding entry')
      }
    })
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updatePerformance(id, slug, data)
        setEditingId(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error saving')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePerformance(id, slug)
    })
  }

  const sorted = [...performances].sort((a, b) => {
    const d = a.date.localeCompare(b.date)
    if (d !== 0) return d
    return (a.start_time ?? '').localeCompare(b.start_time ?? '')
  })

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px',
          borderBottom: sorted.length > 0 || showForm ? '1px solid var(--border)' : 'none',
        }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Performances
          </p>
          {!showForm && !readOnly && (
            <button
              onClick={() => setShowForm(true)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer' }}
            >
              + Add Date
            </button>
          )}
        </div>

        {/* Existing entries */}
        {sorted.length > 0 && (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '100px 1fr 100px 1fr 32px',
              padding: '10px 24px', gap: '16px',
              borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
            }}>
              {['Type', 'Date', 'Time', 'Note', ''].map(h => (
                <span key={h} style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
              ))}
            </div>
            {sorted.map((p, i) => (
              <div key={p.id} style={{
                borderBottom: i < sorted.length - 1 || showForm ? '1px solid var(--border)' : 'none',
              }}>
                {editingId === p.id ? (
                  <form onSubmit={e => handleUpdate(e, p.id)} style={{
                    display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
                    padding: '12px 24px', background: 'rgba(212,168,83,0.03)',
                  }}>
                    <input
                      name="date" type="date" required defaultValue={p.date}
                      style={{ ...inputStyle, width: 'auto', flex: '0 0 auto', colorScheme: 'dark' }}
                    />
                    <input
                      name="start_time" type="time" defaultValue={p.start_time ?? ''}
                      style={{ ...inputStyle, width: 'auto', flex: '0 0 auto', colorScheme: 'dark' }}
                    />
                    <input
                      name="label" type="text" defaultValue={p.label ?? ''} placeholder="Note (optional)"
                      style={{ ...inputStyle, flex: 1, minWidth: '120px' }}
                    />
                    <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '9px 18px', opacity: isPending ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                      <span>Save</span>
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="btn-ghost" style={{ padding: '9px 14px' }}>
                      <span>Cancel</span>
                    </button>
                  </form>
                ) : (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 100px 1fr auto',
                    padding: '14px 24px', gap: '16px', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: TYPE_COLORS[p.type] ?? 'var(--muted)', fontWeight: 600 }}>
                      {TYPE_LABELS[p.type] ?? p.type}
                    </span>
                    <p style={{ fontSize: '0.85rem' }}>{formatDate(p.date)}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      {p.start_time ? formatTime(p.start_time) : '—'}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{p.label ?? '—'}</p>
                    {!readOnly && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => setEditingId(p.id)}
                          disabled={isPending}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.08em', padding: 0 }}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={isPending}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {sorted.length === 0 && !showForm && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No performances scheduled yet.</p>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} style={{ padding: '24px', background: 'rgba(212,168,83,0.03)' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>
              Add Date
            </p>

            {/* Type picker */}
            <div style={{ marginBottom: '16px' }}>
              <span style={labelStyle}>Type</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {allowedTypes.map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setType(t)}
                    style={{
                      padding: '7px 14px',
                      border: `1px solid ${type === t ? TYPE_COLORS[t] : 'var(--border)'}`,
                      borderRadius: '2px',
                      background: type === t ? `color-mix(in srgb, ${TYPE_COLORS[t]} 12%, transparent)` : 'transparent',
                      color: type === t ? TYPE_COLORS[t] : 'var(--muted)',
                      fontSize: '0.72rem',
                      letterSpacing: '0.1em',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label>
                <span style={labelStyle}>Date</span>
                <input name="date" type="date" required style={inputStyle} />
              </label>
              <div>
                <span style={labelStyle}>Start Time <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
                <TimePicker name="start_time" />
              </div>
              <label>
                <span style={labelStyle}>Note <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
                <input name="label" type="text" placeholder="e.g. Opening Night" style={inputStyle} />
              </label>
            </div>

            {error && <p style={{ color: 'var(--rose)', fontSize: '0.78rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '12px 28px', opacity: isPending ? 0.6 : 1 }}>
                <span>{isPending ? 'Adding…' : 'Add'}</span>
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }} className="btn-ghost" style={{ padding: '12px 20px' }}>
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
