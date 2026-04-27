'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createFamilyProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parent_name   = formData.get('parent_name') as string
  const phone         = formData.get('phone') as string || null
  const gender        = formData.get('gender') as string || null
  const spouse_name   = formData.get('spouse_name') as string || null
  const spouse_email  = formData.get('spouse_email') as string || null
  const spouse_phone  = formData.get('spouse_phone') as string || null
  const spouse_gender = formData.get('spouse_gender') as string || null

  const { data: family, error } = await supabase.from('families').insert({
    user_id: user.id,
    email:   user.email!,
    parent_name,
    phone,
    gender,
    spouse_name,
    spouse_email,
    spouse_phone,
    spouse_gender,
  }).select('id').single()

  if (error) throw new Error(error.message)

  await supabase.from('family_users').insert({
    family_id: family.id,
    user_id:   user.id,
    name:      parent_name,
  })

  redirect('/account/family')
}
