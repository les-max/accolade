'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import {
  addShowMember,
  addShowMembersFromAuditions,
  addShowMembersFromCSV,
  removeShowMember,
  updateShowMemberPart,
  searchPeopleByName,
  type PersonSearchResult,
} from './roster-actions'

export type Member = {
  id: string
  show_role: string
  show_part: string | null
  person_name: string
  email: string | null
}

export type Auditioner = {
  id: string
  auditioner_name: string
  family_member_id: string | null
  family_id: string | null
  is_adult: boolean
}

type CsvRow = {
  person_name: string
  show_role: string
  show_part: string | null
  email: string | null
}

const ROLE_SUGGESTIONS = ['Cast A', 'Cast B', 'Crew', 'Tech', 'Volunteer']

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '10px 14px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  display: 'block',
  marginBottom: '6px',
}

// ─── Inline part editor ───────────────────────────────────────────────────────

function PartEditor({ memberId, slug, initial }: { memberId: string; slug: string; initial: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial ?? '')
  const [isPending, start] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function handleSave() {
    start(async () => {
      await updateShowMemberPart(memberId, slug, value)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          style={{ ...inputStyle, padding: '4px 8px', fontSize: '0.78rem', width: '160px' }}
          placeholder="e.g. Jack Kelly"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: '0.72rem', padding: 0 }}
        >
          {isPending ? '…' : 'Save'}
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.72rem', padding: 0 }}
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to set part"
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        color: value ? 'var(--muted)' : 'rgba(255,255,255,0.2)',
        fontSize: '0.78rem', fontStyle: value ? 'normal' : 'italic',
      }}
    >
      {value || 'Add part…'}
    </button>
  )
}

// ─── Role picker shared input ─────────────────────────────────────────────────

function RolePicker({
  value, onChange, existingGroups, listId,
}: {
  value: string
  onChange: (v: string) => void
  existingGroups: string[]
  listId: string
}) {
  const extras = existingGroups.filter(g => !ROLE_SUGGESTIONS.includes(g))
  return (
    <>
      <input
        type="text"
        required
        list={listId}
        placeholder="Group (e.g. Cast A)"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, minWidth: '140px' }}
      />
      <datalist id={listId}>
        {ROLE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
        {extras.map(g => <option key={g} value={g} />)}
      </datalist>
    </>
  )
}

// ─── CSV Import section ───────────────────────────────────────────────────────

