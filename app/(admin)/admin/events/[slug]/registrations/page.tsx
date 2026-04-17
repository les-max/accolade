import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RegistrationsTable from './RegistrationsTable'

export default async function RegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ slot?: string; status?: string }>
}) {
  const { slug } = await params
  const { slot: slotFilter, status: statusFilter } = await searchParams

  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, status')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

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

  // Summary counts
  const allRegs = registrations ?? []
  const counts = {
    registered: allRegs.filter(r => r.status === 'registered').length,
    waitlisted: allRegs.filter(r => r.status === 'waitlisted').length,
    cancelled:  allRegs.filter(r => r.status === 'cancelled').length,
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link href={`/admin/events/${slug}`} style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← {show.title}
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>
            Registrations
          </h1>
          <a
            href={`/api/admin/events/${slug}/registrations/export?slot=${slotFilter ?? ''}&status=${statusFilter ?? ''}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              color: 'var(--gold)',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Registered', count: counts.registered, color: 'var(--gold)' },
          { label: 'Waitlisted', count: counts.waitlisted, color: 'var(--teal)' },
          { label: 'Cancelled',  count: counts.cancelled,  color: 'var(--muted)' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            background: 'var(--layer)', border: '1px solid var(--border)',
            borderRadius: '4px', padding: '20px 24px',
          }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color }}>{count}</p>
          </div>
        ))}
      </div>

      {/* Filters + table — client component */}
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
