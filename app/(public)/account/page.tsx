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
  if (!family) redirect('/account/setup')

  const members = family.family_members ?? []

  // Fetch roster entries for this family across all non-draft shows
  const { data: rosterEntries } = await supabase
    .from('show_members')
    .select('person_name, show_role, shows(id, title, slug, status)')
    .eq('family_id', family.id)

  type ShowEntry = { id: string; title: string; slug: string; members: { name: string; role: string }[] }
  const showsMap = new Map<string, ShowEntry>()
  for (const entry of rosterEntries ?? []) {
    const show = entry.shows as { id: string; title: string; slug: string; status: string } | null
    if (!show || show.status === 'draft') continue
    if (!showsMap.has(show.id)) showsMap.set(show.id, { id: show.id, title: show.title, slug: show.slug, members: [] })
    showsMap.get(show.id)!.members.push({ name: entry.person_name, role: entry.show_role })
  }
  const activeShows = Array.from(showsMap.values())
  const activeShowIds = activeShows.map(s => s.id)

  const feesPendingIds = new Set<string>()
  const waiversPendingIds = new Set<string>()

  if (activeShowIds.length > 0) {
    const [{ data: feeConfigs }, { data: paidOrders }, { data: waivers }] = await Promise.all([
      supabase.from('show_fees_config').select('show_id').eq('fees_enabled', true).in('show_id', activeShowIds),
      supabase.from('show_fee_orders').select('show_id').eq('family_id', family.id).in('show_id', activeShowIds).eq('status', 'paid'),
      supabase.from('show_waivers').select('show_id, waiver_type').eq('family_id', family.id).in('show_id', activeShowIds),
    ])

    const paidShowIds = new Set((paidOrders ?? []).map(o => o.show_id))
    for (const c of feeConfigs ?? []) {
      if (!paidShowIds.has(c.show_id)) feesPendingIds.add(c.show_id)
    }

    const signedByShow = new Map<string, Set<string>>()
    for (const w of waivers ?? []) {
      if (!signedByShow.has(w.show_id)) signedByShow.set(w.show_id, new Set())
      signedByShow.get(w.show_id)!.add(w.waiver_type)
    }
    for (const id of activeShowIds) {
      const signed = signedByShow.get(id)
      if (!signed?.has('liability') || !signed?.has('photo_video')) waiversPendingIds.add(id)
    }
  }

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

        {/* Current productions card */}
        {activeShows.length > 0 && (
          <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '32px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Current Productions
              </p>
            </div>
            {activeShows.map((show, i) => {
              const feesDue = feesPendingIds.has(show.id)
              const waiversDue = waiversPendingIds.has(show.id)
              return (
                <div key={show.id} style={{
                  padding: '16px 24px',
                  borderBottom: i < activeShows.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap',
                }}>
                  <div>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '4px' }}>{show.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {show.members.map(m => `${m.name} · ${m.role}`).join('  •  ')}
                    </p>
                  </div>
                  {(feesDue || waiversDue) && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                      {feesDue && (
                        <Link
                          href={`/account/shows/${show.slug}/fees`}
                          style={{
                            fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                            color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '2px',
                            padding: '4px 10px', textDecoration: 'none', whiteSpace: 'nowrap',
                          }}
                        >
                          Fees due →
                        </Link>
                      )}
                      {waiversDue && (
                        <Link
                          href={`/account/shows/${show.slug}/waivers`}
                          style={{
                            fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                            color: 'var(--rose)', border: '1px solid var(--rose)', borderRadius: '2px',
                            padding: '4px 10px', textDecoration: 'none', whiteSpace: 'nowrap',
                          }}
                        >
                          Waiver needed →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

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
