import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHero from '@/components/PageHero'

export const metadata = {
  title: 'Events — Accolade Community Theatre',
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return ''
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  if (!end || end === start) return s
  const e = new Date(end).toLocaleDateString('en-US', opts)
  return `${s} – ${e}`
}

export default async function EventsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('shows')
    .select('id, slug, title, description, start_date, end_date, show_image, show_image_wide, cta_label, cta_url, status, parent_show:parent_show_id(show_image, show_image_wide)')
    .eq('event_type', 'event')
    .eq('archived', false)
    .order('start_date', { ascending: true })

  const events = data ?? []
  const upcoming = events.filter(e => e.status === 'active')
  const draft = events.filter(e => e.status !== 'active')

  return (
    <>
      <PageHero
        eyebrow="Community"
        title="Special"
        titleItalic="Events"
        subtitle="Performances, showcases, and community gatherings beyond the main season."
        accentColor="var(--gold)"
      />

      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {upcoming.length === 0 && draft.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', marginBottom: '12px' }}>
                No events scheduled right now
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Check back soon or follow us on social media for announcements.
              </p>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <p className="section-label">Upcoming</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '64px' }}>
                    {upcoming.map(e => <EventCard key={e.id} event={e} />)}
                  </div>
                </>
              )}
              {draft.length > 0 && (
                <>
                  <p className="section-label">Coming Soon</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {draft.map(e => <EventCard key={e.id} event={e} comingSoon />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}

type Event = {
  id: string; slug: string; title: string; description: string | null
  start_date: string | null; end_date: string | null
  show_image: string | null; show_image_wide: string | null
  cta_label: string | null; cta_url: string | null; status: string
  parent_show: { show_image: string | null; show_image_wide: string | null } | { show_image: string | null; show_image_wide: string | null }[] | null
}

function EventCard({ event, comingSoon = false }: { event: Event; comingSoon?: boolean }) {
  const parent = Array.isArray(event.parent_show) ? event.parent_show[0] : event.parent_show
  const heroImage = event.show_image_wide ?? event.show_image ?? parent?.show_image_wide ?? parent?.show_image ?? null
  const dateStr = formatDateRange(event.start_date, event.end_date)

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--layer)', overflow: 'hidden' }}>
      <div className="g-2s" style={{ display: 'grid' }}>
        <div style={{ position: 'relative', aspectRatio: '16/9' }}>
          {heroImage ? (
            <Image src={heroImage} alt={event.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 50vw" />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #2d1b4e, #1b0a2e)' }} />
          )}
        </div>
        <div style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
          {dateStr && (
            <div style={{ marginBottom: '16px' }}>
              <span style={{ padding: '6px 14px', border: '1px solid rgba(212,168,83,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                {dateStr}
              </span>
            </div>
          )}
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, marginBottom: '12px' }}>
            {event.title}
          </h2>
          {event.description && (
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '32px', maxWidth: '520px' }}>
              {event.description}
            </p>
          )}
          {!comingSoon && event.cta_url && (
            <Link href={event.cta_url} className="btn-primary">
              <span>{event.cta_label ?? 'Learn More'}</span>
            </Link>
          )}
          {comingSoon && (
            <p style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Details coming soon
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
