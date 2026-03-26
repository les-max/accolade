import PageHero from '@/components/PageHero';

export const metadata = {
  title: 'Partners — Accolade Community Theatre',
};

const partnerTiers = [
  {
    name: 'Stagehand',
    color: 'var(--teal)',
    price: '$100',
    featured: false,
    benefits: [
      '4 reserved seats in all shows',
      '2 free tickets',
      'Name in program',
    ],
    cta: 'Become a Stagehand',
  },
  {
    name: 'Patron',
    color: 'var(--amber)',
    price: '$250',
    featured: false,
    benefits: [
      '6 reserved seats in all shows',
      '4 free tickets',
      'Name in program',
    ],
    cta: 'Become a Patron',
  },
  {
    name: 'Director',
    color: 'var(--gold)',
    price: '$500',
    featured: false,
    benefits: [
      '2 season tickets',
      '6 reserved seats in all shows',
      'Name in program',
      'Free ¼-page Accolade ad for your sponsor year',
    ],
    cta: 'Become a Director',
  },
  {
    name: 'Producer',
    color: 'var(--gold)',
    price: '$1,000+',
    featured: true,
    benefits: [
      '4 season tickets',
      '6 reserved seats in all shows',
      'Name in program',
      'Free ½-page Accolade ad for your sponsor year',
    ],
    cta: 'Become a Producer',
  },
];

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Community Partnership"
        title="Support the"
        titleItalic="Community"
        subtitle="Accolade runs because families believe in what we're doing. Partnering with us is a direct investment in the kids and community you love."
        accentColor="var(--gold)"
      />

      {/* ── Why Partner ───────────────────────────── */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Why Partner With Us</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '28px' }}>
                Every dollar goes<br />
                <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gold)' }}>back to the stage</em>
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '20px' }}>
                Accolade is a community-funded theatre. We keep ticket prices accessible because families step up as partners to cover the real costs of production — sets, costumes, lighting, sound, and more.
              </p>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                In return, partners get reserved seating, free tickets, program recognition, and the knowledge that they made the show possible.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { number: '5th', label: 'Season and counting' },
                { number: '100s', label: 'Families in our community' },
                { number: 'All ages', label: 'Youth performers, 5–19' },
                { number: '100%', label: 'Community funded' },
              ].map(({ number, label }) => (
                <div key={label} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: 'var(--gold)', marginBottom: '8px' }}>{number}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tiers ─────────────────────────────────── */}
      <section style={{ padding: '80px 48px', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Partnership Levels</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {partnerTiers.map(({ name, color, price, benefits, featured, cta }) => (
              <div key={name} style={{
                border: `1px solid ${featured ? 'rgba(212,168,83,0.5)' : 'var(--border)'}`,
                borderRadius: '4px',
                padding: '36px 28px',
                background: featured ? 'rgba(212,168,83,0.04)' : 'var(--deep)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {featured && (
                  <div style={{ position: 'absolute', top: '-1px', left: '28px', right: '28px', height: '2px', background: 'var(--gold)' }} />
                )}
                {featured && (
                  <span style={{ position: 'absolute', top: '-12px', right: '16px', background: 'var(--gold)', color: 'var(--ink)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, padding: '4px 10px', borderRadius: '2px' }}>Top Level</span>
                )}
                <div style={{ width: '3px', height: '28px', background: color, marginBottom: '20px' }} />
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>{name}</h3>
                <p style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", fontWeight: 900, color, marginBottom: '24px' }}>{price}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1 }}>
                  {benefits.map((b) => (
                    <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                      <span style={{ color, flexShrink: 0, marginTop: '1px' }}>→</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href={`mailto:info@accoladetheatre.org?subject=${encodeURIComponent(cta)}&body=Hi! I'd like to become a ${name} partner at Accolade Community Theatre.%0A%0AName:%0APhone:`}
                  className={featured ? 'btn-primary' : 'btn-ghost'}
                  style={{ textAlign: 'center', justifyContent: 'center' }}
                >
                  <span>{cta}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* ── Contact ───────────────────────────────── */}
      <section style={{ padding: '100px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 900, marginBottom: '20px' }}>
            Questions about<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gold)' }}>partnership?</em>
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '40px' }}>
            We&apos;d love to have you involved. Reach out and we&apos;ll follow up within 48 hours.
          </p>
          <a href="mailto:info@accoladetheatre.org?subject=Partnership Inquiry" className="btn-primary">
            <span>Email Us</span>
          </a>
        </div>
      </section>
    </>
  );
}
