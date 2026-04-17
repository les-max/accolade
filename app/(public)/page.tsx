import Link from 'next/link';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import CursorGlow from '@/components/CursorGlow';
import HeroPhotoLayer from '@/components/HeroPhotoLayer';
import { createClient } from '@/lib/supabase/server';
import SponsorsRibbon from '@/components/SponsorsRibbon'

const IMG_EXT = /\.(jpe?g|png|webp|avif)$/i;

function getHeroPhotos(): string[] {
  const dir = path.join(process.cwd(), 'public', 'hero');
  try {
    return fs.readdirSync(dir)
      .filter(f => IMG_EXT.test(f))
      .sort()
      .map(f => `/hero/${f}`);
  } catch {
    return [];
  }
}

const TYPE_COLORS: Record<string, string> = {
  show:     'var(--teal)',
  audition: 'var(--gold)',
  camp:     'var(--rose)',
  workshop: 'var(--amber)',
  event:    'var(--muted)',
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return ''
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  if (!end || end === start) return s
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return `${s} – ${e}`
}

export default async function HomePage() {
  const heroPhotos = getHeroPhotos();

  const supabase = await createClient();
  const { data: events } = await supabase
    .from('shows')
    .select('id, title, slug, description, event_type, start_date, end_date, show_image, featured, cta_label, cta_url')
    .eq('homepage_visible', true)
    .order('start_date', { ascending: true })
    .limit(5);

  const featuredEvent = events?.find(e => e.featured) ?? events?.[0] ?? null;
  const stackEvents = events?.filter(e => e.id !== featuredEvent?.id) ?? [];
  return (
    <>
      <CursorGlow />

      {/* ── Hero ─────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        height: '100vh',
        minHeight: '700px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e0f35 0%, #0d1a2e 30%, #1e1030 60%, #0e0d14 100%)',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(14,13,20,0.55) 0%, rgba(14,13,20,0.3) 40%, rgba(14,13,20,0.6) 80%, var(--ink) 100%)',
          zIndex: 1,
        }} />

        <HeroPhotoLayer photos={heroPhotos} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: '860px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(3.2rem, 9vw, 8.5rem)',
            fontWeight: 900,
            lineHeight: 0.93,
            marginBottom: '32px',
            background: 'linear-gradient(180deg, var(--warm-white) 0%, rgba(245,240,232,0.75) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Where Community<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400, WebkitTextFillColor: 'var(--gold)', color: 'var(--gold)' }}>
              Comes Alive
            </em>
          </h1>

          <p style={{ fontSize: '1.05rem', fontWeight: 300, color: 'var(--muted)', maxWidth: '500px', margin: '0 auto 52px', lineHeight: 1.75, letterSpacing: '0.02em' }}>
            Making excellent theatre experiences possible for families in Richardson, TX and beyond.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tickets" className="btn-primary">
              <span>Get Tickets</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/auditions" className="btn-ghost">
              <span>Audition Info</span>
            </Link>
          </div>
        </div>

        <div className="scroll-indicator" aria-hidden="true">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ── Now Showing ──────────────────────────────── */}
      {featuredEvent && (
        <section style={{ padding: 'clamp(56px, 12vw, 140px) clamp(20px, 5vw, 48px)', position: 'relative' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <p className="section-label">Now Showing</p>
            <div className="g-2a" style={{ display: 'grid', gap: '32px' }}>

              {/* Featured card */}
              <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden' }}>
                {featuredEvent.show_image ? (
                  <Image src={featuredEvent.show_image} alt={featuredEvent.title} fill style={{ objectFit: 'cover' }} sizes="50vw" />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #2d1b4e, #1b0a2e, #0f1a2e)' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.96) 0%, rgba(14,13,20,0.2) 40%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(24px, 4vw, 48px) clamp(20px, 4vw, 40px)', zIndex: 2 }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: TYPE_COLORS[featuredEvent.event_type] ?? 'var(--teal)', marginBottom: '16px', fontWeight: 500 }}>
                    {featuredEvent.event_type.charAt(0).toUpperCase() + featuredEvent.event_type.slice(1)}
                    {formatDateRange(featuredEvent.start_date, featuredEvent.end_date) && (
                      <span style={{ color: 'var(--muted)', marginLeft: '12px' }}>
                        {formatDateRange(featuredEvent.start_date, featuredEvent.end_date)}
                      </span>
                    )}
                  </p>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, lineHeight: 1, marginBottom: '16px' }}>
                    {featuredEvent.title}
                  </h2>
                  {featuredEvent.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65, maxWidth: '360px' }}>
                      {featuredEvent.description}
                    </p>
                  )}
                  {featuredEvent.cta_label && featuredEvent.cta_url && (
                    <Link href={featuredEvent.cta_url} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '24px', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                      {featuredEvent.cta_label} →
                    </Link>
                  )}
                </div>
              </div>

              {/* Stack */}
              {stackEvents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {stackEvents.map(event => (
                    <div key={event.id} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '4px', overflow: 'hidden' }}>
                      {event.show_image ? (
                        <Image src={event.show_image} alt={event.title} fill style={{ objectFit: 'cover' }} sizes="40vw" />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a2030, #0e1020)' }} />
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.9) 0%, rgba(14,13,20,0.1) 60%)' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '32px', zIndex: 2 }}>
                        <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: TYPE_COLORS[event.event_type] ?? 'var(--muted)', marginBottom: '10px', fontWeight: 500 }}>
                          {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                          {formatDateRange(event.start_date, event.end_date) && (
                            <span style={{ color: 'var(--muted)', marginLeft: '10px' }}>
                              {formatDateRange(event.start_date, event.end_date)}
                            </span>
                          )}
                        </p>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700 }}>{event.title}</h3>
                        {event.cta_label && event.cta_url && (
                          <Link href={event.cta_url} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                            {event.cta_label} →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Stats ─────────────────────────────────────── */}
      <div className="g-4" style={{ display: 'grid', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        {[
          { number: '20+',   label: 'Years of\nCommunity Theatre' },
          { number: '100+',  label: 'Productions\nCompleted' },
          { number: '500+',  label: 'Students &\nPerformers Served' },
          { number: '1000s', label: 'Audience Members\nEach Season' },
        ].map(({ number, label }, i) => (
          <div key={i} style={{ padding: 'clamp(32px, 5vw, 60px) clamp(16px, 3vw, 32px)', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : undefined }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: 'var(--gold)', lineHeight: 1, marginBottom: '8px' }}>{number}</div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Mission ───────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 12vw, 160px) clamp(20px, 5vw, 48px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 50%, rgba(61,158,140,0.05) 0%, transparent 55%), radial-gradient(ellipse at 75% 50%, rgba(212,168,83,0.04) 0%, transparent 55%)' }} />
        <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.75rem', letterSpacing: '0.4em', color: 'var(--teal)', textTransform: 'uppercase', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <span style={{ display: 'block', width: '40px', height: '1px', background: 'var(--teal)', opacity: 0.5 }} />
            Our Mission
            <span style={{ display: 'block', width: '40px', height: '1px', background: 'var(--teal)', opacity: 0.5 }} />
          </p>
          <blockquote style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 4.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.25, marginBottom: '40px', color: 'var(--cream)' }}>
            &ldquo;Theatre is not just for the{' '}
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontStyle: 'normal' }}>talented</span> —<br />
            it is for the{' '}
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontStyle: 'normal' }}>willing</span>.&rdquo;
          </blockquote>
          <p style={{ fontSize: '1rem', color: 'var(--muted)', maxWidth: '620px', margin: '0 auto 48px', lineHeight: 1.8 }}>
            Accolade Community Theatre exists to welcome every person who wants to participate — whether on stage, backstage, in the audience, or behind the scenes. No experience required. Just bring your heart.
          </p>
          <Link href="/about" className="btn-ghost"><span>Our Story</span></Link>
        </div>
      </section>

      {/* ── Get Involved ─────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px) clamp(56px, 12vw, 140px)' }}>
        <div className="section-header-split" style={{ maxWidth: '1400px', margin: '0 auto 64px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900, lineHeight: 1, maxWidth: '580px' }}>
            There&apos;s a place here<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--teal)' }}>for you</em>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)', maxWidth: '300px', lineHeight: 1.75, textAlign: 'right' }}>
            Whether you want to perform, volunteer, or just enjoy great shows — Accolade is your community theatre.
          </p>
        </div>

        <div className="g-3" style={{ display: 'grid', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          {[
            { tag: 'Perform', tagColor: 'var(--gold)',  bg: 'linear-gradient(160deg, #2a1540, #0f0a1a)', iconBorder: 'rgba(212,168,83,0.35)',   title: 'Audition for a Show',    body: 'All skill levels welcome. From first-time performers to seasoned actors — if you want to be on stage, we want you.',                         href: '/auditions',   idx: 0 },
            { tag: 'Support', tagColor: 'var(--teal)',  bg: 'linear-gradient(160deg, #0d2a28, #061514)', iconBorder: 'rgba(61,158,140,0.35)',    title: 'Volunteer Backstage',    body: 'Great theatre takes a village. Help build sets, run lights, manage costumes, or usher for shows.',                                           href: '/volunteering', idx: 1 },
            { tag: 'Partner', tagColor: 'var(--rose)',  bg: 'linear-gradient(160deg, #302a1a, #141008)', iconBorder: 'rgba(200,90,122,0.35)',    title: 'Become a Partner',       body: 'Support the arts in your community. Partnership opportunities available for businesses and individuals.',                                  href: '/partners',    idx: 2 },
          ].map(({ tag, tagColor, bg, iconBorder, title, body, href }) => (
            <Link key={tag} href={href} style={{ position: 'relative', aspectRatio: '4/5', borderRadius: '4px', overflow: 'hidden', textDecoration: 'none', color: 'var(--warm-white)', display: 'block' }}>
              <div style={{ position: 'absolute', inset: 0, background: bg }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.95) 0%, rgba(14,13,20,0.2) 50%, transparent 100%)' }} />
              <div style={{ position: 'absolute', top: '28px', left: '28px', width: '48px', height: '48px', border: `1px solid ${iconBorder}`, borderRadius: '50%', zIndex: 2 }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 28px', zIndex: 2 }}>
                <span style={{ fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px', display: 'block', color: tagColor }}>{tag}</span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', fontWeight: 700, marginBottom: '12px', lineHeight: 1.1 }}>{title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.65, marginBottom: '20px' }}>{body}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: tagColor }}>Learn More →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Sponsors ──────────────────────────────────── */}
      <SponsorsRibbon />

      {/* ── Community CTA ─────────────────────────────── */}
      <section style={{ padding: '0 clamp(20px, 5vw, 48px) clamp(56px, 12vw, 160px)', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(61,158,140,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', padding: 'clamp(32px, 6vw, 80px) clamp(20px, 5vw, 60px)', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--layer)', backdropFilter: 'blur(20px)' }}>
          <div className="deco-top" style={{ position: 'absolute', top: '-1px', height: '1px', background: 'repeating-linear-gradient(90deg, var(--teal) 0, var(--teal) 8px, transparent 8px, transparent 16px)', opacity: 0.4 }} />
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: '24px', fontWeight: 500 }}>This is your theatre</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, marginBottom: '20px', lineHeight: 1.1 }}>
            Ready to be part of<br />
            <em style={{ fontStyle: 'italic', color: 'var(--gold)', fontWeight: 400 }}>something special?</em>
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--muted)', maxWidth: '480px', margin: '0 auto 40px', lineHeight: 1.75 }}>
            Join hundreds of community members who have found their home at Accolade Theatre. There&apos;s always a seat — or a spotlight — waiting for you.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tickets" className="btn-primary"><span>See Current Shows</span></Link>
            <Link href="/donate" className="btn-ghost"><span>Support the Arts</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
