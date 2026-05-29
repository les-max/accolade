'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteAudition(auditionId: string, showSlug: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('auditions').delete().eq('id', auditionId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/events/${showSlug}/registrations`)
  return { success: true }
}

export async function addRegistration(
  showId: string,
  showSlug: string,
  data: {
    auditioner_name: string
    parent_email: string
    parent_name: string | null
    parent_phone: string | null
    auditioner_age: number | null
  }
) {
  const supabase = await createClient()
  const { error } = await supabase.from('auditions').insert({
    show_id: showId,
    auditioner_name: data.auditioner_name,
    parent_email: data.parent_email,
    parent_name: data.parent_name,
    parent_phone: data.parent_phone,
    auditioner_age: data.auditioner_age,
    status: 'registered',
    is_adult: false,
    accept_other_roles: false,
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/events/${showSlug}/registrations`)
  return { success: true }
}
