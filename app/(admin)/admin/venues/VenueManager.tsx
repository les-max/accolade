'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createVenue, updateVenue, deleteVenue } from './actions'

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

type Venue = {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
}

function VenueForm({
  initial,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  initial?: Venue
  onSave: (fd: FormData) => void
  onCancel: () => void
  isPending: boolean
  error: string
}) {
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(new FormData(e.currentTarget)) }}
      style={{ padding: '24px', background: 'rgba(212,168,83,0.03)', borderTop: '1px solid var(--border)' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '16px' }}>
        <label>
          <span style={labelStyle}>Name</span>
          <input name="name" type="text" required defaultValue={initial?.name ?? ''} placeholder="e.g. Accolade Black Box Theatre" style={inputStyle} />
        </label>
        <label>
          <span style={labelStyle}>Street Address <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
          <input name="address" type="text" defaultValue={initial?.address ?? ''} placeholder="e.g. 123 Main St" style={inputStyle} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '12px' }}>
          <label>
            <span style={labelStyle}>City</span>
            <input name="city" type="text" defaultValue={initial?.city ?? ''} placeholder="Richardson" style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>State</span>
            <input name="state" type="text" defaultValue={initial?.state ?? ''} placeholder="TX" style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>ZIP</span>
            <input name="zip" type="text" defaultValue={initial?.zip ?? ''} placeholder="75080" style={inputStyle} />
          </label>
        </div>
      </div>

      {error && <p style={{ color: 'var(--rose)', fontSize: '0.78rem', marginBottom: '12px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '12px 28px', opacity: isPending ? 0.6 : 1 }}>
          <span>{isPending ? 'Saving…' : initial ? 'Save Changes' : 'Add Venue'}</span>
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ padding: '12px 20px' }}>
          <span>Cancel</span>
        </button>
      </div>
    </form>
  )
}

export default function VenueManager({ venues }: { venues: Venue[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const router = useRouter()

  function handleCreate(fd: FormData) {
    setError('')
    startTransition(async () => {
      try {
        await createVenue(fd)
        setShowAdd(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error saving venue')
      }
    })
  }

  function handleUpdate(id: string, fd: FormData) {
    setError('')
    startTransition(async () => {
      try {
        await updateVenue(id, fd)
        setEditingId(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error saving venue')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Remove this venue? Events linked to it will lose their venue.')) return
    startTransition(async () => {
      await deleteVenue(id)
      router.refresh()
    })
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px',
        borderBottom: venues.length > 0 || showAdd ? '1px solid var(--border)' : 'none',
        background: 'var(--layer)',
      }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          {venues.length} {venues.length === 1 ? 'Venue' : 'Venues'}
        </p>
        {!showAdd && (
          <button
            onClick={() => { setShowAdd(true); setEditingId(null) }}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer' }}
          >
            + Add Venue
          </button>
        )}
      </div>

      {/* Venue list */}
      {venues.map((venue, i) => (
        <div key={venue.id}>
          <div style={{
            padding: '18px 24px',
            borderBottom: i < venues.length - 1 || showAdd ? '1px solid var(--border)' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
          }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '3px' }}>{venue.name}</p>
              {(venue.address || venue.city) && (
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {[venue.address, venue.city, venue.state, venue.zip].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
              <button
                onClick={() => { setEditingId(venue.id); setShowAdd(false) }}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(venue.id)}
                disabled={isPending}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}
              >
                Remove
              </button>
            </div>
          </div>
          {editingId === venue.id && (
            <VenueForm
              initial={venue}
              onSave={fd => handleUpdate(venue.id, fd)}
              onCancel={() => { setEditingId(null); setError('') }}
              isPending={isPending}
              error={error}
            />
          )}
        </div>
      ))}

      {venues.length === 0 && !showAdd && (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No venues yet.</p>
        </div>
      )}

      {showAdd && (
        <VenueForm
          onSave={handleCreate}
          onCancel={() => { setShowAdd(false); setError('') }}
          isPending={isPending}
          error={error}
        />
      )}
    </div>
  )
}
