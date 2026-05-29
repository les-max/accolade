import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getShowRole } from '@/lib/staff'
import RegistrationsTable from './RegistrationsTable'

export default async function RegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ slot?: string; status?: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, status, event_type, registration_capacity')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  // ── Event-type branch: show_registrations ────────────────────────────────
  if ((show as unknown as { event_type: string | null }).event_type === 'event') {
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

  // ── Audition / camp / workshop branch ────────────────────────────────────
  const { slot: slotFilter, status: statusFilter } = await searchParams

  const { data: slots } = await supabase
    .from('audition_slots')
    .select('id, label')
    .eq('show_id', show.id)
    .order('start_time', { ascending: true })

  let query = supabase
    .from('auditions')
    .select('*, audition_slots(label)')
    .eq('show_id', show.id)
    .order('created_at', { ascending: true })

  if (slotFilter) query = query.eq('slot_id', slotFilter)
  if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter)

  const { data: registrations } = await query

  const allRegs = registrations ?? []
  const counts = {
    registered: allRegs.filter(r => r.status === 'registered').length,
    waitlisted: allRegs.filter(r => r.status === 'waitlisted').length,
    cancelled:  allRegs.filter(r => r.status === 'cancelled').length,
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href={`/admin/events/${slug}`} style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← {show.title}
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>
            Registrations
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href={`/admin/events/${slug}/registrations/import`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--muted)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}
            >
              Import CSV
            </Link>
            <a
              href={`/api/admin/events/${slug}/registrations/export?slot=${slotFilter ?? ''}&status=${statusFilter ?? ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}
            >
              Export CSV
            </a>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Registered', count: counts.registered, color: 'var(--gold)' },
          { label: 'Waitlisted', count: counts.waitlisted, color: 'var(--teal)' },
          { label: 'Cancelled',  count: counts.cancelled,  color: 'var(--muted)' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px 24px' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color }}>{count}</p>
          </div>
        ))}
      </div>

      <RegistrationsTable
        registrations={allRegs}
        slots={slots ?? []}
        slug={slug}
        currentSlot={slotFilter ?? ''}
        currentStatus={statusFilter ?? 'all'}
      />
    </div>
  )
}
