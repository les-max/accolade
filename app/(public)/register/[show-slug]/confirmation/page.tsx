import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function RegistrationConfirmationPage({
  params,
}: {
  params: Promise<{ 'show-slug': string }>
}) {
  const { 'show-slug': slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>
        Registration Confirmed
      </p>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '0.04em', marginBottom: '8px' }}>
        You're in!
      </h1>
      <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '32px' }}>
        We'll see you at {show.title}. Check your email for a confirmation.
      </p>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7 }}>
          Have a family account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Sign in</Link>.{' '}
          New here?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Create an account</Link>.
        </p>
      </div>
    </div>
  )
}
