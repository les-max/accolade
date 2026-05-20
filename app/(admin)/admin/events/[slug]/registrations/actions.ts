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
