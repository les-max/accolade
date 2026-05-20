import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import SetupForm from './SetupForm'

export const metadata = { title: 'Set Up Your Account — Accolade Community Theatre' }

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client for all remaining checks to bypass any RLS ambiguity
  const service = createServiceClient()

  // Already has a profile — skip setup (service client avoids RLS false-negatives)
  const { data: existingFu } = await service.from('family_users').select('family_id').eq('user_id', user.id).maybeSingle()
  if (existingFu) redirect('/account')

  // Auto-link: if email matches a pending invite or existing family, link silently
  if (user.email) {
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
      await service.from('family_users').upsert({ family_id: invite.family_id, user_id: user.id, name: '' }, { onConflict: 'user_id' })
      await service.from('family_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)
      redirect('/account')
    }

    const { data: matchedFamily } = await service
      .from('families')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (matchedFamily) {
      await service.from('family_users').upsert({ family_id: matchedFamily.id, user_id: user.id, name: '' }, { onConflict: 'user_id' })
      redirect('/account')
    }
  }

  return (
    <section style={{ padding: 'clamp(48px, 8vw, 80px) clamp(20px, 5vw, 48px)' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>
          Welcome
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: '12px' }}>
          Set up your account
        </h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '40px' }}>
          Just a few details to get started. You can add your children and manage registrations from your dashboard.
        </p>
        <SetupForm email={user.email ?? ''} />
      </div>
    </section>
  )
}
