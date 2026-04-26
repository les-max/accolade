import { createClient } from '@/lib/supabase/server'

export type StaffRole = 'admin' | 'director' | 'production_manager'

export interface SessionStaff {
  adminUserId: string
  orgRole: StaffRole
}

export async function getSessionStaff(): Promise<SessionStaff | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!data) return null
  return { adminUserId: data.id, orgRole: data.role as StaffRole }
}

export async function getShowRole(showId: string): Promise<StaffRole | null> {
  const supabase = await createClient()
  const staff = await getSessionStaff()
  if (!staff) return null
  if (staff.orgRole === 'admin') return 'admin'

  const { data: assignment } = await supabase
    .from('show_staff')
    .select('role')
    .eq('show_id', showId)
    .eq('admin_user_id', staff.adminUserId)
    .single()

  if (!assignment) return null
  return assignment.role as StaffRole
}
