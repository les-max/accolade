'use client'

import { useState, useTransition } from 'react'
import {
  saveTicketOptionGroup,
  deleteTicketOptionGroup,
  saveTicketOption,
  deleteTicketOption,
} from './ticket-actions'

export type TicketOptionItem = { id: string; name: string; sort_order: number }
export type OptionGroup = {
  id: string
  name: string
  required: boolean
  sort_order: number
  ticket_options: TicketOptionItem[]
}

type PerfWithOptions = {
  ticketPerformanceId: string
  date: string
  start_time: string | null
  label: string | null
  groups: OptionGroup[]
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
  boxSizing: 'border-box',
  colorScheme: 'dark',
}

export default function TicketOptionManager({
  slug,
  performances,
}: {
  slug: string
  performances: PerfWithOptions[]
}) {
  const [isPending, startTransition] = useTransition()
  const [newGroupName, setNewGroupName] = useState<Record<string, string>>({})
  const [newOptionName, setNewOptionName] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  if (performances.length === 0) return null

  function addGroup(ticketPerformanceId: string) {
    const name = (newGroupName[ticketPerformanceId] ?? '').trim()
    if (!name) return
    setError('')
    startTransition(async () => {
      try {
        await saveTicketOptionGroup(ticketPerformanceId, name, slug)
        setNewGroupName(s => ({ ...s, [ticketPerformanceId]: '' }))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error saving group')
      }
    })
  }

  function removeGroup(groupId: string) {
    if (!confirm('Delete this option group and all its choices?')) return
    setError('')
    startTransition(async () => {
      try {
        await deleteTicketOptionGroup(groupId, slug)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting group')
      }
    })
  }

  function addOption(groupId: string, sortOrder: number) {
    const name = (newOptionName[groupId] ?? '').trim()
    if (!name) return
    setError('')
    startTransition(async () => {
      try {
        await saveTicketOption(groupId, name, sortOrder, slug)
        setNewOptionName(s => ({ ...s, [groupId]: '' }))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error saving option')
      }
    })
  }

  function removeOption(optionId: string) {
    setError('')
    startTransition(async () => {
      try {
        await deleteTicketOption(optionId, slug)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting option')
      }
    })
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Ticket Options
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '6px' }}>
            Define choices buyers must make per ticket (e.g. meal selection for a dinner show).
          </p>
        </div>

        {performances.map((perf, pi) => (
          <div
            key={perf.ticketPerformanceId}
            style={{
              padding: '20px 24px',
              borderBottom: pi < performances.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            {/* Performance label */}
            <p style={{ fontSize: '0.82rem', color: 'var(--warm-white)', marginBottom: '16px', fontWeight: 500 }}>
              {formatDate(perf.date)}
              {perf.start_time && (
                <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {formatTime(perf.start_time)}</span>
              )}
              {perf.label && (
                <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {perf.label}</span>
              )}
            </p>

            {/* Existing groups */}
            {perf.groups.map(group => (
              <div
                key={group.id}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '16px',
                  marginBottom: '12px',
                }}
              >
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--warm-white)', fontWeight: 600 }}>{group.name}</span>
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.6rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: group.required ? 'var(--teal)' : 'var(--muted)',
                    }}>
                      {group.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGroup(group.id)}
                    disabled={isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      padding: '2px 6px',
                    }}
                  >
                    Remove group
                  </button>
                </div>

                {/* Existing options */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {group.ticket_options
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(opt => (
                      <div
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          border: '1px solid var(--border)',
                          borderRadius: '2px',
                          fontSize: '0.82rem',
                          color: 'var(--warm-white)',
                        }}
                      >
                        {opt.name}
                        <button
                          type="button"
                          onClick={() => removeOption(opt.id)}
                          disabled={isPending}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            lineHeight: 1,
                            padding: '0 2px',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>

                {/* Add option */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Add a choice (e.g. Chicken)"
                    value={newOptionName[group.id] ?? ''}
                    onChange={e => setNewOptionName(s => ({ ...s, [group.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addOption(group.id, group.ticket_options.length)}
                    disabled={isPending}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => addOption(group.id, group.ticket_options.length)}
                    disabled={isPending || !(newOptionName[group.id] ?? '').trim()}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(61,158,140,0.15)',
                      border: '1px solid rgba(61,158,140,0.3)',
                      borderRadius: '2px',
                      color: 'var(--teal)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      opacity: isPending || !(newOptionName[group.id] ?? '').trim() ? 0.5 : 1,
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}

            {/* Add new group */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="New option group name (e.g. Meal Choice)"
                value={newGroupName[perf.ticketPerformanceId] ?? ''}
                onChange={e => setNewGroupName(s => ({ ...s, [perf.ticketPerformanceId]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addGroup(perf.ticketPerformanceId)}
                disabled={isPending}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => addGroup(perf.ticketPerformanceId)}
                disabled={isPending || !(newGroupName[perf.ticketPerformanceId] ?? '').trim()}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(61,158,140,0.15)',
                  border: '1px solid rgba(61,158,140,0.3)',
                  borderRadius: '2px',
                  color: 'var(--teal)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: isPending || !(newGroupName[perf.ticketPerformanceId] ?? '').trim() ? 0.5 : 1,
                }}
              >
                Add Group
              </button>
            </div>
          </div>
        ))}

        {error && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--rose)' }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
