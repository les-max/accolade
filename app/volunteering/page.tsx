import PageHero from '@/components/PageHero';
export const metadata = {
  title: 'Volunteer — Accolade Community Theatre',
};

const volunteerRoles = [
  { category: 'On Stage', color: 'var(--gold)',  roles: ['Stage Manager', 'Assistant Stage Manager', 'Prompter'] },
  { category: 'Technical', color: 'var(--teal)', roles: ['Lighting Design & Operation', 'Sound Design & Operation', 'Spotlight Operator', 'Set Construction', 'Set Painting'] },
  { category: 'Costumes & Design', color: 'var(--rose)', roles: ['Costume Design', 'Wardrobe Crew', 'Hair & Makeup', 'Props Master'] },
  { category: 'Front of House', color: 'var(--amber)', roles: ['House Manager', 'Usher', 'Box Office', 'Lobby Host'] },
  { category: 'Production Support', color: 'var(--teal)', roles: ['Publicity & Marketing', 'Photography', 'Videography', 'Program Design', 'Concessions'] },
];

const openPositions = [
  {
    show: 'Newsies',
    season: '2025–26 Season',
    roles: [
      { title: 'Stage Manager', category: 'On Stage', color: 'var(--gold)' },
      { title: 'Spotlight Operator', category: 'Technical', color: 'var(--teal)' },
      { title: 'Set Construction', category: 'Technical', color: 'var(--teal)' },
      { title: 'Set Painting', category: 'Technical', color: 'var(--teal)' },
      { title: 'Wardrobe Crew', category: 'Costumes & Design', color: 'var(--rose)' },
      { title: 'Hair & Makeup', category: 'Costumes & Design', color: 'var(--rose)' },
      { title: 'House Manager', category: 'Front of House', color: 'var(--amber)' },
      { title: 'Usher', category: 'Front of House', color: 'var(--amber)' },
      { title: 'Box Office', category: 'Front of House', color: 'var(--amber)' },
      { title: 'Photography', category: 'Production Support', color: 'var(--teal)' },
      { title: 'Concessions', category: 'Production Support', color: 'var(--teal)' },
    ],
  },
];

const photoPlaceholders = [
  { bg: 'linear-gradient(160deg, #1a2a3e, #0d1a2a)', label: 'Set Construction' },
  { bg: 'linear-gradient(160deg, #2a1540, #1a0a2a)', label: 'Backstage Crew' },
  { bg: 'linear-gradient(160deg, #1a2e1a, #0a1a0a)', label: 'Front of House' },
  { bg: 'linear-gradient(160deg, #3a1a1a, #2a0a0a)', label: 'Costumes' },
  { bg: 'linear-gradient(160deg, #1a2a1a, #0d1a0d)', label: 'Tech Crew' },
  { bg: 'linear-gradient(160deg, #1e1a2e, #0d0a1a)', label: 'Rehearsal' },
  { bg: 'linear-gradient(160deg, #2a2010, #1a1008)', label: 'Opening Night' },
  { bg: 'linear-gradient(160deg, #1a1a2e, #0a0a1a)', label: 'Stage Management' },
];

export default function VolunteeringPage() {
  return (
    <>
      <PageHero
        eyebrow="Get Involved"
        title="Volunteer with"
        titleItalic="Accolade"
        subtitle="Theatre is a team sport. Behind every great show is a crew of volunteers who make the magic happen. Join ours."
        accentColor="var(--teal)"
      />

      {/* ── Photo Strip ────────────────────────────── */}
      <div className="photo-marquee" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--deep)' }}>
        <div className="marquee-track" style={{ gap: '12px', padding: '16px 0' }}>
          {[...photoPlaceholders, ...photoPlaceholders].map(({ bg, label }, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: '220px',
                height: '160px',
                borderRadius: '4px',
                background: bg,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', bottom: '12px', left: '14px' }}>
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Roles ─────────────────────────────────── */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Volunteer Opportunities</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {volunteerRoles.map(({ category, color, roles }) => (
              <div key={category} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '3px', height: '28px', background: color, flexShrink: 0 }} />
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700 }}>{category}</h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {roles.map((role) => (
                    <li key={role} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '0.88rem', color: 'var(--muted)' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Job Board ─────────────────────────────── */}
      <section style={{ padding: '80px 48px', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Open Positions</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: '56px', maxWidth: '560px' }}>
            These roles are open for our upcoming productions. Click any position to let us know you&apos;re interested — we&apos;ll follow up with details.
          </p>
          {openPositions.map(({ show, season, roles }) => (
            <div key={show} style={{ marginBottom: '64px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '32px' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900 }}>{show}</h2>
                <span style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>{season}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {roles.map(({ title, category, color }) => (
                  <a
                    key={title}
                    href={`mailto:info@accoladetheatre.org?subject=Volunteer Interest: ${encodeURIComponent(title)} — ${encodeURIComponent(show)}&body=Hi! I'm interested in volunteering as ${title} for ${show}. Here's a little about me:%0A%0AName:%0APhone:%0AAvailability:`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: 'var(--deep)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'border-color 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div>
                        <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color, marginBottom: '6px', fontWeight: 600 }}>{category}</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--warm-white)', fontWeight: 500 }}>{title}</p>
                      </div>
                      <span style={{ color, fontSize: '1.1rem', flexShrink: 0 }}>→</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────── */}
      <section style={{ padding: '80px 48px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
            {[
              { step: '01', title: 'Express Interest', body: 'Click a role above or fill out the general signup form. Tell us your availability and what you love doing.' },
              { step: '02', title: 'Get Matched', body: 'Our production team reaches out when a show needs crew in your area.' },
              { step: '03', title: 'Show Up', body: 'Attend the production meetings and rehearsals relevant to your role. Most crew joins 2–4 weeks before opening.' },
              { step: '04', title: 'Take a Bow', body: 'Your name goes in the playbill and you get to be part of something the whole community is proud of.' },
            ].map(({ step, title, body }) => (
              <div key={step}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '4rem', color: 'rgba(61,158,140,0.15)', lineHeight: 1, marginBottom: '16px' }}>{step}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>{title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '0.85rem' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signup Form ────────────────────────────── */}
      <section style={{ padding: '100px 48px 120px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p className="section-label">General Signup</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, marginBottom: '16px' }}>
            Ready to help out?
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '40px' }}>
            Not sure which role fits you yet? Fill this out and we&apos;ll add you to our volunteer roster. You&apos;ll hear from us when a show needs your skills.
          </p>

          <form action="mailto:info@accoladetheatre.org" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'Full Name', type: 'text', placeholder: 'Your name' },
              { label: 'Email Address', type: 'email', placeholder: 'your@email.com' },
              { label: 'Phone (optional)', type: 'tel', placeholder: '(555) 555-5555' },
            ].map(({ label, type, placeholder }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px', fontWeight: 600 }}>{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  style={{
                    width: '100%',
                    background: 'var(--layer)',
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                    padding: '14px 16px',
                    color: 'var(--warm-white)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px', fontWeight: 600 }}>Areas of Interest</label>
              <textarea
                placeholder="Tell us what you're interested in helping with — stage management, costumes, lighting, front of house, etc."
                rows={4}
                style={{
                  width: '100%',
                  background: 'var(--layer)',
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                  padding: '14px 16px',
                  color: 'var(--warm-white)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  resize: 'vertical',
                }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              <span>Submit Interest Form</span>
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              We&apos;ll follow up within a week. Questions? Email{' '}
              <a href="mailto:info@accoladetheatre.org" style={{ color: 'var(--gold)', textDecoration: 'none' }}>info@accoladetheatre.org</a>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
