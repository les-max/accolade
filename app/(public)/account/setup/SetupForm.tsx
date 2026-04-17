'use client'

import { useTransition } from 'react'
import { createFamilyProfile } from './actions'

function GenderSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }].map(({ label, value }) => (
        <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', flex: 1,
          padding: '11px 14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px',
          background: 'rgba(255,255,255,0.05)', fontSize: '0.88rem', color: 'var(--warm-white)',
        }}>
          <input type="radio" name={name} value={value} defaultChecked={defaultValue === value}
            style={{ accentColor: 'var(--gold)', width: '14px', height: '14px' }} />
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
  padding: '13px 16px',
  color: 'var(--warm-white)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.62rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  marginBottom: '8px',
}

export default function SetupForm({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(() => createFamilyProfile(data))
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--layer)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '32px',
    }}>
      <div style={{ marginBottom: '20px' }}>
        <span style={labelStyle}>Email</span>
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', padding: '13px 0' }}>{email}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <label style={{ display: 'block', gridColumn: '1 / -1' }}>
          <span style={labelStyle}>Your Full Name</span>
          <input name="parent_name" type="text" required placeholder="First and last name" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={labelStyle}>Your Phone</span>
          <input name="phone" type="tel" placeholder="(555) 555-5555" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </label>
        <div style={{ display: 'block' }}>
          <span style={labelStyle}>Gender</span>
          <GenderSelect name="gender" />
        </div>
      </div>

      <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px', marginTop: '8px' }}>
        Spouse / Second Parent <span style={{ color: 'var(--muted)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>(optional)</span>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <label style={{ display: 'block', gridColumn: '1 / -1' }}>
          <span style={labelStyle}>Spouse Name</span>
          <input name="spouse_name" type="text" placeholder="First and last name" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={labelStyle}>Spouse Email</span>
          <input name="spouse_email" type="email" placeholder="spouse@example.com" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={labelStyle}>Spouse Phone</span>
          <input name="spouse_phone" type="tel" placeholder="(555) 555-5555" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </label>
        <div style={{ display: 'block' }}>
          <span style={labelStyle}>Spouse Gender</span>
          <GenderSelect name="spouse_gender" />
        </div>
      </div>

      <button type="submit" disabled={isPending} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: isPending ? 0.6 : 1 }}>
        <span>{isPending ? 'Setting up…' : 'Continue to My Family'}</span>
      </button>
    </form>
  )
}
