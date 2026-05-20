import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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

  const service = createServiceClient()

  const [{ data: fu }, { data: adminUser }] = await Promise.all([
    service.from('family_users').select('family_id').eq('user_id', user.id).maybeSingle(),
    service.from('admin_users').select('id').eq('user_id', user.id).single(),
  ])

  // Auto-link: email+password sign-ins skip /auth/callback, so family_users may not exist yet.
  // If missing, try to match by invite or by family email — same logic as the callback.
  let hasFamily = !!fu
  if (!fu && user.email) {
    const email = user.email.toLowerCase()

    const { data: invite } = await service
      .from('family_invites')
      .select('id, family_id')
      .eq('email', email)
      .is('accepted_at', null)
      .order('invited_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (invite) {
      await service.from('family_users').insert({ family_id: invite.family_id, user_id: user.id, name: '' })
      await service.from('family_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)
      hasFamily = true
    } else {
      const { data: matchedFamily } = await service
        .from('families')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (matchedFamily) {
        await service.from('family_users').insert({ family_id: matchedFamily.id, user_id: user.id, name: '' })
        hasFamily = true
      }
    }
  }

  const BOOTSTRAP_EMAILS = ['les@lesbrowndesign.com']
  const isAdmin = !!adminUser || BOOTSTRAP_EMAILS.includes(user.email ?? '')

  return (
    <div style={{ paddingTop: '80px' }}>
      <AccountNav hasFamily={hasFamily} isAdmin={isAdmin} />
      {children}
    </div>
  )
}
