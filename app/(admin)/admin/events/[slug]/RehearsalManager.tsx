'use client'

import { useState, useTransition } from 'react'
import { addShowEvent, deleteShowEvent } from './actions'

type ShowEvent = {
  id: string
  event_type: string
  title: string
  start_time: string
  end_time: string | null
  location: string | null
  notes: string | null
}

const TYPE_LABELS: Record<string, string> = {
  rehearsal:      'Rehearsal',
  tech_rehearsal: 'Tech',
  event:          'Company Event',
  other:          'Other',
}

const TYPE_COLORS: Record<string, string> = {
  rehearsal:      'var(--teal)',
  tech_rehearsal: 'var(--rose)',
  event:          'var(--gold)',
  other:          'var(--muted)',
}

const TYPES = ['rehearsal', 'tech_rehearsal', 'event', 'other'] as const

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

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

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

function TimePicker({ name, label }: { name: string; label: string }) {
  const [hour,    setHour]    = useState('7')
  const [min,     setMin]     = useState('0')
  const [ampm,    setAmpm]    = useState<'AM' | 'PM'>('PM')
  const [enabled, setEnabled] = useState(false)

  const value24 = (() => {
    if (!enabled) return ''
    let h = Number(hour)
    if (ampm === 'PM' && h !== 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  })()

  return (
    <div>
      <span style={labelStyle}>{label} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <input type="hidden" name={name} value={value24} />
        <button
          type="button"
          onClick={() => setEnabled(e => !e)}
          style={{
            padding: '9px 12px',
            border: `1px solid ${enabled ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: '2px',
            background: enabled ? 'rgba(212,168,83,0.1)' : 'rgba(255,255,255,0.04)',
            color: enabled ? 'var(--gold)' : 'var(--muted)',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {enabled ? 'Set' : '+ Add time'}
        </button>
        {enabled && (
          <>
            <select value={hour} onChange={e => setHour(e.target.value)} style={selectStyle}>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ color: 'var(--muted)', fontSize: '1rem' }}>:</span>
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
          </>
        )}
      </div>
    </div>
  )
}

function formatDateTime(ts: string) {
  const d = new Date(ts)
  const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return { date, time: time === '12:00 AM' ? '' : time }
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function RehearsalManager({
  showId,
  slug,
  events,
}: {
  showId: string
  slug: string
  events: ShowEvent[]
}) {
  const [showForm,   setShowForm]   = useState(false)
  const [type,       setType]       = useState<typeof TYPES[number]>('rehearsal')
  const [isPending,  startTransition] = useTransition()
  const [error,      setError]      = useState('')

  const sorted = [...events].sort((a, b) =>
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    data.set('event_type', type)
    startTransition(async () => {
      try {
        await addShowEvent(showId, slug, data)
        form.reset()
        setType('rehearsal')
        setShowForm(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding event')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteShowEvent(id, slug) })
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px',
          borderBottom: sorted.length > 0 || showForm ? '1px solid var(--border)' : 'none',
        }}>
          <div>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Rehearsals &amp; Events
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '4px' }}>
              Automatically appear on cast &amp; crew calendars
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer' }}
            >
              + Add
            </button>
          )}
        </div>

        {/* Entries */}
        {sorted.length > 0 && (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '110px 1fr 160px 1fr 32px',
              padding: '10px 24px', gap: '16px',
              borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
            }}>
              {['Type', 'Title', 'Date', 'Time / Location', ''].map(h => (
                <span key={h} style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
              ))}
            </div>
            {sorted.map((ev, i) => {
              const { date, time } = formatDateTime(ev.start_time)
              const endTime = ev.end_time ? formatTime(ev.end_time) : null
              const timeRange = time
                ? (endTime ? `${time} – ${endTime}` : time)
                : endTime ?? '—'
              return (
                <div key={ev.id} style={{
                  display: 'grid', gridTemplateColumns: '110px 1fr 160px 1fr 32px',
                  padding: '14px 24px', gap: '16px', alignItems: 'center',
                  borderBottom: i < sorted.length - 1 || showForm ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: TYPE_COLORS[ev.event_type] ?? 'var(--muted)', fontWeight: 600 }}>
                    {TYPE_LABELS[ev.event_type] ?? ev.event_type}
                  </span>
                  <p style={{ fontSize: '0.85rem' }}>{ev.title}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{date}</p>
                  <div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{timeRange}</p>
                    {ev.location && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--muted-dim)', marginTop: '2px' }}>{ev.location}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    disabled={isPending}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {sorted.length === 0 && !showForm && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No rehearsals scheduled yet.</p>
            <p style={{ color: 'var(--muted-dim)', fontSize: '0.75rem', marginTop: '6px' }}>Add dates and they&apos;ll appear automatically on cast &amp; crew calendars.</p>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} style={{ padding: '24px', background: 'rgba(212,168,83,0.03)' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>
              Add Rehearsal / Event
            </p>

            {/* Type */}
            <div style={{ marginBottom: '16px' }}>
              <span style={labelStyle}>Type</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TYPES.map(t => (
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
                      cursor: 'pointer',
                    }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Title + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label>
                <span style={labelStyle}>Title</span>
                <input name="title" type="text" required placeholder="e.g. Act I Run-Through" style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Date</span>
                <input name="date" type="date" required style={inputStyle} />
              </label>
            </div>

            {/* Start + End time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <TimePicker name="start_time" label="Start Time" />
              <TimePicker name="end_time"   label="End Time" />
            </div>

            {/* Location + Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label>
                <span style={labelStyle}>Location <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
                <input name="location" type="text" placeholder="e.g. Main Stage" style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Notes <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
                <input name="notes" type="text" placeholder="e.g. Bring scripts" style={inputStyle} />
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
