import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SlotManager from './SlotManager'
import RoleManager from './RoleManager'
import StatusControl from './StatusControl'
import CustomQuestionsManager from './CustomQuestionsManager'
import EventDetailsManager from './EventDetailsManager'

export default async function ShowDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase.from('shows').select('*').eq('slug', slug).single()

  if (!show) notFound()

  const [{ data: slotsData }, { data: rolesData }, { data: regCounts }] = await Promise.all([
    supabase.from('audition_slots').select('*').eq('show_id', show.id).order('start_time', { ascending: true }),
    supabase.from('show_roles').select('*').eq('show_id', show.id).order('sort_order', { ascending: true }),
    supabase.from('auditions').select('slot_id').eq('show_id', show.id).eq('status', 'registered'),
  ])

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
          <StatusControl showId={show.id} currentStatus={show.status} slug={slug} />
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
            Public Registration URL
          </span>
          <p style={{ fontSize: '0.85rem', color: show.status === 'active' ? 'var(--warm-white)' : 'var(--muted)', marginTop: '4px' }}>
            /auditions/{slug}
            {show.status !== 'active' && <span style={{ color: 'var(--muted-dim)', marginLeft: '8px', fontSize: '0.72rem' }}>(not active)</span>}
          </p>
        </div>
        <Link
          href={`/auditions/${slug}`}
          target="_blank"
          style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Preview →
        </Link>
      </div>

      {/* Slots */}
      <EventDetailsManager
        showId={show.id}
        slug={slug}
        show={{
          event_type:           show.event_type ?? 'show',
          start_date:           show.start_date ?? null,
          end_date:             show.end_date ?? null,
          featured:             show.featured ?? false,
          homepage_visible:     show.homepage_visible ?? false,
          cta_label:            show.cta_label ?? null,
          cta_url:              show.cta_url ?? null,
          show_image:           show.show_image ?? null,
          show_image_wide:      show.show_image_wide ?? null,
          audition_type:        show.audition_type ?? 'slot',
          age_min:              show.age_min ?? null,
          age_max:              show.age_max ?? null,
          show_grade:           (show.field_config as Record<string, unknown>)?.show_grade === true,
          show_headshot_upload: (show.field_config as Record<string, unknown>)?.show_headshot_upload === true,
        }}
      />

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

      {/* Registrations link */}
      <div style={{ marginTop: '16px' }}>
        <Link href={`/admin/events/${slug}/registrations`} className="btn-ghost" style={{ fontSize: '0.72rem' }}>
          <span>View Registrations</span>
        </Link>
      </div>
    </div>
  )
}
