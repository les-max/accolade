'use client'

import { useState, useTransition } from 'react'
import { signWaiver, WaiverType, WaiverResult } from './waiver-actions'

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '10px 14px',
  color: 'var(--warm-white)',
  fontSize: '0.88rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

export default function WaiverForm({
  showId,
  slug,
  waiverType,
  title,
  text,
  signed,
}: {
  showId: string
  slug: string
  waiverType: WaiverType
  title: string
  text: string
  signed: { signature: string; signed_at: string } | null
}) {
  const [signature, setSignature] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<WaiverResult | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await signWaiver(showId, slug, waiverType, signature)
      setResult(res)
    })
  }

  return (
    <div style={{
      background: 'var(--layer)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '32px',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          {title}
        </p>
        {signed && (
          <span style={{
            fontSize: '0.68rem',
            color: 'var(--teal)',
            padding: '2px 8px',
            border: '1px solid rgba(61,158,140,0.3)',
            borderRadius: '2px',
          }}>
            Signed
          </span>
        )}
      </div>

      {/* Waiver text */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid var(--border)',
        maxHeight: '320px',
        overflowY: 'auto',
      }}>
        <p style={{
          fontSize: '0.78rem',
          lineHeight: 1.8,
          color: 'var(--muted)',
          whiteSpace: 'pre-wrap',
          fontFamily: 'Georgia, serif',
        }}>
          {text}
        </p>
      </div>

      {/* Signature area */}
      <div style={{ padding: '24px' }}>
        {signed ? (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--teal)', marginBottom: '4px' }}>
              Signed as: <em>{signed.signature}</em>
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted-dim)' }}>
              {new Date(signed.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
              Type your full name to sign *
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <input
                required
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Full name"
                style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
              />
              <button
                type="submit"
                disabled={isPending || !signature.trim()}
                className="btn-primary"
                style={{ padding: '10px 24px', opacity: (isPending || !signature.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' }}
              >
                <span>{isPending ? 'Signing…' : 'I Agree and Sign'}</span>
              </button>
            </div>
            {result && !result.success && (
              <p style={{ fontSize: '0.78rem', color: 'var(--rose)' }}>{result.error}</p>
            )}
            <p style={{ fontSize: '0.68rem', color: 'var(--muted-dim)', lineHeight: 1.5 }}>
              By typing your name above you agree this constitutes a legal electronic signature under the federal ESIGN Act.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
