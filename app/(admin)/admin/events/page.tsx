import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_STYLES: Record<string, { color: string; border: string }> = {
  draft:  { color: 'var(--muted)',      border: 'rgba(160,160,181,0.3)' },
  active: { color: 'var(--gold)',       border: 'rgba(212,168,83,0.4)'  },
  closed: { color: 'var(--muted-dim)',  border: 'rgba(160,160,181,0.15)' },
}

export default async function ShowsPage() {
  const supabase = await createClient()
  const { data: shows } = await supabase
    .from('shows')
    .select('id, slug, title, audition_type, age_min, age_max, status')
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
            Admin
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>Events</h1>
        </div>
        <Link href="/admin/events/new" className="btn-primary">
          <span>New Event</span>
        </Link>
      </div>

      {/* Table */}
      {shows && shows.length > 0 ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 120px 100px 120px',
            gap: '0',
            background: 'var(--layer)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 24px',
          }}>
            {['Show', 'Audition Type', 'Age Range', 'Status', ''].map(col => (
              <span key={col} style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          {shows.map((show, i) => {
            const badge = STATUS_STYLES[show.status] ?? STATUS_STYLES.draft
            const isLast = i === shows.length - 1
            return (
              <div key={show.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 120px 100px 120px',
                gap: '0',
                padding: '18px 24px',
                alignItems: 'center',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
                background: 'transparent',
              }}
              >
                <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{show.title}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{show.audition_type}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {show.age_min && show.age_max ? `${show.age_min}–${show.age_max}` : show.age_min ? `${show.age_min}+` : '—'}
                </p>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  border: `1px solid ${badge.border}`,
                  borderRadius: '2px',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: badge.color,
                }}>
                  {show.status}
                </span>
                <div style={{ textAlign: 'right' }}>
                  <Link href={`/admin/events/${show.slug}`} style={{
                    fontSize: '0.72rem',
                    color: 'var(--gold)',
                    textDecoration: 'none',
                    letterSpacing: '0.1em',
                  }}>
                    Manage →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty state */
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '80px 40px',
          textAlign: 'center',
          background: 'var(--layer)',
        }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', marginBottom: '12px' }}>
            No events yet
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '32px' }}>
            Create your first event to start accepting audition registrations.
          </p>
          <Link href="/admin/events/new" className="btn-primary">
            <span>Create First Event</span>
          </Link>
        </div>
      )}
    </div>
  )
}
