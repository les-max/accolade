'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { resolveFamily } from '@/lib/family'
import { sendSpouseInvite } from '@/lib/email/invite-emails'

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

  const newSpouseEmail = (formData.get('spouse_email') as string || '').toLowerCase() || null
  const parentName = formData.get('parent_name') as string
  const spouseName = formData.get('spouse_name') as string || null

  const { data: existing } = await supabase
    .from('families')
    .select('spouse_email, parent_name')
    .eq('id', family.id)
    .single()

  const { error } = await supabase.from('families').update({
    parent_name:   parentName,
    phone:         formData.get('phone') as string || null,
    gender:        formData.get('gender') as string || null,
    spouse_name:   spouseName,
    spouse_email:  newSpouseEmail,
    spouse_phone:  formData.get('spouse_phone') as string || null,
    spouse_gender: formData.get('spouse_gender') as string || null,
  }).eq('id', family.id)

  if (error) throw new Error(error.message)

  const oldSpouseEmail = existing?.spouse_email?.toLowerCase() ?? null
  if (newSpouseEmail && newSpouseEmail !== oldSpouseEmail) {
    await sendFamilyInvite({ familyId: family.id, spouseEmail: newSpouseEmail, spouseName, invitedByName: parentName })
  }

  revalidatePath('/account/family')
  revalidatePath('/account')
}

async function sendFamilyInvite({
  familyId,
  spouseEmail,
  spouseName,
  invitedByName,
}: {
  familyId: string
  spouseEmail: string
  spouseName: string | null
  invitedByName: string
}) {
  const service = createServiceClient()

  // Clear any prior unaccepted invites for this email+family, then insert fresh
  await service.from('family_invites')
    .delete()
    .eq('family_id', familyId)
    .eq('email', spouseEmail)
    .is('accepted_at', null)

  await service.from('family_invites').insert({ family_id: familyId, email: spouseEmail })

  const { data: linkData } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: spouseEmail,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })

  if (linkData?.properties?.action_link) {
    await sendSpouseInvite({
      spouseEmail,
      spouseName,
      invitedByName,
      magicLink: linkData.properties.action_link,
    })
  }
}
