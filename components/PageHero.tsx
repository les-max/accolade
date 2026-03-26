interface PageHeroProps {
  eyebrow: string;
  title: string;
  titleItalic?: string;
  subtitle?: string;
  accentColor?: string;
}

export default function PageHero({ eyebrow, title, titleItalic, subtitle, accentColor = 'var(--teal)' }: PageHeroProps) {
  return (
    <section style={{
      position: 'relative',
      paddingTop: '180px',
      paddingBottom: '120px',
      paddingLeft: '48px',
      paddingRight: '48px',
      textAlign: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, rgba(212,168,83,0.06) 0%, transparent 60%)`,
      }} />
      <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.7rem',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: accentColor,
          marginBottom: '28px',
          fontWeight: 500,
        }}>
          {eyebrow}
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2.8rem, 7vw, 6rem)',
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: subtitle ? '32px' : 0,
        }}>
          {title}
          {titleItalic && (
            <>
              <br />
              <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gold)' }}>{titleItalic}</em>
            </>
          )}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.75, maxWidth: '560px', margin: '0 auto' }}>
            {subtitle}
          </p>
        )}
      </div>
      {/* Divider line */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '1px', height: '60px', background: 'linear-gradient(to bottom, var(--gold), transparent)', opacity: 0.3 }} />
    </section>
  );
}
