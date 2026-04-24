import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ticket_performance_id, quantity, buyer_name, buyer_email } = body as {
    ticket_performance_id: string
    quantity: number
    buyer_name: string
    buyer_email: string
  }

  if (!ticket_performance_id || !quantity || !buyer_name || !buyer_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (quantity < 1 || quantity > 8) {
    return NextResponse.json({ error: 'Quantity must be between 1 and 8' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Load ticket config + performance + show
  const { data: tp, error: tpErr } = await supabase
    .from('ticket_performances')
    .select(`
      id, capacity, price, sales_enabled,
      show_performances (
        id, date, start_time, label,
        shows ( id, title )
      )
    `)
    .eq('id', ticket_performance_id)
    .single()

  if (tpErr || !tp) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  if (!tp.sales_enabled) {
    return NextResponse.json({ error: 'Ticket sales are not open for this performance' }, { status: 409 })
  }

  // Check availability: sum of paid order items for this ticket_performance
  const { data: soldRows } = await supabase
    .from('ticket_order_items')
    .select('quantity, ticket_orders!inner(status)')
    .eq('ticket_performance_id', ticket_performance_id)
    .eq('ticket_orders.status', 'paid')

  const sold = (soldRows ?? []).reduce((sum, r) => sum + (r.quantity ?? 0), 0)
  if (sold + quantity > tp.capacity) {
    return NextResponse.json({ error: 'Not enough tickets available' }, { status: 409 })
  }

  const perf = tp.show_performances as unknown as { id: string; date: string; start_time: string | null; label: string | null; shows: { id: string; title: string } }
  const show = perf.shows
  const perfLabel = `${formatDate(perf.date)}${perf.start_time ? ' at ' + formatTime(perf.start_time) : ''}${perf.label ? ' — ' + perf.label : ''}`

  const unitPriceCents = Math.round(tp.price * 100)
  const totalCents = unitPriceCents * quantity

  // Create order row (pending until webhook confirms)
  const { data: order, error: orderErr } = await supabase
    .from('ticket_orders')
    .insert({
      show_id: show.id,
      buyer_name,
      buyer_email,
      total_amount: tp.price * quantity,
      status: 'pending',
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Create order item
  await supabase.from('ticket_order_items').insert({
    order_id: order.id,
    ticket_performance_id,
    quantity,
    unit_price: tp.price,
  })

  // Create Stripe Checkout session
  const origin = req.headers.get('origin') ?? 'https://accoladetheatre.org'
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: buyer_email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: unitPriceCents,
          product_data: {
            name: `${show.title} — ${perfLabel}`,
            description: `${quantity} ticket${quantity !== 1 ? 's' : ''}`,
          },
        },
        quantity,
      },
    ],
    metadata: { type: 'ticket', order_id: order.id },
    success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/tickets`,
  })

  // Store session id on order
  await supabase.from('ticket_orders').update({ stripe_session_id: session.id }).eq('id', order.id)

  return NextResponse.json({ url: session.url })
}
