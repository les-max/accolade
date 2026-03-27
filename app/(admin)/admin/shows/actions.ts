'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createShow(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const audition_type = formData.get('audition_type') as 'window' | 'slot'
  const age_min = formData.get('age_min') ? Number(formData.get('age_min')) : null
  const age_max = formData.get('age_max') ? Number(formData.get('age_max')) : null
  const show_image = formData.get('show_image') as string || null
  const show_grade = formData.get('show_grade') === 'true'
  const show_headshot_upload = formData.get('show_headshot_upload') === 'true'

  const { error } = await supabase.from('shows').insert({
    title,
    slug,
    description,
    audition_type,
    age_min,
    age_max,
    show_image,
    status: 'draft',
    field_config: {
      show_grade,
      show_headshot_upload,
      custom_questions: [],
    },
  })

  if (error) throw new Error(error.message)

  redirect(`/admin/shows/${slug}`)
}
