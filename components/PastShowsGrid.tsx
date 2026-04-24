'use client'

import Image from 'next/image'
import { useState } from 'react'
import VideoModal from './VideoModal'

type PastShow = {
  id: string
  title: string
  event_type: string | null
  end_date: string | null
  show_image_wide: string | null
  show_image: string | null
  youtube_video_id: string | null
}

function getSeason(dateStr: string | null): string {
  if (!dateStr) return 'Earlier'
  const d = new Date(dateStr)
  const year = d.getFullYear()
  // Theatre season runs Aug – July — anything from Aug onward belongs to that year's season
  const month = d.getMonth() // 0 = Jan
  const seasonStart = month >= 7 ? year : year - 1
  return `${seasonStart}–${seasonStart + 1}`
}

export default function PastShowsGrid({ shows }: { shows: PastShow[] }) {
  const [active, setActive] = useState<PastShow | null>(null)

  // Group by season, newest first
  const bySeason = new Map<string, PastShow[]>()
  for (const show of shows) {
    const season = getSeason(show.end_date)
    if (!bySeason.has(season)) bySeason.set(season, [])
    bySeason.get(season)!.push(show)
  }
  const seasons = Array.from(bySeason.entries()).sort(([a], [b]) => b.localeCompare(a))

  return (
    <>
      {seasons.map(([season, seasonShows]) => (
        <div key={season} style={{ marginBottom: '80px' }}>
          <p className="section-label">{season} Season</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
            {seasonShows.map(show => {
              const image = show.show_image_wide ?? show.show_image
              const hasVideo = !!show.youtube_video_id
              const Card = (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: 'var(--layer)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: hasVideo ? 'pointer' : 'default',
                    transition: 'transform 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (hasVideo) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.borderColor = 'rgba(212,168,83,0.4)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  <div style={{ position: 'relative', aspectRatio: '16/9', flexShrink: 0 }}>
                    {image ? (
                      <Image
                        src={image}
                        alt={show.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1535, #0e1828)' }} />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.55) 0%, transparent 60%)' }} />
                    {hasVideo && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: '64px', height: '64px', borderRadius: '50%',
                          background: 'rgba(14,13,20,0.72)',
                          border: '1px solid rgba(255,255,255,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backdropFilter: 'blur(4px)',
                        }}>
                          <div style={{
                            width: 0, height: 0,
                            borderLeft: '16px solid var(--warm-white)',
                            borderTop: '11px solid transparent',
                            borderBottom: '11px solid transparent',
                            marginLeft: '4px',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '20px 22px 22px' }}>
                    {show.event_type && (
                      <span style={{
                        fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase',
                        color: 'var(--teal)', fontWeight: 500, display: 'block', marginBottom: '8px',
                      }}>
                        {show.event_type}
                      </span>
                    )}
                    <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', lineHeight: 1.05, marginBottom: '6px' }}>
                      {show.title}
                    </h3>
                    {show.end_date && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        {new Date(show.end_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              )

              return (
                <div
                  key={show.id}
                  onClick={() => { if (hasVideo) setActive(show) }}
                  role={hasVideo ? 'button' : undefined}
                  tabIndex={hasVideo ? 0 : undefined}
                  onKeyDown={e => { if (hasVideo && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setActive(show) } }}
                >
                  {Card}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {active?.youtube_video_id && (
        <VideoModal
          videoId={active.youtube_video_id}
          title={active.title}
          onClose={() => setActive(null)}
        />
      )}
    </>
  )
}
