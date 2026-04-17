'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadEventImage(file: File): Promise<string> {
  const supabase = await createClient()

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('event-images')
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('event-images').getPublicUrl(filename)
  return data.publicUrl
}
