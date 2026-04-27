'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { resolveFamily } from '@/lib/family'

async function getFamily() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const familyId = await resolveFamily(supabase, user.id)
  return { supabase, family: { id: familyId } }
}

export async function addFamilyMember(formData: FormData) {
  const { supabase, family } = await getFamily()

  const { error } = await supabase.from('family_members').insert({
    family_id: family.id,
    name:      formData.get('name') as string,
    birthdate: formData.get('birthdate') as string || null,
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
    name:      formData.get('name') as string,
    birthdate: formData.get('birthdate') as string || null,
    grade:     formData.get('grade') as string || null,
    gender:    formData.get('gender') as string || null,
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

export async function inviteCoParent(formData: FormData): Promise<{ error?: string }> {
  const { family } = await getFamily()
  const email = formData.get('email') as string
  const name  = (formData.get('name') as string) || ''

  if (!email) return { error: 'Email is required' }

  const service = createServiceClient()
  const { error } = await service.auth.admin.inviteUserByEmail(email, {
    data: {
      name,
      family_id:           family.id,
      invited_as_co_parent: true,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  })

  if (error) return { error: error.message }
  revalidatePath('/account/family')
  return {}
}
