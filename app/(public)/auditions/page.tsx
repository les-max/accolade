import Image from 'next/image';
import PageHero from '@/components/PageHero';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Auditions — Accolade Community Theatre',
};

export default async function AuditionsPage() {
  const supabase = await createClient();
  const { data: activeShows } = await supabase
    .from('shows')
    .select('id, slug, title, description, age_min, age_max, audition_type, show_image, show_image_wide, start_date, end_date, field_config, parent_show:parent_show_id(show_image, show_image_wide)')
    .eq('event_type', 'audition')
    .eq('status', 'active')
    .eq('archived', false)
    .order('start_date', { ascending: true });

  return (
    <>
      <PageHero
        eyebrow="Get On Stage"
        title="Auditions"
        titleItalic="Step Into the Light"
        subtitle="We are a youth theatre — welcoming performers ages 5–19. No experience needed. Just a willingness to try."
        accentColor="var(--gold)"
      />

      {/* ── Upcoming Auditions ────────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Open Auditions</p>

          {activeShows && activeShows.length > 0 ? (
            activeShows.map(show => {
              const ageLabel = show.age_min && show.age_max
                ? `Ages ${show.age_min}–${show.age_max}`
                : show.age_min ? `Ages ${show.age_min}+` : null;
              const parent = Array.isArray(show.parent_show) ? show.parent_show[0] : show.parent_show;
              const allowCrewSignup = (show.field_config as Record<string, unknown> | null)?.allow_crew_signup === true;
              const heroImage =
                show.show_image_wide ?? show.show_image ??
                parent?.show_image_wide ?? parent?.show_image ?? null;
              return (
                <div key={show.id} style={{ border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--layer)', overflow: 'hidden', marginBottom: '24px' }}>
                  <div className="g-2s" style={{ display: 'grid' }}>
                    <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                      {heroImage ? (
                        <Image
                          src={heroImage}
                          alt={show.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #2d1b4e, #1b0a2e)' }} />
                      )}
                    </div>
                    <div style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '6px 14px', border: '1px solid rgba(212,168,83,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                          {show.audition_type === 'slot' ? 'Time Slots' : 'Auditions Open'}
                        </span>
                        {ageLabel && (
                          <span style={{ padding: '6px 14px', border: '1px solid rgba(61,158,140,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)' }}>
                            {ageLabel}
                          </span>
                        )}
                      </div>
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, marginBottom: '12px' }}>
                        {show.title}
                      </h2>
                      {show.description && (
                        <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '32px', maxWidth: '520px' }}>
                          {show.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <Link href={`/auditions/${show.slug}`} className="btn-primary">
                          <span>Register to Audition</span>
                        </Link>
                        {allowCrewSignup && (
                          <Link href={`/auditions/${show.slug}?crew=1`} className="btn-ghost">
                            <span>Join the Crew</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', marginBottom: '12px' }}>
                No auditions open right now
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Check back soon or follow us on social media for announcements.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── What to Expect ────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px)', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">What to Expect</p>
          <div className="g-3" style={{ display: 'grid', gap: '48px' }}>
            {[
              { step: '01', title: 'Pick Your Time', body: 'When registration opens, choose from available audition slots. Slots fill quickly, so sign up early.' },
              { step: '02', title: 'Prepare Your Piece', body: 'For musicals, bring 16–32 bars of a song in the style of the show. For plays, prepare a 1–2 minute monologue.' },
              { step: '03', title: 'Show Up & Be Yourself', body: 'Callbacks are held within a week. All cast decisions are made by the director. You\'ll hear from us either way.' },
            ].map(({ step, title, body }) => (
              <div key={step}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '4rem', color: 'rgba(212,168,83,0.15)', lineHeight: 1, marginBottom: '16px' }}>{step}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>{title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.75, fontSize: '0.88rem' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Crew / Crew Registration ──────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Not a Performer?</p>
          <div className="g-2" style={{ display: 'grid', gap: '64px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px' }}>
                Join the<br />
                <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--teal)' }}>production crew</em>
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '20px' }}>
                Great theatre doesn&apos;t happen without a great crew. We welcome volunteers for every aspect of production — no experience necessary for most roles, just willingness to learn and show up.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {['Stage Management', 'Lighting & Sound', 'Set Construction', 'Costumes & Wardrobe', 'Props', 'Hair & Makeup'].map((role) => (
                  <li key={role} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--warm-white)' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />
                    {role}
                  </li>
                ))}
              </ul>

            </div>
            <div style={{ aspectRatio: '4/3', borderRadius: '4px', background: 'linear-gradient(160deg, #0d2a28, #061514)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.4) 0%, transparent 60%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────── */}
      <section style={{ padding: '0 clamp(20px, 5vw, 48px) clamp(48px, 10vw, 120px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p className="section-label">Common Questions</p>
          {[
            { q: 'Do I need prior experience to audition?', a: 'Not at all. Accolade welcomes first-time performers. The director will always consider enthusiasm and commitment alongside skill.' },
            { q: 'What age ranges do you cast?', a: 'We are a youth theatre — our productions are cast with performers ages 5–19. Adults are welcome to be part of the community as volunteers and crew.' },
            { q: 'Is there a fee to participate?', a: 'Most productions have a participation fee: $50 per child for the first two children in a family, and $25 per child for the third and beyond. Scholarship assistance is available — just reach out and ask.' },
            { q: 'How do I know when auditions are announced?', a: 'Join our mailing list or follow us on social media. Audition announcements typically go out about 30 days before the audition date.' },
          ].map(({ q, a }, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', padding: '28px 0' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px' }}>{q}</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.75, fontSize: '0.9rem' }}>{a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
