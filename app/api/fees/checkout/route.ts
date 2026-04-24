import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import {
  ACCOLADE_AD_PRICES, AD_LABELS, SHIRT_SIZES, SHOW_TUITION_TIER_1, SHOW_TUITION_TIER_2,
  type AdSize, type ShirtSize,
} from '@/lib/fees-constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function centsOf(dollars: number): number {
  return Math.round(dollars * 100)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    show_slug: string
    family_member_ids: string[]
    shirt_sizes: Record<string, string>
    ads: string[]
    coupon_code?: string
  }

  const { show_slug, family_member_ids, shirt_sizes, ads, coupon_code } = body

  if (!show_slug || !family_member_ids || family_member_ids.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Auth: must be logged in
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Load family
  const { data: family } = await supabase
    .from('families')
    .select('id, parent_name, email')
    .eq('user_id', user.id)
    .single()
  if (!family) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 })
  }

  // Load show + fees config
  const { data: show } = await supabase
    .from('shows')
    .select('id, title, event_type, show_fees_config ( shirt_price, tuition_amount, fees_enabled )')
    .eq('slug', show_slug)
    .single()
  if (!show) {
    return NextResponse.json({ error: 'Show not found' }, { status: 404 })
  }

  const feesConfig = (show.show_fees_config as unknown as { shirt_price: number | null; tuition_amount: number | null; fees_enabled: boolean } | null)
  if (!feesConfig?.fees_enabled) {
    return NextResponse.json({ error: 'Fees not enabled for this show' }, { status: 409 })
  }

  // Validate family_member_ids belong to this family
  const { data: allMembers } = await supabase
    .from('family_members')
    .select('id, first_name, last_name')
    .eq('family_id', family.id)
  const memberMap = new Map((allMembers ?? []).map(m => [m.id, m]))
  const validMemberIds = family_member_ids.filter(id => memberMap.has(id))
  if (validMemberIds.length === 0) {
    return NextResponse.json({ error: 'No valid family members selected' }, { status: 400 })
  }

  // Check for existing paid order
  const { data: existingPaid } = await supabase
    .from('show_fee_orders')
    .select('id')
    .eq('show_id', show.id)
    .eq('family_id', family.id)
    .eq('status', 'paid')
    .maybeSingle()
  if (existingPaid) {
    return NextResponse.json({ error: 'Fees already paid for this show' }, { status: 409 })
  }

  // Validate coupon (if provided)
  let coupon: { id: string; waive_tuition: boolean; waive_shirts: boolean } | null = null
  if (coupon_code) {
    const { data: couponRow } = await supabase
      .from('show_coupon_codes')
      .select('id, waive_tuition, waive_shirts, used_by_family_id')
      .eq('show_id', show.id)
      .eq('code', coupon_code.toUpperCase().trim())
      .single()
    if (!couponRow || couponRow.used_by_family_id) {
      return NextResponse.json({ error: 'Invalid or already-used coupon code' }, { status: 400 })
    }
    coupon = couponRow
  }

  // Build line items
  const isCamp = show.event_type === 'camp' || show.event_type === 'workshop'
  const shirtPrice = feesConfig.shirt_price ?? 0

  type LineItem = { item_type: 'tuition' | 'shirt' | 'ad'; label: string; unit_price: number; quantity: number; family_member_id: string | null; shirt_size: string | null }
  const lineItems: LineItem[] = []

  for (let i = 0; i < validMemberIds.length; i++) {
    const memberId = validMemberIds[i]
    const member = memberMap.get(memberId)!
    const memberName = `${member.first_name} ${member.last_name}`

    let tuitionPrice: number
    if (isCamp) {
      tuitionPrice = feesConfig.tuition_amount ?? 0
    } else {
      tuitionPrice = i < 2 ? SHOW_TUITION_TIER_1 : SHOW_TUITION_TIER_2
    }

    lineItems.push({
      item_type: 'tuition',
      label: `${memberName} — Tuition`,
      unit_price: tuitionPrice,
      quantity: 1,
      family_member_id: memberId,
      shirt_size: null,
    })

    // Shirt item
    const size = shirt_sizes[memberId]
    if (size && SHIRT_SIZES.includes(size as ShirtSize)) {
      const shirtCost = isCamp ? 0 : shirtPrice  // camps: shirt included, record size at $0
      lineItems.push({
        item_type: 'shirt',
        label: `${memberName} — Shirt`,
        unit_price: shirtCost,
        quantity: 1,
        family_member_id: memberId,
        shirt_size: size,
      })
    }
  }

  // Ad items
  for (const adSize of ads) {
    if (!(adSize in ACCOLADE_AD_PRICES)) continue
    lineItems.push({
      item_type: 'ad',
      label: AD_LABELS[adSize as AdSize],
      unit_price: ACCOLADE_AD_PRICES[adSize as AdSize],
      quantity: 1,
      family_member_id: null,
      shirt_size: null,
    })
  }

  // Apply coupon discounts
  if (coupon) {
    if (coupon.waive_tuition) {
      lineItems.filter(l => l.item_type === 'tuition').forEach(l => { l.unit_price = 0 })
    }
    if (coupon.waive_shirts) {
      lineItems.filter(l => l.item_type === 'shirt').forEach(l => { l.unit_price = 0 })
    }
  }

  const totalDollars = lineItems.reduce((sum, l) => sum + l.unit_price * l.quantity, 0)

  // Create order row
  const { data: order, error: orderErr } = await supabase
    .from('show_fee_orders')
    .insert({
      show_id: show.id,
      family_id: family.id,
      total_amount: totalDollars,
      status: 'pending',
      coupon_code_id: coupon?.id ?? null,
    })
    .select('id')
    .single()
  if (orderErr || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Insert line items
  const { error: itemsErr } = await supabase.from('show_fee_order_items').insert(
    lineItems.map(l => ({ order_id: order.id, ...l }))
  )
  if (itemsErr) {
    console.error('Failed to insert fee order items', itemsErr)
    return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
  }

  // Mark coupon used (reserve it at checkout time)
  if (coupon) {
    await supabase
      .from('show_coupon_codes')
      .update({ used_by_family_id: family.id })
      .eq('id', coupon.id)
  }

  const origin = req.headers.get('origin') ?? 'https://accoladetheatre.org'

  // $0 order: skip Stripe, mark paid immediately
  if (totalDollars === 0) {
    await supabase.from('show_fee_orders').update({ status: 'paid' }).eq('id', order.id)
    return NextResponse.json({ url: `${origin}/account/shows/${show_slug}/fees/success?free=1` })
  }

  // Stripe Checkout session
  const stripeLineItems = lineItems
    .filter(l => l.unit_price > 0)
    .map(l => ({
      price_data: {
        currency: 'usd',
        unit_amount: centsOf(l.unit_price),
        product_data: { name: l.label },
      },
      quantity: l.quantity,
    }))

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: family.email,
    line_items: stripeLineItems,
    metadata: { type: 'show_fees', order_id: order.id },
    success_url: `${origin}/account/shows/${show_slug}/fees/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/account/shows/${show_slug}/fees`,
  })

  await supabase.from('show_fee_orders').update({ stripe_session_id: session.id }).eq('id', order.id)

  return NextResponse.json({ url: session.url })
}
