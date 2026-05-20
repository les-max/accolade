'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? searchParams.get('redirect') ?? '/account'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirm, setNeedsConfirm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Use "Forgot password" if you haven\'t set one yet.'
          : error.message)
        setLoading(false)
      } else {
        router.push(next)
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (data.session) {
        router.push('/account/setup')
        router.refresh()
      } else {
        setNeedsConfirm(true)
        setLoading(false)
      }
    }
  }

  if (needsConfirm) {
    return (
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(212,168,83,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4 4 8-8" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>Check your email</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
          We sent a confirmation link to <strong style={{ color: 'var(--warm-white)' }}>{email}</strong>. Click it to activate your account.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px 32px' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '32px' }}>
        {mode === 'signin'
          ? 'Sign in to your Accolade family account.'
          : 'Create an account to manage registrations and fees.'}
      </p>

      <label style={{ display: 'block', marginBottom: '16px' }}>
        <span style={LABEL}>Email address</span>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="you@example.com" style={INPUT}
          onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '8px' }}>
        <span style={LABEL}>Password</span>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)} required
          placeholder="••••••••" minLength={8} style={INPUT}
          onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </label>

      {mode === 'signin' && (
        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <Link href="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--muted)', textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>
      )}

      {mode === 'signup' && (
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '24px', marginTop: '8px' }}>
          Minimum 8 characters.
        </p>
      )}

      {error && <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '16px' }}>{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1, marginBottom: '20px' }}>
        <span>{loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Create account')}</span>
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)' }}>
        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
          style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}
        >
          {mode === 'signin' ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </form>
  )
}

export default function LoginPage() {
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
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
