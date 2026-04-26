import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EventRowActions from './EventRowActions'
import { getSessionStaff } from '@/lib/staff'

const TYPE_COLORS: Record<string, string> = {
  show:     'var(--teal)',
  audition: 'var(--gold)',
  camp:     'var(--rose)',
  workshop: 'var(--amber)',
  event:    'var(--muted)',
}

const STATUS_STYLES: Record<string, { color: string; border: string }> = {
  draft:  { color: 'var(--muted)',      border: 'rgba(160,160,181,0.3)'  },
  active: { color: 'var(--gold)',       border: 'rgba(212,168,83,0.4)'   },
  closed: { color: 'var(--muted-dim)',  border: 'rgba(160,160,181,0.15)' },
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>
}) {
  const { archived: showArchived } = await searchParams
  const includeArchived = showArchived === '1'

  const supabase = await createClient()
  const staff = await getSessionStaff()

  // Directors and PMs see only their assigned shows
  let showIds: string[] | null = null
  if (staff && staff.orgRole !== 'admin') {
    const { data: assignments } = await supabase
      .from('show_staff')
      .select('show_id')
      .eq('admin_user_id', staff.adminUserId)
    showIds = (assignments ?? []).map(a => a.show_id)
  }

  let query = supabase
    .from('shows')
    .select('id, slug, title, event_type, start_date, status, archived')
    .order('start_date', { ascending: false })

  if (!includeArchived) query = query.eq('archived', false)
  if (showIds !== null) query = query.in('id', showIds.length > 0 ? showIds : ['00000000-0000-0000-0000-000000000000'])

  const { data: shows } = await query

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
            Admin
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>Events</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {staff?.orgRole === 'admin' && (
            <Link
              href={includeArchived ? '/admin/events' : '/admin/events?archived=1'}
              style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: includeArchived ? 'var(--gold)' : 'var(--muted)', textDecoration: 'none' }}
            >
              {includeArchived ? 'Hide Archived' : 'Show Archived'}
            </Link>
          )}
          {staff?.orgRole === 'admin' && (
            <Link href="/admin/events/new" className="btn-primary">
              <span>New Event</span>
            </Link>
          )}
        </div>
      </div>

      {shows && shows.length > 0 ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px 140px 100px 200px',
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
            const statusBadge = STATUS_STYLES[show.status] ?? STATUS_STYLES.draft
            const typeColor   = TYPE_COLORS[show.event_type] ?? 'var(--muted)'
            const isLast      = i === shows.length - 1
            const dateStr     = show.start_date
              ? new Date(show.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
              : '—'
            return (
              <div key={show.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 140px 100px 200px',
                padding: '18px 24px',
                alignItems: 'center',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
                opacity: show.archived ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{show.title}</p>
                  {show.archived && (
                    <span style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '2px', padding: '2px 6px' }}>
                      Archived
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.72rem', color: typeColor, textTransform: 'capitalize', fontWeight: 500 }}>
                  {show.event_type}
                </p>
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
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Link href={`/admin/events/${show.slug}`} style={{
                    fontSize: '0.68rem',
                    color: 'var(--gold)',
                    textDecoration: 'none',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    Manage
                  </Link>
                  <EventRowActions id={show.id} archived={show.archived} />
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
            Create your first event to get started.
          </p>
          <Link href="/admin/events/new" className="btn-primary">
            <span>Create First Event</span>
          </Link>
        </div>
      )}
    </div>
  )
}
