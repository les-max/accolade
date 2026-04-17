// app/(admin)/admin/sponsors/page.tsx
import { createClient } from '@/lib/supabase/server'
import { addSponsor, toggleSponsorActive, deleteSponsor } from './actions'

export const dynamic = 'force-dynamic'

export default async function SponsorsAdminPage() {
  const supabase = await createClient()
  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('id, name, logo_url, website_url, active, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>
        Sponsors
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '48px' }}>
        Manage current sponsors. Active sponsors appear on the homepage.
      </p>

      {/* Add Sponsor Form */}
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px', fontWeight: 500 }}>
          Add a Sponsor
        </h2>
        <form action={addSponsor} encType="multipart/form-data" style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label htmlFor="sponsor-name" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px', fontWeight: 500 }}>
              Sponsor Name *
            </label>
            <input
              id="sponsor-name"
              name="name"
              required
              placeholder="e.g. Richardson Arts Council"
              style={{ width: '100%', padding: '10px 14px', background: 'var(--ink)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--warm-white)', fontSize: '0.88rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="sponsor-logo" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px', fontWeight: 500 }}>
              Logo Image * (PNG, JPG, or SVG recommended)
            </label>
            <input
              id="sponsor-logo"
              name="logo"
              type="file"
              accept="image/*"
              required
              style={{ width: '100%', padding: '10px 14px', background: 'var(--ink)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--warm-white)', fontSize: '0.88rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="sponsor-website" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px', fontWeight: 500 }}>
              Website URL (optional)
            </label>
            <input
              id="sponsor-website"
              name="website_url"
              type="url"
              placeholder="https://example.com"
              style={{ width: '100%', padding: '10px 14px', background: 'var(--ink)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--warm-white)', fontSize: '0.88rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="sponsor-order" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px', fontWeight: 500 }}>
              Display Order (optional — lower numbers appear first)
            </label>
            <input
              id="sponsor-order"
              name="sort_order"
              type="number"
              defaultValue={0}
              style={{ width: '180px', padding: '10px 14px', background: 'var(--ink)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--warm-white)', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <button
              type="submit"
              style={{ padding: '12px 28px', background: 'var(--gold)', color: 'var(--ink)', border: 'none', borderRadius: '2px', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}
            >
              Add Sponsor
            </button>
          </div>
        </form>
      </div>

      {/* Sponsor List */}
      {(!sponsors || sponsors.length === 0) ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No sponsors yet. Add one above.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 80px 80px 80px', gap: '16px', padding: '0 16px', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>
            <span>Logo</span>
            <span>Name</span>
            <span>Website</span>
            <span>Order</span>
            <span>Active</span>
            <span></span>
          </div>
          {sponsors.map(sponsor => (
            <div
              key={sponsor.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr 80px 80px 80px',
                gap: '16px',
                alignItems: 'center',
                padding: '16px',
                background: 'var(--layer)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                opacity: sponsor.active ? 1 : 0.45,
              }}
            >
              {/* Logo thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sponsor.logo_url} alt={sponsor.name} style={{ height: '40px', width: '72px', objectFit: 'contain', borderRadius: '2px', background: 'rgba(255,255,255,0.05)' }} />

              {/* Name */}
              <span style={{ fontSize: '0.85rem', color: 'var(--warm-white)' }}>{sponsor.name}</span>

              {/* Website */}
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {sponsor.website_url ? (
                  <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)', textDecoration: 'none' }}>
                    {(() => { try { return new URL(sponsor.website_url).hostname } catch { return sponsor.website_url } })()}
                  </a>
                ) : '—'}
              </span>

              {/* Sort order */}
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{sponsor.sort_order}</span>

              {/* Active toggle */}
              <form action={async () => {
                'use server'
                await toggleSponsorActive(sponsor.id, !sponsor.active)
              }}>
                <button
                  type="submit"
                  title={sponsor.active ? 'Click to hide' : 'Click to show'}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.62rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    border: '1px solid',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    background: 'none',
                    borderColor: sponsor.active ? 'rgba(61,158,140,0.5)' : 'var(--border)',
                    color: sponsor.active ? 'var(--teal)' : 'var(--muted)',
                  }}
                >
                  {sponsor.active ? 'Active' : 'Hidden'}
                </button>
              </form>

              {/* Delete */}
              <form action={async () => {
                'use server'
                await deleteSponsor(sponsor.id)
              }}>
                <button
                  type="submit"
                  title="Remove sponsor"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.62rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    background: 'none',
                    color: 'var(--muted)',
                  }}
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
