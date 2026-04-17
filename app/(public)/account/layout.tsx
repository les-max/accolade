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

  // Check if family profile exists — if not, redirect to setup (unless already there)
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return (
    <div style={{ paddingTop: '80px' }}>
      <AccountNav hasFamily={!!family} />
      {children}
    </div>
  )
}
