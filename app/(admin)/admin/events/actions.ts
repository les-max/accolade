'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createShow(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = (formData.get('description') as string) || null
  const event_type = (formData.get('event_type') as string) || 'show'
  const audition_type = (formData.get('audition_type') as 'window' | 'slot') || null
  const age_min = formData.get('age_min') ? Number(formData.get('age_min')) : null
  const age_max = formData.get('age_max') ? Number(formData.get('age_max')) : null
  const parent_show_id = (formData.get('parent_show_id') as string) || null
  const venue_id = (formData.get('venue_id') as string) || null
  const season = formData.get('season') ? Number(formData.get('season')) : null

  const { error } = await supabase.from('shows').insert({
    title,
    slug,
    description,
    event_type,
    audition_type,
    age_min,
    age_max,
    parent_show_id,
    venue_id,
    season,
    status: 'draft',
    field_config: { custom_questions: [] },
  })

  if (error) throw new Error(error.message)

  redirect(`/admin/events/${slug}`)
}

export async function archiveShow(id: string, archived: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('shows').update({ archived }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteShow(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('shows').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
