'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INPUT: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '12px 16px',
  color: 'var(--warm-white)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: '0.65rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  marginBottom: '8px',
}

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/account')
      router.refresh()
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '0.4em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Accolade Community Theatre
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          My Account
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px 32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>Set your password</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '32px' }}>
          Choose a password for your Accolade account.
        </p>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <span style={LABEL}>New password</span>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            required minLength={8} placeholder="••••••••" style={INPUT}
            onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '24px' }}>
          <span style={LABEL}>Confirm password</span>
          <input
            type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            required minLength={8} placeholder="••••••••" style={INPUT}
            onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </label>

        {error && <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '16px' }}>{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
          <span>{loading ? 'Saving…' : 'Set password & sign in'}</span>
        </button>
      </form>
    </div>
  )
}
