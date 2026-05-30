import Image from 'next/image'
import Link from 'next/link'
import PageHero from '@/components/PageHero'
import { createServiceClient } from '@/lib/supabase/service'
import TicketCheckoutForm from './TicketCheckoutForm'

export const metadata = {
  title: 'Tickets — Accolade Community Theatre',
}

function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return ''
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
  if (dates.length === 1) return new Date(dates[0]).toLocaleDateString('en-US', opts)
  const first = new Date(dates[0]).toLocaleDateString('en-US', opts)
  const last = new Date(dates[dates.length - 1]).toLocaleDateString('en-US', opts)
  return `${first} – ${last}`
}

type OptionGroup = {
  id: string
  name: string
  required: boolean
  options: { id: string; name: string }[]
}

type TicketPerf = {
  id: string
  price: number
  capacity: number
  available: number
  date: string
  start_time: string | null
  label: string | null
  optionGroups: OptionGroup[]
}

type ShowWithTickets = {
  id: string
  title: string
  description: string | null
  show_image: string | null
  show_image_wide: string | null
  venue: { name: string; city: string } | null
  dateRange: string
  ticketPerformances: TicketPerf[]
}

export default async function TicketsPage() {
  const supabase = createServiceClient()

  // Fetch all active shows
  const { data: shows } = await supabase
    .from('shows')
    .select('id, title, description, show_image, show_image_wide, venues(name, city)')
    .eq('status', 'active')
    .eq('event_type', 'show')
    .eq('archived', false)
    .order('start_date', { ascending: true })

  const activeShows = shows ?? []

  let showsWithTickets: ShowWithTickets[] = []

  if (activeShows.length > 0) {
    const showIds = activeShows.map(s => s.id)

    // Fetch all performances for all active shows
    const { data: allPerfs } = await supabase
      .from('show_performances')
      .select('id, show_id, date, start_time, label')
      .in('show_id', showIds)
      .eq('type', 'performance')
      .order('date')
      .order('start_time')

    const allPerfIds = (allPerfs ?? []).map(p => p.id)

    // Fetch all ticket_performances
    const allTickets = allPerfIds.length > 0
      ? (await supabase
          .from('ticket_performances')
          .select(`
            id, show_performance_id, capacity, price, sales_enabled,
            ticket_option_groups (
              id, name, required, sort_order,
              ticket_options ( id, name, sort_order )
            )
          `)
          .in('show_performance_id', allPerfIds)).data ?? []
      : []

    // Count sold tickets across all performances
    const enabledTicketIds = allTickets.filter(t => t.sales_enabled).map(t => t.id)
    const soldByTicketId: Record<string, number> = {}

    if (enabledTicketIds.length > 0) {
      const { data: soldItems } = await supabase
        .from('ticket_order_items')
        .select('ticket_performance_id, quantity, ticket_orders!inner(status)')
        .in('ticket_performance_id', enabledTicketIds)
        .eq('ticket_orders.status', 'paid')

      for (const item of soldItems ?? []) {
        const tpid = item.ticket_performance_id
        soldByTicketId[tpid] = (soldByTicketId[tpid] ?? 0) + item.quantity
      }
    }

    // Build per-show data
    showsWithTickets = activeShows.map(show => {
      const venue = show.venues as unknown as { name: string; city: string } | null | undefined
      const showPerfs = (allPerfs ?? []).filter(p => p.show_id === show.id)

      const ticketPerformances: TicketPerf[] = showPerfs.flatMap(perf => {
        const ticket = allTickets.find(t => t.show_performance_id === perf.id && t.sales_enabled)
        if (!ticket) return []
        const sold = soldByTicketId[ticket.id] ?? 0
        return [{
          id: ticket.id,
          price: ticket.price,
          capacity: ticket.capacity,
          available: Math.max(0, ticket.capacity - sold),
          date: perf.date,
          start_time: perf.start_time,
          label: perf.label,
          optionGroups: ((ticket as any).ticket_option_groups ?? []).map((g: any) => ({
            id: g.id,
            name: g.name,
            required: g.required,
            options: (g.ticket_options ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((o: any) => ({ id: o.id, name: o.name })),
          })),
        }]
      })

      return {
        id: show.id,
        title: show.title,
        description: show.description ?? null,
        show_image: show.show_image ?? null,
        show_image_wide: show.show_image_wide ?? null,
        venue: venue ?? null,
        dateRange: formatDateRange(ticketPerformances.map(p => p.date)),
        ticketPerformances,
      }
    })
  }

  return (
    <>
      <PageHero
        eyebrow="See a Show"
        title="Get Your Tickets"
        subtitle="Support community theatre and experience something extraordinary. Every seat in the house is a great seat."
        accentColor="var(--rose)"
      />

      {/* ── Productions ───────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {showsWithTickets.length === 0 ? (
            <>
              <p className="section-label">Coming Soon</p>
              <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Ticket sales coming soon. Check back for updates.</p>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(64px, 12vw, 120px)' }}>
              {showsWithTickets.map((show, i) => (
                <div key={show.id}>
                  <p className="section-label">{i === 0 ? 'Now Playing' : 'Also Playing'}</p>
                  <div className="g-2w" style={{ display: 'grid', gap: '64px', alignItems: 'start' }}>

                    {/* Show image */}
                    <div style={{ aspectRatio: '2/3', borderRadius: '4px', background: 'linear-gradient(160deg, #2d1b4e, #1b0a2e)', position: 'relative', overflow: 'hidden' }}>
                      {show.show_image && (
                        <Image
                          src={show.show_image}
                          alt={show.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, 40vw"
                          priority={i === 0}
                        />
                      )}
                    </div>

                    {/* Ticket info */}
                    <div>
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '8px' }}>{show.title}</h2>
                      {show.dateRange && <p style={{ color: 'var(--teal)', fontSize: '0.78rem', letterSpacing: '0.1em', marginBottom: '24px' }}>{show.dateRange}</p>}

                      {show.venue && (
                        <div style={{ marginBottom: '20px' }}>
                          <span style={{ padding: '6px 14px', border: '1px solid rgba(61,158,140,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)' }}>
                            {show.venue.name}{show.venue.city ? ` · ${show.venue.city}` : ''}
                          </span>
                        </div>
                      )}

                      {show.description && (
                        <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '40px', fontSize: '0.95rem' }}>
                          {show.description}
                        </p>
                      )}

                      {show.ticketPerformances.length > 0 ? (
                        <TicketCheckoutForm showId={show.id} performances={show.ticketPerformances} />
                      ) : (
                        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px', textAlign: 'center' }}>
                          <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>Ticket sales are not yet open.</p>
                          <p style={{ fontSize: '0.82rem', color: 'var(--muted-dim)' }}>Check back soon or contact us to be notified.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Partner CTA ───────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 900, marginBottom: '20px' }}>
            Get tickets + perks as a <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gold)' }}>Partner</em>
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '40px' }}>
            Accolade Partners enjoy reserved tickets, early access, and exclusive benefits. It&apos;s the best way to support the theatre and never miss a show.
          </p>
          <Link href="/partners" className="btn-primary"><span>Learn About Partnerships</span></Link>
        </div>
      </section>
    </>
  )
}
