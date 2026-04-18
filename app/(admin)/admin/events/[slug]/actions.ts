'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    homepage_visible: boolean
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
  }
) {
  const supabase = await createClient()

  const { show_grade, show_headshot_upload, ...coreFields } = fields
  const update: Record<string, unknown> = { ...coreFields }

  if (show_grade !== undefined || show_headshot_upload !== undefined) {
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