function CsvImportSection({
  showId, slug, existingGroups, alreadyAddedNames,
}: {
  showId: string
  slug: string
  existingGroups: string[]
  alreadyAddedNames: Set<string>
}) {
  const [rows, setRows] = useState<CsvRow[]>([])
  const [error, setError] = useState('')
  const [isPending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function parseCSV(text: string): CsvRow[] {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.')

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'person_name')
    const groupIdx = headers.findIndex(h => h === 'group' || h === 'role' || h === 'show_role')
    const partIdx = headers.findIndex(h => h === 'part' || h === 'show_part' || h === 'character')
    const emailIdx = headers.findIndex(h => h === 'email')

    if (nameIdx === -1) throw new Error('CSV must have a "Name" column.')
    if (groupIdx === -1) throw new Error('CSV must have a "Group" or "Role" column.')

    return lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim())
      return {
        person_name: cols[nameIdx] ?? '',
        show_role: cols[groupIdx] ?? '',
        show_part: partIdx >= 0 ? (cols[partIdx] || null) : null,
        email: emailIdx >= 0 ? (cols[emailIdx] || null) : null,
      }
    }).filter(r => r.person_name && r.show_role)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setRows([])
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = parseCSV(ev.target?.result as string)
        if (parsed.length === 0) throw new Error('No valid rows found.')
        setRows(parsed)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV.')
      }
    }
    reader.readAsText(file)
  }

  function handleImport() {
    const toAdd = rows.filter(r => !alreadyAddedNames.has(r.person_name.toLowerCase()))
    if (toAdd.length === 0) { setError('All people in this file are already on the roster.'); return }
    start(async () => {
      try {
        await addShowMembersFromCSV(showId, slug, toAdd)
        setRows([])
        setOpen(false)
        if (fileRef.current) fileRef.current.value = ''
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed.')
      }
    })
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Import from CSV
        </span>
        <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 24px 24px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '12px' }}>
            Upload a CSV with columns: <strong style={{ color: 'var(--warm-white)' }}>Name</strong>,{' '}
            <strong style={{ color: 'var(--warm-white)' }}>Group</strong> (e.g. Cast A, Crew, Volunteer),{' '}
            and optionally <strong style={{ color: 'var(--warm-white)' }}>Part</strong> (character or position){' '}
            and <strong style={{ color: 'var(--warm-white)' }}>Email</strong>.
          </p>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              style={{ ...inputStyle, flex: 1, minWidth: '200px', cursor: 'pointer' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginTop: '8px' }}>{error}</p>
          )}

          {rows.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '8px' }}>
                {rows.length} rows parsed — {rows.filter(r => alreadyAddedNames.has(r.person_name.toLowerCase())).length} already on roster
              </p>
              <div style={{ border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px', maxHeight: '240px', overflowY: 'auto' }}>
                {rows.map((r, i) => {
                  const dupe = alreadyAddedNames.has(r.person_name.toLowerCase())
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto',
                      gap: '12px', alignItems: 'center',
                      padding: '8px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      opacity: dupe ? 0.4 : 1,
                    }}>
                      <span style={{ fontSize: '0.83rem' }}>
                        {r.person_name}
                        {r.show_part && <span style={{ color: 'var(--muted)', marginLeft: '8px', fontSize: '0.72rem' }}>— {r.show_part}</span>}
                        {r.email && <span style={{ color: 'var(--muted)', marginLeft: '8px', fontSize: '0.68rem' }}>{r.email}</span>}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--teal)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {r.show_role}
                      </span>
                      {dupe && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>already added</span>
                      )}
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={handleImport}
                disabled={isPending}
                className="btn-primary"
                style={{ opacity: isPending ? 0.6 : 1 }}
              >
                <span>{isPending ? 'Importing…' : `Import ${rows.filter(r => !alreadyAddedNames.has(r.person_name.toLowerCase())).length} People`}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── From Auditions section ───────────────────────────────────────────────────

function AuditionSection({
  showId, slug, auditioners, alreadyAddedIds, existingGroups,
}: {
  showId: string
  slug: string
  auditioners: Auditioner[]
  alreadyAddedIds: Set<string>
  existingGroups: string[]
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [group, setGroup] = useState('Cast A')
  const [isPending, start] = useTransition()
  const [error, setError] = useState('')
  const [open, setOpen] = useState(true)

  const available = auditioners.filter(a => !alreadyAddedIds.has(a.id))
  const allChecked = available.length > 0 && available.every(a => checked.has(a.id))

  function toggleAll() {
    if (allChecked) setChecked(new Set())
    else setChecked(new Set(available.map(a => a.id)))
  }

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleAdd() {
    const selected = auditioners.filter(a => checked.has(a.id))
    if (!selected.length || !group.trim()) return
    setError('')
    start(async () => {
      try {
        await addShowMembersFromAuditions(showId, slug, selected.map(a => ({
          person_name: a.auditioner_name,
          family_id: a.family_id,
          family_member_id: a.family_member_id,
          show_role: group.trim(),
        })))
        setChecked(new Set())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add members.')
      }
    })
  }

  if (auditioners.length === 0) return null

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Add from Auditions ({available.length} available)
        </span>
        <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 24px 24px' }}>
          {/* Group picker + add button */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            <label style={{ ...labelStyle, margin: 0, whiteSpace: 'nowrap' }}>
              Add {checked.size} selected as:
            </label>
            <RolePicker value={group} onChange={setGroup} existingGroups={existingGroups} listId="aud-role-suggestions" />
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || checked.size === 0 || !group.trim()}
              className="btn-primary"
              style={{ opacity: (isPending || checked.size === 0 || !group.trim()) ? 0.6 : 1, whiteSpace: 'nowrap' }}
            >
              <span>{isPending ? 'Adding…' : `Add ${checked.size > 0 ? checked.size : ''} Selected`}</span>
            </button>
          </div>

          {error && <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginBottom: '8px' }}>{error}</p>}

          {/* Auditioner table */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '32px 1fr auto',
              padding: '8px 16px', background: 'rgba(0,0,0,0.3)',
              borderBottom: '1px solid var(--border)',
            }}>
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                style={{ cursor: 'pointer', accentColor: 'var(--teal)' }}
              />
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>Name</span>
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>Status</span>
            </div>

            {auditioners.map(a => {
              const added = alreadyAddedIds.has(a.id)
              return (
                <div
                  key={a.id}
                  onClick={() => !added && toggle(a.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '32px 1fr auto',
                    alignItems: 'center', padding: '10px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: added ? 'default' : 'pointer',
                    opacity: added ? 0.4 : 1,
                    background: checked.has(a.id) ? 'rgba(0,180,160,0.06)' : 'none',
                  }}
                  onMouseOver={e => { if (!added) (e.currentTarget as HTMLElement).style.background = checked.has(a.id) ? 'rgba(0,180,160,0.08)' : 'rgba(255,255,255,0.03)' }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = checked.has(a.id) ? 'rgba(0,180,160,0.06)' : 'none' }}
                >
                  <input
                    type="checkbox"
                    checked={checked.has(a.id)}
                    disabled={added}
                    onChange={() => toggle(a.id)}
                    onClick={e => e.stopPropagation()}
                    style={{ cursor: added ? 'default' : 'pointer', accentColor: 'var(--teal)' }}
                  />
                  <div>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{a.auditioner_name}</p>
                    {a.is_adult && (
                      <p style={{ fontSize: '0.68rem', color: 'var(--muted)', margin: '2px 0 0' }}>Adult</p>
                    )}
                  </div>
                  {added && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--teal)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      On Roster
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Manual add section ───────────────────────────────────────────────────────

function ManualAddSection({
  showId, slug, existingGroups,
}: {
  showId: string
  slug: string
  existingGroups: string[]
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PersonSearchResult[]>([])
  const [selected, setSelected] = useState<PersonSearchResult | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [group, setGroup] = useState('Volunteer')
  const [part, setPart] = useState('')
  const [email, setEmail] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [isPending, start] = useTransition()
  const [error, setError] = useState('')
  const [open, setOpen] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selected || isNew || query.length < 2) { setDropdownOpen(false); return }
    setDropdownOpen(true)
    const timer = setTimeout(async () => {
      setSearching(true)
      try { setResults(await searchPeopleByName(query)) }
      catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, selected, isNew])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(r: PersonSearchResult) {
    setSelected(r); setQuery(''); setResults([]); setDropdownOpen(false)
  }

  function handleClear() {
    setSelected(null); setQuery(''); setIsNew(false); setNewName('')
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const personName = isNew ? newName.trim() : selected?.name ?? ''
    if (!personName || !group.trim()) return
    setError('')
    start(async () => {
      try {
        await addShowMember(showId, slug, {
          person_name: personName,
          family_id: isNew ? null : (selected?.family_id ?? null),
          family_member_id: isNew ? null : (selected?.family_member_id ?? null),
          show_role: group.trim(),
          show_part: part.trim() || undefined,
          email: email.trim() || undefined,
        })
        setSelected(null); setQuery(''); setNewName(''); setPart(''); setEmail(''); setIsNew(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add.')
      }
    })
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Add Manually
        </span>
        <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={handleAdd} style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: error ? '8px' : 0 }}>

            {/* Name: search or new */}
            {isNew ? (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1, minWidth: '220px' }}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  autoFocus
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleClear}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                >
                  ← Search instead
                </button>
              </div>
            ) : (
              <div ref={dropdownRef} style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                {selected ? (
                  <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {selected.name}
                      <span style={{ color: 'var(--muted)', marginLeft: '6px', fontSize: '0.72rem' }}>{selected.subtitle}</span>
                    </span>
                    <button type="button" onClick={handleClear}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Search by name…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoComplete="off"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                )}

                {dropdownOpen && !selected && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '2px',
                    marginTop: '2px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}>
                    {searching ? (
                      <div style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.82rem' }}>Searching…</div>
                    ) : results.length === 0 ? (
                      <div style={{ padding: '12px 16px' }}>
                        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '8px' }}>No matches found.</p>
                        <button type="button" onClick={() => { setIsNew(true); setNewName(query); setDropdownOpen(false) }}
                          style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}>
                          + Add &ldquo;{query}&rdquo; as new person
                        </button>
                      </div>
                    ) : (
                      <>
                        {results.map(r => (
                          <button key={`${r.family_id}-${r.family_member_id}`} type="button" onClick={() => handleSelect(r)}
                            style={{
                              width: '100%', textAlign: 'left', background: 'none', border: 'none',
                              padding: '10px 16px', cursor: 'pointer', color: 'var(--warm-white)',
                              borderBottom: '1px solid rgba(255,255,255,0.06)',
                            }}
                            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                            onMouseOut={e => (e.currentTarget.style.background = 'none')}
                          >
                            <p style={{ fontSize: '0.85rem', margin: 0 }}>{r.name}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', margin: '2px 0 0' }}>{r.subtitle}</p>
                          </button>
                        ))}
                        <button type="button" onClick={() => { setIsNew(true); setNewName(query); setDropdownOpen(false) }}
                          style={{
                            width: '100%', textAlign: 'left', background: 'none', border: 'none',
                            padding: '10px 16px', cursor: 'pointer', color: 'var(--teal)', fontSize: '0.78rem',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseOut={e => (e.currentTarget.style.background = 'none')}
                        >
                          + Add as new person (not in system)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <RolePicker value={group} onChange={setGroup} existingGroups={existingGroups} listId="manual-role-suggestions" />

            <input
              type="text"
              placeholder="Part / Character (optional)"
              value={part}
              onChange={e => setPart(e.target.value)}
              style={{ ...inputStyle, minWidth: '160px', flex: '0 1 auto' }}
            />

            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ ...inputStyle, minWidth: '180px', flex: '0 1 auto' }}
            />

            <button
              type="submit"
              disabled={isPending || (!selected && !isNew)}
              className="btn-primary"
              style={{ padding: '10px 20px', opacity: (isPending || (!selected && !isNew)) ? 0.6 : 1, whiteSpace: 'nowrap' }}
            >
              <span>{isPending ? 'Adding…' : '+ Add'}</span>
            </button>
          </div>

          {error && <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginTop: '6px' }}>{error}</p>}
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '8px' }}>
            Search existing members or add a new person not yet in the system.
          </p>
        </form>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function RosterManager({
  showId,
  slug,
  members,
  auditioners = [],
}: {
  showId: string
  slug: string
  members: Member[]
  auditioners?: Auditioner[]
}) {
  const [isPending, start] = useTransition()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const groups = Array.from(new Set(members.map(m => m.show_role))).sort()
  const byRole = Object.fromEntries(groups.map(g => [g, members.filter(m => m.show_role === g)]))

  // IDs for "already added" checks — match auditioners to roster by name
  const alreadyAddedNames = new Set(members.map(m => m.person_name.toLowerCase()))
  const alreadyAddedAuditionerIds = new Set(
    auditioners
      .filter(a => alreadyAddedNames.has(a.auditioner_name.toLowerCase()))
      .map(a => a.id)
  )

  function handleRemove(memberId: string) {
    start(async () => { await removeShowMember(memberId, slug) })
  }

  function toggleCollapse(role: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      next.has(role) ? next.delete(role) : next.add(role)
      return next
    })
  }

  function toggleExpand(role: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(role) ? next.delete(role) : next.add(role)
      return next
    })
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Roster — {members.length} {members.length === 1 ? 'person' : 'people'}
          </p>
        </div>

        {/* Member list grouped by role */}
        {members.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No members added yet.</p>
          </div>
        ) : (
          <div>
            {groups.map(r => {
              const group = byRole[r]
              const collapsed = collapsedGroups.has(r)
              const showAll = expandedGroups.has(r)
              const visible = collapsed ? [] : showAll ? group : group.slice(0, PAGE_SIZE)
              const hiddenCount = group.length - PAGE_SIZE
              return (
                <div key={r} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => toggleCollapse(r)}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer',
                      padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--teal)' }}>
                      {r} ({group.length})
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>{collapsed ? '▶' : '▼'}</span>
                  </button>
                  {visible.map(m => (
                    <div key={m.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 24px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div>
                        <p style={{ fontSize: '0.88rem', margin: 0 }}>{m.person_name}</p>
                        {m.email && <p style={{ fontSize: '0.72rem', color: 'var(--muted)', margin: '2px 0 0' }}>{m.email}</p>}
                      </div>
                      <PartEditor memberId={m.id} slug={slug} initial={m.show_part} />
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
                  {!collapsed && hiddenCount > 0 && (
                    <div style={{ padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(r)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.75rem', padding: 0 }}
                      >
                        {showAll ? `▲ Show first ${PAGE_SIZE}` : `▼ Show ${hiddenCount} more`}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add sections */}
        {auditioners.length > 0 && (
          <AuditionSection
            showId={showId}
            slug={slug}
            auditioners={auditioners}
            alreadyAddedIds={alreadyAddedAuditionerIds}
            existingGroups={groups}
          />
        )}

        <CsvImportSection
          showId={showId}
          slug={slug}
          existingGroups={groups}
          alreadyAddedNames={alreadyAddedNames}
        />

        <ManualAddSection
          showId={showId}
          slug={slug}
          existingGroups={groups}
        />

      </div>
    </div>
  )
}
