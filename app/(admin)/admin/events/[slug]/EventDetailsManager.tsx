'use client'

import { useState, useTransition } from 'react'
import { updateShowDetails } from './actions'
import { uploadEventImage } from '../uploadImage'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '10px 14px',
  color: 'var(--warm-white)',
  fontSize: '0.88rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  marginBottom: '6px',
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: '40px', height: '22px', borderRadius: '11px',
        background: on ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '21px' : '3px',
        width: '16px', height: '16px',
        borderRadius: '50%', background: 'white',
        transition: 'left 0.2s',
      }} />
    </div>
  )
}

const EVENT_TYPES = ['show', 'audition', 'camp', 'workshop', 'event']

type Props = {
  showId: string
  slug: string
  show: {
    event_type: string
    start_date: string | null
    end_date: string | null
    featured: boolean
    homepage_visible: boolean
    cta_label: string | null
    cta_url: string | null
    show_image: string | null
    show_image_wide: string | null
    audition_type: string
    age_min: number | null
    age_max: number | null
    show_grade: boolean
    show_headshot_upload: boolean
  }
}

export default function EventDetailsManager({ showId, slug, show }: Props) {
  const [isPending, startTransition] = useTransition()
  const [eventType, setEventType] = useState(show.event_type ?? 'show')
  const [startDate, setStartDate] = useState(show.start_date ?? '')
  const [endDate, setEndDate] = useState(show.end_date ?? '')
  const [featured, setFeatured] = useState(show.featured ?? false)
  const [homepageVisible, setHomepageVisible] = useState(show.homepage_visible ?? false)
  const [ctaLabel, setCtaLabel] = useState(show.cta_label ?? '')
  const [ctaUrl, setCtaUrl] = useState(show.cta_url ?? '')
  const [auditionType, setAuditionType] = useState<'slot' | 'window'>(
    (show.audition_type as 'slot' | 'window') ?? 'slot'
  )
  const [ageMin, setAgeMin] = useState<number | null>(show.age_min)
  const [ageMax, setAgeMax] = useState<number | null>(show.age_max)
  const [showGrade, setShowGrade] = useState(show.show_grade ?? false)
  const [showHeadshot, setShowHeadshot] = useState(show.show_headshot_upload ?? false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(show.show_image)
  const [imageWideFile, setImageWideFile] = useState<File | null>(null)
  const [imageWidePreview, setImageWidePreview] = useState<string | null>(show.show_image_wide)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) setImagePreview(URL.createObjectURL(file))
  }

  function handleImageWideChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageWideFile(file)
    if (file) setImageWidePreview(URL.createObjectURL(file))
  }

  function handleSave() {
    setError('')
    setSaved(false)
    startTransition(async () => {
      try {
        let imageUrl = show.show_image
        if (imageFile) imageUrl = await uploadEventImage(imageFile)
        let imageWideUrl = show.show_image_wide
        if (imageWideFile) imageWideUrl = await uploadEventImage(imageWideFile)

        await updateShowDetails(showId, slug, {
          event_type: eventType,
          start_date: startDate || null,
          end_date: endDate || null,
          featured,
          homepage_visible: homepageVisible,
          cta_label: ctaLabel || null,
          cta_url: ctaUrl || null,
          show_image: imageUrl,
          show_image_wide: imageWideUrl,
          audition_type: auditionType,
          age_min: ageMin,
          age_max: ageMax,
          show_grade: showGrade,
          show_headshot_upload: showHeadshot,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '28px', marginBottom: '24px' }}>
      <p style={{ fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
        Event Details
      </p>

      {/* Event type */}
      <div style={{ marginBottom: '20px' }}>
        <span style={labelStyle}>Event Type</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {EVENT_TYPES.map(type => (
            <button
              key={type} type="button"
              onClick={() => setEventType(type)}
              style={{
                padding: '7px 14px',
                border: `1px solid ${eventType === type ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: '2px',
                background: eventType === type ? 'rgba(212,168,83,0.1)' : 'transparent',
                color: eventType === type ? 'var(--gold)' : 'var(--muted)',
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <label>
          <span style={labelStyle}>Start Date</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
        </label>
        <label>
          <span style={labelStyle}>End Date <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
        </label>
      </div>

      {/* Audition Settings — audition type only */}
      {eventType === 'audition' && (
        <div style={{ marginBottom: '20px' }}>
          <span style={labelStyle}>Audition Type</span>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
            {(['slot', 'window'] as const).map(type => (
              <button
                key={type} type="button"
                onClick={() => setAuditionType(type)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${auditionType === type ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '2px',
                  background: auditionType === type ? 'rgba(212,168,83,0.1)' : 'transparent',
                  color: auditionType === type ? 'var(--gold)' : 'var(--muted)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {type === 'slot' ? 'Specific Time Slots' : 'Audition Windows'}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
            <label>
              <span style={labelStyle}>Min Age</span>
              <input
                type="number" min={1} max={99}
                value={ageMin ?? ''}
                onChange={e => setAgeMin(e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g. 8"
                style={inputStyle}
              />
            </label>
            <label>
              <span style={labelStyle}>Max Age</span>
              <input
                type="number" min={1} max={99}
                value={ageMax ?? ''}
                onChange={e => setAgeMax(e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g. 18"
                style={inputStyle}
              />
            </label>
          </div>
        </div>
      )}

      {/* Portrait image 3/4 */}
      <div style={{ marginBottom: '16px' }}>
        <span style={labelStyle}>Portrait Image — 3:4 ratio (featured card)</span>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          border: '1px dashed var(--border)', borderRadius: '2px',
          padding: '14px', cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="preview" style={{ width: '40px', height: '54px', objectFit: 'cover', borderRadius: '2px' }} />
          ) : (
            <div style={{ width: '40px', height: '54px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.2rem', opacity: 0.4 }}>+</span>
            </div>
          )}
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--warm-white)', marginBottom: '3px' }}>
              {imageFile ? imageFile.name : imagePreview ? 'Click to replace' : 'Click to upload portrait image'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>JPG, PNG, WebP · portrait orientation</p>
          </div>
        </label>
      </div>

      {/* Wide image 16/9 */}
      <div style={{ marginBottom: '20px' }}>
        <span style={labelStyle}>Wide Image — 16:9 ratio (stack cards)</span>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          border: '1px dashed var(--border)', borderRadius: '2px',
          padding: '14px', cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <input type="file" accept="image/*" onChange={handleImageWideChange} style={{ display: 'none' }} />
          {imageWidePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageWidePreview} alt="preview" style={{ width: '72px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />
          ) : (
            <div style={{ width: '72px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.2rem', opacity: 0.4 }}>+</span>
            </div>
          )}
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--warm-white)', marginBottom: '3px' }}>
              {imageWideFile ? imageWideFile.name : imageWidePreview ? 'Click to replace' : 'Click to upload wide image'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>JPG, PNG, WebP · landscape orientation</p>
          </div>
        </label>
      </div>

      {/* Homepage toggles */}
      <div style={{ marginBottom: '20px' }}>
        <span style={labelStyle}>Homepage Display</span>
        {[
          { label: 'Show on homepage', sub: 'Appears in the Now Showing section', state: homepageVisible, set: setHomepageVisible },
          { label: 'Featured', sub: 'Displays as the large card on the left', state: featured, set: setFeatured },
        ].map(({ label, sub, state, set }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <Toggle on={state} onChange={set} />
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--warm-white)', marginBottom: '1px' }}>{label}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <label>
          <span style={labelStyle}>CTA Button Label</span>
          <input type="text" value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} placeholder="Get Tickets" style={inputStyle} />
        </label>
        <label>
          <span style={labelStyle}>CTA Link</span>
          <input type="text" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="/tickets" style={inputStyle} />
        </label>
      </div>

      {/* Registration Fields — audition, camp, workshop */}
      {['audition', 'camp', 'workshop'].includes(eventType) && (
        <div style={{ marginBottom: '20px' }}>
          <span style={labelStyle}>Registration Form Fields</span>
          {[
            { label: 'Ask for grade in school', state: showGrade, set: setShowGrade },
            { label: 'Allow headshot / resume upload', state: showHeadshot, set: setShowHeadshot },
          ].map(({ label, state, set }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', cursor: 'pointer' }}
              onClick={() => set(!state)}
            >
              <Toggle on={state} onChange={set} />
              <span style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ color: 'var(--rose)', fontSize: '0.8rem', marginBottom: '12px' }}>{error}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary"
          style={{ fontSize: '0.7rem', padding: '12px 28px', opacity: isPending ? 0.6 : 1 }}
        >
          <span>{isPending ? 'Saving…' : 'Save Details'}</span>
        </button>
        {saved && <span style={{ fontSize: '0.78rem', color: 'var(--teal)' }}>Saved</span>}
      </div>
    </div>
  )
}
