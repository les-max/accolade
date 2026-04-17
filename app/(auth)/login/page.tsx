'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSubmitted(true)
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px' }}>
      {/* Wordmark */}
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
          My Account
        </p>
      </div>

      {submitted ? (
        /* Confirmation state */
        <div style={{
          background: 'var(--layer)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '40px 32px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px',
            borderRadius: '50%',
            border: '1px solid rgba(212,168,83,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10l4 4 8-8" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>
            Check your email
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
            We sent a magic link to <strong style={{ color: 'var(--warm-white)' }}>{email}</strong>.
            Click it to sign in — no password needed.
          </p>
        </div>
      ) : (
        /* Login form */
        <form onSubmit={handleSubmit} style={{
          background: 'var(--layer)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '40px 32px',
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.6rem',
            fontWeight: 700,
            marginBottom: '8px',
          }}>
            Sign in
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '32px' }}>
            Enter your email and we&apos;ll send you a magic link.
          </p>

          <label style={{ display: 'block', marginBottom: '24px' }}>
            <span style={{
              display: 'block',
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              fontWeight: 600,
              marginBottom: '8px',
            }}>
              Email address
            </span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
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
              }}
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
            <span>{loading ? 'Sending…' : 'Send Magic Link'}</span>
          </button>
        </form>
      )}
    </div>
  )
}
