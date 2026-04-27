'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { addShowMember, removeShowMember, searchFamiliesByName } from './roster-actions'

type Member = {
  id: string
  show_role: string
  families: { parent_name: string; email: string }
}

type SearchResult = {
  id: string
  parent_name: string
  email: string
  children: string[]
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

const ROLE_SUGGESTIONS = ['Cast A', 'Cast B', 'Crew', 'Pit Band', 'Orchestra', 'Volunteer', 'Stage Crew', 'Light/Sound']

export default function RosterManager({
  showId,
  slug,
  members,
}: {
  showId: string
  slug: string
  members: Member[]
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [role, setRole] = useState('Cast')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selected || query.length < 2) {
      setDropdownOpen(false)
      return
    }
    setDropdownOpen(true)
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchFamiliesByName(query)
        setResults(res)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, selected])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(r: SearchResult) {
    setSelected(r)
    setQuery('')
    setResults([])
    setDropdownOpen(false)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    setResults([])
    setDropdownOpen(false)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !role.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await addShowMember(showId, slug, selected.id, role.trim())
        setSelected(null)
        setQuery('')
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

  const groups = Array.from(new Set(members.map(m => m.show_role))).sort()
  const byRole = Object.fromEntries(groups.map(g => [g, members.filter(m => m.show_role === g)]))

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Roster
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

            {/* Name search with dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              {selected ? (
                <div style={{
                  ...inputStyle,
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default',
                }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.parent_name}
                    {selected.children.length > 0 && (
                      <span style={{ color: 'var(--muted)', marginLeft: '6px', fontSize: '0.78rem' }}>
                        — {selected.children.join(', ')}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Search by parent or child name..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoComplete="off"
                  style={inputStyle}
                />
              )}

              {dropdownOpen && !selected && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '2px',
                  marginTop: '2px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  {searching ? (
                    <div style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.82rem' }}>Searching...</div>
                  ) : results.length === 0 ? (
                    <div style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.82rem' }}>No matches found</div>
                  ) : (
                    results.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelect(r)}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none',
                          padding: '10px 16px', cursor: 'pointer', color: 'var(--warm-white)',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'none')}
                      >
                        <p style={{ fontSize: '0.85rem', margin: 0 }}>{r.parent_name}</p>
                        {r.children.length > 0 && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', margin: '2px 0 0' }}>
                            {r.children.join(', ')}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Role/group input */}
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

            <button
              type="submit"
              disabled={isPending || !selected}
              className="btn-primary"
              style={{ padding: '10px 20px', opacity: (isPending || !selected) ? 0.6 : 1, whiteSpace: 'nowrap' }}
            >
              <span>{isPending ? 'Adding…' : '+ Add'}</span>
            </button>
          </div>
          {error && <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginTop: '6px' }}>{error}</p>}
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '8px' }}>
            Search by parent or child name. Type any group name or choose from suggestions.
          </p>
        </form>
      </div>
    </div>
  )
}
