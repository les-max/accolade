'use client'

import { useState, useTransition } from 'react'
import { addShowEvent, bulkAddShowEvents, deleteShowEvent } from './actions'

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
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

function parseTime(timeStr?: string): { hour: string; min: string; ampm: 'AM' | 'PM'; enabled: boolean } {
  if (!timeStr) return { hour: '7', min: '0', ampm: 'PM', enabled: false }
  const [hStr, mStr] = timeStr.split(':')
  let h = Number(hStr)
  const m = Number(mStr)
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return { hour: String(h), min: String(m), ampm, enabled: true }
}

function TimePicker({ name, label, initialTime }: { name: string; label: string; initialTime?: string }) {
  const init = parseTime(initialTime)
  const [hour,    setHour]    = useState(init.hour)
  const [min,     setMin]     = useState(init.min)
  const [ampm,    setAmpm]    = useState<'AM' | 'PM'>(init.ampm)
  const [enabled, setEnabled] = useState(init.enabled)

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

function computeDates(startDate: string, endDate: string, weekdays: number[]): string[] {
  if (!startDate || !endDate || weekdays.length === 0) return []
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const cur = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  const dates: string[] = []
  while (cur <= end) {
    if (weekdays.includes(cur.getDay())) {
      const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      dates.push(iso)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

type Prefill = {
  type: typeof TYPES[number]
  title: string
  date: string
  start_time: string
  end_time: string
  location: string
  notes: string
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
  const [mode,         setMode]         = useState<null | 'single' | 'bulk'>(null)
  const [formKey,      setFormKey]      = useState(0)
  const [prefill,      setPrefill]      = useState<Prefill | null>(null)
  const [type,         setType]         = useState<typeof TYPES[number]>('rehearsal')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [bulkStart,    setBulkStart]    = useState('')
  const [bulkEnd,      setBulkEnd]      = useState('')
  const [isPending,    startTransition] = useTransition()
  const [error,        setError]        = useState('')

  const sorted = [...events].sort((a, b) =>
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  const previewCount = mode === 'bulk'
    ? computeDates(bulkStart, bulkEnd, selectedDays).length
    : 0

  function openSingle() {
    setPrefill(null)
    setType('rehearsal')
    setFormKey(k => k + 1)
    setMode('single')
    setError('')
  }

  function openBulk() {
    setMode('bulk')
    setType('rehearsal')
    setSelectedDays([])
    setBulkStart('')
    setBulkEnd('')
    setFormKey(k => k + 1)
    setError('')
  }

  function closeForm() {
    setMode(null)
    setPrefill(null)
    setError('')
  }

  function openDuplicate(ev: ShowEvent) {
    const start = new Date(ev.start_time)
    const end   = ev.end_time ? new Date(ev.end_time) : null
    const toHHMM = (d: Date) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    const toDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const pf: Prefill = {
      type:       ev.event_type as typeof TYPES[number],
      title:      ev.title,
      date:       toDate(start),
      start_time: (start.getHours() === 0 && start.getMinutes() === 0) ? '' : toHHMM(start),
      end_time:   end ? toHHMM(end) : '',
      location:   ev.location ?? '',
      notes:      ev.notes ?? '',
    }
    setPrefill(pf)
    setType(pf.type)
    setFormKey(k => k + 1)
    setMode('single')
    setError('')
  }

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
        setPrefill(null)
        setMode(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding event')
      }
    })
  }

  function handleBulkAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    const title     = data.get('title') as string
    const start_val = data.get('start_time') as string
    const end_val   = data.get('end_time') as string
    const location  = (data.get('location') as string) || null
    const notes     = (data.get('notes') as string) || null

    const dates = computeDates(bulkStart, bulkEnd, selectedDays)
    if (dates.length === 0) {
      setError('No dates match — check your day selection and date range.')
      return
    }

    const eventsToAdd = dates.map(date => ({
      event_type: type,
      title,
      date,
      start_val: start_val ?? '',
      end_val:   end_val   ?? '',
      location,
      notes,
    }))

    startTransition(async () => {
      try {
        await bulkAddShowEvents(showId, slug, eventsToAdd)
        form.reset()
        setType('rehearsal')
        setSelectedDays([])
        setBulkStart('')
        setBulkEnd('')
        setMode(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding events')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteShowEvent(id, slug) })
  }

  function toggleDay(day: number) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const typeSelector = (
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
  )

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px',
          borderBottom: sorted.length > 0 || mode !== null ? '1px solid var(--border)' : 'none',
        }}>
          <div>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Rehearsals &amp; Events
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '4px' }}>
              Automatically appear on cast &amp; crew calendars
            </p>
          </div>
          {mode === null && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={openSingle}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer' }}
              >
                + Add
              </button>
              <button
                onClick={openBulk}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--teal)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer' }}
              >
                + Bulk
              </button>
            </div>
          )}
        </div>

        {/* Entries list */}
        {sorted.length > 0 && (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '110px 1fr 160px 1fr 56px',
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
                  display: 'grid', gridTemplateColumns: '110px 1fr 160px 1fr 56px',
                  padding: '14px 24px', gap: '16px', alignItems: 'center',
                  borderBottom: i < sorted.length - 1 || mode !== null ? '1px solid var(--border)' : 'none',
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
                  <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => openDuplicate(ev)}
                      disabled={isPending}
                      title="Duplicate"
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.95rem', lineHeight: 1, padding: '2px 5px' }}
                    >
                      ⎘
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      disabled={isPending}
                      title="Remove"
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '2px 5px' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {sorted.length === 0 && mode === null && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No rehearsals scheduled yet.</p>
            <p style={{ color: 'var(--muted-dim)', fontSize: '0.75rem', marginTop: '6px' }}>Add dates and they&apos;ll appear automatically on cast &amp; crew calendars.</p>
          </div>
        )}

        {/* Single add / duplicate form */}
        {mode === 'single' && (
          <form key={formKey} onSubmit={handleAdd} style={{ padding: '24px', background: 'rgba(212,168,83,0.03)' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>
              {prefill ? 'Duplicate Rehearsal / Event' : 'Add Rehearsal / Event'}
            </p>

            {typeSelector}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label>
                <span style={labelStyle}>Title</span>
                <input name="title" type="text" required placeholder="e.g. Act I Run-Through" defaultValue={prefill?.title ?? ''} style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Date</span>
                <input name="date" type="date" required defaultValue={prefill?.date ?? ''} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <TimePicker name="start_time" label="Start Time" initialTime={prefill?.start_time} />
              <TimePicker name="end_time"   label="End Time"   initialTime={prefill?.end_time} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label>
                <span style={labelStyle}>Location <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
                <input name="location" type="text" placeholder="e.g. Main Stage" defaultValue={prefill?.location ?? ''} style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Notes <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
                <input name="notes" type="text" placeholder="e.g. Bring scripts" defaultValue={prefill?.notes ?? ''} style={inputStyle} />
              </label>
            </div>

            {error && <p style={{ color: 'var(--rose)', fontSize: '0.78rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '12px 28px', opacity: isPending ? 0.6 : 1 }}>
                <span>{isPending ? 'Adding…' : 'Add'}</span>
              </button>
              <button type="button" onClick={closeForm} className="btn-ghost" style={{ padding: '12px 20px' }}>
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}

        {/* Bulk add form */}
        {mode === 'bulk' && (
          <form key={formKey} onSubmit={handleBulkAdd} style={{ padding: '24px', background: 'rgba(0,180,180,0.03)' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: '20px' }}>
              Bulk Add Rehearsals
            </p>

            {typeSelector}

            <div style={{ marginBottom: '16px' }}>
              <label>
                <span style={labelStyle}>Title</span>
                <input name="title" type="text" required placeholder="e.g. Act I Run-Through" style={inputStyle} />
              </label>
            </div>

            {/* Day of week toggles */}
            <div style={{ marginBottom: '16px' }}>
              <span style={labelStyle}>Days of Week</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={day} type="button"
                    onClick={() => toggleDay(i)}
                    style={{
                      padding: '7px 12px',
                      border: `1px solid ${selectedDays.includes(i) ? 'var(--teal)' : 'var(--border)'}`,
                      borderRadius: '2px',
                      background: selectedDays.includes(i) ? 'rgba(0,180,180,0.12)' : 'transparent',
                      color: selectedDays.includes(i) ? 'var(--teal)' : 'var(--muted)',
                      fontSize: '0.72rem',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      minWidth: '40px',
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label>
                <span style={labelStyle}>Start Date</span>
                <input
                  name="start_date" type="date" required
                  value={bulkStart}
                  onChange={e => setBulkStart(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label>
                <span style={labelStyle}>End Date</span>
                <input
                  name="end_date" type="date" required
                  value={bulkEnd}
                  onChange={e => setBulkEnd(e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>

            {previewCount > 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--teal)', marginBottom: '16px' }}>
                {previewCount} rehearsal{previewCount !== 1 ? 's' : ''} will be created
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <TimePicker name="start_time" label="Start Time" />
              <TimePicker name="end_time"   label="End Time" />
            </div>

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
              <button
                type="submit"
                disabled={isPending || previewCount === 0}
                className="btn-primary"
                style={{ padding: '12px 28px', opacity: (isPending || previewCount === 0) ? 0.6 : 1 }}
              >
                <span>{isPending ? 'Adding…' : previewCount > 0 ? `Add ${previewCount} Rehearsal${previewCount !== 1 ? 's' : ''}` : 'Add Rehearsals'}</span>
              </button>
              <button type="button" onClick={closeForm} className="btn-ghost" style={{ padding: '12px 20px' }}>
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
