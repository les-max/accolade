import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

type CheckoutItem = { ticket_performance_id: string; quantity: number }

type PerfRow = {
  id: string
  capacity: number
  price: number
  sales_enabled: boolean
  show_performances: {
    id: string
    date: string
    start_time: string | null
    label: string | null
    shows: { id: string; title: string }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { items, buyer_name, buyer_email } = body as {
    items: CheckoutItem[]
    buyer_name: string
    buyer_email: string
  }

  if (!items?.length || !buyer_name || !buyer_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (items.some(item => item.quantity < 1 || item.quantity > 8)) {
    return NextResponse.json({ error: 'Quantity must be between 1 and 8 per performance' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: tps, error: tpErr } = await supabase
    .from('ticket_performances')
    .select(`
      id, capacity, price, sales_enabled,
      show_performances (
        id, date, start_time, label,
        shows ( id, title )
      )
    `)
    .in('id', items.map(i => i.ticket_performance_id))

  if (tpErr || !tps?.length) {
    return NextResponse.json({ error: 'Tickets not found' }, { status: 404 })
  }

  const tpById = Object.fromEntries((tps as unknown as PerfRow[]).map(tp => [tp.id, tp]))

  // Verify all items found and sales are open
  for (const item of items) {
    const tp = tpById[item.ticket_performance_id]
    if (!tp) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (!tp.sales_enabled) {
      return NextResponse.json({ error: 'Ticket sales are not open for one or more performances' }, { status: 409 })
    }
  }

  // Check availability for each performance
  for (const item of items) {
    const { data: soldRows } = await supabase
      .from('ticket_order_items')
      .select('quantity, ticket_orders!inner(status)')
      .eq('ticket_performance_id', item.ticket_performance_id)
      .eq('ticket_orders.status', 'paid')

    const sold = (soldRows ?? []).reduce((sum, r) => sum + (r.quantity ?? 0), 0)
    const tp = tpById[item.ticket_performance_id]
    if (sold + item.quantity > tp.capacity) {
      return NextResponse.json({ error: 'Not enough tickets available for one or more performances' }, { status: 409 })
    }
  }

  const firstTp = tpById[items[0].ticket_performance_id]
  const show = firstTp.show_performances.shows

  const totalAmount = items.reduce((sum, item) => sum + tpById[item.ticket_performance_id].price * item.quantity, 0)

  // Create order
  const { data: order, error: orderErr } = await supabase
    .from('ticket_orders')
    .insert({ show_id: show.id, buyer_name, buyer_email, total_amount: totalAmount, status: 'pending' })
    .select('id')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Create order items (one per performance)
  await supabase.from('ticket_order_items').insert(
    items.map(item => ({
      order_id: order.id,
      ticket_performance_id: item.ticket_performance_id,
      quantity: item.quantity,
      unit_price: tpById[item.ticket_performance_id].price,
    }))
  )

  // Build Stripe line items (one per performance)
  const origin = req.headers.get('origin') ?? 'https://accoladetheatre.org'
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const lineItems = items.map(item => {
    const tp = tpById[item.ticket_performance_id]
    const perf = tp.show_performances
    const perfLabel = `${formatDate(perf.date)}${perf.start_time ? ' at ' + formatTime(perf.start_time) : ''}${perf.label ? ' — ' + perf.label : ''}`
    return {
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(tp.price * 100),
        product_data: {
          name: `${show.title} — ${perfLabel}`,
          description: `${item.quantity} ticket${item.quantity !== 1 ? 's' : ''}`,
        },
      },
      quantity: item.quantity,
    }
  })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: buyer_email,
    line_items: lineItems,
    metadata: { type: 'ticket', order_id: order.id },
    success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/tickets`,
  })

  await supabase.from('ticket_orders').update({ stripe_session_id: session.id }).eq('id', order.id)

  return NextResponse.json({ url: session.url })
}
