'use client'

import { useState } from 'react'

type ConflictEntry =
  | { type: 'single'; date: string }
  | { type: 'range'; start: string; end: string }

function formatEntry(entry: ConflictEntry): string {
  if (entry.type === 'single') {
    return new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  const start = new Date(entry.start + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const end   = new Date(entry.end   + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `${start} – ${end}`
}

function serializeConflicts(entries: ConflictEntry[]): string {
  return entries.map(formatEntry).join('; ')
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '2px',
  padding: '10px 14px',
  color: 'var(--warm-white)',
  fontSize: '0.88rem',
  outline: 'none',
  colorScheme: 'dark',
}

export default function ConflictPicker({ name = 'conflicts' }: { name?: string }) {
  const [mode, setMode] = useState<'single' | 'range'>('single')
  const [singleDate, setSingleDate] = useState('')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [entries, setEntries] = useState<ConflictEntry[]>([])
  const [error, setError] = useState('')

  function handleAdd() {
    setError('')
    if (mode === 'single') {
      if (!singleDate) return
      setEntries(prev => [...prev, { type: 'single', date: singleDate }])
      setSingleDate('')
    } else {
      if (!rangeStart || !rangeEnd) return
      if (rangeEnd < rangeStart) { setError('End date must be after start date.'); return }
      setEntries(prev => [...prev, { type: 'range', start: rangeStart, end: rangeEnd }])
      setRangeStart('')
      setRangeEnd('')
    }
  }

  function removeEntry(index: number) {
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  const serialized = serializeConflicts(entries)

  return (
    <div>
      <input type="hidden" name={name} value={serialized} />

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['single', 'range'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError('') }}
            style={{
              padding: '8px 16px',
              border: `1px solid ${mode === m ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '2px',
              background: mode === m ? 'rgba(212,168,83,0.1)' : 'transparent',
              color: mode === m ? 'var(--gold)' : 'var(--muted)',
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'capitalize',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {m === 'single' ? 'Single Date' : 'Date Range'}
          </button>
        ))}
      </div>

      {/* Date inputs */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px', flexWrap: 'wrap' }}>
        {mode === 'single' ? (
          <input
            type="date"
            value={singleDate}
            onChange={e => setSingleDate(e.target.value)}
            style={{ ...inputStyle, flex: '1', minWidth: '160px' }}
          />
        ) : (
          <>
            <div style={{ flex: '1', minWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>Start</label>
              <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '1', minWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>End</label>
              <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} min={rangeStart} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </>
        )}
        <button
          type="button"
          onClick={handleAdd}
          disabled={mode === 'single' ? !singleDate : !rangeStart || !rangeEnd}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            color: 'var(--gold)',
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            opacity: (mode === 'single' ? !singleDate : !rangeStart || !rangeEnd) ? 0.4 : 1,
          }}
        >
          + Add
        </button>
      </div>

      {error && <p style={{ color: 'var(--rose)', fontSize: '0.78rem', marginBottom: '8px' }}>{error}</p>}

      {/* Added entries */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {entries.map((entry, i) => (
            <div key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px',
              background: 'rgba(212,168,83,0.08)',
              border: '1px solid rgba(212,168,83,0.2)',
              borderRadius: '2px',
              fontSize: '0.78rem',
              color: 'var(--warm-white)',
            }}>
              {formatEntry(entry)}
              <button
                type="button"
                onClick={() => removeEntry(i)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--muted-dim)', fontStyle: 'italic', marginTop: '8px' }}>
          No conflicts added yet.
        </p>
      )}
    </div>
  )
}
