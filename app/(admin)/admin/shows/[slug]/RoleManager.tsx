'use client'

import { useState, useTransition } from 'react'
import { addRole, deleteRole } from './actions'

type Role = { id: string; role_name: string }
type Show = { id: string }

export default function RoleManager({
  show,
  roles,
  slug,
}: {
  show: Show
  roles: Role[]
  slug: string
}) {
  const [newRole, setNewRole] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newRole.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await addRole(show.id, newRole.trim(), slug)
        setNewRole('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding role')
      }
    })
  }

  function handleDelete(roleId: string) {
    startTransition(async () => {
      await deleteRole(roleId, slug)
    })
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        background: 'var(--layer)', border: '1px solid var(--border)',
        borderRadius: '4px', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Roles
          </p>
        </div>

        {/* Role list */}
        {roles.length > 0 && (
          <div style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)' }}>
            {roles.map(role => (
              <div key={role.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 12px',
                border: '1px solid var(--border)',
                borderRadius: '2px',
                fontSize: '0.78rem',
                color: 'var(--warm-white)',
              }}>
                {role.role_name}
                <button
                  onClick={() => handleDelete(role.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem' }}
                  title="Remove role"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add role form */}
        <form onSubmit={handleAdd} style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              placeholder="Role name (e.g. Jack Kelly, Ensemble)"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: '2px',
                padding: '10px 14px',
                color: 'var(--warm-white)',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {error && <p style={{ color: 'var(--rose)', fontSize: '0.72rem', marginTop: '6px' }}>{error}</p>}
          </div>
          <button
            type="submit"
            disabled={isPending || !newRole.trim()}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              color: 'var(--gold)',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '10px 18px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              opacity: isPending || !newRole.trim() ? 0.5 : 1,
            }}
          >
            + Add Role
          </button>
        </form>
      </div>
    </div>
  )
}
