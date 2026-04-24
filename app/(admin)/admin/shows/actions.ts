'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const title            = formData.get('title') as string
  const slug             = formData.get('slug') as string
  const description      = formData.get('description') as string
  const event_type       = formData.get('event_type') as string || 'show'
  const start_date       = formData.get('start_date') as string || null
  const end_date         = formData.get('end_date') as string || null
  const show_image       = formData.get('show_image') as string || null
  const show_image_wide  = formData.get('show_image_wide') as string || null
  const featured         = formData.get('featured') === 'true'
  const homepage_visible = formData.get('homepage_visible') === 'true'
  const cta_label        = formData.get('cta_label') as string || null
  const cta_url          = formData.get('cta_url') as string || null

  const { error } = await supabase.from('shows').insert({
    title, slug, description, event_type,
    start_date, end_date, show_image, show_image_wide,
    featured, homepage_visible, cta_label, cta_url,
    status: 'draft',
    field_config: { show_grade: false, show_headshot_upload: false, custom_questions: [] },
  })

  if (error) throw new Error(error.message)

  const { data: show } = await supabase.from('shows').select('id').eq('slug', slug).single()
  if (show) {
    const performances = JSON.parse((formData.get('performances') as string) || '[]')
    if (performances.length > 0) {
      await supabase.from('show_performances').insert(
        performances.map((p: { type: string; date: string; start_time: string; label: string }) => ({
          show_id:    show.id,
          type:       p.type,
          date:       p.date,
          start_time: p.start_time || null,
          label:      p.label || null,
        }))
      )
    }
  }

  redirect('/admin/shows')
}
