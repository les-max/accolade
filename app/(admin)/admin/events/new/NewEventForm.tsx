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
  colorScheme: 'dark',
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

const EVENT_TYPES = [
  { value: 'show',      label: 'Show' },
  { value: 'audition',  label: 'Audition' },
  { value: 'camp',      label: 'Camp' },
  { value: 'workshop',  label: 'Workshop' },
  { value: 'event',     label: 'Event' },
] as const

type EventType = typeof EVENT_TYPES[number]['value']

type ParentShow = {
  id: string
  title: string
  event_type: string
  show_image: string | null
  show_image_wide: string | null
  venue_id: string | null
  season: number | null
}

export default function NewEventForm({ parentShows }: { parentShows: ParentShow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [eventType, setEventType] = useState<EventType>('show')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [auditionType, setAuditionType] = useState<'slot' | 'window'>('slot')
  const [parentShowId, setParentShowId] = useState<string>('')
  const [season, setSeason] = useState<number | null>(null)
  const [error, setError] = useState('')

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  function handleEventTypeChange(type: EventType) {
    setEventType(type)
    // Reset audition-specific state when switching away
    if (type !== 'audition') {
      setParentShowId('')
      setSeason(null)
    }
  }

  function handleParentShowChange(id: string) {
    setParentShowId(id)
    if (!id) {
      setSeason(null)
      return
    }
    const show = parentShows.find(s => s.id === id)
    if (!show) return
    if (!slugEdited) {
      const newTitle = `${show.title} Auditions`
      setTitle(newTitle)
      setSlug(slugify(newTitle))
    } else if (!title) {
      setTitle(`${show.title} Auditions`)
    }
    setSeason(show.season)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const data = new FormData()
    data.set('event_type', eventType)
    data.set('title', title)
    data.set('slug', slug)
    if (eventType === 'audition') {
      data.set('audition_type', auditionType)
      if (parentShowId) data.set('parent_show_id', parentShowId)
      if (season != null) data.set('season', String(season))
    }

    startTransition(async () => {
      try {
        await createShow(data)
      } catch (err: unknown) {
        if (err instanceof Error && (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  const publicPath = eventType === 'audition' ? `/auditions/${slug || 'your-slug'}` : `/shows/${slug || 'your-slug'}`

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '40px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, marginBottom: '16px' }}
        >
          ← Events
        </button>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>New Event</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Event Type ── */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>Event Type</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {EVENT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleEventTypeChange(value)}
                style={{
                  padding: '10px 20px',
                  border: `1px solid ${eventType === value ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '2px',
                  background: eventType === value ? 'rgba(212,168,83,0.1)' : 'transparent',
                  color: eventType === value ? 'var(--gold)' : 'var(--muted)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Connected Show (audition only) ── */}
        {eventType === 'audition' && (
          <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '24px' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>Connected Show or Camp</p>
            <label style={{ display: 'block' }}>
              <span style={labelStyle}>Show / Camp <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
              <select
                value={parentShowId}
                onChange={e => handleParentShowChange(e.target.value)}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                <option value="">— Select a show or camp —</option>
                {parentShows.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.event_type})</option>
                ))}
              </select>
            </label>
            {parentShowId && (
              <p style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: '10px' }}>
                Title, venue, and season pulled from connected show. Override below if needed.
              </p>
            )}
          </div>
        )}

        {/* ── Basic Info ── */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>Basic Info</p>

          <label style={{ display: 'block', marginBottom: '20px' }}>
            <span style={labelStyle}>Title</span>
            <input
              type="text"
              required
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder={eventType === 'audition' ? 'e.g. Newsies Auditions' : 'e.g. Newsies'}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'block' }}>
            <span style={labelStyle}>URL Slug</span>
            <input
              type="text"
              required
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
              placeholder="e.g. newsies-2026"
              style={inputStyle}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '6px', display: 'block' }}>
              {publicPath}
            </span>
          </label>
        </div>

        {/* ── Audition Settings (audition only) ── */}
        {eventType === 'audition' && (
          <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '24px' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>Audition Settings</p>

            <div style={{ marginBottom: '20px' }}>
              <span style={labelStyle}>Registration Type</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(['slot', 'window'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAuditionType(type)}
                    style={{
                      padding: '10px 20px',
                      border: `1px solid ${auditionType === type ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius: '2px',
                      background: auditionType === type ? 'rgba(212,168,83,0.1)' : 'transparent',
                      color: auditionType === type ? 'var(--gold)' : 'var(--muted)',
                      fontSize: '0.78rem',
                      letterSpacing: '0.1em',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <label>
                <span style={labelStyle}>Min Age <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
                <input name="age_min" type="number" min={1} max={99} placeholder="e.g. 8" style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Max Age <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
                <input name="age_max" type="number" min={1} max={99} placeholder="e.g. 18" style={inputStyle} />
              </label>
            </div>
          </div>
        )}

        {error && <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '16px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '16px' }}>
          <button type="submit" disabled={isPending} className="btn-primary" style={{ opacity: isPending ? 0.6 : 1 }}>
            <span>{isPending ? 'Creating…' : 'Create Event'}</span>
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </div>
  )
}
