import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FamilyManager from './FamilyManager'

export const metadata = { title: 'My Family — Accolade Community Theatre' }

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fu } = await supabase.from('family_users').select('family_id').eq('user_id', user.id).single()
  if (!fu) redirect('/account/setup')

  const { data: family } = await supabase
    .from('families')
    .select('*, family_members(*)')
    .eq('id', fu.family_id)
    .single()

  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const showGradePrompt = (month === 6 && day >= 1) || month === 7 || month === 8

  return (
    <section style={{ padding: 'clamp(40px, 8vw, 72px) clamp(20px, 5vw, 48px)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
          My Account
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: '40px' }}>
          My Family
        </h1>
        <FamilyManager family={family} members={family.family_members ?? []} showGradePrompt={showGradePrompt} />
      </div>
    </section>
  )
}
