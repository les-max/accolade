// app/(admin)/admin/sponsors/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function uploadSponsorLogo(file: File): Promise<string> {
  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'bin'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('sponsor-logos')
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(filename)
  return data.publicUrl
}

export async function addSponsor(formData: FormData) {
  const supabase = await createClient()

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) throw new Error('Logo image is required')

  const logo_url = await uploadSponsorLogo(file)
  const name = (formData.get('name') as string).trim()
  if (!name) throw new Error('Sponsor name is required')
  const website_url = (formData.get('website_url') as string).trim() || null
  const sort_order = parseInt(formData.get('sort_order') as string, 10) || 0

  const { error } = await supabase.from('sponsors').insert({ name, logo_url, website_url, sort_order })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/sponsors')
  revalidatePath('/')
}

export async function toggleSponsorActive(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('sponsors').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/sponsors')
  revalidatePath('/')
}

export async function deleteSponsor(id: string) {
  const supabase = await createClient()

  // Fetch logo_url so we can remove the file from storage
  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('logo_url')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) throw new Error(error.message)

  // Remove logo from storage (best-effort, don't block on failure)
  if (sponsor?.logo_url) {
    const filename = sponsor.logo_url.split('/').pop()
    if (filename) {
      await supabase.storage.from('sponsor-logos').remove([filename])
    }
  }

  revalidatePath('/admin/sponsors')
  revalidatePath('/')
}
