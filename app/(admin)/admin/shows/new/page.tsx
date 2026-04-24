'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createListing } from '../actions'
import { uploadEventImage } from '../../events/uploadImage'
import PerformancesInput from '../../components/PerformancesInput'

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

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: '40px', height: '22px', borderRadius: '11px',
      background: on ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
      position: 'relative', flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer',
    }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '21px' : '3px',
        width: '16px', height: '16px',
        borderRadius: '50%', background: 'white', transition: 'left 0.2s',
      }} />
    </div>
  )
}

const EVENT_TYPES = [
  { value: 'show',     label: 'Show'     },
  { value: 'camp',     label: 'Camp'     },
  { value: 'workshop', label: 'Workshop' },
  { value: 'event',    label: 'Event'    },
  { value: 'other',    label: 'Other'    },
]

export default function NewListingPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [eventType, setEventType] = useState('show')
  const [featured, setFeatured] = useState(false)
  const [homepageVisible, setHomepageVisible] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageWideFile, setImageWideFile] = useState<File | null>(null)
  const [imageWidePreview, setImageWidePreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  function handleImageWideChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageWideFile(file)
    setImageWidePreview(file ? URL.createObjectURL(file) : null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    data.set('featured', String(featured))
    data.set('homepage_visible', String(homepageVisible))

    startTransition(async () => {
      try {
        if (imageFile) data.set('show_image', await uploadEventImage(imageFile))
        if (imageWideFile) data.set('show_image_wide', await uploadEventImage(imageWideFile))
        await createListing(data)
      } catch (err: unknown) {
        if (err instanceof Error && (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '40px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
          ← Back
        </button>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Events</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>New Event</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="event_type" value={eventType} />

        {/* ── Basic Info ── */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>Basic Info</p>

          <label style={{ display: 'block', marginBottom: '20px' }}>
            <span style={labelStyle}>Event Type</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EVENT_TYPES.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setEventType(value)} style={{
                  padding: '8px 16px',
                  border: `1px solid ${eventType === value ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '2px',
                  background: eventType === value ? 'rgba(212,168,83,0.1)' : 'transparent',
                  color: eventType === value ? 'var(--gold)' : 'var(--muted)',
                  fontSize: '0.72rem', letterSpacing: '0.1em',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </label>

          <label style={{ display: 'block', marginBottom: '20px' }}>
            <span style={labelStyle}>Title</span>
            <input name="title" type="text" required value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="e.g. Summer Camp 2026" style={inputStyle} />
          </label>

          <label style={{ display: 'block', marginBottom: '20px' }}>
            <span style={labelStyle}>URL Slug</span>
            <input
              name="slug" type="text" required value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
              placeholder="e.g. summer-camp-2026"
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '20px' }}>
            <span style={labelStyle}>Description</span>
            <textarea name="description" rows={3} placeholder="Brief description shown publicly" style={{ ...inputStyle, resize: 'vertical' }} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <label>
              <span style={labelStyle}>Start Date</span>
              <input name="start_date" type="date" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>End Date <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
              <input name="end_date" type="date" style={inputStyle} />
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>Portrait Image — 2:3 ratio · 1200 × 1800 px</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px dashed var(--border)', borderRadius: '2px', padding: '16px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="preview" style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '2px' }} />
              ) : (
                <div style={{ width: '40px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>+</span>
                </div>
              )}
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--warm-white)', marginBottom: '4px' }}>{imageFile ? imageFile.name : 'Click to upload portrait image'}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>JPG, PNG, WebP · portrait orientation</p>
              </div>
            </label>
          </div>

          <div>
            <span style={labelStyle}>Wide Image — 16:9 ratio · 1920 × 1080 px</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px dashed var(--border)', borderRadius: '2px', padding: '16px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
              <input type="file" accept="image/*" onChange={handleImageWideChange} style={{ display: 'none' }} />
              {imageWidePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageWidePreview} alt="preview" style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '2px' }} />
              ) : (
                <div style={{ width: '80px', height: '45px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>+</span>
                </div>
              )}
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--warm-white)', marginBottom: '4px' }}>{imageWideFile ? imageWideFile.name : 'Click to upload wide image'}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>JPG, PNG, WebP · landscape orientation</p>
              </div>
            </label>
          </div>
        </div>

        {/* ── Performances ── */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>Performances</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '20px' }}>Add each performance date and time separately.</p>
          <PerformancesInput
            allowedTypes={[{ value: 'performance', label: 'Performance' }]}
          />
        </div>

        {/* ── Homepage Display ── */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '32px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>Homepage Display</p>
          {[
            { label: 'Show on homepage', sub: 'Appears in the Current Season section', state: homepageVisible, set: setHomepageVisible },
            { label: 'Featured', sub: 'Displays as the large card on the left', state: featured, set: setFeatured },
          ].map(({ label, sub, state, set }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <Toggle on={state} onChange={set} />
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--warm-white)', marginBottom: '2px' }}>{label}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{sub}</p>
              </div>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>
              <span style={labelStyle}>CTA Button Label</span>
              <input name="cta_label" type="text" placeholder="Learn More" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>CTA Link</span>
              <input name="cta_url" type="text" placeholder="/current-season" style={inputStyle} />
            </label>
          </div>
        </div>

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
