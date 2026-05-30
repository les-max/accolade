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

type CheckoutItem = {
  ticket_performance_id: string
  quantity: number
  options?: { ticket_option_id: string; quantity: number }[]
}

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
  const { items, buyer_name, buyer_email, coupon_code } = body as {
    items: CheckoutItem[]
    buyer_name: string
    buyer_email: string
    coupon_code?: string | null
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

  // Fetch option names for Stripe line item descriptions
  const allOptionIds = items.flatMap(i => (i.options ?? []).map(o => o.ticket_option_id))
  const optionNameById: Record<string, string> = {}
  if (allOptionIds.length > 0) {
    const { data: optRows } = await supabase
      .from('ticket_options')
      .select('id, name')
      .in('id', allOptionIds)
    for (const o of optRows ?? []) optionNameById[o.id] = o.name
  }

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

  const totalBeforeDiscount = items.reduce(
    (sum, item) => sum + tpById[item.ticket_performance_id].price * item.quantity,
    0
  )

  // Server-side coupon validation
  let couponId: string | null = null
  let discountAmount = 0

  if (coupon_code?.trim()) {
    const { data: couponRow } = await supabase
      .from('show_coupon_codes')
      .select('id, discount_type, discount_value, max_uses')
      .eq('show_id', show.id)
      .ilike('code', coupon_code.trim())
      .not('discount_type', 'is', null)
      .maybeSingle()

    if (!couponRow) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
    }
    couponId = couponRow.id
    if (couponRow.discount_type === 'percent') {
      discountAmount = totalBeforeDiscount * (couponRow.discount_value / 100)
    } else {
      discountAmount = couponRow.discount_value
    }
    // Cap so Stripe total never drops below $0.50
    discountAmount = Math.min(discountAmount, Math.max(0, totalBeforeDiscount - 0.5))
  }

  const totalAmount = Math.max(0.5, totalBeforeDiscount - discountAmount)

  // Create order
  const { data: order, error: orderErr } = await supabase
    .from('ticket_orders')
    .insert({
      show_id: show.id,
      buyer_name,
      buyer_email,
      total_amount: totalAmount,
      status: 'pending',
      coupon_code_id: couponId,
      discount_amount: discountAmount,
    })
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

  // Fetch back order item IDs for option linking
  const { data: orderItems } = await supabase
    .from('ticket_order_items')
    .select('id, ticket_performance_id')
    .eq('order_id', order.id)

  const optionInserts: { ticket_order_item_id: string; ticket_option_id: string; quantity: number }[] = []
  for (const item of items) {
    if (!item.options?.length) continue
    const orderItem = (orderItems ?? []).find(oi => oi.ticket_performance_id === item.ticket_performance_id)
    if (!orderItem) continue
    for (const opt of item.options) {
      if (opt.quantity > 0) {
        optionInserts.push({
          ticket_order_item_id: orderItem.id,
          ticket_option_id: opt.ticket_option_id,
          quantity: opt.quantity,
        })
      }
    }
  }
  if (optionInserts.length > 0) {
    await supabase.from('ticket_order_item_options').insert(optionInserts)
  }

  // Build Stripe line items (one per performance)
  const origin = req.headers.get('origin') ?? 'https://accoladetheatre.org'
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const lineItems = items.map(item => {
    const tp = tpById[item.ticket_performance_id]
    const perf = tp.show_performances
    const perfLabel = `${formatDate(perf.date)}${perf.start_time ? ' at ' + formatTime(perf.start_time) : ''}${perf.label ? ' — ' + perf.label : ''}`
    const optionSummary = (item.options ?? [])
      .filter(o => o.quantity > 0)
      .map(o => `${o.quantity}× ${optionNameById[o.ticket_option_id] ?? 'Unknown'}`)
      .join(', ')
    const description = [
      `${item.quantity} ticket${item.quantity !== 1 ? 's' : ''}`,
      optionSummary,
    ].filter(Boolean).join(' · ')
    return {
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(tp.price * 100),
        product_data: {
          name: `${show.title} — ${perfLabel}`,
          description,
        },
      },
      quantity: item.quantity,
    }
  })

  // Add negative line item for coupon discount
  if (discountAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: -Math.round(discountAmount * 100),
        product_data: {
          name: 'Discount',
          description: `Coupon: ${coupon_code!.trim().toUpperCase()}`,
        },
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: buyer_email,
    line_items: lineItems,
    metadata: { type: 'ticket', order_id: order.id },
    success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/tickets`,
  })

  await supabase.from('ticket_orders').update({ stripe_session_id: session.id }).eq('id', order.id)

  // Atomically claim coupon — also enforces max_uses at the DB level
  if (couponId) {
    const { data: claimed, error: claimErr } = await supabase.rpc('claim_ticket_coupon', { p_coupon_id: couponId })
    if (claimErr) console.error('[checkout] claim_ticket_coupon RPC error:', claimErr)
    if (!claimed) {
      // Coupon exhausted between validation and claim — order is still valid, just log it
      console.warn('[checkout] Coupon exhausted at claim time, order proceeds without discount adjustment')
    }
  }

  return NextResponse.json({ url: session.url })
}
