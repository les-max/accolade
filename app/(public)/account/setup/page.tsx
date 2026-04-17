import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SetupForm from './SetupForm'

export const metadata = { title: 'Set Up Your Account — Accolade Community Theatre' }

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Already has a profile — skip setup
  const { data: family } = await supabase.from('families').select('id').eq('user_id', user.id).single()
  if (family) redirect('/account')

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
