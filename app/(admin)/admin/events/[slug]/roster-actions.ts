'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addShowMember(
  showId: string,
  slug: string,
  email: string,
  role: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Look up family by email
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!family) throw new Error(`No account found for ${email}`)

  const { error } = await supabase.from('show_members').upsert(
    { show_id: showId, family_id: family.id, show_role: role },
    { onConflict: 'show_id,family_id' }
  )
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function removeShowMember(memberId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('show_members').delete().eq('id', memberId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}
