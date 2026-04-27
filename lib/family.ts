import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

/**
 * Looks up the family_id for a given auth user via the family_users join table.
 * Redirects to /account/setup if the user has no family.
 */
export async function resolveFamily(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: fu } = await supabase
    .from('family_users')
    .select('family_id')
    .eq('user_id', userId)
    .single()
  if (!fu) redirect('/account/setup')
  return fu.family_id
}
