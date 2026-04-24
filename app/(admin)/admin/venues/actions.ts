'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createVenue(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('venues').insert({
    name:    formData.get('name') as string,
    address: (formData.get('address') as string) || null,
    city:    (formData.get('city') as string) || null,
    state:   (formData.get('state') as string) || null,
    zip:     (formData.get('zip') as string) || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/venues')
}

export async function updateVenue(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('venues').update({
    name:    formData.get('name') as string,
    address: (formData.get('address') as string) || null,
    city:    (formData.get('city') as string) || null,
    state:   (formData.get('state') as string) || null,
    zip:     (formData.get('zip') as string) || null,
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/venues')
}

export async function deleteVenue(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('venues').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/venues')
}
