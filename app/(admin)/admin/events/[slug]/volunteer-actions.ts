'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type VolunteerPosition = {
  id: string
  show_id: string
  name: string
  description: string | null
  capacity: number
  position_type: 'open' | 'assigned'
  sort_order: number
}

export type VolunteerSignup = {
  id: string
  position_id: string
  family_id: string
  assigned_by: string | null
  created_at: string
  families: { parent_name: string; email: string } | null
}

export async function createVolunteerPosition(
  showId: string,
  slug: string,
  data: { name: string; description: string; capacity: number; position_type: 'open' | 'assigned' }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existing } = await supabase
    .from('volunteer_positions')
    .select('sort_order')
    .eq('show_id', showId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sort_order = existing ? existing.sort_order + 1 : 0

  const { error } = await supabase.from('volunteer_positions').insert({
    show_id: showId,
    name: data.name,
    description: data.description || null,
    capacity: data.capacity,
    position_type: data.position_type,
    sort_order,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function updateVolunteerPosition(
  positionId: string,
  slug: string,
  data: { name: string; description: string; capacity: number; position_type: 'open' | 'assigned' }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('volunteer_positions').update({
    name: data.name,
    description: data.description || null,
    capacity: data.capacity,
    position_type: data.position_type,
  }).eq('id', positionId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteVolunteerPosition(positionId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('volunteer_positions').delete().eq('id', positionId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function setVolunteersPublished(showId: string, slug: string, published: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('shows').update({ volunteers_published: published }).eq('id', showId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function assignVolunteer(
  positionId: string,
  showId: string,
  familyId: string,
  slug: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!admin) throw new Error('Unauthorized')

  const { error } = await supabase.from('volunteer_signups').upsert({
    position_id: positionId,
    show_id: showId,
    family_id: familyId,
    assigned_by: admin.id,
  }, { onConflict: 'position_id,family_id' })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function removeVolunteerSignup(signupId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('volunteer_signups').delete().eq('id', signupId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}
