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

const bentoGroups = [
  {
    cols: '280px 200px 200px',
    areas: '"a a b" "c d d" "c e f"',
    cells: [
      { area: 'a', ...photoPlaceholders[0] },
      { area: 'b', ...photoPlaceholders[1] },
      { area: 'c', ...photoPlaceholders[2] },
      { area: 'd', ...photoPlaceholders[3] },
      { area: 'e', ...photoPlaceholders[4] },
      { area: 'f', ...photoPlaceholders[5] },
    ],
  },
  {
    cols: '200px 200px 280px',
    areas: '"a b b" "a c d" "e e d"',
    cells: [
      { area: 'a', ...photoPlaceholders[6] },
      { area: 'b', ...photoPlaceholders[7] },
      { area: 'c', ...photoPlaceholders[0] },
      { area: 'd', ...photoPlaceholders[1] },
      { area: 'e', ...photoPlaceholders[2] },
    ],
  },
  {
    cols: '200px 280px 200px',
    areas: '"a b b" "a c d" "e f d"',
    cells: [
      { area: 'a', ...photoPlaceholders[3] },
      { area: 'b', ...photoPlaceholders[4] },
      { area: 'c', ...photoPlaceholders[5] },
      { area: 'd', ...photoPlaceholders[6] },
      { area: 'e', ...photoPlaceholders[7] },
      { area: 'f', ...photoPlaceholders[0] },
    ],
  },
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

      {/* ── Bento Photo Strip ────────────────────────────── */}
      <div className="photo-marquee" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--deep)' }}>
        <div className="marquee-track" style={{ gap: '12px', padding: '0 12px', alignItems: 'start' }}>
          {[...bentoGroups, ...bentoGroups].map((group, gi) => (
            <div
              key={gi}
              className="bento-group"
              style={{
                flexShrink: 0,
                display: 'grid',
                gridTemplateColumns: group.cols,
                gridTemplateAreas: group.areas,
                gap: '8px',
              }}
            >
              {group.cells.map((cell, ci) => (
                <div
                  key={ci}
                  style={{
                    gridArea: cell.area,
                    background: cell.bg,
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Roles ─────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Volunteer Opportunities</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {volunteerRoles.map(({ category, color, roles }) => (
              <div key={category} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '3px', height: '28px', background: color, flexShrink: 0 }} />
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem' }}>{category}</h3>
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

      {/* ── Ready to Help Out ─────────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px) clamp(60px, 12vw, 120px)', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="g-2" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '80px', alignItems: 'start' }}>
          <div>
            <p className="section-label">Ready to Help Out?</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px' }}>
              Find your place<br />on our crew
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, fontSize: '0.9rem' }}>
              Not sure which role fits you yet? Fill this out and we&apos;ll add you to our volunteer roster. You&apos;ll hear from us when a show needs your skills.
            </p>
          </div>

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
                    background: 'var(--deep)',
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                    padding: '14px 16px',
                    color: 'var(--warm-white)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    boxSizing: 'border-box',
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
                  background: 'var(--deep)',
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                  padding: '14px 16px',
                  color: 'var(--warm-white)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
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
