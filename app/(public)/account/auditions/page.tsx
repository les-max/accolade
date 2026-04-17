import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'My Auditions — Accolade Community Theatre' }

const STATUS_COLOR: Record<string, string> = {
  registered: 'var(--gold)',
  waitlisted:  'var(--teal)',
  cancelled:   'var(--muted)',
}

export default async function AccountAuditionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: family } = await supabase
    .from('families')
    .select('id, parent_name')
    .eq('user_id', user.id)
    .single()

  if (!family) redirect('/account/setup')

  const { data: auditions } = await supabase
    .from('auditions')
    .select('*, shows(title, slug), audition_slots(label, start_time)')
    .eq('family_id', family.id)
    .order('created_at', { ascending: false })

  const active   = (auditions ?? []).filter(a => a.status !== 'cancelled')
  const cancelled = (auditions ?? []).filter(a => a.status === 'cancelled')

  return (
    <section style={{ padding: 'clamp(40px, 8vw, 72px) clamp(20px, 5vw, 48px)' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
          My Account
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700 }}>
            My Auditions
          </h1>
          <Link href="/auditions" className="btn-ghost" style={{ fontSize: '0.65rem', padding: '12px 24px' }}>
            <span>Browse Open Auditions</span>
          </Link>
        </div>

        {active.length === 0 && cancelled.length === 0 ? (
          <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '60px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '12px' }}>
              No auditions yet
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '28px' }}>
              When you register for an audition it will appear here.
            </p>
            <Link href="/auditions" className="btn-primary">
              <span>Browse Auditions</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {active.length > 0 && (
              <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Active Registrations
                  </p>
                </div>
                {active.map((a, i) => {
                  const show = a.shows as { title: string; slug: string } | null
                  const slot = a.audition_slots as { label: string; start_time: string | null } | null
                  const calendarUrl = slot?.start_time ? (() => {
                    const start = new Date(slot.start_time)
                    const end = new Date(start.getTime() + 30 * 60 * 1000)
                    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
                    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${show?.title ?? 'Audition'} - Accolade Theatre`)}&dates=${fmt(start)}/${fmt(end)}`
                  })() : null

                  return (
                    <div key={a.id} style={{
                      padding: '20px 24px',
                      borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap',
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <p style={{ fontSize: '1rem', fontWeight: 600 }}>{show?.title ?? 'Unknown Show'}</p>
                          <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: STATUS_COLOR[a.status] ?? 'var(--muted)' }}>
                            {a.status === 'waitlisted' && a.waitlist_position ? `#${a.waitlist_position} Waitlist` : a.status}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '4px' }}>
                          {a.auditioner_name} · {slot?.label ?? '—'}
                        </p>
                        {a.role_preference && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                            Role preference: {a.role_preference}
                          </p>
                        )}
                      </div>
                      {calendarUrl && a.status === 'registered' && (
                        <a href={calendarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.65rem', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                          + Add to Calendar
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {cancelled.length > 0 && (
              <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Cancelled
                  </p>
                </div>
                {cancelled.map((a, i) => {
                  const show = a.shows as { title: string } | null
                  const slot = a.audition_slots as { label: string } | null
                  return (
                    <div key={a.id} style={{
                      padding: '16px 24px',
                      borderBottom: i < cancelled.length - 1 ? '1px solid var(--border)' : 'none',
                      opacity: 0.5,
                    }}>
                      <p style={{ fontSize: '0.88rem' }}>{show?.title ?? 'Unknown Show'}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                        {a.auditioner_name} · {slot?.label ?? '—'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
