import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(',')
}

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const showId = req.nextUrl.searchParams.get('showId')
  if (!showId) return new NextResponse('Missing showId', { status: 400 })

  // Verify user has access to this show
  const { data: staffRow } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const isGlobalAdmin = staffRow?.role === 'admin'

  if (!isGlobalAdmin) {
    const { data: showStaff } = await supabase
      .from('show_staff')
      .select('id')
      .eq('show_id', showId)
      .eq('admin_user_id', user.id)
      .maybeSingle()
    if (!showStaff) return new NextResponse('Forbidden', { status: 403 })
  }

  const service = createServiceClient()

  // Fetch show title for filename
  const { data: show } = await service
    .from('shows')
    .select('title')
    .eq('id', showId)
    .single()

  // Fetch all paid orders for this show with full detail including coupon
  const { data: orders } = await service
    .from('ticket_orders')
    .select(`
      id, buyer_name, buyer_email, created_at, status, total_amount,
      discount_amount,
      show_coupon_codes ( code ),
      ticket_order_items (
        id, quantity,
        ticket_performances (
          price,
          show_performances ( date, start_time, label )
        ),
        ticket_order_item_options (
          quantity,
          ticket_options (
            name,
            ticket_option_groups ( name )
          )
        )
      )
    `)
    .eq('show_id', showId)
    .eq('status', 'paid')
    .order('created_at', { ascending: true })

  // Build CSV
  const headers = [
    'Order Date', 'Buyer Name', 'Buyer Email',
    'Performance Date', 'Performance Time', 'Performance Label',
    'Qty', 'Price Per Ticket', 'Subtotal', 'Options',
    'Coupon Code', 'Discount',
  ]

  const rows: string[] = [csvRow(headers)]

  for (const order of orders ?? []) {
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    const couponCode = (order.show_coupon_codes as any)?.code ?? ''
    const discountAmt = (order as any).discount_amount ?? 0

    for (const item of (order.ticket_order_items as any[]) ?? []) {
      const tp = item.ticket_performances as any
      const perf = tp?.show_performances as any
      const date = perf?.date ? formatDate(perf.date) : ''
      const time = perf?.start_time ? formatTime(perf.start_time) : ''
      const label = perf?.label ?? ''
      const price = tp?.price ?? 0
      const subtotal = price * item.quantity

      // Collect options: "Chicken: 2, Beef: 1"
      const optionParts: string[] = []
      for (const opt of (item.ticket_order_item_options as any[]) ?? []) {
        const optName = (opt.ticket_options as any)?.name ?? ''
        if (optName && opt.quantity > 0) {
          optionParts.push(`${optName}: ${opt.quantity}`)
        }
      }
      const options = optionParts.join(', ')

      rows.push(csvRow([
        orderDate,
        order.buyer_name,
        order.buyer_email,
        date,
        time,
        label,
        item.quantity,
        price.toFixed(2),
        subtotal.toFixed(2),
        options,
        couponCode,
        discountAmt > 0 ? `-${Number(discountAmt).toFixed(2)}` : '',
      ]))
    }
  }

  const csv = rows.join('\n')
  const filename = `tickets-${(show?.title ?? 'export').toLowerCase().replace(/\s+/g, '-')}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
