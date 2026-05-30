import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import SlotManager from './SlotManager'
import RoleManager from './RoleManager'
import StatusControl from './StatusControl'
import CustomQuestionsManager from './CustomQuestionsManager'
import EventDetailsManager from './EventDetailsManager'
import PerformancesManager from './PerformancesManager'
import FeesManager from './FeesManager'
import ShowTabNav, { type ShowTab } from './ShowTabNav'
import OverviewTab from './tabs/OverviewTab'
import DetailsTab from './tabs/DetailsTab'
import ScheduleTab from './tabs/ScheduleTab'
import TicketsTab from './tabs/TicketsTab'
import PeopleTab from './tabs/PeopleTab'
import FinancesTab from './tabs/FinancesTab'
import CommsTab from './tabs/CommsTab'
import VolunteersTab from './tabs/VolunteersTab'
import { getShowRole } from '@/lib/staff'
import RegistrationConfig from './RegistrationConfig'

export default async function ShowDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { slug } = await params
  const { tab: tabParam } = await searchParams
  const supabase = await createClient()

  const { data: show } = await supabase.from('shows').select('*').eq('slug', slug).single()
  if (!show) notFound()

  const role = await getShowRole(show.id)
  if (!role) redirect('/admin/events')

  const [{ data: slotsData }, { data: rolesData }, { data: regCounts }, { data: performancesData }, { data: venuesData }, { data: parentShowsData }, { data: membersData }, { data: feesConfigData }, { data: couponsData }, { data: showEventsData }, { data: volunteerPositionsData }] = await Promise.all([
    supabase.from('audition_slots').select('*').eq('show_id', show.id).order('start_time', { ascending: true }),
    supabase.from('show_roles').select('*').eq('show_id', show.id).order('sort_order', { ascending: true }),
    supabase.from('auditions').select('slot_id').eq('show_id', show.id).eq('status', 'registered'),
    supabase.from('show_performances').select('id, type, date, start_time, label').eq('show_id', show.id).order('date').order('start_time'),
    supabase.from('venues').select('id, name, address, city, state').order('name'),
    supabase.from('shows').select('id, title, show_image, show_image_wide, venue_id, season').eq('event_type', 'show').eq('archived', false).order('title'),
    supabase.from('show_members')
      .select('id, show_role, show_part, person_name, email')
      .eq('show_id', show.id)
      .order('show_role'),
    supabase.from('show_fees_config').select('shirt_price, tuition_amount, fees_enabled').eq('show_id', show.id).maybeSingle(),
    supabase.from('show_coupon_codes').select('id, code, waive_tuition, waive_shirts, used_by_family_id').eq('show_id', show.id).order('created_at'),
    supabase.from('show_events').select('id, event_type, title, start_time, end_time, location, notes').eq('show_id', show.id).order('start_time'),
    supabase.from('volunteer_positions').select('id, show_id, name, description, capacity, position_type, sort_order').eq('show_id', show.id).order('sort_order'),
  ])

  const showPerformanceIds = (performancesData ?? []).filter(p => p.type === 'performance').map(p => p.id)
  const [{ data: ticketConfigData }, { data: linkedAuditionShows }] = await Promise.all([
    showPerformanceIds.length > 0
      ? supabase.from('ticket_performances').select('id, show_performance_id, capacity, price, sales_enabled, ticket_option_groups ( id, name, required, sort_order, ticket_options ( id, name, sort_order ) )').in('show_performance_id', showPerformanceIds)
      : Promise.resolve({ data: [] }),
    supabase.from('shows').select('id').eq('parent_show_id', show.id).eq('event_type', 'audition'),
  ])

  const auditionShowIds = (linkedAuditionShows ?? []).map(s => s.id)
  const { data: auditionersRaw } = auditionShowIds.length > 0
    ? await supabase
        .from('auditions')
        .select('id, auditioner_name, family_member_id, family_id, is_adult, parent_email')
        .in('show_id', auditionShowIds)
        .neq('status', 'cancelled')
        .order('auditioner_name')
    : { data: [] }

  // Volunteer signups for the positions on this show
  const volunteerPositionIds = (volunteerPositionsData ?? []).map(p => p.id)
  const { data: volunteerSignupsData } = volunteerPositionIds.length > 0
    ? await supabase
        .from('volunteer_signups')
        .select('id, position_id, family_id, assigned_by, created_at, families(parent_name, email)')
        .in('position_id', volunteerPositionIds)
    : { data: [] }

  type VolSignup = { id: string; position_id: string; family_id: string; assigned_by: string | null; created_at: string; families: { parent_name: string; email: string } | null }
  const signupsByPosition = new Map<string, VolSignup[]>()
  for (const s of (volunteerSignupsData ?? []) as unknown as VolSignup[]) {
    if (!signupsByPosition.has(s.position_id)) signupsByPosition.set(s.position_id, [])
    signupsByPosition.get(s.position_id)!.push(s)
  }

  const positionsWithSignups = (volunteerPositionsData ?? []).map(p => ({
    ...p,
    position_type: p.position_type as 'open' | 'assigned',
    signups: signupsByPosition.get(p.id) ?? [],
  }))

  // Staff assignments — only needed for admin on show detail overview tab
  let staffData: { id: string; role: string; admin_users: { id: string; email: string } }[] = []
  let availableStaff: { id: string; email: string; role: string }[] = []
  if (show.event_type === 'show' && role === 'admin') {
    const [{ data: assigned }, { data: allStaff }] = await Promise.all([
      supabase.from('show_staff').select('id, role, admin_users(id, email)').eq('show_id', show.id),
      supabase.from('admin_users').select('id, email, role').in('role', ['director', 'production_manager']),
    ])
    staffData = (assigned ?? []) as unknown as typeof staffData
    const assignedIds = new Set(staffData.map(m => m.admin_users.id))
    availableStaff = (allStaff ?? []).filter(s => !assignedIds.has(s.id))
  }

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

  // Shared show details shape for EventDetailsManager
  const detailsShow = {
    title:                show.title ?? '',
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
    allow_crew_signup:      (show.field_config as Record<string, unknown>)?.allow_crew_signup === true,
    crew_positions:         ((show.field_config as Record<string, unknown>)?.crew_positions as number) ?? null,
    audition_announcement:  ((show.field_config as Record<string, unknown>)?.audition_announcement as string) ?? null,
    venue_id:               show.venue_id ?? null,
    season:                 show.season ?? null,
    registrations_open:     (show.field_config as Record<string, unknown>)?.registrations_open !== false,
    description:            show.description ?? null,
  }

  // Tabbed layout for shows
  if (show.event_type === 'show') {
    const VALID_TABS: ShowTab[] = ['overview', 'details', 'schedule', 'tickets', 'people', 'finances', 'comms', 'volunteers']
    const activeTab: ShowTab = VALID_TABS.includes(tabParam as ShowTab) ? (tabParam as ShowTab) : 'overview'

    return (
      <div style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/admin/events" style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
            ← Events
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.4rem', letterSpacing: '0.04em', lineHeight: 1 }}>{show.title}</h1>
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
        </div>

        <ShowTabNav slug={slug} activeTab={activeTab} role={role} />

        {activeTab === 'overview' && (
          <OverviewTab
            show={{ id: show.id, slug, status: show.status, event_type: show.event_type ?? 'show' }}
            slug={slug}
            role={role}
            performancesData={performancesData ?? []}
            membersData={(membersData ?? []) as { id: string }[]}
            staffAssignments={staffData}
            availableDirectorStaff={availableStaff}
          />
        )}
        {activeTab === 'details' && (
          <DetailsTab
            showId={show.id}
            slug={slug}
            role={role}
            show={detailsShow}
            venues={venuesData ?? []}
            parentShows={parentShowsData ?? []}
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab
            show={{ id: show.id, event_type: show.event_type ?? 'show' }}
            slug={slug}
            role={role}
            performancesData={performancesData ?? []}
            showEventsData={showEventsData ?? []}
          />
        )}
        {activeTab === 'tickets' && (
          <TicketsTab
            show={{ id: show.id }}
            slug={slug}
            role={role}
            performancesData={performancesData ?? []}
            ticketConfigData={(ticketConfigData ?? []) as any}
          />
        )}
        {activeTab === 'people' && (
          <PeopleTab
            show={{ id: show.id }}
            slug={slug}
            role={role}
            membersData={(membersData ?? []) as unknown as Parameters<typeof PeopleTab>[0]['membersData']}
            auditioners={(auditionersRaw ?? []) as unknown as Parameters<typeof PeopleTab>[0]['auditioners']}
          />
        )}
        {activeTab === 'finances' && (
          <FinancesTab
            show={{ id: show.id, event_type: show.event_type ?? 'show' }}
            slug={slug}
            role={role}
            feesConfigData={feesConfigData ?? null}
            couponsData={(couponsData ?? []) as { id: string; code: string; waive_tuition: boolean; waive_shirts: boolean; used_by_family_id: string | null }[]}
          />
        )}
        {activeTab === 'comms' && (
          <CommsTab
            show={{ id: show.id }}
            slug={slug}
            role={role}
          />
        )}
        {activeTab === 'volunteers' && (
          <VolunteersTab
            show={{ id: show.id }}
            slug={slug}
            role={role}
            published={show.volunteers_published ?? false}
            positions={positionsWithSignups}
          />
        )}
      </div>
    )
  }

  // Flat layout for auditions, camps, workshops (non-show event types)
  const isAudition = show.event_type === 'audition'
  const publicPath = isAudition ? `/auditions/${slug}` : `/shows/${slug}`
  const publicLabel = isAudition ? 'Public Registration URL' : 'Public Event URL'

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link href="/admin/events" style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← Events
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.4rem', letterSpacing: '0.04em', lineHeight: 1 }}>{show.title}</h1>
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
          {['audition', 'event', 'camp', 'workshop'].includes(show.event_type ?? '') && (
            <StatusControl showId={show.id} currentStatus={show.status} slug={slug} />
          )}
        </div>
      </div>

      {/* Public link */}
      <div style={{
        background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
        padding: '16px 20px', marginBottom: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {publicLabel}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        <Link href={`/admin/events/${slug}/registrations`} className="admin-link-card" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Registrations
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View List →</span>
        </Link>
        <Link href={`/admin/events/${slug}/communications`} className="admin-link-card" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Communications
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>Send Email →</span>
        </Link>
      </div>

      <EventDetailsManager
        showId={show.id}
        slug={slug}
        role={role}
        venues={venuesData ?? []}
        parentShows={parentShowsData ?? []}
        show={detailsShow}
      />

      <PerformancesManager showId={show.id} slug={slug} performances={performancesData ?? []} eventType={show.event_type ?? 'show'} />

      {show.event_type === 'event' && (
        <RegistrationConfig
          showId={show.id}
          slug={slug}
          currentCapacity={(show as unknown as { registration_capacity: number | null }).registration_capacity}
        />
      )}

      {['camp', 'workshop'].includes(show.event_type ?? '') && (
        <FeesManager
          showId={show.id}
          slug={slug}
          eventType={show.event_type ?? 'camp'}
          role={role}
          config={feesConfigData ?? null}
          coupons={(couponsData ?? []) as { id: string; code: string; waive_tuition: boolean; waive_shirts: boolean; used_by_family_id: string | null }[]}
        />
      )}

      {['camp', 'workshop'].includes(show.event_type ?? '') && (
        <div style={{ marginBottom: '32px' }}>
          <Link href={`/admin/events/${slug}/fees`} className="admin-link-card" style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Production Orders
            </p>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View Orders →</span>
          </Link>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <Link href={`/admin/events/${slug}/waivers`} className="admin-link-card" style={{ padding: '20px 24px' }}>
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

    </div>
  )
}
