'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type BioResult =
  | { success: true }
  | { success: false; error: string }

export async function submitBio(
  showId: string,
  slug: string,
  familyMemberId: string,
  data: {
    first_name: string
    last_name: string
    role: string
    age: number
    grade: string
    bio: string
  }
): Promise<BioResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not signed in' }

  const { data: fu } = await supabase.from('family_users').select('family_id').eq('user_id', user.id).single()
  if (!fu) return { success: false, error: 'Family not found' }
  const family = { id: fu.family_id }

  const { error } = await supabase.from('show_bios').upsert(
    {
      show_id: showId,
      family_id: family.id,
      family_member_id: familyMemberId,
      ...data,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'show_id,family_member_id' }
  )

  if (error) return { success: false, error: error.message }
  revalidatePath(`/account/shows/${slug}/bio`)
  return { success: true }
}
