import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ 'show-slug': string }>
  searchParams: Promise<{ id?: string; status?: string }>
}) {
  const { 'show-slug': slug } = await params
  const { id: auditionId, status } = await searchParams

  if (!auditionId) notFound()

  const supabase = await createClient()
  const { data: audition } = await supabase
    .from('auditions')
    .select('*, audition_slots(label, start_time), shows(title)')
    .eq('id', auditionId)
    .single()

  if (!audition) notFound()

  const isWaitlisted = status === 'waitlisted'
  const slot = audition.audition_slots as { label: string; start_time: string | null } | null
  const show = audition.shows as { title: string } | null

  // Build Google Calendar add link
  let calendarUrl = ''
  if (slot?.start_time) {
    const start = new Date(slot.start_time)
    const end = new Date(start.getTime() + 30 * 60 * 1000) // +30 min default
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${show?.title ?? 'Audition'} - Accolade Theatre`)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent('Audition for Accolade Community Theatre')}`
  }

  return (
    <>
      <section style={{ padding: 'clamp(80px, 15vw, 160px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          {/* Icon */}
          <div style={{
            width: '72px', height: '72px',
            borderRadius: '50%',
            border: `1px solid ${isWaitlisted ? 'rgba(61,158,140,0.4)' : 'rgba(212,168,83,0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
          }}>
            {isWaitlisted ? (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="10" stroke="var(--teal)" strokeWidth="1.5"/>
                <path d="M14 9v5l3 3" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 14l5 5 11-11" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          <p className="section-label" style={{ justifyContent: 'center' }}>
            {isWaitlisted ? 'Waitlist Confirmed' : 'Registration Confirmed'}
          </p>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '24px',
          }}>
            {isWaitlisted
              ? <>You&apos;re on the <em style={{ fontStyle: 'italic', color: 'var(--teal)' }}>waitlist</em></>
              : <>You&apos;re <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>registered</em></>
            }
          </h1>

          <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: '1rem', marginBottom: '40px' }}>
            {isWaitlisted ? (
              <>
                This slot is currently full. You&apos;re #{audition.waitlist_position} on the waitlist for{' '}
                <strong style={{ color: 'var(--warm-white)' }}>{show?.title}</strong>.
                We&apos;ll notify you by email if a spot opens up.
              </>
            ) : (
              <>
                {audition.auditioner_name} is registered to audition for{' '}
                <strong style={{ color: 'var(--warm-white)' }}>{show?.title}</strong>.
                {slot && <> Slot: <strong style={{ color: 'var(--warm-white)' }}>{slot.label}</strong>.</>}
              </>
            )}
          </p>

          {/* Details card */}
          <div style={{
            background: 'var(--layer)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '24px 28px',
            textAlign: 'left',
            marginBottom: '32px',
          }}>
            {[
              { label: 'Auditioner', value: audition.auditioner_name },
              { label: 'Show', value: show?.title },
              { label: 'Slot', value: slot?.label },
              { label: 'Contact Email', value: audition.parent_email },
              audition.role_preference && { label: 'Role Preference', value: audition.role_preference },
            ].filter(Boolean).map((item) => {
              const { label, value } = item as { label: string; value: string }
              return (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--warm-white)', textAlign: 'right' }}>{value}</span>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {calendarUrl && !isWaitlisted && (
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <span>Add to Calendar</span>
              </a>
            )}
            <Link href="/auditions" className="btn-ghost">
              <span>Back to Auditions</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
