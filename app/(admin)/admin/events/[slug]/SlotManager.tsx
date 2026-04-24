'use client'

import { useState, useTransition } from 'react'
import { addSlot, updateSlot, deleteSlot, setWaitlistForAllSlots } from './actions'

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

type Slot = {
  id: string
  label: string
  start_time: string | null
  end_time: string | null
  capacity: number
  waitlist_enabled: boolean
}

type Show = { id: string; audition_type: string }

function formatSlotTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatWindowLabel(startIso: string, endTime24: string): string {
  const d = new Date(startIso)
  const base = d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  if (!endTime24) return base
  const [h, m] = endTime24.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  const min  = m === 0 ? '' : `:${String(m).padStart(2, '0')}`
  return `${base} – ${hour}${min}${ampm}`
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseIsoToTimeParts(iso: string | null): { hour: string; min: string; ampm: 'AM' | 'PM' } {
  if (!iso) return { hour: '9', min: '0', ampm: 'AM' }
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { hour: '9', min: '0', ampm: 'AM' }
  const h24 = d.getHours()
  const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM'
  const hour = String(h24 % 12 || 12)
  const min  = String(d.getMinutes())
  return { hour, min, ampm }
}

function time24(hour: string, min: string, ampm: 'AM' | 'PM'): string {
  let h = Number(hour)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// Combines a date input + time picker, outputs a hidden input with ISO datetime value
function WindowTimePicker({
  label,
  name,
  defaultIso,
}: {
  label: string
  name: string
  defaultIso: string | null
}) {
  const parts = parseIsoToTimeParts(defaultIso)
  const defaultDate = defaultIso ? toDatetimeLocal(defaultIso).slice(0, 10) : ''

  const [date, setDate]   = useState(defaultDate)
  const [hour, setHour]   = useState(parts.hour)
  const [min,  setMin]    = useState(parts.min)
  const [ampm, setAmpm]   = useState<'AM' | 'PM'>(parts.ampm)

  const isoValue = date ? `${date}T${time24(hour, min, ampm)}` : ''

  return (
    <div>
      <span style={labelStyle}>{label} *</span>
      <input type="hidden" name={name} value={isoValue} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          type="date"
          required
          value={date}
          onChange={e => setDate(e.target.value)}
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <select value={hour} onChange={e => setHour(e.target.value)} style={selectStyle}>
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span style={{ color: 'var(--muted)' }}>:</span>
          <select value={min} onChange={e => setMin(e.target.value)} style={selectStyle}>
            {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setAmpm(p => p === 'AM' ? 'PM' : 'AM')}
            style={{
              padding: '9px 10px', border: '1px solid var(--border)', borderRadius: '2px',
              background: 'rgba(255,255,255,0.04)', color: 'var(--warm-white)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', minWidth: '46px',
            }}
          >
            {ampm}
          </button>
        </div>
      </div>
    </div>
  )
}

type SlotFormProps = {
  isSlot: boolean
  slug: string
  onCancel: () => void
  onDone: () => void
  waitlistEnabled?: boolean
  editingSlot?: Slot
  showId?: string
}

function SlotForm({ isSlot, slug, onCancel, onDone, waitlistEnabled, editingSlot, showId }: SlotFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  // Only used for specific time slots (per-slot waitlist)
  const [slotWaitlist, setSlotWaitlist] = useState(editingSlot?.waitlist_enabled ?? false)

  const isEdit = !!editingSlot

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)

    if (isSlot) {
      data.set('capacity', '1')
      data.set('waitlist_enabled', String(slotWaitlist))
      const startTime = data.get('start_time') as string
      const label = (data.get('label') as string).trim()
      if (!label && startTime) data.set('label', formatSlotTime(startTime))
    } else {
      // For windows: waitlist is controlled at section level; use passed-in value
      data.set('waitlist_enabled', String(waitlistEnabled ?? false))
      const startTime = data.get('start_time') as string
      const endTime   = data.get('end_time') as string
      const label     = (data.get('label') as string).trim()
      if (!label && startTime) data.set('label', formatWindowLabel(startTime, endTime))
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateSlot(editingSlot.id, slug, data)
        } else {
          await addSlot(showId!, data)
        }
        onDone()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error saving')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '24px', background: 'rgba(212,168,83,0.03)', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>
        {isEdit ? `Edit ${isSlot ? 'Slot' : 'Window'}` : `Add ${isSlot ? 'Slot' : 'Window'}`}
      </p>

      {isSlot ? (
        /* ── Specific time slot ── */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <label>
            <span style={labelStyle}>Date & Time *</span>
            <input
              name="start_time" type="datetime-local" required
              defaultValue={toDatetimeLocal(editingSlot?.start_time ?? null)}
              style={inputStyle}
            />
          </label>
          <label>
            <span style={labelStyle}>Label <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(auto-fills from time)</span></span>
            <input name="label" type="text" placeholder="e.g. 9:00am Saturday" defaultValue={editingSlot?.label ?? ''} style={inputStyle} />
          </label>
        </div>
      ) : (
        /* ── Audition window ── */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <WindowTimePicker label="Start" name="start_time" defaultIso={editingSlot?.start_time ?? null} />
          <WindowTimePicker label="End"   name="end_time"   defaultIso={editingSlot?.end_time ?? null} />
          <label>
            <span style={labelStyle}>Capacity *</span>
            <input name="capacity" type="number" min={1} defaultValue={editingSlot?.capacity ?? 10} required style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>Label <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(auto-fills)</span></span>
            <input name="label" type="text" placeholder="e.g. Saturday Morning" defaultValue={editingSlot?.label ?? ''} style={inputStyle} />
          </label>
        </div>
      )}

      {/* Waitlist toggle — per slot only for specific time slots */}
      {isSlot && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', cursor: 'pointer' }}>
          <div
            onClick={() => setSlotWaitlist(!slotWaitlist)}
            style={{
              width: '36px', height: '20px', borderRadius: '10px',
              background: slotWaitlist ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
              position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: '2px', left: slotWaitlist ? '18px' : '2px',
              width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s',
            }} />
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--warm-white)' }}>Enable waitlist when full</span>
        </label>
      )}

      {error && <p style={{ color: 'var(--rose)', fontSize: '0.78rem', marginBottom: '12px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '12px 28px', opacity: isPending ? 0.6 : 1 }}>
          <span>{isPending ? 'Saving…' : isEdit ? 'Save' : 'Add'}</span>
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ padding: '12px 20px' }}>
          <span>Cancel</span>
        </button>
      </div>
    </form>
  )
}

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
  const isSlot = show.audition_type === 'slot'

  // Section-level waitlist toggle for windows
  const [waitlistEnabled, setWaitlistEnabled] = useState(
    slots.length > 0 ? slots[0].waitlist_enabled : false
  )
  const [waitlistPending, startWaitlistTransition] = useTransition()

  function handleWaitlistToggle() {
    const next = !waitlistEnabled
    setWaitlistEnabled(next)
    startWaitlistTransition(async () => {
      await setWaitlistForAllSlots(show.id, slug, next)
    })
  }

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(slotId: string) {
    startTransition(async () => {
      await deleteSlot(slotId, slug)
    })
  }

  const sectionLabel = isSlot ? 'Audition Slots' : 'Audition Windows'
  const addLabel     = isSlot ? 'Add Slot' : 'Add Window'

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px',
          borderBottom: slots.length > 0 || showAddForm ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {sectionLabel}
            </p>
            {/* Section-level waitlist toggle — windows only */}
            {!isSlot && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                onClick={handleWaitlistToggle}
              >
                <div style={{
                  width: '32px', height: '18px', borderRadius: '9px',
                  background: waitlistEnabled ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                  position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                  opacity: waitlistPending ? 0.6 : 1,
                }}>
                  <div style={{
                    position: 'absolute', top: '2px', left: waitlistEnabled ? '16px' : '2px',
                    width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                  }} />
                </div>
                <span style={{ fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  Waitlist {waitlistEnabled ? 'On' : 'Off'}
                </span>
              </label>
            )}
          </div>
          {!showAddForm && (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null) }}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer' }}
            >
              + {addLabel}
            </button>
          )}
        </div>

        {/* Slot list */}
        {slots.length > 0 && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isSlot ? '1fr 80px 80px 72px' : '1fr 80px 80px 72px',
              padding: '10px 24px', gap: '16px',
              borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
            }}>
              {(isSlot
                ? ['Time Slot', 'Status', 'Waitlist', '']
                : ['Window', 'Capacity', 'Registered', '']
              ).map(h => (
                <span key={h} style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
              ))}
            </div>

            {slots.map((slot, i) => {
              const count = countBySlot[slot.id] ?? 0
              const full = count >= slot.capacity
              const isEditing = editingId === slot.id
              const isLast = i === slots.length - 1

              return (
                <div key={slot.id}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isSlot ? '1fr 80px 80px 72px' : '1fr 80px 80px 72px',
                    padding: '14px 24px', gap: '16px', alignItems: 'center',
                    borderBottom: (!isLast || showAddForm || isEditing) ? '1px solid var(--border)' : 'none',
                    background: isEditing ? 'rgba(212,168,83,0.03)' : 'transparent',
                  }}>
                    <p style={{ fontSize: '0.85rem' }}>{slot.label}</p>
                    {isSlot ? (
                      <p style={{ fontSize: '0.78rem', color: full ? 'var(--rose)' : 'var(--teal)', letterSpacing: '0.05em' }}>
                        {full ? 'Full' : 'Open'}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{slot.capacity}</p>
                    )}
                    {isSlot ? (
                      <p style={{ fontSize: '0.75rem', color: slot.waitlist_enabled ? 'var(--teal)' : 'var(--muted)' }}>
                        {slot.waitlist_enabled ? 'On' : 'Off'}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: full ? 'var(--rose)' : 'var(--warm-white)' }}>
                        {count} / {slot.capacity}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setEditingId(isEditing ? null : slot.id); setShowAddForm(false) }}
                        style={{ background: 'none', border: 'none', color: isEditing ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.08em', padding: 0 }}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        disabled={isPending}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <SlotForm
                      isSlot={isSlot}
                      slug={slug}
                      editingSlot={slot}
                      waitlistEnabled={waitlistEnabled}
                      onCancel={() => setEditingId(null)}
                      onDone={() => setEditingId(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {slots.length === 0 && !showAddForm && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No {isSlot ? 'slots' : 'windows'} yet.</p>
          </div>
        )}

        {showAddForm && (
          <SlotForm
            isSlot={isSlot}
            slug={slug}
            showId={show.id}
            waitlistEnabled={waitlistEnabled}
            onCancel={() => setShowAddForm(false)}
            onDone={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  )
}
