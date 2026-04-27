import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountNav from './AccountNav'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/account')

  const [{ data: fu }, { data: adminUser }] = await Promise.all([
    supabase.from('family_users').select('family_id').eq('user_id', user.id).single(),
    supabase.from('admin_users').select('id').eq('user_id', user.id).single(),
  ])

  const BOOTSTRAP_EMAILS = ['les@lesbrowndesign.com']
  const isAdmin = !!adminUser || BOOTSTRAP_EMAILS.includes(user.email ?? '')

  return (
    <div style={{ paddingTop: '80px' }}>
      <AccountNav hasFamily={!!fu} isAdmin={isAdmin} />
      {children}
    </div>
  )
}
