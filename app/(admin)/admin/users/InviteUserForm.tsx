'use client'

import { useState } from 'react'
import { invitePortalUser } from './actions'

type Show = { id: string; title: string }

export default function InviteUserForm({ shows }: { shows: Show[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await invitePortalUser(new FormData(e.currentTarget))
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false) }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: '2px',
    padding: '10px 14px',
    color: 'var(--warm-white)',
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.6rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    fontWeight: 600,
    marginBottom: '6px',
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <span>Invite User</span>
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }} onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div style={{
            background: 'var(--deep)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '40px',
            width: '100%',
            maxWidth: '480px',
          }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
              Invite User
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '32px' }}>
              They&apos;ll receive a magic link to set up their account.
            </p>

            {done ? (
              <p style={{ color: 'var(--gold)', fontSize: '0.88rem', textAlign: 'center', padding: '24px 0' }}>
                Invite sent.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <label>
                    <span style={labelStyle}>Name</span>
                    <input name="name" required style={inputStyle} />
                  </label>
                  <label>
                    <span style={labelStyle}>Email</span>
                    <input name="email" type="email" required style={inputStyle} />
                  </label>
                </div>

                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <span style={labelStyle}>Phone (optional)</span>
                  <input name="phone" type="tel" style={inputStyle} />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <label>
                    <span style={labelStyle}>Show (optional)</span>
                    <select name="show_id" style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">— none —</option>
                      {shows.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span style={labelStyle}>Show Role</span>
                    <select name="show_role" style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="parent">Parent</option>
                      <option value="cast">Cast</option>
                      <option value="crew">Crew</option>
                    </select>
                  </label>
                </div>

                <label style={{ display: 'block', marginBottom: '28px' }}>
                  <span style={labelStyle}>Portal Role</span>
                  <select name="portal_role" style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="user">User</option>
                    <option value="organizer">Organizer</option>
                  </select>
                </label>

                {error && (
                  <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '16px' }}>{error}</p>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
                  >
                    <span>{loading ? 'Sending…' : 'Send Invite'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: '2px',
                      color: 'var(--muted)',
                      fontSize: '0.78rem',
                      padding: '10px 20px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
