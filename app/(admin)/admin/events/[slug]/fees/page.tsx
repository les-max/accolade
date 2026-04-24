import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function FeeOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: adminCheck } = await supabase.from('admin_users').select('id').single()
  if (!adminCheck) redirect('/login')

  const { data: show } = await supabase.from('shows').select('id, title').eq('slug', slug).single()
  if (!show) notFound()

  const { data: orders } = await supabase
    .from('show_fee_orders')
    .select(`
      id, total_amount, status, created_at,
      families ( parent_name, email ),
      show_fee_order_items ( id, item_type, label, unit_price, quantity, shirt_size )
    `)
    .eq('show_id', show.id)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  const paidOrders = (orders ?? []) as unknown as Array<{
    id: string
    total_amount: number
    status: string
    created_at: string
    families: { parent_name: string; email: string }
    show_fee_order_items: Array<{ id: string; item_type: string; label: string; unit_price: number; quantity: number; shirt_size: string | null }>
  }>

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href={`/admin/events/${slug}`} style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← {show.title}
        </Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700 }}>Fee Orders</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '4px' }}>{paidOrders.length} paid</p>
      </div>

      {paidOrders.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No paid fee orders yet.</p>
      )}

      {paidOrders.map(order => (
        <div key={order.id} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px 24px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--warm-white)', marginBottom: '2px' }}>{order.families.parent_name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{order.families.email}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1rem', color: 'var(--gold)', fontWeight: 600 }}>${order.total_amount.toFixed(2)}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {order.show_fee_order_items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)' }}>
                <span>{item.label}{item.shirt_size ? ` (${item.shirt_size})` : ''}</span>
                <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
