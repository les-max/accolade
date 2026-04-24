'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function invitePortalUser(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!adminUser) throw new Error('Unauthorized')

  const email      = formData.get('email') as string
  const name       = formData.get('name') as string
  const phone      = (formData.get('phone') as string) || null
  const show_id    = (formData.get('show_id') as string) || null
  const show_role  = (formData.get('show_role') as string) || 'parent'
  const portal_role = (formData.get('portal_role') as string) || 'user'

  const service = createServiceClient()
  const { error } = await service.auth.admin.inviteUserByEmail(email, {
    data: { name, phone, show_id, show_role, portal_role, invited_by_admin: true },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function removePortalUser(familyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!adminUser) throw new Error('Unauthorized')

  const service = createServiceClient()

  // Get user_id from families before deleting
  const { data: family } = await service
    .from('families')
    .select('user_id')
    .eq('id', familyId)
    .single()

  if (family?.user_id) {
    await service.auth.admin.deleteUser(family.user_id)
  }

  revalidatePath('/admin/users')
}
