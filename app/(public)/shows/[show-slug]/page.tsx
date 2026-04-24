import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const TYPE_COLORS: Record<string, string> = {
  show:     'var(--teal)',
  audition: 'var(--gold)',
  camp:     'var(--rose)',
  workshop: 'var(--amber)',
  event:    'var(--muted)',
};

const TYPE_LABELS: Record<string, string> = {
  show:     'Show',
  audition: 'Audition',
  camp:     'Camp',
  workshop: 'Workshop',
  event:    'Event',
};


function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const s = new Date(start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (!end || end === start) return s;
  const e = new Date(end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${s} – ${e}`;
}

function formatTime(t: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}


export default async function ShowDetailPage({ params }: { params: Promise<{ 'show-slug': string }> }) {
  const { 'show-slug': slug } = await params;
  const supabase = await createClient();

  const { data: show } = await supabase
    .from('shows')
    .select('id, slug, title, description, event_type, start_date, end_date, show_image, show_image_wide, cta_label, cta_url, youtube_video_id, status, venues(name, address, city, state, zip)')
    .eq('slug', slug)
    .eq('archived', false)
    .single();

  if (!show) notFound();

  const { data: performances } = await supabase
    .from('show_performances')
    .select('id, type, date, start_time, label')
    .eq('show_id', show.id)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  const accentColor = TYPE_COLORS[show.event_type] ?? 'var(--muted)';
  const heroImage = show.show_image_wide ?? show.show_image;
  const dateRange = formatDateRange(show.start_date, show.end_date);

  const showPerformances  = (performances ?? []).filter(p => p.type === 'performance');
  const auditionDates     = (performances ?? []).filter(p => p.type === 'audition');

  return (
    <>
      {/* ── Hero ─────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        height: 'clamp(480px, 60vh, 720px)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e0f35 0%, #0d1a2e 50%, #0e0d14 100%)',
      }}>
        {heroImage && (
          <Image
            src={heroImage}
            alt={show.title}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            sizes="100vw"
            priority
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.95) 0%, rgba(14,13,20,0.4) 50%, rgba(14,13,20,0.2) 100%)' }} />

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(32px, 5vw, 64px) clamp(20px, 5vw, 48px)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px',
                background: 'rgba(14,13,20,0.7)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${accentColor}`,
                borderRadius: '2px',
                fontSize: '0.6rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: accentColor,
                fontWeight: 600,
              }}>
                {TYPE_LABELS[show.event_type] ?? show.event_type}
              </span>
              {dateRange && (
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>
                  {dateRange}
                </span>
              )}
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.8rem, 7vw, 6rem)',
              fontWeight: 900,
              lineHeight: 0.95,
              maxWidth: '900px',
            }}>
              {show.title}
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 8vw, 96px) clamp(20px, 5vw, 48px) clamp(80px, 12vw, 140px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '48px' }}>
          <div className="g-2s" style={{ display: 'grid', gap: '48px', alignItems: 'start' }}>

            {/* ── Main column ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {show.description && (
                <div>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.7rem', letterSpacing: '0.35em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '20px' }}>About</p>
                  <p style={{ fontSize: '1.05rem', color: 'var(--cream)', lineHeight: 1.85 }}>
                    {show.description}
                  </p>
                </div>
              )}

              {/* YouTube embed */}
              {show.youtube_video_id && (
                <div>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.7rem', letterSpacing: '0.35em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '20px' }}>Video</p>
                  <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${show.youtube_video_id}`}
                      title={show.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '32px' }}>
              <div style={{
                background: 'var(--layer)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{ height: '3px', background: accentColor }} />
                <div style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Performance dates */}
                    {showPerformances.length > 0 ? (
                      <div>
                        <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>Performances</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {showPerformances.map(p => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>
                                {new Date(p.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                              </span>
                              {p.start_time && (
                                <span style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                  {formatTime(p.start_time)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : dateRange ? (
                      <div>
                        <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>Dates</p>
                        <p style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>{dateRange}</p>
                      </div>
                    ) : null}

                    {/* Audition dates */}
                    {auditionDates.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>Auditions</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {auditionDates.map(p => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>
                                {new Date(p.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                              </span>
                              {p.start_time && (
                                <span style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                  {formatTime(p.start_time)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {show.venues && (() => {
                      type V = { name: string; address?: string|null; city?: string|null; state?: string|null; zip?: string|null }
                      const v = (Array.isArray(show.venues) ? show.venues[0] : show.venues) as V | null
                      if (!v) return null
                      const addrLine = [v.address, v.city, v.state, v.zip].filter(Boolean).join(', ')
                      return (
                        <div>
                          <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>Location</p>
                          <p style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>{v.name}</p>
                          {addrLine && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '3px' }}>{addrLine}</p>}
                        </div>
                      )
                    })()}

                    {/* Tickets */}
                    {show.cta_url && (
                      <div>
                        <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>Tickets</p>
                        <a
                          href={show.cta_url}
                          style={{ fontSize: '0.88rem', color: accentColor, textDecoration: 'none', fontWeight: 600 }}
                        >
                          {show.cta_label ?? 'Get Tickets'} →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {show.cta_label && show.cta_url && (
                <Link href={show.cta_url} className="btn-primary" style={{ textAlign: 'center', justifyContent: 'center' }}>
                  <span>{show.cta_label}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}

              <Link href="/current-season" style={{ textAlign: 'center', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
                ← Back to Current Season
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
