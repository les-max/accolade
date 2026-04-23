import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CopyButton from './CopyButton'

export const metadata = { title: 'My Calendar — Accolade Community Theatre' }

const EVENT_TYPE_LABEL: Record<string, string> = {
  rehearsal:      'Rehearsal',
  tech_rehearsal: 'Tech Rehearsal',
  performance:    'Performance',
  event:          'Event',
  other:          'Event',
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: family } = await supabase
    .from('families')
    .select('id, calendar_token')
    .eq('user_id', user.id)
    .single()

  if (!family) redirect('/account/setup')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const feedUrl = `${siteUrl}/api/calendar/${family.calendar_token}`

  const now = new Date().toISOString()

  const [{ data: auditions }, { data: memberships }] = await Promise.all([
    supabase
      .from('auditions')
      .select('id, auditioner_name, audition_slots(label, start_time), shows(title, slug)')
      .eq('family_id', family.id)
      .eq('status', 'registered'),
    supabase
      .from('show_members')
      .select('show_id')
      .eq('family_id', family.id),
  ])

  type AgendaItem = {
    id: string
    label: string
    type: string
    date: Date
    detail: string
  }

  const items: AgendaItem[] = []

  for (const a of auditions ?? []) {
    const slot = a.audition_slots as unknown as { label: string; start_time: string | null } | null
    const show = a.shows as unknown as { title: string; slug: string } | null
    if (!slot?.start_time) continue
    const date = new Date(slot.start_time)
    if (date < new Date(now)) continue
    items.push({
      id:     `audition-${a.id}`,
      label:  show?.title ?? 'Audition',
      type:   'Audition',
      date,
      detail: `${a.auditioner_name} · ${slot.label}`,
    })
  }

  const showIds = (memberships ?? []).map((m: { show_id: string }) => m.show_id)
  if (showIds.length > 0) {
    const { data: showEvents } = await supabase
      .from('show_events')
      .select('id, title, event_type, start_time, end_time, location, shows(title)')
      .in('show_id', showIds)
      .gte('start_time', now)
      .order('start_time')

    for (const e of (showEvents ?? [])) {
      const show = e.shows as unknown as { title: string } | null
      items.push({
        id:     `event-${e.id}`,
        label:  show?.title ?? 'Accolade Theatre',
        type:   EVENT_TYPE_LABEL[e.event_type as string] ?? 'Event',
        date:   new Date(e.start_time as string),
        detail: [
          new Date(e.start_time as string).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          e.location,
        ].filter(Boolean).join(' · '),
      })
    }
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <section style={{ padding: 'clamp(40px, 8vw, 72px) clamp(20px, 5vw, 48px)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
          My Account
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: '40px' }}>
          My Calendar
        </h1>

        {/* Subscribe card */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px 28px', marginBottom: '40px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
            Subscribe to Calendar
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '20px' }}>
            Add this feed to iOS Calendar, Google Calendar, or any calendar app. It updates automatically when new events are added.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={`webcal://${feedUrl.replace(/^https?:\/\//, '')}`}
              className="btn-primary"
              style={{ fontSize: '0.7rem' }}
            >
              <span>Add to Apple Calendar</span>
            </a>
            <CopyButton url={feedUrl} />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '16px', lineHeight: 1.6 }}>
            For Google Calendar: open Google Calendar → Other calendars → From URL → paste the copied link.
          </p>
        </div>

        {/* Agenda */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Upcoming
            </p>
          </div>
          {items.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No upcoming events.</p>
            </div>
          ) : (
            <div>
              {items.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', gap: '20px', padding: '16px 24px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ minWidth: '60px', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--warm-white)' }}>
                      {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>
                      {item.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
                      {item.type}
                    </span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '2px', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
