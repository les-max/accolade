'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

type TicketRow = {
  show_performance_id: string
  capacity: number
  price: number
  sales_enabled: boolean
}

export async function upsertTicketPerformances(showId: string, slug: string, rows: TicketRow[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (rows.length === 0) return

  const { error } = await supabase.from('ticket_performances').upsert(
    rows.map(r => ({
      show_performance_id: r.show_performance_id,
      capacity: r.capacity,
      price: r.price,
      sales_enabled: r.sales_enabled,
    })),
    { onConflict: 'show_performance_id' }
  )

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
  revalidatePath('/tickets')

  void showId
}

export async function saveTicketOptionGroup(
  ticketPerformanceId: string,
  name: string,
  slug: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ticket_option_groups')
    .insert({ ticket_performance_id: ticketPerformanceId, name: name.trim() })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteTicketOptionGroup(groupId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ticket_option_groups')
    .delete()
    .eq('id', groupId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function saveTicketOption(
  groupId: string,
  name: string,
  sortOrder: number,
  slug: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ticket_options')
    .insert({ group_id: groupId, name: name.trim(), sort_order: sortOrder })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteTicketOption(optionId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ticket_options')
    .delete()
    .eq('id', optionId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

// ---------------------------------------------------------------------------
// Ticket coupon actions
// ---------------------------------------------------------------------------

export type TicketCouponRow = {
  id: string
  code: string
  discount_type: 'percent' | 'amount'
  discount_value: number
  max_uses: number | null
  use_count: number
}

/**
 * Public action — no auth required. Used by the checkout form to preview the
 * discount before the buyer submits. Does NOT increment use_count.
 */
export async function validateTicketCoupon(
  showId: string,
  code: string
): Promise<{ valid: true; coupon: TicketCouponRow } | { valid: false; error: string }> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('show_coupon_codes')
    .select('id, code, discount_type, discount_value, max_uses, use_count')
    .eq('show_id', showId)
    .ilike('code', code.trim())
    .not('discount_type', 'is', null)
    .maybeSingle()

  if (error) return { valid: false, error: 'Error checking coupon' }
  if (!data) return { valid: false, error: 'Invalid coupon code' }

  if (data.max_uses !== null && data.use_count >= data.max_uses) {
    return { valid: false, error: 'This coupon has reached its usage limit' }
  }

  return {
    valid: true,
    coupon: {
      id: data.id,
      code: data.code,
      discount_type: data.discount_type as 'percent' | 'amount',
      discount_value: data.discount_value,
      max_uses: data.max_uses,
      use_count: data.use_count,
    },
  }
}

export async function addTicketCoupon(
  showId: string,
  slug: string,
  code: string,
  discountType: 'percent' | 'amount',
  discountValue: number,
  maxUses: number | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (discountValue <= 0) throw new Error('Discount value must be greater than 0')
  if (discountType === 'percent' && discountValue > 100) throw new Error('Percent discount cannot exceed 100')

  const service = createServiceClient()
  const { error } = await service
    .from('show_coupon_codes')
    .insert({
      show_id: showId,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses,
      use_count: 0,
      // fees columns default to false, untouched
      waive_tuition: false,
      waive_shirts: false,
    })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteTicketCoupon(couponId: string, showId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { error } = await service
    .from('show_coupon_codes')
    .delete()
    .eq('id', couponId)
    .eq('show_id', showId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}
