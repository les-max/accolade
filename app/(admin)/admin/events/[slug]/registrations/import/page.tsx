import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ImportForm from './ImportForm'

export default async function ImportAuditionersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  return (
    <div style={{ maxWidth: '800px' }}>
      <Link
        href={`/admin/events/${slug}/registrations`}
        style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
      >
        ← Registrations
      </Link>

      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
        Import Auditioners
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '40px' }}>
        {show.title}
      </p>

      <ImportForm slug={slug} />
    </div>
  )
}
