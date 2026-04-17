import PageHero from '@/components/PageHero';
import Link from 'next/link';

export const metadata = {
  title: 'Tickets — Accolade Community Theatre',
};

export default function TicketsPage() {
  return (
    <>
      <PageHero
        eyebrow="See a Show"
        title="Get Your Tickets"
        subtitle="Support community theatre and experience something extraordinary. Every seat in the house is a great seat."
        accentColor="var(--rose)"
      />

      {/* ── Current Production ────────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Current Production</p>

          <div className="g-2w" style={{ display: 'grid', gap: '64px', alignItems: 'start' }}>
            {/* Show poster */}
            <div style={{ aspectRatio: '2/3', borderRadius: '4px', background: 'linear-gradient(160deg, #2d1b4e, #1b0a2e)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.7) 0%, transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: '32px', left: '32px', right: '32px' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>Newsies</h2>
                <p style={{ color: 'var(--teal)', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '8px' }}>Current Production</p>
              </div>
            </div>

            {/* Ticket info */}
            <div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ padding: '6px 14px', border: '1px solid rgba(212,168,83,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-light)' }}>Musical</span>
              </div>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '40px', fontSize: '0.95rem' }}>
                The rousing musical based on the real-life newsboy strike of 1899 in New York City. Featuring the iconic songs &ldquo;Seize the Day,&rdquo; &ldquo;Santa Fe,&rdquo; and &ldquo;King of New York.&rdquo;
              </p>

              {/* Show dates placeholder */}
              <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '32px' }}>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px', fontWeight: 600 }}>Performance Dates</p>
                <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                  Performance dates to be announced. Check back soon or join our mailing list for updates.
                </p>
              </div>

              {/* Ticket pricing */}
              <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '32px' }}>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px', fontWeight: 600 }}>Ticket Pricing</p>
                <div className="g-2" style={{ display: 'grid', gap: '16px' }}>
                  {[
                    { type: 'Adult', price: 'TBD' },
                    { type: 'Senior (65+)', price: 'TBD' },
                    { type: 'Student', price: 'TBD' },
                    { type: 'Child (under 5)', price: 'Free' },
                  ].map(({ type, price }) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.88rem', color: 'var(--warm-white)' }}>{type}</span>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)' }}>{price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%', justifyContent: 'center' }}>
                <span>Ticket Sales Opening Soon</span>
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '12px', textAlign: 'center' }}>
                Partner members may reserve tickets through the Partner Portal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Group Sales ───────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px)', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="g-2" style={{ display: 'grid', maxWidth: '1200px', margin: '0 auto', gap: '64px', alignItems: 'center' }}>
          <div>
            <p className="section-label">Groups & Schools</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px' }}>
              Bring your<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gold)' }}>group or class</em>
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '32px' }}>
              Group discounts available for parties of 10 or more. We work with schools, churches, and community organizations to make live theatre accessible. Contact us for group pricing.
            </p>
            <a href="mailto:info@accoladetheatre.org" className="btn-ghost"><span>Contact for Group Sales</span></a>
          </div>
          <div style={{ background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px' }}>Group Perks</h3>
            {[
              'Discounted ticket pricing for 10+ guests',
              'Reserved seating blocks',
              'Dedicated group coordinator',
              'Pre-show meet & greet options',
              'Flexible payment arrangements',
            ].map((perk) => (
              <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(61,158,140,0.15)', border: '1px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: 'var(--teal)' }}>✓</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--warm-white)' }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner benefits CTA ──────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 900, marginBottom: '20px' }}>
            Get tickets + perks as a <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gold)' }}>Partner</em>
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '40px' }}>
            Accolade Partners enjoy reserved tickets, early access, and exclusive benefits. It&apos;s the best way to support the theatre and never miss a show.
          </p>
          <Link href="/partners" className="btn-primary"><span>Learn About Partnerships</span></Link>
        </div>
      </section>
    </>
  );
}
