'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function claimVolunteerPosition(
  positionId: string,
  showId: string,
  slug: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: fu } = await supabase
    .from('family_users')
    .select('family_id')
    .eq('user_id', user.id)
    .single()
  if (!fu) throw new Error('No family found')

  const { error } = await supabase.from('volunteer_signups').insert({
    position_id: positionId,
    show_id: showId,
    family_id: fu.family_id,
    assigned_by: null,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/account/shows/${slug}/volunteers`)
  revalidatePath('/account')
}

export async function unclaimVolunteerPosition(signupId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('volunteer_signups').delete().eq('id', signupId)
  if (error) throw new Error(error.message)
  revalidatePath(`/account/shows/${slug}/volunteers`)
  revalidatePath('/account')
}
