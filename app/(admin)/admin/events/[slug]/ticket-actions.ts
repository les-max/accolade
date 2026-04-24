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

  void showId
}
