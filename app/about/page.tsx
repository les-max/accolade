import PageHero from '@/components/PageHero';
import Link from 'next/link';

const boardMembers = [
  { name: 'Board President', role: 'President' },
  { name: 'Vice President', role: 'Vice President' },
  { name: 'Treasurer', role: 'Treasurer' },
  { name: 'Secretary', role: 'Secretary' },
];

export const metadata = {
  title: 'About — Accolade Community Theatre',
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Accolade Community Theatre"
        title="More Than a Stage."
        titleItalic="A Community."
        subtitle="For over two decades, Accolade has been a home for storytellers, dreamers, and everyone in between — right here in Allen, TX."
      />

      {/* ── Our Story ─────────────────────────────── */}
      <section style={{ padding: '100px 48px', maxWidth: '900px', margin: '0 auto' }}>
        <p className="section-label">Our Story</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '28px' }}>
              Born from a love of<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gold)' }}>live performance</em>
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '20px' }}>
              Accolade Community Theatre was founded with a simple belief: everyone deserves access to the transformative power of live theatre — whether as a performer, crew member, or audience member.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
              What started as a small group of passionate volunteers has grown into one of North Texas&apos;s most beloved community theatres, producing shows that challenge, entertain, and inspire.
            </p>
          </div>
          <div>
            <div style={{ aspectRatio: '4/5', borderRadius: '4px', background: 'linear-gradient(160deg, #2a1540, #0f0a1a)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.6) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: '24px', left: '24px' }}>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Est. 2003</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────── */}
      <section style={{ padding: '80px 48px', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">What We Stand For</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px' }}>
            {[
              { title: 'Inclusion', color: 'var(--teal)', body: 'Theatre is for everyone. We actively welcome performers and volunteers of all backgrounds, ages, and experience levels.' },
              { title: 'Excellence', color: 'var(--gold)', body: 'Community theatre doesn\'t mean settling. We bring professional-quality production values to every show we produce.' },
              { title: 'Community', color: 'var(--rose)', body: 'We exist to serve our neighbors. The relationships built at Accolade last long after the curtain falls.' },
            ].map(({ title, color, body }) => (
              <div key={title}>
                <div style={{ width: '2px', height: '40px', background: color, marginBottom: '24px' }} />
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '16px' }}>{title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.75, fontSize: '0.9rem' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Board & Staff ─────────────────────────── */}
      <section id="board" style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Leadership</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, marginBottom: '64px' }}>
            Board of Directors
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {boardMembers.map(({ name, role }) => (
              <div key={role} style={{ padding: '32px 24px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--layer)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #2a1540, #1a2a3e)', marginBottom: '20px' }} />
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{name}</p>
                <p style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join CTA ──────────────────────────────── */}
      <section style={{ padding: '0 48px 120px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '20px' }}>
            Ready to get involved?
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '40px' }}>
            Whether you want to perform, volunteer, or support the arts — there&apos;s a place for you at Accolade.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auditions" className="btn-primary"><span>Audition Info</span></Link>
            <Link href="/volunteering" className="btn-ghost"><span>Volunteer</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
