'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPerformance(showId: string, slug: string, formData: FormData) {
  const supabase = await createClient()
  const type       = formData.get('type') as string
  const date       = formData.get('date') as string
  const start_time = formData.get('start_time') as string || null
  const label      = formData.get('label') as string || null
  const { error } = await supabase.from('show_performances').insert({ show_id: showId, type, date, start_time, label })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function updatePerformance(id: string, slug: string, formData: FormData) {
  const supabase = await createClient()
  const date       = formData.get('date') as string
  const start_time = formData.get('start_time') as string || null
  const label      = formData.get('label') as string || null
  const { error } = await supabase.from('show_performances').update({ date, start_time, label }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deletePerformance(id: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('show_performances').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function addShowEvent(showId: string, slug: string, formData: FormData) {
  const supabase = await createClient()
  const event_type = formData.get('event_type') as string
  const title      = formData.get('title') as string
  const date       = formData.get('date') as string
  const start_val  = formData.get('start_time') as string
  const end_val    = formData.get('end_time') as string
  const location   = (formData.get('location') as string) || null
  const notes      = (formData.get('notes') as string) || null

  const start_time = start_val ? `${date}T${start_val}:00` : `${date}T00:00:00`
  const end_time   = end_val   ? `${date}T${end_val}:00`   : null

  const { error } = await supabase.from('show_events').insert({
    show_id: showId, event_type, title, start_time, end_time, location, notes,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteShowEvent(id: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('show_events').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function addSlot(showId: string, formData: FormData) {
  const supabase = await createClient()

  const label = formData.get('label') as string
  const start_time = formData.get('start_time') as string || null
  const end_time = formData.get('end_time') as string || null
  const capacity = Number(formData.get('capacity')) || 10
  const waitlist_enabled = formData.get('waitlist_enabled') === 'true'

  const { error } = await supabase.from('audition_slots').insert({
    show_id: showId,
    label,
    start_time,
    end_time,
    capacity,
    waitlist_enabled,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/events/[slug]', 'page')
}

export async function updateSlot(slotId: string, slug: string, formData: FormData) {
  const supabase = await createClient()

  const label = formData.get('label') as string
  const start_time = formData.get('start_time') as string || null
  const end_time = formData.get('end_time') as string || null
  const capacity = Number(formData.get('capacity')) || 1
  const waitlist_enabled = formData.get('waitlist_enabled') === 'true'

  const { error } = await supabase.from('audition_slots').update({
    label,
    start_time,
    end_time,
    capacity,
    waitlist_enabled,
  }).eq('id', slotId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function setWaitlistForAllSlots(showId: string, slug: string, waitlist_enabled: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('audition_slots').update({ waitlist_enabled }).eq('show_id', showId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteSlot(slotId: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('audition_slots').delete().eq('id', slotId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function addRole(showId: string, roleName: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('show_roles').insert({ show_id: showId, role_name: roleName })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteRole(roleId: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('show_roles').delete().eq('id', roleId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function updateShowStatus(
  showId: string,
  status: 'draft' | 'active' | 'closed',
  slug: string
) {
  const supabase = await createClient()
  const { error } = await supabase.from('shows').update({ status }).eq('id', showId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function updateShowDetails(
  showId: string,
  slug: string,
  fields: {
    event_type: string
    start_date: string | null
    end_date: string | null
    featured: boolean
    parent_show_id?: string | null
    cta_label: string | null
    cta_url: string | null
    show_image: string | null
    show_image_wide: string | null
    past_shows_visible: boolean
    youtube_video_id: string | null
    audition_type?: string
    age_min?: number | null
    age_max?: number | null
    show_grade?: boolean
    show_headshot_upload?: boolean
    show_resume_upload?: boolean
    allow_crew_signup?: boolean
    crew_positions?: number | null
    venue_id?: string | null
    season?: number | null
  }
) {
  const supabase = await createClient()

  const { show_grade, show_headshot_upload, show_resume_upload, allow_crew_signup, crew_positions, ...coreFields } = fields
  const update: Record<string, unknown> = { ...coreFields }

  if (
    show_grade !== undefined || show_headshot_upload !== undefined ||
    show_resume_upload !== undefined || allow_crew_signup !== undefined || crew_positions !== undefined
  ) {
    const { data: existing } = await supabase
      .from('shows')
      .select('field_config')
      .eq('id', showId)
      .single()
    const existingConfig = (existing?.field_config as Record<string, unknown>) ?? {}
    update.field_config = {
      ...existingConfig,
      ...(show_grade !== undefined && { show_grade }),
      ...(show_headshot_upload !== undefined && { show_headshot_upload }),
      ...(show_resume_upload !== undefined && { show_resume_upload }),
      ...(allow_crew_signup !== undefined && { allow_crew_signup }),
      ...(crew_positions !== undefined && { crew_positions }),
    }
  }

  const { error } = await supabase.from('shows').update(update).eq('id', showId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export type CustomQuestion = {
  id: string
  label: string
  type: 'text' | 'textarea' | 'checkbox' | 'select'
  required: boolean
  options?: string[]
}

export async function updateCustomQuestions(slug: string, questions: CustomQuestion[]) {
  const supabase = await createClient()

  // Fetch existing field_config so we preserve show_grade / show_headshot_upload
  const { data: show } = await supabase
    .from('shows')
    .select('field_config')
    .eq('slug', slug)
    .single()

  const existing = (show?.field_config as Record<string, unknown>) ?? {}

  const { error } = await supabase
    .from('shows')
    .update({ field_config: { ...existing, custom_questions: questions } })
    .eq('slug', slug)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}
