'use client'

import { useState, useTransition } from 'react'
import { addShowMember, removeShowMember } from './roster-actions'

type Member = {
  id: string
  show_role: string
  families: { parent_name: string; email: string }
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '10px 14px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  flex: 1,
  boxSizing: 'border-box',
}

const ROLE_SUGGESTIONS = ['Cast A', 'Cast B', 'Crew', 'Pit Band', 'Orchestra', 'Parent Volunteer', 'Stage Crew', 'Light/Sound']

export default function RosterManager({
  showId,
  slug,
  members,
}: {
  showId: string
  slug: string
  members: Member[]
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Cast')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !role.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await addShowMember(showId, slug, email, role.trim())
        setEmail('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add member')
      }
    })
  }

  function handleRemove(memberId: string) {
    startTransition(async () => {
      await removeShowMember(memberId, slug)
    })
  }

  // Group members by their show_role label
  const groups = Array.from(new Set(members.map(m => m.show_role))).sort()
  const byRole = Object.fromEntries(groups.map(g => [g, members.filter(m => m.show_role === g)]))

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Cast &amp; Crew Roster
          </p>
        </div>

        {/* Member list grouped by role label */}
        {members.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No members added yet.</p>
          </div>
        ) : (
          <div>
            {groups.map(r => {
              const group = byRole[r]
              return (
                <div key={r} style={{ borderBottom: '1px solid var(--border)' }}>
                  <div style={{ padding: '10px 24px', background: 'rgba(0,0,0,0.2)' }}>
                    <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--teal)' }}>
                      {r} ({group.length})
                    </span>
                  </div>
                  {group.map(m => (
                    <div key={m.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div>
                        <p style={{ fontSize: '0.88rem' }}>{m.families.parent_name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>{m.families.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(m.id)}
                        disabled={isPending}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} style={{ padding: '20px 24px', borderTop: members.length > 0 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: error ? '8px' : 0 }}>
            <input
              type="email"
              required
              placeholder="family@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ ...inputStyle, minWidth: '220px' }}
            />
            {/* Free-text group input with suggestions */}
            <input
              type="text"
              required
              list="role-suggestions"
              placeholder="Group (e.g. Cast A)"
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ ...inputStyle, minWidth: '140px', flex: '0 1 auto' }}
            />
            <datalist id="role-suggestions">
              {ROLE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              {groups.filter(g => !ROLE_SUGGESTIONS.includes(g)).map(g => <option key={g} value={g} />)}
            </datalist>
            <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '10px 20px', opacity: isPending ? 0.6 : 1, whiteSpace: 'nowrap' }}>
              <span>{isPending ? 'Adding…' : '+ Add'}</span>
            </button>
          </div>
          {error && <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginTop: '6px' }}>{error}</p>}
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '8px' }}>
            Enter the email address of a family with an existing account. Type any group name or choose from suggestions.
          </p>
        </form>
      </div>
    </div>
  )
}
