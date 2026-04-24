import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EmailComposer from './EmailComposer'

export default async function CommunicationsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, event_type')
    .eq('slug', slug)
    .single()

  if (!show || show.event_type !== 'show') notFound()

  const { data: members } = await supabase
    .from('show_members')
    .select('show_role')
    .eq('show_id', show.id)

  const countByRole: Record<string, number> = {}
  for (const m of members ?? []) {
    countByRole[m.show_role] = (countByRole[m.show_role] ?? 0) + 1
  }
  const memberGroups = Object.entries(countByRole).map(([label, count]) => ({ label, count }))

  const { count: auditionerCount } = await supabase
    .from('auditions')
    .select('id', { count: 'exact', head: true })
    .eq('show_id', show.id)
    .in('status', ['registered', 'waitlisted'])

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href={`/admin/events/${slug}`}
          style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
        >
          ← {show.title}
        </Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>
          Communications
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '8px' }}>
          Send an email to any group of participants for {show.title}.
        </p>
      </div>

      <EmailComposer
        showId={show.id}
        showTitle={show.title}
        memberGroups={memberGroups}
        auditionerCount={auditionerCount ?? 0}
      />
    </div>
  )
}
