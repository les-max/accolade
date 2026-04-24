'use client'

import { useState } from 'react'

export type PerformanceRow = {
  id: string
  type: 'performance' | 'audition' | 'callback'
  date: string
  start_time: string
  label: string
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '10px 12px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  display: 'block',
  marginBottom: '5px',
}

type Props = {
  allowedTypes: { value: PerformanceRow['type']; label: string }[]
  fieldName?: string
}

export default function PerformancesInput({ allowedTypes, fieldName = 'performances' }: Props) {
  const [rows, setRows] = useState<PerformanceRow[]>([])

  function addRow() {
    setRows(r => [...r, {
      id: crypto.randomUUID(),
      type: allowedTypes[0].value,
      date: '',
      start_time: '',
      label: '',
    }])
  }

  function updateRow(id: string, patch: Partial<PerformanceRow>) {
    setRows(r => r.map(row => row.id === id ? { ...row, ...patch } : row))
  }

  function removeRow(id: string) {
    setRows(r => r.filter(row => row.id !== id))
  }

  return (
    <div>
      <input type="hidden" name={fieldName} value={JSON.stringify(rows)} />

      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {rows.map(row => (
            <div key={row.id} style={{
              display: 'grid',
              gridTemplateColumns: allowedTypes.length > 1 ? '120px 1fr 1fr 1fr auto' : '1fr 1fr 1fr auto',
              gap: '10px',
              alignItems: 'end',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              padding: '14px',
            }}>
              {allowedTypes.length > 1 && (
                <div>
                  <span style={labelStyle}>Type</span>
                  <select
                    value={row.type}
                    onChange={e => updateRow(row.id, { type: e.target.value as PerformanceRow['type'] })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {allowedTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <span style={labelStyle}>Date</span>
                <input
                  type="date"
                  value={row.date}
                  onChange={e => updateRow(row.id, { date: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>Time</span>
                <input
                  type="time"
                  value={row.start_time}
                  onChange={e => updateRow(row.id, { start_time: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>Label <span style={{ opacity: 0.5 }}>(optional)</span></span>
                <input
                  type="text"
                  value={row.label}
                  onChange={e => updateRow(row.id, { label: e.target.value })}
                  placeholder={row.type === 'performance' ? 'e.g. Opening Night' : row.type === 'callback' ? 'e.g. Callbacks' : ''}
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '2px', color: 'var(--muted)',
                  padding: '10px 12px', cursor: 'pointer', fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        style={{
          background: 'none',
          border: '1px dashed var(--border)',
          borderRadius: '2px',
          color: 'var(--muted)',
          fontSize: '0.72rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '10px 20px',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        + Add {allowedTypes[0].label}
      </button>
    </div>
  )
}
