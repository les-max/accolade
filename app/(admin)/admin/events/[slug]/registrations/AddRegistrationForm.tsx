'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addRegistration } from './actions'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '9px 12px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
  colorScheme: 'dark',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.58rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  marginBottom: '5px',
}

export default function AddRegistrationForm({
  showId,
  showSlug,
}: {
  showId: string
  showSlug: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')

  function reset() {
    setName('')
    setEmail('')
    setParentName('')
    setPhone('')
    setAge('')
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.')
      return
    }
    setError('')
    startTransition(async () => {
      const result = await addRegistration(showId, showSlug, {
        auditioner_name: name.trim(),
        parent_email: email.trim(),
        parent_name: parentName.trim() || null,
        parent_phone: phone.trim() || null,
        auditioner_age: age ? Number(age) : null,
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: 'var(--gold)',
          border: 'none',
          borderRadius: '2px',
          color: 'var(--bg)',
          fontSize: '0.65rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Add Registration
      </button>
    )
  }

  return (
    <div style={{
      background: 'var(--layer)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '24px',
    }}>
      <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>
        Add Registration
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <label>
            <span style={labelStyle}>Camper Name *</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First Last"
              style={inputStyle}
              autoFocus
            />
          </label>
          <label>
            <span style={labelStyle}>Age</span>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="—"
              min={1}
              max={99}
              style={inputStyle}
            />
          </label>
          <label>
            <span style={labelStyle}>Parent / Guardian Email *</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              style={inputStyle}
            />
          </label>
          <label>
            <span style={labelStyle}>Parent / Guardian Name</span>
            <input
              type="text"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              placeholder="First Last"
              style={inputStyle}
            />
          </label>
          <label>
            <span style={labelStyle}>Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              style={inputStyle}
            />
          </label>
        </div>

        {error && (
          <p style={{ fontSize: '0.78rem', color: '#e07070', marginBottom: '16px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '9px 20px',
              background: 'var(--gold)',
              border: 'none',
              borderRadius: '2px',
              color: 'var(--bg)',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => { reset(); setOpen(false) }}
            style={{
              padding: '9px 20px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              color: 'var(--muted)',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
