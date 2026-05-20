import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import VolunteerSignupForm from './VolunteerSignupForm'

export default async function VolunteersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fu } = await supabase.from('family_users').select('family_id').eq('user_id', user.id).single()
  if (!fu) redirect('/account/setup')

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, volunteers_published')
    .eq('slug', slug)
    .single()
  if (!show) notFound()
  if (!show.volunteers_published) notFound()

  // Verify this family has at least one member in this show
  const { data: membership } = await supabase
    .from('show_members')
    .select('id')
    .eq('show_id', show.id)
    .eq('family_id', fu.family_id)
    .limit(1)
    .maybeSingle()
  if (!membership) notFound()

  const { data: positions } = await supabase
    .from('volunteer_positions')
    .select('id, name, description, capacity, position_type')
    .eq('show_id', show.id)
    .order('sort_order')

  const positionIds = (positions ?? []).map(p => p.id)

  // Count signups per position + check if this family has already signed up
  const [{ data: allSignupCounts }, { data: mySignups }] = await Promise.all([
    positionIds.length > 0
      ? supabase.from('volunteer_signups').select('position_id').in('position_id', positionIds)
      : Promise.resolve({ data: [] }),
    positionIds.length > 0
      ? supabase.from('volunteer_signups').select('id, position_id').in('position_id', positionIds).eq('family_id', fu.family_id)
      : Promise.resolve({ data: [] }),
  ])

  const countByPosition = new Map<string, number>()
  for (const s of (allSignupCounts ?? [])) {
    countByPosition.set(s.position_id, (countByPosition.get(s.position_id) ?? 0) + 1)
  }
  const mySignupByPosition = new Map<string, string>()
  for (const s of (mySignups ?? [])) {
    mySignupByPosition.set(s.position_id, s.id)
  }

  const enrichedPositions = (positions ?? []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    capacity: p.capacity,
    position_type: p.position_type as 'open' | 'assigned',
    signupCount: countByPosition.get(p.id) ?? 0,
    mySignupId: mySignupByPosition.get(p.id) ?? null,
  }))

  return (
    <section style={{ padding: 'clamp(40px, 8vw, 72px) clamp(20px, 5vw, 48px)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link
          href="/account"
          style={{ fontSize: '0.75rem', color: 'var(--muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}
        >
          ← My Account
        </Link>

        <p style={{ fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
          {show.title}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '8px' }}>
          Volunteer Opportunities
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '40px' }}>
          Claim an open position below. You can remove yourself at any time before the show.
        </p>

        <VolunteerSignupForm
          showId={show.id}
          showSlug={slug}
          positions={enrichedPositions}
        />
      </div>
    </section>
  )
}
