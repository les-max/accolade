'use server'

import { createClient } from '@/lib/supabase/server'
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
