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

// Appends the America/Chicago UTC offset so Postgres stores the correct UTC value.
function toCentralISO(date: string, time: string | null): string {
  const t = time || '00:00'
  const sample = new Date(`${date}T18:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    timeZoneName: 'shortOffset',
  }).formatToParts(sample)
  const tz = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT-6'
  // tz is "GMT-5" (CDT) or "GMT-6" (CST)
  const match = tz.match(/GMT([+-])(\d+)/)
  const sign  = match?.[1] ?? '-'
  const hours = (match?.[2] ?? '6').padStart(2, '0')
  return `${date}T${t}:00${sign}${hours}:00`
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

  const start_time = toCentralISO(date, start_val || null)
  const end_time   = end_val ? toCentralISO(date, end_val) : null

  const { error } = await supabase.from('show_events').insert({
    show_id: showId, event_type, title, start_time, end_time, location, notes,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function bulkAddShowEvents(
  showId: string,
  slug: string,
  events: Array<{
    event_type: string
    title: string
    date: string
    start_val: string
    end_val: string
    location: string | null
    notes: string | null
  }>
) {
  const supabase = await createClient()
  const rows = events.map(e => ({
    show_id:    showId,
    event_type: e.event_type,
    title:      e.title,
    start_time: toCentralISO(e.date, e.start_val || null),
    end_time:   e.end_val ? toCentralISO(e.date, e.end_val) : null,
    location:   e.location,
    notes:      e.notes,
  }))
  const { error } = await supabase.from('show_events').insert(rows)
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
    audition_announcement?: string | null
    venue_id?: string | null
    season?: number | null
  }
) {
  const supabase = await createClient()

  const { show_grade, show_headshot_upload, show_resume_upload, allow_crew_signup, crew_positions, audition_announcement, ...coreFields } = fields
  const update: Record<string, unknown> = { ...coreFields }

  if (
    show_grade !== undefined || show_headshot_upload !== undefined ||
    show_resume_upload !== undefined || allow_crew_signup !== undefined ||
    crew_positions !== undefined || audition_announcement !== undefined
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
      ...(audition_announcement !== undefined && { audition_announcement }),
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
