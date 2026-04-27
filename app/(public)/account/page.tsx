import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'My Account — Accolade Community Theatre' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fu } = await supabase.from('family_users').select('family_id').eq('user_id', user.id).single()
  if (!fu) redirect('/account/setup')

  const { data: family } = await supabase
    .from('families')
    .select('*, family_members(*)')
    .eq('id', fu.family_id)
    .single()

  const members = family.family_members ?? []

  // Fetch upcoming auditions for this family
  const { data: auditions } = await supabase
    .from('auditions')
    .select('*, shows(title, slug), audition_slots(label, start_time)')
    .eq('family_id', family.id)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(5)

  type UpcomingItem = { id: string; label: string; type: string; date: string }
  const upcoming: UpcomingItem[] = []
  const nowIso = new Date().toISOString()

  for (const a of auditions ?? []) {
    const slot = a.audition_slots as unknown as { label: string; start_time: string | null } | null
    const show = a.shows as unknown as { title: string; slug: string } | null
    if (!slot?.start_time || slot.start_time < nowIso) continue
    upcoming.push({
      id:    `a-${a.id}`,
      label: show?.title ?? 'Audition',
      type:  'Audition',
      date:  slot.start_time,
    })
  }
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const nextThree = upcoming.slice(0, 3)

  return (
    <section style={{ padding: 'clamp(40px, 8vw, 72px) clamp(20px, 5vw, 48px)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
            My Account
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700 }}>
            Welcome back, {family.parent_name.split(' ')[0]}
          </h1>
        </div>

        <div className="g-2" style={{ display: 'grid', gap: '32px', alignItems: 'start' }}>

          {/* Family members card */}
          <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                My Family
              </p>
              <Link href="/account/family" style={{ fontSize: '0.65rem', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.1em' }}>
                Manage →
              </Link>
            </div>
            {members.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '16px' }}>No family members added yet.</p>
                <Link href="/account/family" className="btn-primary" style={{ fontSize: '0.65rem', padding: '12px 24px' }}>
                  <span>Add a Child</span>
                </Link>
              </div>
            ) : (
              <div>
                {members.map((m: { id: string; name: string; age: number | null; grade: string | null }, i: number) => (
                  <div key={m.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 24px',
                    borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{m.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {[m.age ? `Age ${m.age}` : null, m.grade].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                ))}
                <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)' }}>
                  <Link href="/account/family" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
                    + Add another child
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming events card */}
          <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Upcoming
              </p>
              <Link href="/account/calendar" style={{ fontSize: '0.65rem', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.1em' }}>
                Calendar →
              </Link>
            </div>
            {nextThree.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '16px' }}>No upcoming events.</p>
                <Link href="/account/calendar" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
                  Subscribe to calendar →
                </Link>
              </div>
            ) : (
              <div>
                {nextThree.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 24px',
                    borderBottom: i < nextThree.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.label}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>{item.type}</p>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
                <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)' }}>
                  <Link href="/account/calendar" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
                    View calendar + subscribe →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recent auditions card */}
          <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Recent Auditions
              </p>
              <Link href="/account/auditions" style={{ fontSize: '0.65rem', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.1em' }}>
                View All →
              </Link>
            </div>
            {!auditions || auditions.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '16px' }}>No auditions registered yet.</p>
                <Link href="/auditions" className="btn-primary" style={{ fontSize: '0.65rem', padding: '12px 24px' }}>
                  <span>Browse Auditions</span>
                </Link>
              </div>
            ) : (
              <div>
                {auditions.map((a: {
                  id: string; status: string; auditioner_name: string;
                  shows: { title: string; slug: string } | null;
                  audition_slots: { label: string } | null;
                }, i: number) => {
                  const statusColor = a.status === 'registered' ? 'var(--gold)' : a.status === 'waitlisted' ? 'var(--teal)' : 'var(--muted)'
                  return (
                    <div key={a.id} style={{
                      padding: '16px 24px',
                      borderBottom: i < auditions.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <p style={{ fontSize: '0.88rem', fontWeight: 500, marginBottom: '4px' }}>
                            {a.shows?.title ?? 'Unknown Show'}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {a.auditioner_name} · {a.audition_slots?.label ?? '—'}
                          </p>
                        </div>
                        <span style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: statusColor, whiteSpace: 'nowrap' }}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
