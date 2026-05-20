'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ImportRow = {
  auditioner_name: string
  auditioner_age: number | null
  auditioner_grade: string | null
  parent_name: string | null
  parent_email: string
  parent_phone: string | null
}

export async function importAuditioners(showSlug: string, rows: ImportRow[]) {
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id')
    .eq('slug', showSlug)
    .single()

  if (!show) return { error: 'Show not found.' }

  const records = rows.map(row => ({
    show_id: show.id,
    auditioner_name: row.auditioner_name,
    auditioner_age: row.auditioner_age,
    auditioner_grade: row.auditioner_grade,
    parent_name: row.parent_name,
    parent_email: row.parent_email,
    parent_phone: row.parent_phone,
    status: 'registered' as const,
    is_adult: false,
    accept_other_roles: true,
  }))

  const { error } = await supabase.from('auditions').insert(records)
  if (error) return { error: error.message }

  revalidatePath(`/admin/events/${showSlug}/registrations`)
  return { success: true, count: records.length }
}
