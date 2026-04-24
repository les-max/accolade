import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PageHero from '@/components/PageHero';


function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const s = new Date(start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (!end || end === start) return s;
  const e = new Date(end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${s} – ${e}`;
}

export default async function CurrentSeasonPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('shows')
    .select('id, title, slug, description, event_type, start_date, end_date, show_image, show_image_wide, cta_label, cta_url, status')
    .eq('archived', false)
    .eq('event_type', 'show')
    .order('start_date', { ascending: true });

  const shows = events ?? [];

  return (
    <>
      <PageHero
        eyebrow="Accolade Community Theatre"
        title="Current"
        titleItalic="Season"
        subtitle="The shows happening this season."
      />

      <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px) clamp(80px, 12vw, 140px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {shows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', marginBottom: '12px' }}>
                Nothing scheduled yet
              </p>
              <p style={{ fontSize: '0.9rem' }}>Check back soon for upcoming season announcements.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
              {shows.map(event => {
                const dateStr = formatDateRange(event.start_date, event.end_date);
                return (
                  <Link
                    key={event.id}
                    href={`/shows/${event.slug}`}
                    style={{
                      position: 'relative',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      background: 'var(--layer)',
                      display: 'flex',
                      flexDirection: 'column',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ position: 'relative', aspectRatio: '16/9', flexShrink: 0 }}>
                      {(event.show_image_wide ?? event.show_image) ? (
                        <Image
                          src={(event.show_image_wide ?? event.show_image)!}
                          alt={event.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                        />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1535, #0e1828)' }} />
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.5) 0%, transparent 60%)' }} />
                    </div>

                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {dateStr && (
                        <p style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
                          {dateStr}
                        </p>
                      )}
                      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: '12px' }}>
                        {event.title}
                      </h2>
                      {event.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '20px', flex: 1 }}>
                          {event.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginTop: 'auto' }}>
                        {event.cta_label && event.cta_url && (
                          <Link
                            href={event.cta_url}
                            onClick={e => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '0.68rem',
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              color: 'var(--gold)',
                              textDecoration: 'none',
                              fontWeight: 600,
                            }}
                          >
                            {event.cta_label} →
                          </Link>
                        )}
                        <span style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>
                          Details →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
