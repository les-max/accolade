import PageHero from '@/components/PageHero';
import Link from 'next/link';

export const metadata = {
  title: 'Auditions — Accolade Community Theatre',
};

export default function AuditionsPage() {
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
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Upcoming Auditions</p>

          {/* Newsies audition card */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--layer)', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 0 }}>
              <div style={{ background: 'linear-gradient(160deg, #2d1b4e, #1b0a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', minHeight: '240px' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 900, textAlign: 'center' }}>Newsies</h2>
              </div>
              <div style={{ padding: '48px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '6px 14px', border: '1px solid rgba(212,168,83,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-light)' }}>Musical</span>
                  <span style={{ padding: '6px 14px', border: '1px solid rgba(61,158,140,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)' }}>Ages 10+</span>
                </div>
                <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '32px', maxWidth: '520px' }}>
                  The rousing musical based on the 1899 newsboy strike in New York City. We&apos;re casting a large ensemble — singers, dancers, and actors all welcome. Auditions include a brief song (16–32 bars) and a movement call.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                  {[
                    { label: 'Audition Dates', value: 'TBD — Summer 2025' },
                    { label: 'Show Dates', value: 'TBD — Summer 2025' },
                    { label: 'Rehearsals', value: 'Weeknights & Weekends' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '6px', fontWeight: 600 }}>{label}</p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--warm-white)' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '24px', fontStyle: 'italic' }}>
                  Registration opens when dates are confirmed. Check back soon or join our mailing list for updates.
                </p>
                <button className="btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <span>Registration Coming Soon</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What to Expect ────────────────────────── */}
      <section style={{ padding: '80px 48px', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">What to Expect</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px' }}>
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
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Not a Performer?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
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
              <Link href="/volunteering" className="btn-ghost"><span>Volunteer for Crew</span></Link>
            </div>
            <div style={{ aspectRatio: '4/3', borderRadius: '4px', background: 'linear-gradient(160deg, #0d2a28, #061514)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.4) 0%, transparent 60%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────── */}
      <section style={{ padding: '0 48px 120px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p className="section-label">Common Questions</p>
          {[
            { q: 'Do I need prior experience to audition?', a: 'Not at all. Accolade welcomes first-time performers. The director will always consider enthusiasm and commitment alongside skill.' },
            { q: 'What age ranges do you cast?', a: 'We are a youth theatre — our productions are cast with performers ages 5–19. Adults are welcome to be part of the community as volunteers and crew.' },
            { q: 'Is there a fee to participate?', a: 'Some productions have a participation fee (tuition) to help cover costs. This is always disclosed during the audition process. Financial hardship waivers are available — just ask.' },
            { q: 'How do I know when auditions are announced?', a: 'Join our mailing list or follow us on social media. Audition announcements go out 4–6 weeks before the audition date.' },
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
