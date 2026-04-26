'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: caller } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (caller?.role !== 'admin') throw new Error('Unauthorized')
  return supabase
}

export async function addShowStaff(showId: string, adminUserId: string, role: string, slug: string) {
  const supabase = await assertAdmin()
  const { error } = await supabase
    .from('show_staff')
    .insert({ show_id: showId, admin_user_id: adminUserId, role })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function removeShowStaff(staffId: string, slug: string) {
  const supabase = await assertAdmin()
  const { error } = await supabase.from('show_staff').delete().eq('id', staffId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}
