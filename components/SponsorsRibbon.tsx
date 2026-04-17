// components/SponsorsRibbon.tsx
import { createClient } from '@/lib/supabase/server'

export default async function SponsorsRibbon() {
  const supabase = await createClient()
  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('id, name, logo_url, website_url')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (!sponsors || sponsors.length === 0) return null

  return (
    <section style={{
      padding: 'clamp(32px, 6vw, 56px) clamp(20px, 5vw, 48px)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--layer)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <p style={{
          fontSize: '0.62rem',
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          textAlign: 'center',
          marginBottom: '32px',
          fontWeight: 500,
        }}>
          Thank you to our sponsors
        </p>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '40px',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {sponsors.map(sponsor => sponsor.website_url ? (
            <a
              key={sponsor.id}
              href={sponsor.website_url}
              target="_blank"
              rel="noopener noreferrer"
              title={sponsor.name}
              style={{ display: 'block', lineHeight: 0 }}
              className="sponsor-logo-link"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                style={{
                  height: '56px',
                  width: 'auto',
                  maxWidth: '160px',
                  objectFit: 'contain',
                  filter: 'grayscale(100%) brightness(0.8)',
                  transition: 'filter 0.3s',
                  display: 'block',
                }}
              />
            </a>
          ) : (
            <div key={sponsor.id} title={sponsor.name} style={{ lineHeight: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                style={{
                  height: '56px',
                  width: 'auto',
                  maxWidth: '160px',
                  objectFit: 'contain',
                  filter: 'grayscale(100%) brightness(0.8)',
                  transition: 'filter 0.3s',
                  display: 'block',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
