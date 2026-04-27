import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function FeesSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string; free?: string }>
}) {
  const { slug } = await params
  const { free } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fu } = await supabase.from('family_users').select('family_id').eq('user_id', user.id).single()
  const { data: family } = fu
    ? await supabase.from('families').select('id, parent_name').eq('id', fu.family_id).single()
    : { data: null }

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  // Find the most recent paid fee order for this family + show
  const { data: order } = show && family ? await supabase
    .from('show_fee_orders')
    .select('id, total_amount, created_at')
    .eq('show_id', show.id)
    .eq('family_id', family.id)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
        <p style={{ fontSize: '2rem', marginBottom: '16px' }}>✓</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>
          {free ? 'All set!' : 'Payment confirmed!'}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          {family?.parent_name ? `Thanks, ${family.parent_name}. ` : ''}
          {show ? `Your production fees for ${show.title} are recorded.` : 'Your production fees are recorded.'}
        </p>
        {order && (order as unknown as { total_amount: number }).total_amount > 0 && (
          <p style={{ fontSize: '1.1rem', color: 'var(--gold)', fontWeight: 600, marginTop: '16px' }}>
            ${(order as unknown as { total_amount: number }).total_amount.toFixed(2)} paid
          </p>
        )}
        {!free && (
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '12px' }}>
            A confirmation email is on its way.
          </p>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/account" className="btn-ghost" style={{ fontSize: '0.8rem' }}>
          <span>Back to Account</span>
        </Link>
      </div>
    </div>
  )
}
