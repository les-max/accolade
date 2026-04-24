'use client'

import { useState, useTransition } from 'react'
import { addFamilyMember, deleteFamilyMember, updateFamilyMember, updateFamilyContact } from './actions'
import { computeAge } from '@/lib/utils/age'

type Member = { id: string; name: string; birthdate: string | null; age: number | null; grade: string | null; gender: string | null }
type Family = { id: string; parent_name: string; email: string; phone: string | null; gender: string | null; spouse_name: string | null; spouse_email: string | null; spouse_phone: string | null; spouse_gender: string | null }

function GenderSelect({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }].map(({ label, value }) => (
        <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', flex: 1,
          padding: '9px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px',
          background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--warm-white)',
        }}>
          <input type="radio" name={name} value={value} defaultChecked={defaultValue === value}
            style={{ accentColor: 'var(--gold)', width: '13px', height: '13px' }} />
          {label}
        </label>
      ))}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '2px',
  padding: '11px 14px',
  color: 'var(--warm-white)',
  fontSize: '0.88rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.6rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  marginBottom: '6px',
}

function MemberRow({ member, onDelete }: { member: Member; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateFamilyMember(member.id, data)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <form onSubmit={handleUpdate} style={{ padding: '16px 24px', background: 'rgba(212,168,83,0.03)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px', marginBottom: '12px' }}>
          <label>
            <span style={labelStyle}>Name</span>
            <input name="name" type="text" required defaultValue={member.name} style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>Birthdate</span>
            <input name="birthdate" type="date" defaultValue={member.birthdate ?? ''} style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>Grade</span>
            <input name="grade" type="text" defaultValue={member.grade ?? ''} placeholder="e.g. 7th" style={inputStyle} />
          </label>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <span style={labelStyle}>Gender</span>
          <GenderSelect name="gender" defaultValue={member.gender} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" disabled={isPending} style={{ background: 'none', border: '1px solid var(--gold)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer' }}>
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--muted)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{member.name}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
          {(() => {
            const age = member.birthdate ? computeAge(member.birthdate) : member.age
            return [member.gender, age != null ? `Age ${age}` : null, member.grade]
              .filter(Boolean)
              .map((v, i) => i === 0 && member.gender ? (v as string).charAt(0).toUpperCase() + (v as string).slice(1) : v)
              .join(' · ') || 'No details added'
          })()}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setEditing(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--muted)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '7px 14px', cursor: 'pointer' }}>
          Edit
        </button>
        <button onClick={() => onDelete(member.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }} title="Remove">
          ×
        </button>
      </div>
    </div>
  )
}

export default function FamilyManager({ family, members, showGradePrompt }: { family: Family; members: Member[]; showGradePrompt: boolean }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      await addFamilyMember(data)
      form.reset()
      setShowAddForm(false)
    })
  }

  function handleDelete(id: string) {
    startTransition(() => deleteFamilyMember(id))
  }

  function handleContactUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateFamilyContact(data)
      setEditingContact(false)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {showGradePrompt && members.length > 0 && (
        <div style={{ padding: '16px 20px', background: 'rgba(212,168,83,0.06)', border: '1px solid rgba(212,168,83,0.25)', borderRadius: '4px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em', marginBottom: '4px' }}>Time to check grade levels</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            A new school year is starting. Double-check that your kids' grade levels are still accurate before audition season.
          </p>
        </div>
      )}

      {/* Contact info */}
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>Contact Info</p>
          {!editingContact && (
            <button onClick={() => setEditingContact(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--muted)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '7px 14px', cursor: 'pointer' }}>
              Edit
            </button>
          )}
        </div>
        {editingContact ? (
          <form onSubmit={handleContactUpdate} style={{ padding: '24px' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Primary Contact</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <label style={{ gridColumn: '1 / -1' }}>
                <span style={labelStyle}>Your Name</span>
                <input name="parent_name" type="text" required defaultValue={family.parent_name} style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Your Phone</span>
                <input name="phone" type="tel" defaultValue={family.phone ?? ''} style={inputStyle} />
              </label>
              <div>
                <span style={labelStyle}>Gender</span>
                <GenderSelect name="gender" defaultValue={family.gender} />
              </div>
            </div>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Spouse / Second Parent <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <label style={{ gridColumn: '1 / -1' }}>
                <span style={labelStyle}>Spouse Name</span>
                <input name="spouse_name" type="text" defaultValue={family.spouse_name ?? ''} style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Spouse Email</span>
                <input name="spouse_email" type="email" defaultValue={family.spouse_email ?? ''} style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Spouse Phone</span>
                <input name="spouse_phone" type="tel" defaultValue={family.spouse_phone ?? ''} style={inputStyle} />
              </label>
              <div>
                <span style={labelStyle}>Spouse Gender</span>
                <GenderSelect name="spouse_gender" defaultValue={family.spouse_gender} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={isPending} style={{ background: 'none', border: '1px solid var(--gold)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer' }}>
                {isPending ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditingContact(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--muted)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: family.spouse_name ? '20px' : 0 }}>
              {[
                { label: 'Name',  value: family.parent_name },
                { label: 'Email', value: family.email },
                { label: 'Phone', value: family.phone ?? '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '0.88rem' }}>{value}</p>
                </div>
              ))}
            </div>
            {family.spouse_name ? (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                {[
                  { label: 'Spouse', value: family.spouse_name },
                  { label: 'Spouse Email', value: family.spouse_email ?? '—' },
                  { label: 'Spouse Phone', value: family.spouse_phone ?? '—' },
                  ...(family.spouse_gender ? [{ label: 'Spouse Gender', value: family.spouse_gender.charAt(0).toUpperCase() + family.spouse_gender.slice(1) }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>{label}</p>
                    <p style={{ fontSize: '0.88rem' }}>{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button onClick={() => setEditingContact(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.05em' }}>
                  + Add spouse / second parent
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: members.length > 0 || showAddForm ? '1px solid var(--border)' : 'none' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>Children</p>
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '7px 14px', cursor: 'pointer' }}>
              + Add Child
            </button>
          )}
        </div>

        {members.map(m => (
          <MemberRow key={m.id} member={m} onDelete={handleDelete} />
        ))}

        {members.length === 0 && !showAddForm && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No children added yet.</p>
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleAdd} style={{ padding: '20px 24px', background: 'rgba(212,168,83,0.03)', borderTop: members.length > 0 ? '1px solid var(--border)' : 'none' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Add Child</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px', marginBottom: '12px' }}>
              <label>
                <span style={labelStyle}>Name</span>
                <input name="name" type="text" required placeholder="Child's full name" style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Birthdate</span>
                <input name="birthdate" type="date" style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Grade</span>
                <input name="grade" type="text" placeholder="e.g. 7th" style={inputStyle} />
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span style={labelStyle}>Gender</span>
              <GenderSelect name="gender" />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={isPending} style={{ background: 'none', border: '1px solid var(--gold)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer' }}>
                {isPending ? 'Adding…' : 'Add Child'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--muted)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
