'use client'

import { useState, useTransition } from 'react'
import { submitBio, BioResult } from './bio-actions'

type FamilyMember = {
  id: string
  name: string
  grade: string | null
}

type ExistingBio = {
  first_name: string
  last_name: string
  role: string
  age: number
  grade: string
  bio: string
} | null

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
  color: 'var(--muted)',
  display: 'block',
  marginBottom: '6px',
}

export default function BioForm({
  showId,
  slug,
  member,
  existing,
}: {
  showId: string
  slug: string
  member: FamilyMember
  existing: ExistingBio
}) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<BioResult | null>(null)
  const [firstName, setFirstName] = useState(existing?.first_name ?? '')
  const [lastName, setLastName] = useState(existing?.last_name ?? '')
  const [role, setRole] = useState(existing?.role ?? '')
  const [age, setAge] = useState(String(existing?.age ?? ''))
  const [grade, setGrade] = useState(existing?.grade ?? member.grade ?? '')
  const [bio, setBio] = useState(existing?.bio ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await submitBio(showId, slug, member.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: role.trim(),
        age: parseInt(age, 10),
        grade: grade.trim(),
        bio: bio.trim(),
      })
      setResult(res)
    })
  }

  return (
    <div style={{
      background: 'var(--layer)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Bio for {member.name}
        </p>
        {existing && (
          <span style={{
            fontSize: '0.68rem',
            color: 'var(--teal)',
            padding: '2px 8px',
            border: '1px solid rgba(61,158,140,0.3)',
            borderRadius: '2px',
          }}>
            Submitted
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>First Name *</label>
            <input
              required
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Last Name *</label>
            <input
              required
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Role in the Play *</label>
            <input
              required
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Lead, Ensemble, Stage Manager…"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Age *</label>
            <input
              required
              type="number"
              min={3}
              max={99}
              value={age}
              onChange={e => setAge(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Grade *</label>
            <input
              required
              value={grade}
              onChange={e => setGrade(e.target.value)}
              placeholder="8th"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Bio *</label>
          <textarea
            required
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={6}
            placeholder="Tell us a little about yourself — hobbies, interests, family life, theatre experience, favorite show or role..."
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
        </div>

        {result && !result.success && (
          <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '12px' }}>{result.error}</p>
        )}
        {result?.success && (
          <p style={{ color: 'var(--teal)', fontSize: '0.82rem', marginBottom: '12px' }}>Bio submitted! Thank you.</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
          style={{ padding: '10px 24px', opacity: isPending ? 0.6 : 1 }}
        >
          <span>{isPending ? 'Saving…' : existing ? 'Update Bio' : 'Submit Bio'}</span>
        </button>
      </form>
    </div>
  )
}
