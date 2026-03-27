'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getFamily() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: family } = await supabase.from('families').select('id').eq('user_id', user.id).single()
  if (!family) redirect('/account/setup')
  return { supabase, family }
}

export async function addFamilyMember(formData: FormData) {
  const { supabase, family } = await getFamily()

  const { error } = await supabase.from('family_members').insert({
    family_id: family.id,
    name:      formData.get('name') as string,
    age:       formData.get('age') ? Number(formData.get('age')) : null,
    grade:     formData.get('grade') as string || null,
    gender:    formData.get('gender') as string || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/account/family')
  revalidatePath('/account')
}

export async function updateFamilyMember(memberId: string, formData: FormData) {
  const { supabase } = await getFamily()

  const { error } = await supabase.from('family_members').update({
    name:   formData.get('name') as string,
    age:    formData.get('age') ? Number(formData.get('age')) : null,
    grade:  formData.get('grade') as string || null,
    gender: formData.get('gender') as string || null,
  }).eq('id', memberId)

  if (error) throw new Error(error.message)
  revalidatePath('/account/family')
  revalidatePath('/account')
}

export async function deleteFamilyMember(memberId: string) {
  const { supabase } = await getFamily()
  const { error } = await supabase.from('family_members').delete().eq('id', memberId)
  if (error) throw new Error(error.message)
  revalidatePath('/account/family')
  revalidatePath('/account')
}

export async function updateFamilyContact(formData: FormData) {
  const { supabase, family } = await getFamily()

  const { error } = await supabase.from('families').update({
    parent_name:   formData.get('parent_name') as string,
    phone:         formData.get('phone') as string || null,
    gender:        formData.get('gender') as string || null,
    spouse_name:   formData.get('spouse_name') as string || null,
    spouse_email:  formData.get('spouse_email') as string || null,
    spouse_phone:  formData.get('spouse_phone') as string || null,
    spouse_gender: formData.get('spouse_gender') as string || null,
  }).eq('id', family.id)

  if (error) throw new Error(error.message)
  revalidatePath('/account/family')
  revalidatePath('/account')
}
