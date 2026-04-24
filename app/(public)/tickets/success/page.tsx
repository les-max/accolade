import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import Stripe from 'stripe'

export const metadata = {
  title: 'Order Confirmed — Accolade Community Theatre',
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

export default async function TicketSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  let orderId: string | null = null
  let showTitle = ''
  let performanceDate = ''
  let performanceTime: string | null = null
  let performanceLabel: string | null = null
  let quantity = 0
  let totalAmount = 0
  let buyerName = ''
  let error = false

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      orderId = session.metadata?.order_id ?? null

      if (orderId) {
        const supabase = createServiceClient()

        const { data: order } = await supabase
          .from('ticket_orders')
          .select(`
            id, buyer_name, total_amount, status, show_id,
            shows ( title )
          `)
          .eq('id', orderId)
          .single()

        if (order) {
          buyerName = order.buyer_name
          totalAmount = order.total_amount
          showTitle = (order.shows as unknown as { title: string })?.title ?? ''

          const { data: items } = await supabase
            .from('ticket_order_items')
            .select(`
              quantity,
              ticket_performances (
                show_performances ( date, start_time, label )
              )
            `)
            .eq('order_id', orderId)

          if (items && items.length > 0) {
            quantity = items[0].quantity
            const tp = items[0].ticket_performances as unknown as { show_performances: { date: string; start_time: string | null; label: string | null } }
            if (tp?.show_performances) {
              performanceDate = formatDate(tp.show_performances.date)
              performanceTime = tp.show_performances.start_time ? formatTime(tp.show_performances.start_time) : null
              performanceLabel = tp.show_performances.label
            }
          }
        }
      }
    } catch {
      error = true
    }
  } else {
    error = true
  }

  if (error || !orderId) {
    return (
      <section style={{ padding: 'clamp(80px, 15vw, 140px) clamp(20px, 5vw, 48px)', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: '16px' }}>Order not found</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
            We couldn&apos;t find your order. If you completed a purchase, check your email for a confirmation.
          </p>
          <Link href="/tickets" className="btn-ghost"><span>Back to Tickets</span></Link>
        </div>
      </section>
    )
  }

  const ticketWord = quantity === 1 ? 'ticket' : 'tickets'

  return (
    <section style={{ padding: 'clamp(80px, 15vw, 140px) clamp(20px, 5vw, 48px)' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Check mark */}
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(61,158,140,0.15)', border: '1px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', fontSize: '24px', color: 'var(--teal)' }}>
          &#10003;
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '12px' }}>
          You&apos;re going to the show!
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '40px' }}>
          Thanks, {buyerName}. Your {ticketWord} are confirmed and a receipt has been sent to your email.
        </p>

        {/* Order summary */}
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '6px', padding: '28px 32px', marginBottom: '40px' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>Order Summary</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>Show</p>
              <p style={{ fontSize: '1rem', color: 'var(--warm-white)', fontWeight: 600 }}>{showTitle}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>Performance</p>
              <p style={{ fontSize: '0.95rem', color: 'var(--warm-white)' }}>
                {performanceDate}
                {performanceTime && <span style={{ color: 'var(--muted)' }}> at {performanceTime}</span>}
              </p>
              {performanceLabel && <p style={{ fontSize: '0.8rem', color: 'var(--muted-dim)', marginTop: '2px' }}>{performanceLabel}</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>Tickets</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--warm-white)' }}>{quantity} {ticketWord}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>Total Paid</p>
                <p style={{ fontSize: '1.4rem', color: 'var(--gold)', fontWeight: 700 }}>${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '32px' }}>
          Bring this confirmation or just your name to will call at the door. See you at the show!
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-primary"><span>Back to Home</span></Link>
          <Link href="/tickets" className="btn-ghost"><span>Buy More Tickets</span></Link>
        </div>
      </div>
    </section>
  )
}
