'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router                  = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/admin/shows')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: '2px',
    padding: '12px 16px',
    color: 'var(--warm-white)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    fontWeight: 600,
    marginBottom: '8px',
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1rem',
          letterSpacing: '0.4em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Accolade Community Theatre
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Admin
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: 'var(--layer)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '40px 32px',
      }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '32px' }}>
          Sign in
        </h1>

        <label style={{ display: 'block', marginBottom: '20px' }}>
          <span style={labelStyle}>Email address</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '24px' }}>
          <span style={labelStyle}>Password</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </label>

        {error && (
          <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '16px' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
        >
          <span>{loading ? 'Signing in…' : 'Sign In'}</span>
        </button>
      </form>
    </div>
  )
}
