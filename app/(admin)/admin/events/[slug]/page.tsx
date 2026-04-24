import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SlotManager from './SlotManager'
import RoleManager from './RoleManager'
import StatusControl from './StatusControl'
import CustomQuestionsManager from './CustomQuestionsManager'
import EventDetailsManager from './EventDetailsManager'
import PerformancesManager from './PerformancesManager'
import TicketManager from './TicketManager'
import RosterManager from './RosterManager'

export default async function ShowDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase.from('shows').select('*').eq('slug', slug).single()

  if (!show) notFound()

  const [{ data: slotsData }, { data: rolesData }, { data: regCounts }, { data: performancesData }, { data: venuesData }, { data: parentShowsData }, { data: membersData }] = await Promise.all([
    supabase.from('audition_slots').select('*').eq('show_id', show.id).order('start_time', { ascending: true }),
    supabase.from('show_roles').select('*').eq('show_id', show.id).order('sort_order', { ascending: true }),
    supabase.from('auditions').select('slot_id').eq('show_id', show.id).eq('status', 'registered'),
    supabase.from('show_performances').select('id, type, date, start_time, label').eq('show_id', show.id).order('date').order('start_time'),
    supabase.from('venues').select('id, name, address, city, state').order('name'),
    supabase.from('shows').select('id, title, show_image, show_image_wide, venue_id, season').eq('event_type', 'show').eq('archived', false).order('title'),
    supabase.from('show_members')
      .select('id, show_role, families(parent_name, email)')
      .eq('show_id', show.id)
      .order('show_role'),
  ])

  // Ticket config for shows
  const showPerformanceIds = (performancesData ?? []).filter(p => p.type === 'performance').map(p => p.id)
  const { data: ticketConfigData } = showPerformanceIds.length > 0
    ? await supabase.from('ticket_performances').select('show_performance_id, capacity, price, sales_enabled').in('show_performance_id', showPerformanceIds)
    : { data: [] }

  // Count registrations per slot
  const countBySlot: Record<string, number> = {}
  for (const r of (regCounts ?? [])) {
    if (r.slot_id) countBySlot[r.slot_id] = (countBySlot[r.slot_id] ?? 0) + 1
  }

  const STATUS_STYLES: Record<string, { color: string; border: string }> = {
    draft:  { color: 'var(--muted)',     border: 'rgba(160,160,181,0.3)'  },
    active: { color: 'var(--gold)',      border: 'rgba(212,168,83,0.4)'   },
    closed: { color: 'var(--muted-dim)', border: 'rgba(160,160,181,0.15)' },
  }
  const badge = STATUS_STYLES[show.status] ?? STATUS_STYLES.draft

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link href="/admin/events" style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← Events
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>{show.title}</h1>
              <span style={{
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
            </div>
            {show.event_type === 'audition' && (
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                {show.audition_type === 'slot' ? 'Specific time slots' : 'Audition windows'}
                {show.age_min && show.age_max ? ` · Ages ${show.age_min}–${show.age_max}` : ''}
              </p>
            )}
          </div>
          {show.event_type === 'audition' && (
            <StatusControl showId={show.id} currentStatus={show.status} slug={slug} />
          )}
        </div>
      </div>

      {/* Public link */}
      {(() => {
        const isAudition = show.event_type === 'audition'
        const publicPath = isAudition ? `/auditions/${slug}` : `/shows/${slug}`
        const label      = isAudition ? 'Public Registration URL' : 'Public Event URL'
        return (
          <div style={{
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            padding: '16px 20px', marginBottom: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          }}>
            <div>
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {label}
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--warm-white)', marginTop: '4px' }}>
                {publicPath}
              </p>
            </div>
            <Link
              href={publicPath}
              target="_blank"
              style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Preview →
            </Link>
          </div>
        )
      })()}

      {/* Slots */}
      <EventDetailsManager
        showId={show.id}
        slug={slug}
        venues={venuesData ?? []}
        parentShows={parentShowsData ?? []}
        show={{
          event_type:           show.event_type ?? 'show',
          start_date:           show.start_date ?? null,
          end_date:             show.end_date ?? null,
          featured:             show.featured ?? false,
          parent_show_id:       show.parent_show_id ?? null,
          cta_label:            show.cta_label ?? null,
          cta_url:              show.cta_url ?? null,
          show_image:           show.show_image ?? null,
          show_image_wide:      show.show_image_wide ?? null,
          past_shows_visible:   show.past_shows_visible ?? false,
          youtube_video_id:     show.youtube_video_id ?? null,
          audition_type:        show.audition_type ?? 'slot',
          age_min:              show.age_min ?? null,
          age_max:              show.age_max ?? null,
          show_grade:           (show.field_config as Record<string, unknown>)?.show_grade === true,
          show_headshot_upload: (show.field_config as Record<string, unknown>)?.show_headshot_upload === true,
          show_resume_upload:   (show.field_config as Record<string, unknown>)?.show_resume_upload === true,
          allow_crew_signup:    (show.field_config as Record<string, unknown>)?.allow_crew_signup === true,
          crew_positions:       ((show.field_config as Record<string, unknown>)?.crew_positions as number) ?? null,
          venue_id:             show.venue_id ?? null,
          season:               show.season ?? null,
        }}
      />

      <PerformancesManager showId={show.id} slug={slug} performances={performancesData ?? []} eventType={show.event_type ?? 'show'} />

      {show.event_type === 'show' && (
        <TicketManager
          showId={show.id}
          slug={slug}
          performances={(performancesData ?? []).filter(p => p.type === 'performance')}
          ticketConfig={ticketConfigData ?? []}
        />
      )}

      {show.event_type === 'show' && (
        <RosterManager
          showId={show.id}
          slug={slug}
          members={(membersData ?? []) as unknown as {
            id: string
            show_role: string
            families: { parent_name: string; email: string }
          }[]}
        />
      )}

      {show.event_type === 'show' && (
        <div style={{ marginBottom: '32px' }}>
          <Link
            href={`/admin/events/${slug}/communications`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Communications
            </p>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>Send Email →</span>
          </Link>
        </div>
      )}

      {show.event_type === 'show' && (
        <div style={{ marginBottom: '32px' }}>
          <Link
            href={`/admin/events/${slug}/bios`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Playbill Bios
            </p>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View Bios →</span>
          </Link>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <Link
          href={`/admin/events/${slug}/waivers`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px',
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Waivers
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View Signatures →</span>
        </Link>
      </div>

      {show.event_type === 'audition' && (
        <SlotManager show={show} slots={slotsData ?? []} countBySlot={countBySlot} slug={slug} />
      )}

      {show.event_type === 'audition' && (
        <RoleManager show={show} roles={rolesData ?? []} slug={slug} />
      )}

      {['audition', 'camp', 'workshop'].includes(show.event_type ?? '') && (
        <CustomQuestionsManager
          slug={slug}
          initialQuestions={(show.field_config as { custom_questions?: import('./actions').CustomQuestion[] })?.custom_questions ?? []}
        />
      )}

      {/* Registrations link — auditions only */}
      {show.event_type !== 'show' && (
        <div style={{ marginTop: '16px' }}>
          <Link href={`/admin/events/${slug}/registrations`} className="btn-ghost" style={{ fontSize: '0.72rem' }}>
            <span>View Registrations</span>
          </Link>
        </div>
      )}
    </div>
  )
}
