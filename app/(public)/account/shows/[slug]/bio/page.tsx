import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import BioForm from './BioForm'

export default async function BioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!family) redirect('/account/setup')

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  const [{ data: members }, { data: existingBios }] = await Promise.all([
    supabase
      .from('family_members')
      .select('id, name, grade')
      .eq('family_id', family.id)
      .order('name'),
    supabase
      .from('show_bios')
      .select('family_member_id, first_name, last_name, role, age, grade, bio')
      .eq('show_id', show.id)
      .eq('family_id', family.id),
  ])

  const bioByMember = Object.fromEntries(
    (existingBios ?? []).map(b => [b.family_member_id, b])
  )

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href="/account"
          style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
        >
          ← Dashboard
        </Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
          Playbill Bio
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
          {show.title} — submit a bio for each cast or crew member in your family.
        </p>
      </div>

      {(members ?? []).length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
          No family members found.{' '}
          <Link href="/account/family" style={{ color: 'var(--gold)' }}>Add family members</Link> first.
        </p>
      ) : (
        (members ?? []).map(member => (
          <BioForm
            key={member.id}
            showId={show.id}
            slug={slug}
            member={member}
            existing={bioByMember[member.id] ?? null}
          />
        ))
      )}
    </div>
  )
}
