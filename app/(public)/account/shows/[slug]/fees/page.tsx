import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import FeesForm from './FeesForm'

export default async function FeesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/account/shows/${slug}/fees`)

  const { data: fu } = await supabase.from('family_users').select('family_id').eq('user_id', user.id).single()
  if (!fu) redirect('/account/setup')
  const { data: family } = await supabase
    .from('families')
    .select('id, parent_name')
    .eq('id', fu.family_id)
    .single()

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, event_type')
    .eq('slug', slug)
    .single()
  if (!show) notFound()

  const { data: feesConfig } = await supabase
    .from('show_fees_config')
    .select('shirt_price, tuition_amount, fees_enabled')
    .eq('show_id', show.id)
    .maybeSingle()

  if (!feesConfig?.fees_enabled) {
    return (
      <div style={{ maxWidth: '600px' }}>
        <Link href="/account" style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>← Account</Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '12px' }}>{show.title}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Fees are not yet open for this production. Check back soon.</p>
      </div>
    )
  }

  const [{ data: paidOrder }, { data: membersData }] = await Promise.all([
    supabase
      .from('show_fee_orders')
      .select('id, total_amount, created_at, show_fee_order_items ( label, unit_price, quantity, shirt_size )')
      .eq('show_id', show.id)
      .eq('family_id', family.id)
      .eq('status', 'paid')
      .maybeSingle(),
    supabase
      .from('family_members')
      .select('id, first_name, last_name')
      .eq('family_id', family.id)
      .order('first_name'),
  ])

  const members = (membersData ?? []) as { id: string; first_name: string; last_name: string }[]

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/account" style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>← Account</Link>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>{show.title}</h1>
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '32px' }}>Production Fees</p>

      {paidOrder ? (
        <div>
          <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px 24px', marginBottom: '24px' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: '12px' }}>Paid</p>
            {(paidOrder.show_fee_order_items as unknown as Array<{ label: string; unit_price: number; quantity: number; shirt_size: string | null }>).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
                <span>{item.label}{item.shirt_size ? ` (${item.shirt_size})` : ''}</span>
                <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--warm-white)', fontWeight: 600, marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <span>Total Paid</span>
              <span style={{ color: 'var(--gold)' }}>${(paidOrder as unknown as { total_amount: number }).total_amount.toFixed(2)}</span>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            Check your email for a confirmation receipt. Questions? Contact us at{' '}
            <a href="mailto:info@accoladetheatre.org" style={{ color: 'var(--gold)' }}>info@accoladetheatre.org</a>.
          </p>
        </div>
      ) : (
        <FeesForm
          showId={show.id}
          showSlug={slug}
          showTitle={show.title}
          eventType={show.event_type ?? 'show'}
          feesConfig={{ shirt_price: feesConfig.shirt_price, tuition_amount: feesConfig.tuition_amount }}
          members={members}
        />
      )}
    </div>
  )
}
