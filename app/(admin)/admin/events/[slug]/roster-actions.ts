'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function searchFamiliesByName(query: string) {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const q = `%${query.trim()}%`

  // Search by parent name
  const { data: byParent } = await supabase
    .from('families')
    .select('id, parent_name, email, family_members(name)')
    .ilike('parent_name', q)
    .limit(8)

  // Search by child name — get matching family IDs first
  const { data: childRows } = await supabase
    .from('family_members')
    .select('family_id')
    .ilike('name', q)
    .limit(8)

  const childFamilyIds = [...new Set((childRows ?? []).map(c => c.family_id))]

  let byChild: Array<{ id: string; parent_name: string; email: string; family_members: Array<{ name: string }> }> = []
  if (childFamilyIds.length > 0) {
    const { data } = await supabase
      .from('families')
      .select('id, parent_name, email, family_members(name)')
      .in('id', childFamilyIds)
    byChild = (data ?? []) as typeof byChild
  }

  // Merge and deduplicate by family ID
  const seen = new Set<string>()
  const results: { id: string; parent_name: string; email: string; children: string[] }[] = []

  for (const fam of [...(byParent ?? []), ...byChild]) {
    if (seen.has(fam.id)) continue
    seen.add(fam.id)
    results.push({
      id: fam.id,
      parent_name: fam.parent_name,
      email: fam.email,
      children: (fam.family_members ?? []).map(m => m.name),
    })
  }

  return results.slice(0, 10)
}

export async function addShowMember(
  showId: string,
  slug: string,
  familyId: string,
  role: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('show_members').upsert(
    { show_id: showId, family_id: familyId, show_role: role },
    { onConflict: 'show_id,family_id' }
  )
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function removeShowMember(memberId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('show_members').delete().eq('id', memberId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}
