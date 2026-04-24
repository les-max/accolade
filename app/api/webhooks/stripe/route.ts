import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { sendTicketConfirmation } from '@/lib/email/ticket-emails'
import { sendFeeConfirmation } from '@/lib/email/fee-emails'

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

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const orderType = session.metadata?.type ?? 'ticket'  // backwards compat for existing orders
  const orderId = session.metadata?.order_id

  if (!orderId) {
    return NextResponse.json({ error: 'No order_id in metadata' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (orderType === 'show_fees') {
    const { data: feeOrder, error: feeErr } = await supabase
      .from('show_fee_orders')
      .update({ status: 'paid' })
      .eq('id', orderId)
      .select('id, total_amount, show_id, family_id')
      .single()

    if (feeErr || !feeOrder) {
      console.error('Failed to update fee order', orderId, feeErr)
      return NextResponse.json({ error: 'Fee order update failed' }, { status: 500 })
    }

    const { data: feeItems } = await supabase
      .from('show_fee_order_items')
      .select('label, unit_price, quantity')
      .eq('order_id', orderId)

    const { data: feeShow } = await supabase
      .from('shows')
      .select('title')
      .eq('id', feeOrder.show_id)
      .single()

    const { data: family } = await supabase
      .from('families')
      .select('parent_name, email')
      .eq('id', feeOrder.family_id)
      .single()

    if (feeItems && feeShow && family) {
      try {
        await sendFeeConfirmation({
          to: family.email,
          parentName: family.parent_name,
          showTitle: feeShow.title,
          items: feeItems
            .filter(i => i.unit_price > 0)
            .map(i => ({ label: i.label, amount: Math.round(i.unit_price * i.quantity * 100) })),
          totalAmount: Math.round(feeOrder.total_amount * 100),
          orderId: feeOrder.id,
        })
      } catch (emailErr) {
        console.error('Fee confirmation email failed', emailErr)
        // Order is paid; do not fail the webhook
      }
    }

    return NextResponse.json({ received: true })
  }

  // Mark order as paid
  const { data: order, error: orderErr } = await supabase
    .from('ticket_orders')
    .update({ status: 'paid' })
    .eq('id', orderId)
    .select('id, buyer_name, buyer_email, total_amount, show_id')
    .single()

  if (orderErr || !order) {
    console.error('Failed to update order', orderId, orderErr)
    return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
  }

  // Fetch order items + performance info for confirmation email
  const { data: items } = await supabase
    .from('ticket_order_items')
    .select(`
      quantity, unit_price,
      ticket_performances (
        show_performances ( date, start_time, label )
      )
    `)
    .eq('order_id', orderId)

  const { data: show } = await supabase
    .from('shows')
    .select('title')
    .eq('id', order.show_id)
    .single()

  if (items && items.length > 0 && show) {
    const item = items[0]
    const tp = item.ticket_performances as unknown as { show_performances: { date: string; start_time: string | null; label: string | null } }
    const perf = tp?.show_performances

    await sendTicketConfirmation({
      to: order.buyer_email,
      buyerName: order.buyer_name,
      showTitle: show.title,
      performanceDate: perf ? formatDate(perf.date) : '',
      performanceTime: perf?.start_time ? formatTime(perf.start_time) : null,
      quantity: item.quantity,
      totalAmount: Math.round(order.total_amount * 100),
      orderId: order.id,
    })
  }

  return NextResponse.json({ received: true })
}
