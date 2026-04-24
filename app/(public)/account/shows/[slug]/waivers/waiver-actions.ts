'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type WaiverType = 'liability' | 'photo_video'

export type WaiverResult =
  | { success: true }
  | { success: false; error: string }

export async function signWaiver(
  showId: string,
  slug: string,
  waiverType: WaiverType,
  signature: string
): Promise<WaiverResult> {
  if (!signature.trim()) return { success: false, error: 'Signature is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not signed in' }

  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!family) return { success: false, error: 'Family not found' }

  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'

  const { error } = await supabase.from('show_waivers').insert({
    show_id: showId,
    family_id: family.id,
    waiver_type: waiverType,
    signature: signature.trim(),
    signed_at: new Date().toISOString(),
    ip_address: ip,
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Already signed' }
    return { success: false, error: error.message }
  }

  revalidatePath(`/account/shows/${slug}/waivers`)
  return { success: true }
}
