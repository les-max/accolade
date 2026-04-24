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

export default async function TicketsPage() {
  const supabase = createServiceClient()

  // Find the current active show
  const { data: show } = await supabase
    .from('shows')
    .select('id, title, description, show_image, show_image_wide, venues(name, city)')
    .eq('status', 'active')
    .eq('event_type', 'show')
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch performance dates + ticket config for this show
  let ticketPerformances: {
    id: string
    price: number
    capacity: number
    available: number
    date: string
    start_time: string | null
    label: string | null
  }[] = []

  if (show) {
    const { data: perfs } = await supabase
      .from('show_performances')
      .select('id, date, start_time, label')
      .eq('show_id', show.id)
      .eq('type', 'performance')
      .order('date')
      .order('start_time')

    const perfIds = (perfs ?? []).map(p => p.id)

    if (perfIds.length > 0) {
      const { data: tickets } = await supabase
        .from('ticket_performances')
        .select('id, show_performance_id, capacity, price, sales_enabled')
        .in('show_performance_id', perfIds)

      const ticketIds = (tickets ?? []).filter(t => t.sales_enabled).map(t => t.id)

      // Count paid tickets per ticket_performance
      const soldByTicketId: Record<string, number> = {}
      if (ticketIds.length > 0) {
        const { data: soldItems } = await supabase
          .from('ticket_order_items')
          .select('ticket_performance_id, quantity, ticket_orders!inner(status)')
          .in('ticket_performance_id', ticketIds)
          .eq('ticket_orders.status', 'paid')

        for (const item of soldItems ?? []) {
          const tpid = item.ticket_performance_id
          soldByTicketId[tpid] = (soldByTicketId[tpid] ?? 0) + item.quantity
        }
      }

      // Build result: join perfs + tickets
      ticketPerformances = (perfs ?? []).flatMap(perf => {
        const ticket = (tickets ?? []).find(t => t.show_performance_id === perf.id && t.sales_enabled)
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
        }]
      })
    }
  }

  const venue = show?.venues as { name: string; city: string } | null | undefined
  const perfDates = ticketPerformances.map(p => p.date)
  const dateRange = formatDateRange(perfDates)
  const hasTickets = ticketPerformances.length > 0

  return (
    <>
      <PageHero
        eyebrow="See a Show"
        title="Get Your Tickets"
        subtitle="Support community theatre and experience something extraordinary. Every seat in the house is a great seat."
        accentColor="var(--rose)"
      />

      {/* ── Current Production ────────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-label">Current Production</p>

          {!show ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Ticket sales coming soon. Check back for updates.</p>
            </div>
          ) : (
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
                    priority
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.8) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', bottom: '32px', left: '32px', right: '32px' }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{show.title}</h2>
                  {dateRange && <p style={{ color: 'var(--teal)', fontSize: '0.78rem', letterSpacing: '0.1em', marginTop: '8px' }}>{dateRange}</p>}
                </div>
              </div>

              {/* Ticket info */}
              <div>
                {venue && (
                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ padding: '6px 14px', border: '1px solid rgba(61,158,140,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)' }}>
                      {venue.name}{venue.city ? ` · ${venue.city}` : ''}
                    </span>
                  </div>
                )}

                {show.description && (
                  <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '40px', fontSize: '0.95rem' }}>
                    {show.description}
                  </p>
                )}

                {hasTickets ? (
                  <TicketCheckoutForm performances={ticketPerformances} />
                ) : (
                  <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>Ticket sales are not yet open.</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted-dim)' }}>Check back soon or contact us to be notified.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Group Sales ───────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px)', background: 'var(--layer)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="g-2" style={{ display: 'grid', maxWidth: '1200px', margin: '0 auto', gap: '64px', alignItems: 'center' }}>
          <div>
            <p className="section-label">Groups & Schools</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px' }}>
              Bring your<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gold)' }}>group or class</em>
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '32px' }}>
              Group discounts available for parties of 10 or more. We work with schools, churches, and community organizations to make live theatre accessible. Contact us for group pricing.
            </p>
            <a href="mailto:info@accoladetheatre.org" className="btn-ghost"><span>Contact for Group Sales</span></a>
          </div>
          <div style={{ background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px' }}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', marginBottom: '24px' }}>Group Perks</h3>
            {[
              'Discounted ticket pricing for 10+ guests',
              'Reserved seating blocks',
              'Dedicated group coordinator',
              'Pre-show meet & greet options',
              'Flexible payment arrangements',
            ].map((perk) => (
              <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(61,158,140,0.15)', border: '1px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: 'var(--teal)' }}>&#10003;</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--warm-white)' }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner CTA ───────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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
