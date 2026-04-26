'use client'

import { useState, useTransition } from 'react'
import { sendShowEmail } from './send-actions'

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '12px 16px',
  color: 'var(--warm-white)',
  fontSize: '0.88rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  display: 'block',
  marginBottom: '8px',
}

export default function EmailComposer({
  showId,
  showTitle,
  memberGroups,
  auditionerCount,
}: {
  showId: string
  showTitle: string
  memberGroups: { label: string; count: number }[]
  auditionerCount: number
}) {
  const allGroups = [
    ...memberGroups,
    { label: 'auditioners', count: auditionerCount },
  ]

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const [error, setError] = useState('')

  function toggleGroup(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setResult(null)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)
    startTransition(async () => {
      try {
        const res = await sendShowEmail({
          showId,
          showTitle,
          groups: Array.from(selected),
          subject,
          body,
        })
        setResult(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Send failed')
      }
    })
  }

  return (
    <form onSubmit={handleSend} style={{ maxWidth: '680px' }}>

      <div style={{ marginBottom: '28px' }}>
        <span style={labelStyle}>Send To</span>
        {allGroups.length === 1 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            No roster members yet. Add members in the Roster section, or send to Auditioners.
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {allGroups.map(g => {
            const on = selected.has(g.label)
            const displayLabel = g.label === 'auditioners' ? 'Auditioners' : g.label
            return (
              <button
                key={g.label}
                type="button"
                onClick={() => toggleGroup(g.label)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${on ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: '2px',
                  background: on ? 'rgba(61,158,140,0.12)' : 'rgba(255,255,255,0.04)',
                  color: on ? 'var(--teal)' : 'var(--muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {displayLabel}
                <span style={{
                  background: on ? 'rgba(61,158,140,0.2)' : 'rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.68rem',
                  color: on ? 'var(--teal)' : 'var(--muted-dim)',
                }}>
                  {g.count}
                </span>
              </button>
            )
          })}
        </div>
        {selected.size > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '10px' }}>
            {Array.from(selected).map(id => {
              const g = allGroups.find(x => x.label === id)
              return `${g?.count ?? 0} ${id === 'auditioners' ? 'auditioners' : id}`
            }).join(', ')} — deduplicated before send
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Subject</label>
        <input
          type="text"
          required
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Schedule change for Tuesday rehearsal"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '28px' }}>
        <label style={labelStyle}>Message</label>
        <textarea
          required
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={10}
          placeholder={"Hi everyone,\n\nJust a reminder that Tuesday's rehearsal has moved to 6:30pm.\n\nSee you there!"}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
        />
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '6px' }}>
          Plain text. Blank lines become paragraph breaks.
        </p>
      </div>

      {error && <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '16px' }}>{error}</p>}
      {result && (
        <p style={{ color: 'var(--teal)', fontSize: '0.82rem', marginBottom: '16px' }}>
          Sent to {result.sent} recipient{result.sent !== 1 ? 's' : ''}.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || selected.size === 0 || !subject.trim() || !body.trim()}
        className="btn-primary"
        style={{ padding: '12px 32px', opacity: (isPending || selected.size === 0) ? 0.5 : 1 }}
      >
        <span>{isPending ? 'Sending…' : 'Send Email'}</span>
      </button>
    </form>
  )
}
