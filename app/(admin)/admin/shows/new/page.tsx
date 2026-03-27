'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createShow } from '../actions'

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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

export default function NewShowPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [auditionType, setAuditionType] = useState<'slot' | 'window'>('slot')
  const [showGrade, setShowGrade] = useState(false)
  const [showHeadshot, setShowHeadshot] = useState(false)
  const [error, setError] = useState('')

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    data.set('show_grade', String(showGrade))
    data.set('show_headshot_upload', String(showHeadshot))

    startTransition(async () => {
      try {
        await createShow(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '40px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, marginBottom: '16px' }}
        >
          ← Back
        </button>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
          Shows
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>
          New Show
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
            Basic Info
          </p>

          {/* Title */}
          <label style={{ display: 'block', marginBottom: '20px' }}>
            <span style={labelStyle}>Title</span>
            <input name="title" type="text" required value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="e.g. Newsies" style={inputStyle} />
          </label>

          {/* Slug */}
          <label style={{ display: 'block', marginBottom: '20px' }}>
            <span style={labelStyle}>URL Slug</span>
            <input
              name="slug" type="text" required value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
              placeholder="e.g. newsies-2026"
              style={inputStyle}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '6px', display: 'block' }}>
              /auditions/{slug || 'your-slug-here'}
            </span>
          </label>

          {/* Description */}
          <label style={{ display: 'block', marginBottom: '20px' }}>
            <span style={labelStyle}>Description</span>
            <textarea name="description" rows={3} placeholder="Brief description shown on the auditions listing page" style={{ ...inputStyle, resize: 'vertical' }} />
          </label>

          {/* Show image */}
          <label style={{ display: 'block' }}>
            <span style={labelStyle}>Show Image URL</span>
            <input name="show_image" type="url" placeholder="https://..." style={inputStyle} />
          </label>
        </div>

        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
            Audition Settings
          </p>

          {/* Audition type */}
          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>Audition Type</span>
            <input type="hidden" name="audition_type" value={auditionType} />
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['slot', 'window'] as const).map(type => (
                <button
                  key={type} type="button"
                  onClick={() => setAuditionType(type)}
                  style={{
                    padding: '10px 20px',
                    border: `1px solid ${auditionType === type ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '2px',
                    background: auditionType === type ? 'rgba(212,168,83,0.1)' : 'transparent',
                    color: auditionType === type ? 'var(--gold)' : 'var(--muted)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.1em',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {type === 'slot' ? 'Specific Time Slots' : 'Audition Windows'}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '8px' }}>
              {auditionType === 'slot'
                ? 'Each person picks a specific time (e.g. 9:17am, 9:22am)'
                : 'Each person picks a window (e.g. Saturday 10am–11:30am)'}
            </p>
          </div>

          {/* Age range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <label>
              <span style={labelStyle}>Min Age</span>
              <input name="age_min" type="number" min={1} max={99} placeholder="e.g. 8" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>Max Age</span>
              <input name="age_max" type="number" min={1} max={99} placeholder="e.g. 18" style={inputStyle} />
            </label>
          </div>
        </div>

        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '32px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
            Optional Fields
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '20px' }}>
            These fields can be shown or hidden on the registration form depending on what the director needs.
          </p>

          {[
            { label: 'Ask for grade in school', state: showGrade, set: setShowGrade },
            { label: 'Allow headshot / resume upload', state: showHeadshot, set: setShowHeadshot },
          ].map(({ label, state, set }) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '16px' }}>
              <div
                onClick={() => set(!state)}
                style={{
                  width: '40px', height: '22px', borderRadius: '11px',
                  background: state ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                  position: 'relative', flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: state ? '21px' : '3px',
                  width: '16px', height: '16px',
                  borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--warm-white)' }}>{label}</span>
            </label>
          ))}
        </div>

        {error && (
          <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '16px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '16px' }}>
          <button type="submit" disabled={isPending} className="btn-primary" style={{ opacity: isPending ? 0.6 : 1 }}>
            <span>{isPending ? 'Creating…' : 'Create Show'}</span>
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </div>
  )
}
