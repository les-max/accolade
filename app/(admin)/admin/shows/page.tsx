import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const TYPE_STYLES: Record<string, { color: string; border: string }> = {
  show:     { color: 'var(--teal)',  border: 'rgba(61,158,140,0.4)'  },
  camp:     { color: 'var(--rose)',  border: 'rgba(200,90,122,0.4)'  },
  workshop: { color: 'var(--amber)', border: 'rgba(240,160,80,0.4)'  },
  event:    { color: 'var(--muted)', border: 'rgba(160,160,181,0.3)' },
  other:    { color: 'var(--muted)', border: 'rgba(160,160,181,0.3)' },
}

const TYPE_LABELS: Record<string, string> = {
  show:     'Show',
  camp:     'Camp',
  workshop: 'Workshop',
  event:    'Event',
  other:    'Other',
}

const STATUS_STYLES: Record<string, { color: string; border: string }> = {
  draft:  { color: 'var(--muted)',     border: 'rgba(160,160,181,0.3)'  },
  active: { color: 'var(--gold)',      border: 'rgba(212,168,83,0.4)'   },
  closed: { color: 'var(--muted-dim)', border: 'rgba(160,160,181,0.15)' },
}

export default async function ShowsPage() {
  const supabase = await createClient()
  const { data: shows } = await supabase
    .from('shows')
    .select('id, slug, title, event_type, start_date, status')
    .not('event_type', 'eq', 'show')
    .order('start_date', { ascending: false })

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
            Admin
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>Events</h1>
        </div>
        <Link href="/admin/shows/new" className="btn-primary">
          <span>New Event</span>
        </Link>
      </div>

      {shows && shows.length > 0 ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px 140px 100px 120px',
            background: 'var(--layer)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 24px',
          }}>
            {['Title', 'Type', 'Date', 'Status', ''].map(col => (
              <span key={col} style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {col}
              </span>
            ))}
          </div>

          {shows.map((show, i) => {
            const typeBadge   = TYPE_STYLES[show.event_type]   ?? TYPE_STYLES.other
            const statusBadge = STATUS_STYLES[show.status]      ?? STATUS_STYLES.draft
            const isLast      = i === shows.length - 1
            const dateStr     = show.start_date
              ? new Date(show.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
              : '—'

            return (
              <div key={show.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 140px 100px 120px',
                padding: '18px 24px',
                alignItems: 'center',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
              }}>
                <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{show.title}</p>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  border: `1px solid ${typeBadge.border}`,
                  borderRadius: '2px',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: typeBadge.color,
                }}>
                  {TYPE_LABELS[show.event_type] ?? 'Other'}
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{dateStr}</p>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  border: `1px solid ${statusBadge.border}`,
                  borderRadius: '2px',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: statusBadge.color,
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
            Add shows, camps, workshops, and other events here.
          </p>
          <Link href="/admin/shows/new" className="btn-primary">
            <span>Create First Event</span>
          </Link>
        </div>
      )}
    </div>
  )
}
