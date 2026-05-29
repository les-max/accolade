import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getShowRole } from '@/lib/staff'

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, registration_capacity')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  const role = await getShowRole(show.id)
  if (!role) redirect('/admin/events')

  const service = createServiceClient()
  const { data: registrations } = await service
    .from('show_registrations')
    .select('id, name, email, party_size, created_at')
    .eq('show_id', show.id)
    .order('created_at', { ascending: false })

  const rows = registrations ?? []
  const totalClaimed = rows.reduce((acc, r) => acc + (r.party_size ?? 0), 0)
  const capacity = (show as unknown as { registration_capacity: number | null }).registration_capacity

  const summaryText = capacity !== null
    ? `${totalClaimed} of ${capacity} seats claimed`
    : `${totalClaimed} seat${totalClaimed === 1 ? '' : 's'} claimed — no cap set`

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href={`/admin/events/${slug}`} style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← {show.title}
        </Link>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.04em', lineHeight: 1, marginBottom: '8px' }}>
          Registrations
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{summaryText}</p>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No registrations yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Email', 'Party', 'Registered'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--warm-white)' }}>{r.name}</td>
                <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{r.email}</td>
                <td style={{ padding: '10px 12px', color: 'var(--warm-white)', textAlign: 'center' }}>{r.party_size}</td>
                <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
