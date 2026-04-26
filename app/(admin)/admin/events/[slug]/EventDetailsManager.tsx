'use client'

import { useState, useTransition } from 'react'
import { updateShowDetails } from './actions'
import { uploadEventImage } from '../uploadImage'
import type { StaffRole } from '@/lib/staff'

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
  colorScheme: 'dark',
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

const sectionStyle: React.CSSProperties = {
  paddingTop: '20px',
  marginTop: '20px',
  borderTop: '1px solid var(--border)',
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.58rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: '16px',
  display: 'block',
}

function Toggle({ on, onChange, disabled = false }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: '40px', height: '22px', borderRadius: '11px',
        background: on ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
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

function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  if (match) return match[1]
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed
  return trimmed
}

const TYPE_COLORS: Record<string, string> = {
  show:     'var(--teal)',
  audition: 'var(--gold)',
  camp:     'var(--rose)',
  workshop: 'var(--amber, #c87941)',
  event:    'var(--muted)',
}

const TYPE_LABELS: Record<string, string> = {
  show: 'Show', audition: 'Audition', camp: 'Camp', workshop: 'Workshop', event: 'Event',
}

type Props = {
  showId: string
  slug: string
  role: StaffRole
  show: {
    event_type: string
    start_date: string | null
    end_date: string | null
    featured: boolean
    cta_label: string | null
    cta_url: string | null
    show_image: string | null
    show_image_wide: string | null
    past_shows_visible: boolean
    youtube_video_id: string | null
    audition_type: string
    age_min: number | null
    age_max: number | null
    show_grade: boolean
    show_headshot_upload: boolean
    show_resume_upload: boolean
    allow_crew_signup: boolean
    crew_positions: number | null
    venue_id: string | null
    season: number | null
    parent_show_id: string | null
  }
  venues: { id: string; name: string; address: string | null; city: string | null; state: string | null }[]
  parentShows: { id: string; title: string; show_image: string | null; show_image_wide: string | null; venue_id: string | null; season: number | null }[]
}

