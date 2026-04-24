import PageHero from '@/components/PageHero';
import Link from 'next/link';

export const metadata = {
  title: 'Donate — Accolade Community Theatre',
};

export default function DonatePage() {
  return (
    <>
      <PageHero
        eyebrow="Support the Arts"
        title="Your Gift Keeps the"
        titleItalic="Curtain Rising"
        subtitle="Accolade Community Theatre is a 501(c)(3) nonprofit. Every dollar goes directly to keeping live theatre alive and accessible in our community."
        accentColor="var(--rose)"
      />

      {/* ── Impact ────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Your Impact</p>
          <div className="g-3" style={{ display: 'grid', gap: '32px', marginBottom: '80px' }}>
            {[
              { amount: '$25',  label: 'Covers a student\'s costume materials for one show', color: 'var(--rose)' },
              { amount: '$50',  label: 'Pays for one night of rehearsal space rental', color: 'var(--amber)' },
              { amount: '$100', label: 'Helps fund rights and licensing for one production', color: 'var(--gold)' },
              { amount: '$250', label: 'Covers set materials for an entire production', color: 'var(--teal)' },
              { amount: '$500', label: 'Sponsors one full student scholarship to summer camp', color: 'var(--rose)' },
              { amount: '$1,000', label: 'Co-sponsors a full production from start to close', color: 'var(--gold)' },
            ].map(({ amount, label, color }) => (
              <div key={amount} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.4rem', color, marginBottom: '12px' }}>{amount}</div>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.65 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Donation form placeholder */}
          <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: 'clamp(32px, 6vw, 60px) clamp(20px, 5vw, 48px)', textAlign: 'center', position: 'relative' }}>
            <div className="deco-top" style={{ position: 'absolute', top: '-1px', height: '1px', background: 'repeating-linear-gradient(90deg, var(--rose) 0, var(--rose) 8px, transparent 8px, transparent 16px)', opacity: 0.4 }} />
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: '24px', fontWeight: 500 }}>Make a Donation</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, marginBottom: '12px' }}>Online Giving</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '32px', lineHeight: 1.7 }}>
              Secure online donations coming soon. In the meantime, contact us directly to make your gift.
            </p>
            <a href="mailto:info@accoladetheatre.org?subject=Donation" className="btn-primary" style={{ marginBottom: '16px', display: 'inline-flex' }}>
              <span>Contact Us to Donate</span>
            </a>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '20px' }}>
              Accolade Community Theatre is a 501(c)(3) nonprofit organization.<br />
              All donations are tax-deductible to the extent permitted by law.
            </p>
          </div>
        </div>
      </section>

      {/* ── Other Ways ────────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px) clamp(48px, 10vw, 120px)', background: 'var(--layer)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Other Ways to Give</p>
          <div className="g-3" style={{ display: 'grid', gap: '40px' }}>
            {[
              { title: 'Become a Partner', body: 'Business or individual partnerships provide sustained support and include community benefits like tickets and playbill recognition.', href: '/partners', cta: 'Partner With Us' },
              { title: 'Volunteer Your Time', body: 'Time is money. Donate your skills backstage, front of house, or behind the scenes. Every hour counts.', href: '/volunteering', cta: 'Volunteer' },
              { title: 'Spread the Word', body: 'Tell your friends. Share our shows. Buy an extra ticket for someone who can\'t afford one. Community is the best fundraiser.', href: '/tickets', cta: 'See Shows' },
            ].map(({ title, body, href, cta }) => (
              <div key={title}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', marginBottom: '16px' }}>{title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '24px', fontSize: '0.88rem' }}>{body}</p>
                <Link href={href} style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
