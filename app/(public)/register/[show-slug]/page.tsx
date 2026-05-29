import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RegisterForm from './RegisterForm'

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ 'show-slug': string }>
}) {
  const { 'show-slug': slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, status, registration_capacity')
    .eq('slug', slug)
    .single()

  if (!show || show.status !== 'active') notFound()

  const capacity = (show as unknown as { registration_capacity: number | null }).registration_capacity

  let seatsRemaining: number | null = null
  if (capacity !== null) {
    const { data: rows } = await supabase
      .from('show_registrations')
      .select('party_size')
      .eq('show_id', show.id)

    const claimed = (rows ?? []).reduce((acc, r) => acc + (r.party_size ?? 0), 0)
    seatsRemaining = Math.max(0, capacity - claimed)
  }

  const isFull = seatsRemaining !== null && seatsRemaining === 0

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '80px 24px 48px' }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '0.04em', marginBottom: '8px' }}>
        {show.title}
      </h1>
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '32px' }}>
        Registration
      </p>

      {isFull ? (
        <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.7 }}>
          Registration for this event is now full.
        </p>
      ) : (
        <RegisterForm showId={show.id} slug={slug} seatsRemaining={seatsRemaining} />
      )}
    </div>
  )
}
