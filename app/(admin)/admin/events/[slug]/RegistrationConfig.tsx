'use client'

import { useRef, useState, useTransition } from 'react'
import { saveRegistrationCapacity } from './actions'

export default function RegistrationConfig({
  showId,
  slug,
  currentCapacity,
}: {
  showId: string
  slug: string
  currentCapacity: number | null
}) {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await saveRegistrationCapacity(showId, slug, formData)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div style={{ marginBottom: '32px', background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px 28px' }}>
      <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
        Registration
      </p>
      <form ref={formRef} action={handleSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="reg-capacity" style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Seat cap
          </label>
          <input
            id="reg-capacity"
            name="registration_capacity"
            type="number"
            min={1}
            defaultValue={currentCapacity ?? ''}
            placeholder="Unlimited"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '8px 12px',
              color: 'var(--warm-white)',
              fontSize: '0.9rem',
              width: '120px',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '8px 20px',
            fontSize: '0.68rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: saved ? 'var(--gold)' : 'var(--warm-white)',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {saved ? 'Saved' : isPending ? 'Saving...' : 'Save'}
        </button>
      </form>
      {error && <p style={{ marginTop: '8px', fontSize: '0.72rem', color: '#e05555' }}>{error}</p>}
      <p style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--muted)' }}>
        Leave blank for unlimited. Public form: <code style={{ fontSize: '0.7rem' }}>/register/{slug}</code>
      </p>
    </div>
  )
}
