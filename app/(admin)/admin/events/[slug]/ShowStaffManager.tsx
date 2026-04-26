'use client'

import { useTransition, useState } from 'react'
import { addShowStaff, removeShowStaff } from './staff-actions'

interface StaffMember {
  id: string
  role: string
  admin_users: { id: string; email: string }
}

interface AvailableStaff {
  id: string
  email: string
  role: string
}

interface Props {
  showId: string
  slug: string
  currentStaff: StaffMember[]
  availableStaff: AvailableStaff[]
}

const ROLE_LABEL: Record<string, string> = {
  director: 'Director',
  production_manager: 'Production Manager',
}

export default function ShowStaffManager({ showId, slug, currentStaff, availableStaff }: Props) {
  const [pending, startTransition] = useTransition()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'director' | 'production_manager'>('director')
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    if (!selectedUserId) return
    setError(null)
    startTransition(async () => {
      try {
        await addShowStaff(showId, selectedUserId, selectedRole, slug)
        setSelectedUserId('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to add staff')
      }
    })
  }

  function handleRemove(staffId: string) {
    startTransition(async () => {
      await removeShowStaff(staffId, slug)
    })
  }

  const SELECT: React.CSSProperties = {
    padding: '8px 10px',
    background: 'var(--ink)',
    border: '1px solid var(--border)',
    borderRadius: '2px',
    color: 'var(--warm-white)',
    fontSize: '0.8rem',
  }

  return (
    <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px', marginBottom: '32px' }}>
      <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
        Show Staff
      </p>

      {currentStaff.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentStaff.map(member => (
            <div key={member.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>{member.admin_users.email}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginLeft: '12px' }}>
                  {ROLE_LABEL[member.role] ?? member.role}
                </span>
              </div>
              <button
                onClick={() => handleRemove(member.id)}
                disabled={pending}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.1em' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {currentStaff.length === 0 && availableStaff.length === 0 && (
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '12px' }}>No director/PM users exist yet. Create them in Users first.</p>
      )}

      {availableStaff.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ ...SELECT, flex: 1, minWidth: '180px' }}>
            <option value="">Select staff member</option>
            {availableStaff.map(s => (
              <option key={s.id} value={s.id}>{s.email}</option>
            ))}
          </select>
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as 'director' | 'production_manager')} style={SELECT}>
            <option value="director">Director</option>
            <option value="production_manager">Production Manager</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={pending || !selectedUserId}
            className="btn-primary"
            style={{ fontSize: '0.72rem' }}
          >
            <span>Add</span>
          </button>
        </div>
      )}

      {error && <p style={{ fontSize: '0.75rem', color: 'var(--rose)', marginTop: '8px' }}>{error}</p>}
    </div>
  )
}