export default function EventDetailsManager({ showId, slug, role, show, venues, parentShows }: Props) {
  const [isPending, startTransition] = useTransition()
  const eventType = show.event_type ?? 'show'
  const is = (types: string[]) => types.includes(eventType)

  const [startDate, setStartDate] = useState(show.start_date ?? '')
  const [endDate, setEndDate] = useState(show.end_date ?? '')
  const [featured, setFeatured] = useState(show.featured ?? false)
  const [ctaLabel, setCtaLabel] = useState(show.cta_label ?? '')
  const [ctaUrl, setCtaUrl] = useState(show.cta_url ?? '')
  const [auditionType, setAuditionType] = useState<'slot' | 'window'>(
    (show.audition_type as 'slot' | 'window') ?? 'slot'
  )
  const [ageMin, setAgeMin] = useState<number | null>(show.age_min)
  const [ageMax, setAgeMax] = useState<number | null>(show.age_max)
  const [showGrade, setShowGrade] = useState(show.show_grade ?? false)
  const [showHeadshot, setShowHeadshot] = useState(show.show_headshot_upload ?? false)
  const [showResume, setShowResume] = useState(show.show_resume_upload ?? false)
  const [allowCrewSignup, setAllowCrewSignup] = useState(show.allow_crew_signup ?? false)
  const [crewPositions, setCrewPositions] = useState<number | null>(show.crew_positions)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(show.show_image)
  const [imageWideFile, setImageWideFile] = useState<File | null>(null)
  const [imageWidePreview, setImageWidePreview] = useState<string | null>(show.show_image_wide)
  const [pastShowsVisible, setPastShowsVisible] = useState(show.past_shows_visible ?? false)
  const [youtubeVideoId, setYoutubeVideoId] = useState(show.youtube_video_id ?? '')
  const [venueId, setVenueId] = useState<string | null>(show.venue_id)
  const [season, setSeason] = useState<number | null>(show.season)
  const [parentShowId, setParentShowId] = useState<string | null>(show.parent_show_id)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = role === 'admin'
  const canEdit = (field: string) =>
    isAdmin || (['start_date', 'end_date', 'venue_id'].includes(field) && role === 'director')

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
          parent_show_id: parentShowId,
          cta_label: ctaLabel || null,
          cta_url: ctaUrl || null,
          venue_id: venueId || null,
          season,
          show_image: imageUrl,
          show_image_wide: imageWideUrl,
          past_shows_visible: pastShowsVisible,
          youtube_video_id: extractYoutubeId(youtubeVideoId),
          audition_type: auditionType,
          age_min: ageMin,
          age_max: ageMax,
          show_grade: showGrade,
          show_headshot_upload: showHeadshot,
          show_resume_upload: showResume,
          allow_crew_signup: allowCrewSignup,
          crew_positions: allowCrewSignup ? crewPositions : null,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  const typeColor = TYPE_COLORS[eventType] ?? 'var(--muted)'

  return (
    <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '28px', marginBottom: '24px' }}>

      {/* Header with type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <p style={{ fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Event Details
        </p>
        <span style={{
          padding: '3px 10px',
          border: `1px solid ${typeColor}`,
          borderRadius: '2px',
          fontSize: '0.58rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: typeColor,
        }}>
          {TYPE_LABELS[eventType] ?? eventType}
        </span>
      </div>

      {/* Connected Show (audition only) */}
      {is(['audition']) && (
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <label>
            <span style={labelStyle}>Connected Show</span>
            <select
              value={parentShowId ?? ''}
              disabled={!isAdmin}
              onChange={e => {
                const id = e.target.value || null
                setParentShowId(id)
                if (id) {
                  const s = parentShows.find(p => p.id === id)
                  if (s) {
                    if (s.show_image)      setImagePreview(s.show_image)
                    if (s.show_image_wide) setImageWidePreview(s.show_image_wide)
                    if (s.season != null)  setSeason(s.season)
                  }
                }
              }}
              style={{ ...inputStyle, appearance: 'none', opacity: isAdmin ? 1 : 0.5 }}
            >
              <option value="">— Not linked to a show —</option>
              {parentShows.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </label>
          {parentShowId && (
            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '8px' }}>
              Images, venue, and season pulled from connected show. Override below if needed.
            </p>
          )}
        </div>
      )}

      {/* Season (show, audition, camp) */}
      {is(['show', 'audition', 'camp']) && (
        <div style={{ marginBottom: '20px' }}>
          <label>
            <span style={labelStyle}>Season <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
            <select
              value={season ?? ''}
              disabled={!isAdmin}
              onChange={e => setSeason(e.target.value ? Number(e.target.value) : null)}
              style={{ ...inputStyle, appearance: 'none', opacity: isAdmin ? 1 : 0.5 }}
            >
              <option value="">— Unassigned —</option>
              {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>Season {n}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <label>
          <span style={labelStyle}>Start Date</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            disabled={!canEdit('start_date')}
            style={{ ...inputStyle, opacity: canEdit('start_date') ? 1 : 0.5 }}
          />
        </label>
        <label>
          <span style={labelStyle}>End Date <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={!canEdit('end_date')}
            style={{ ...inputStyle, opacity: canEdit('end_date') ? 1 : 0.5 }}
          />
        </label>
      </div>

      {/* Venue */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          <span style={labelStyle}>{eventType === 'audition' ? 'Audition Venue' : 'Venue'} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
          <select
            value={venueId ?? ''}
            disabled={!canEdit('venue_id')}
            onChange={e => setVenueId(e.target.value || null)}
            style={{ ...inputStyle, appearance: 'none', opacity: canEdit('venue_id') ? 1 : 0.5 }}
          >
            <option value="">— No venue —</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}{v.city ? ` — ${v.city}${v.state ? `, ${v.state}` : ''}` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Audition Settings (audition only) */}
      {is(['audition']) && (
        <div style={sectionStyle}>
          <span style={sectionLabel}>Audition Settings</span>
          <div style={{ marginBottom: '16px' }}>
            <span style={labelStyle}>Registration Type</span>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              {(['slot', 'window'] as const).map(type => (
                <button
                  key={type} type="button"
                  disabled={!isAdmin}
                  onClick={() => isAdmin && setAuditionType(type)}
                  style={{
                    padding: '8px 16px',
                    border: `1px solid ${auditionType === type ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '2px',
                    background: auditionType === type ? 'rgba(212,168,83,0.1)' : 'transparent',
                    color: auditionType === type ? 'var(--gold)' : 'var(--muted)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.1em',
                    cursor: isAdmin ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    opacity: isAdmin ? 1 : 0.5,
                  }}
                >
                  {type === 'slot' ? 'Specific Time Slots' : 'Audition Windows'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>
              <span style={labelStyle}>Min Age <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
              <input type="number" min={1} max={99} value={ageMin ?? ''} disabled={!isAdmin} onChange={e => setAgeMin(e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 8" style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.5 }} />
            </label>
            <label>
              <span style={labelStyle}>Max Age <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
              <input type="number" min={1} max={99} value={ageMax ?? ''} disabled={!isAdmin} onChange={e => setAgeMax(e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 18" style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.5 }} />
            </label>
          </div>
        </div>
      )}

      {/* Age Range (camp, workshop) */}
      {is(['camp', 'workshop']) && (
        <div style={sectionStyle}>
          <span style={sectionLabel}>Age Range</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>
              <span style={labelStyle}>Min Age <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
              <input type="number" min={1} max={99} value={ageMin ?? ''} disabled={!isAdmin} onChange={e => setAgeMin(e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 8" style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.5 }} />
            </label>
            <label>
              <span style={labelStyle}>Max Age <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
              <input type="number" min={1} max={99} value={ageMax ?? ''} disabled={!isAdmin} onChange={e => setAgeMax(e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 18" style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.5 }} />
            </label>
          </div>
        </div>
      )}

      {/* Images */}
      <div style={sectionStyle}>
        <span style={sectionLabel}>Images</span>

        {is(['audition']) && parentShowId ? (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '2px' }}>
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="portrait" style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
            )}
            {imageWidePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageWidePreview} alt="wide" style={{ width: '72px', height: '40px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
            )}
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              Using images from connected show.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '14px' }}>
              <span style={labelStyle}>Portrait — 2:3 ratio · 1200 × 1800 px</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px dashed var(--border)', borderRadius: '2px', padding: '14px', cursor: isAdmin ? 'pointer' : 'not-allowed', background: 'rgba(255,255,255,0.02)', opacity: isAdmin ? 1 : 0.6, pointerEvents: isAdmin ? undefined : 'none' }}>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} disabled={!isAdmin} />
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="preview" style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '2px' }} />
                ) : (
                  <div style={{ width: '36px', height: '54px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div>
              <span style={labelStyle}>Wide — 16:9 ratio · 1920 × 1080 px</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px dashed var(--border)', borderRadius: '2px', padding: '14px', cursor: isAdmin ? 'pointer' : 'not-allowed', background: 'rgba(255,255,255,0.02)', opacity: isAdmin ? 1 : 0.6, pointerEvents: isAdmin ? undefined : 'none' }}>
                <input type="file" accept="image/*" onChange={handleImageWideChange} style={{ display: 'none' }} disabled={!isAdmin} />
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
          </>
        )}
      </div>

      {/* Featured (show, camp, event) */}
      {is(['show', 'camp', 'event']) && (
        <div style={sectionStyle}>
          <span style={sectionLabel}>Homepage Display</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Toggle on={featured} onChange={setFeatured} disabled={!isAdmin} />
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--warm-white)', marginBottom: '1px' }}>Featured</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Displays as the featured event on the home page</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA (show, camp, workshop, event) */}
      {is(['show', 'camp', 'workshop', 'event']) && (
        <div style={sectionStyle}>
          <span style={sectionLabel}>{eventType === 'show' ? 'Tickets' : 'Call to Action'}</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>
              <span style={labelStyle}>Button Label</span>
              <input type="text" value={ctaLabel} disabled={!isAdmin} onChange={e => setCtaLabel(e.target.value)} placeholder={eventType === 'show' ? 'Get Tickets' : 'Register Now'} style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.5 }} />
            </label>
            <label>
              <span style={labelStyle}>Link</span>
              <input type="text" value={ctaUrl} disabled={!isAdmin} onChange={e => setCtaUrl(e.target.value)} placeholder="/tickets" style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.5 }} />
            </label>
          </div>
        </div>
      )}

      {/* Registration Form Fields (audition, camp, workshop) */}
      {is(['audition', 'camp', 'workshop']) && (
        <div style={sectionStyle}>
          <span style={sectionLabel}>Registration Form Fields</span>
          {([
            { label: 'Ask for grade in school',    state: showGrade,    set: setShowGrade    },
            { label: 'Require headshot upload',    state: showHeadshot, set: setShowHeadshot },
            { label: 'Require résumé upload',      state: showResume,   set: setShowResume   },
          ] as { label: string; state: boolean; set: (v: boolean) => void }[]).map(({ label, state, set }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: isAdmin ? 'pointer' : 'not-allowed' }}
              onClick={() => isAdmin && set(!state)}
            >
              <Toggle on={state} onChange={set} disabled={!isAdmin} />
              <span style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>{label}</span>
            </div>
          ))}
          {is(['audition']) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: isAdmin ? 'pointer' : 'not-allowed' }}
                onClick={() => isAdmin && setAllowCrewSignup(v => !v)}
              >
                <Toggle on={allowCrewSignup} onChange={setAllowCrewSignup} disabled={!isAdmin} />
                <span style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>Allow crew signup on this page</span>
              </div>
              {allowCrewSignup && (
                <div style={{ marginLeft: '52px', marginBottom: '4px' }}>
                  <label>
                    <span style={labelStyle}>Crew positions available</span>
                    <input
                      type="number"
                      min={1}
                      disabled={!isAdmin}
                      value={crewPositions ?? ''}
                      onChange={e => setCrewPositions(e.target.value ? Number(e.target.value) : null)}
                      placeholder="e.g. 10"
                      style={{ ...inputStyle, maxWidth: '120px', opacity: isAdmin ? 1 : 0.5 }}
                    />
                  </label>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Past Productions (show only) */}
      {is(['show']) && (
        <div style={sectionStyle}>
          <span style={sectionLabel}>Past Productions</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', cursor: isAdmin ? 'pointer' : 'not-allowed' }}
            onClick={() => isAdmin && setPastShowsVisible(v => !v)}
          >
            <Toggle on={pastShowsVisible} onChange={setPastShowsVisible} disabled={!isAdmin} />
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--warm-white)', marginBottom: '1px' }}>Show in past productions</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Appears in the Past Productions archive</p>
            </div>
          </div>
          <label>
            <span style={labelStyle}>YouTube Video <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></span>
            <input
              type="text"
              value={youtubeVideoId}
              disabled={!isAdmin}
              onChange={e => setYoutubeVideoId(e.target.value)}
              placeholder="https://youtu.be/dQw4w9WgXcQ  or  dQw4w9WgXcQ"
              style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.5 }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '6px' }}>
              Paste a YouTube URL or the 11-character video ID.
            </p>
          </label>
        </div>
      )}

      {error && <p style={{ color: 'var(--rose)', fontSize: '0.8rem', marginTop: '20px' }}>{error}</p>}

      {role !== 'production_manager' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
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
      )}
    </div>
  )
}
