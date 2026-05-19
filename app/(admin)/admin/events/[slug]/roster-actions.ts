'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PersonSearchResult = {
  family_member_id: string | null
  family_id: string | null
  name: string
  subtitle: string
}

export async function searchPeopleByName(query: string): Promise<PersonSearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const q = `%${query.trim()}%`

  const [{ data: members }, { data: parents }] = await Promise.all([
    supabase.from('family_members').select('id, name, family_id, age, grade').ilike('name', q).limit(8),
    supabase.from('families').select('id, parent_name, email').ilike('parent_name', q).limit(6),
  ])

  const results: PersonSearchResult[] = []

  for (const m of (members ?? [])) {
    const parts = [m.age && `Age ${m.age}`, m.grade && `Gr. ${m.grade}`].filter(Boolean)
    results.push({
      family_member_id: m.id,
      family_id: m.family_id,
      name: m.name,
      subtitle: parts.length ? parts.join(' · ') : 'Student',
    })
  }

  for (const p of (parents ?? [])) {
    results.push({
      family_member_id: null,
      family_id: p.id,
      name: p.parent_name,
      subtitle: 'Adult / Parent account',
    })
  }

  return results.slice(0, 10)
}

export async function addShowMember(
  showId: string,
  slug: string,
  entry: {
    person_name: string
    family_id: string | null
    family_member_id: string | null
    show_role: string
    show_part?: string
    email?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('show_members').insert({
    show_id: showId,
    family_id: entry.family_id,
    family_member_id: entry.family_member_id,
    person_name: entry.person_name,
    show_role: entry.show_role,
    show_part: entry.show_part || null,
    email: entry.email || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function addShowMembersFromAuditions(
  showId: string,
  slug: string,
  entries: Array<{
    person_name: string
    family_id: string | null
    family_member_id: string | null
    show_role: string
  }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const rows = entries.map(e => ({
    show_id: showId,
    family_id: e.family_id,
    family_member_id: e.family_member_id,
    person_name: e.person_name,
    show_role: e.show_role,
    show_part: null,
  }))

  const { error } = await supabase.from('show_members').insert(rows)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function addShowMembersFromCSV(
  showId: string,
  slug: string,
  entries: Array<{
    person_name: string
    show_role: string
    show_part: string | null
    email: string | null
  }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const rows = entries.map(e => ({
    show_id: showId,
    family_id: null,
    family_member_id: null,
    person_name: e.person_name,
    show_role: e.show_role,
    show_part: e.show_part || null,
    email: e.email || null,
  }))

  const { error } = await supabase.from('show_members').insert(rows)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function updateShowMemberPart(memberId: string, slug: string, show_part: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('show_members').update({ show_part: show_part || null }).eq('id', memberId)
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
