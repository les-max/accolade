'use client'

import { useState, useTransition } from 'react'
import {
  createVolunteerPosition,
  updateVolunteerPosition,
  deleteVolunteerPosition,
  setVolunteersPublished,
  removeVolunteerSignup,
  type VolunteerPosition,
  type VolunteerSignup,
} from './volunteer-actions'

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

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
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

const EMPTY_FORM = { name: '', description: '', capacity: 1, position_type: 'open' as 'open' | 'assigned' }

interface SignupWithFamily extends VolunteerSignup {
  families: { parent_name: string; email: string } | null
}

interface PositionWithSignups extends VolunteerPosition {
  signups: SignupWithFamily[]
}

export default function VolunteerPositionsManager({
  showId,
  slug,
  published,
  positions,
}: {
  showId: string
  slug: string
  published: boolean
  positions: PositionWithSignups[]
}) {
  const [isPending, startTransition] = useTransition()
  const [isPublished, setIsPublished] = useState(published)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  function handleTogglePublish() {
    const next = !isPublished
    setIsPublished(next)
    startTransition(async () => {
      try {
        await setVolunteersPublished(showId, slug, next)
      } catch (e) {
        setIsPublished(!next)
        setError(e instanceof Error ? e.message : 'Failed to update')
      }
    })
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await createVolunteerPosition(showId, slug, form)
        setForm(EMPTY_FORM)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create position')
      }
    })
  }

  function startEdit(pos: PositionWithSignups) {
    setEditingId(pos.id)
    setEditForm({ name: pos.name, description: pos.description ?? '', capacity: pos.capacity, position_type: pos.position_type })
  }

  function handleUpdate(e: React.FormEvent, positionId: string) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await updateVolunteerPosition(positionId, slug, editForm)
        setEditingId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update')
      }
    })
  }

  function handleDelete(positionId: string) {
    if (!confirm('Delete this position? All signups will also be removed.')) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteVolunteerPosition(positionId, slug)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete')
      }
    })
  }

  function handleRemoveSignup(signupId: string) {
    startTransition(async () => {
      try {
        await removeVolunteerSignup(signupId, slug)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to remove signup')
      }
    })
  }

  return (
    <div>
      {/* Publish toggle */}
      <div style={{
        background: 'var(--layer)',
        border: `1px solid ${isPublished ? 'rgba(212,168,83,0.4)' : 'var(--border)'}`,
        borderRadius: '4px',
        padding: '20px 24px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
            Portal Visibility
          </p>
          <p style={{ fontSize: '0.88rem', color: isPublished ? 'var(--gold)' : 'var(--muted)' }}>
            {isPublished
              ? 'Volunteer signups are live — families can see and claim positions'
              : 'Volunteer signups are hidden from families'}
          </p>
        </div>
        <button
          onClick={handleTogglePublish}
          disabled={isPending}
          style={{
            padding: '10px 20px',
            fontSize: '0.68rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 600,
            background: isPublished ? 'transparent' : 'var(--gold)',
            color: isPublished ? 'var(--rose)' : 'var(--black)',
            border: isPublished ? '1px solid var(--rose)' : 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPublished ? 'Unpublish' : 'Publish Positions'}
        </button>
      </div>

      {/* Existing positions */}
      {positions.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
            Positions ({positions.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {positions.map(pos => {
              const signupCount = pos.signups.length
              const spotsLeft = pos.capacity - signupCount
              return (
                <div key={pos.id} style={{
                  background: 'var(--layer)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  {editingId === pos.id ? (
                    <form onSubmit={(e) => handleUpdate(e, pos.id)} style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={labelStyle}>Position Name</label>
                          <input
                            style={inputStyle}
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={labelStyle}>Capacity</label>
                            <input
                              type="number"
                              min={1}
                              style={inputStyle}
                              value={editForm.capacity}
                              onChange={e => setEditForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Type</label>
                            <select
                              style={selectStyle}
                              value={editForm.position_type}
                              onChange={e => setEditForm(f => ({ ...f, position_type: e.target.value as 'open' | 'assigned' }))}
                            >
                              <option value="open">Open</option>
                              <option value="assigned">Assigned</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Description</label>
                        <textarea
                          style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                          value={editForm.description}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="What does this role involve? When are they needed?"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" disabled={isPending} className="btn-primary" style={{ fontSize: '0.68rem', padding: '10px 20px' }}>
                          <span>Save</span>
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="btn-ghost" style={{ fontSize: '0.68rem' }}>
                          <span>Cancel</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: pos.description ? '4px' : 0 }}>
                            <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>{pos.name}</p>
                            <span style={{
                              fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                              padding: '2px 8px', borderRadius: '2px',
                              background: pos.position_type === 'open' ? 'rgba(0,189,157,0.1)' : 'rgba(212,168,83,0.1)',
                              color: pos.position_type === 'open' ? 'var(--teal)' : 'var(--gold)',
                              border: `1px solid ${pos.position_type === 'open' ? 'rgba(0,189,157,0.3)' : 'rgba(212,168,83,0.3)'}`,
                            }}>
                              {pos.position_type}
                            </span>
                          </div>
                          {pos.description && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '6px' }}>{pos.description}</p>
                          )}
                          <p style={{ fontSize: '0.72rem', color: spotsLeft === 0 ? 'var(--rose)' : 'var(--muted)' }}>
                            {signupCount} / {pos.capacity} filled{spotsLeft > 0 ? ` · ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining` : ' · Full'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button onClick={() => startEdit(pos)} style={{
                            fontSize: '0.65rem', color: 'var(--gold)', background: 'transparent',
                            border: '1px solid rgba(212,168,83,0.3)', borderRadius: '2px',
                            padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.1em',
                          }}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(pos.id)} disabled={isPending} style={{
                            fontSize: '0.65rem', color: 'var(--rose)', background: 'transparent',
                            border: '1px solid rgba(220,53,69,0.3)', borderRadius: '2px',
                            padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.1em',
                          }}>
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Signups list */}
                      {pos.signups.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)' }}>
                          {pos.signups.map((signup, i) => (
                            <div key={signup.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 20px',
                              borderBottom: i < pos.signups.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              background: 'rgba(255,255,255,0.02)',
                            }}>
                              <div>
                                <p style={{ fontSize: '0.82rem' }}>{signup.families?.parent_name ?? '—'}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                                  {signup.families?.email ?? ''}
                                  {signup.assigned_by ? ' · Assigned' : ' · Self-signup'}
                                </p>
                              </div>
                              <button onClick={() => handleRemoveSignup(signup.id)} disabled={isPending} style={{
                                fontSize: '0.62rem', color: 'var(--muted)', background: 'transparent',
                                border: 'none', cursor: 'pointer', padding: '4px 8px',
                              }}>
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add new position form */}
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px 24px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>
          Add Position
        </p>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Position Name</label>
              <input
                style={inputStyle}
                placeholder="e.g. Usher, Front of House Lead"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Capacity</label>
                <input
                  type="number"
                  min={1}
                  style={inputStyle}
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select
                  style={selectStyle}
                  value={form.position_type}
                  onChange={e => setForm(f => ({ ...f, position_type: e.target.value as 'open' | 'assigned' }))}
                >
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              placeholder="What does this role involve? When are they needed?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          {error && (
            <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginBottom: '12px' }}>{error}</p>
          )}
          <button type="submit" disabled={isPending || !form.name.trim()} className="btn-primary" style={{ fontSize: '0.68rem', padding: '12px 24px' }}>
            <span>{isPending ? 'Saving…' : 'Add Position'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
