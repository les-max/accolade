import PageHero from '@/components/PageHero';

export const metadata = {
  title: 'Partners — Accolade Community Theatre',
};

const partnerTiers = [
  {
    name: 'Curtain Call',
    color: 'var(--amber)',
    price: 'Starting at $250/yr',
    benefits: [
      '2 complimentary tickets per production',
      'Name listed in playbill',
      'Invitation to annual partner reception',
      'Partner Portal access',
    ],
  },
  {
    name: 'Center Stage',
    color: 'var(--gold)',
    price: 'Starting at $500/yr',
    featured: true,
    benefits: [
      '4 complimentary tickets per production',
      'Logo in playbill & lobby signage',
      'Reserved seating priority',
      'Invitation to opening night events',
      'Partner Portal access',
      'Playbill ad (business card size)',
    ],
  },
  {
    name: 'Standing Ovation',
    color: 'var(--teal)',
    price: 'Starting at $1,000/yr',
    benefits: [
      '8 complimentary tickets per production',
      'Prominent logo placement — playbill, lobby, website',
      'Premium reserved seating',
      'VIP backstage tour for your group',
      'Partner Portal access',
      'Half-page playbill ad',
      'Named sponsorship of one production',
    ],
  },
];

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Community Partnership"
        title="Partner with"
        titleItalic="Accolade"
        subtitle="Support the arts, grow your community presence, and connect your organization with hundreds of families across North Texas."
        accentColor="var(--gold)"
      />

      {/* ── Why Partner ───────────────────────────── */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Why Partner With Us</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '28px' }}>
                Your brand, at the<br />
                <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gold)' }}>heart of the community</em>
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '20px' }}>
                Accolade serves hundreds of families each season. A partnership with us puts your name in front of a loyal, community-minded audience — people who live and shop locally.
              </p>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                We make it easy with flexible partnership levels, dedicated partner support, and a member portal where you can manage your benefits, reserve tickets, and order playbill ads — all in one place.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { number: '1,000s', label: 'Audience members per season' },
                { number: '6+', label: 'Productions per year' },
                { number: '500+', label: 'Active community members' },
                { number: '20+', label: 'Years in the community' },
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
      <section style={{ padding: '80px 48px 120px', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Partnership Levels</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {partnerTiers.map(({ name, color, price, benefits, featured }) => (
              <div key={name} style={{
                border: `1px solid ${featured ? 'rgba(212,168,83,0.4)' : 'var(--border)'}`,
                borderRadius: '4px',
                padding: '40px 32px',
                background: featured ? 'rgba(212,168,83,0.04)' : 'var(--deep)',
                position: 'relative',
              }}>
                {featured && (
                  <div style={{ position: 'absolute', top: '-1px', left: '32px', right: '32px', height: '2px', background: 'var(--gold)' }} />
                )}
                {featured && (
                  <span style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--gold)', color: 'var(--ink)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, padding: '4px 10px', borderRadius: '2px' }}>Most Popular</span>
                )}
                <div style={{ width: '3px', height: '32px', background: color, marginBottom: '24px' }} />
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>{name}</h3>
                <p style={{ fontSize: '0.78rem', color: color, marginBottom: '28px', letterSpacing: '0.05em' }}>{price}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                  {benefits.map((b) => (
                    <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                      <span style={{ color, flexShrink: 0, marginTop: '2px' }}>→</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a href="mailto:info@accoladetheatre.org?subject=Partnership Inquiry" className={featured ? 'btn-primary' : 'btn-ghost'} style={{ width: '100%', justifyContent: 'center' }}>
                  <span>Get Started</span>
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.82rem', color: 'var(--muted)' }}>
            Individual partnership levels also available. Contact us for custom arrangements.
          </p>
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
            We&apos;d love to find the right fit for your organization. Reach out and we&apos;ll follow up within 48 hours.
          </p>
          <a href="mailto:info@accoladetheatre.org?subject=Partnership Inquiry" className="btn-primary">
            <span>Email Us</span>
          </a>
        </div>
      </section>
    </>
  );
}
