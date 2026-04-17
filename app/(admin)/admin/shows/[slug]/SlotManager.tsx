'use client'

import { useState, useTransition } from 'react'
import { addSlot, deleteSlot } from './actions'

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

type Slot = {
  id: string
  label: string
  start_time: string | null
  end_time: string | null
  capacity: number
  waitlist_enabled: boolean
}

type Show = { id: string; audition_type: string }

export default function SlotManager({
  show,
  slots,
  countBySlot,
  slug,
}: {
  show: Show
  slots: Slot[]
  countBySlot: Record<string, number>
  slug: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [waitlist, setWaitlist] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    data.set('waitlist_enabled', String(waitlist))

    startTransition(async () => {
      try {
        await addSlot(show.id, data)
        form.reset()
        setWaitlist(true)
        setShowForm(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding slot')
      }
    })
  }

  function handleDelete(slotId: string) {
    startTransition(async () => {
      await deleteSlot(slotId, slug)
    })
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        background: 'var(--layer)', border: '1px solid var(--border)',
        borderRadius: '4px', overflow: 'hidden',
      }}>
        {/* Section header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: slots.length > 0 || showForm ? '1px solid var(--border)' : 'none',
        }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Audition {show.audition_type === 'slot' ? 'Slots' : 'Windows'}
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer' }}
            >
              + Add {show.audition_type === 'slot' ? 'Slot' : 'Window'}
            </button>
          )}
        </div>

        {/* Existing slots */}
        {slots.length > 0 && (
          <div>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 40px',
              padding: '10px 24px', gap: '16px',
              borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
            }}>
              {['Label', 'Capacity', 'Registered', 'Waitlist', ''].map(h => (
                <span key={h} style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
              ))}
            </div>
            {slots.map((slot, i) => {
              const count = countBySlot[slot.id] ?? 0
              const full = count >= slot.capacity
              return (
                <div key={slot.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 40px',
                  padding: '14px 24px', gap: '16px', alignItems: 'center',
                  borderBottom: i < slots.length - 1 || showForm ? '1px solid var(--border)' : 'none',
                }}>
                  <p style={{ fontSize: '0.85rem' }}>{slot.label}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{slot.capacity}</p>
                  <p style={{ fontSize: '0.82rem', color: full ? 'var(--rose)' : 'var(--warm-white)' }}>
                    {count} / {slot.capacity}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: slot.waitlist_enabled ? 'var(--teal)' : 'var(--muted)' }}>
                    {slot.waitlist_enabled ? 'On' : 'Off'}
                  </p>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                    title="Delete slot"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {slots.length === 0 && !showForm && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              No {show.audition_type === 'slot' ? 'slots' : 'windows'} yet.
            </p>
          </div>
        )}

        {/* Add slot form */}
        {showForm && (
          <form onSubmit={handleAdd} style={{ padding: '24px', background: 'rgba(212,168,83,0.03)' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>
              Add {show.audition_type === 'slot' ? 'Slot' : 'Window'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label style={{ gridColumn: '1 / -1' }}>
                <span style={labelStyle}>Label</span>
                <input name="label" type="text" required placeholder={show.audition_type === 'slot' ? 'e.g. 9:17am' : 'e.g. Saturday 10am–11:30am'} style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Start Time (optional)</span>
                <input name="start_time" type="datetime-local" style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>End Time (optional)</span>
                <input name="end_time" type="datetime-local" style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Capacity</span>
                <input name="capacity" type="number" min={1} defaultValue={10} required style={inputStyle} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
                <div
                  onClick={() => setWaitlist(!waitlist)}
                  style={{
                    width: '36px', height: '20px', borderRadius: '10px',
                    background: waitlist ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '2px',
                    left: waitlist ? '18px' : '2px',
                    width: '16px', height: '16px',
                    borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s',
                  }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--warm-white)' }}>Enable waitlist</span>
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
