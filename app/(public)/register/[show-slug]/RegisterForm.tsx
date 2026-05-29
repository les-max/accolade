'use client'

import { useActionState } from 'react'
import { registerForShow, type RegisterResult } from './actions'

export default function RegisterForm({
  showId,
  slug,
  seatsRemaining,
}: {
  showId: string
  slug: string
  seatsRemaining: number | null
}) {
  const action = registerForShow.bind(null, slug)
  const [state, formAction, pending] = useActionState<RegisterResult, FormData>(action, null)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <input type="hidden" name="show_id" value={showId} />

      {seatsRemaining !== null && (
        <p style={{ fontSize: '0.85rem', color: 'var(--gold)', margin: 0 }}>
          {seatsRemaining} seat{seatsRemaining === 1 ? '' : 's'} remaining
        </p>
      )}

      {state?.error && (
        <p role="alert" style={{ fontSize: '0.85rem', color: '#e05555', margin: 0 }}>
          {state.error}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="reg-name" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Name
        </label>
        <input
          id="reg-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 14px', color: 'var(--warm-white)', fontSize: '0.95rem' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="reg-email" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 14px', color: 'var(--warm-white)', fontSize: '0.95rem' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="reg-party-size" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          How many people are you registering?
        </label>
        <input
          id="reg-party-size"
          name="party_size"
          type="number"
          required
          min={1}
          max={seatsRemaining ?? undefined}
          defaultValue={1}
          style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 14px', color: 'var(--warm-white)', fontSize: '0.95rem', width: '100px' }}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          background: 'var(--gold)',
          color: '#0e0d14',
          border: 'none',
          borderRadius: '4px',
          padding: '12px 28px',
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 700,
          cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.7 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {pending ? 'Registering...' : 'Register'}
      </button>
    </form>
  )
}
