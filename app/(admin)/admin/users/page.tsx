import { createClient } from '@/lib/supabase/server'
import InviteUserForm from './InviteUserForm'

const ROLE_STYLES: Record<string, { color: string; border: string }> = {
  user:      { color: 'var(--muted)',  border: 'rgba(160,160,181,0.3)' },
  organizer: { color: 'var(--gold)',   border: 'rgba(212,168,83,0.4)'  },
}

export default async function UsersPage() {
  const supabase = await createClient()

  const [{ data: families }, { data: shows }] = await Promise.all([
    supabase
      .from('families')
      .select(`
        id, email, parent_name, phone, portal_role, created_at,
        show_members ( show_role, shows ( title ) )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('shows')
      .select('id, title')
      .order('title'),
  ])

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
            Admin
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>Users</h1>
        </div>
        <InviteUserForm shows={shows ?? []} />
      </div>

      {families && families.length > 0 ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 140px 100px',
            background: 'var(--layer)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 24px',
          }}>
            {['Name', 'Email', 'Shows', 'Role'].map(col => (
              <span key={col} style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {col}
              </span>
            ))}
          </div>

          {families.map((f, i) => {
            const badge = ROLE_STYLES[f.portal_role] ?? ROLE_STYLES.user
            const isLast = i === families.length - 1
            const showList = (f.show_members as unknown as { show_role: string; shows: { title: string } | null }[])
              ?.map(m => m.shows?.title)
              .filter(Boolean)
              .join(', ') || '—'

            return (
              <div key={f.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 140px 100px',
                padding: '18px 24px',
                alignItems: 'center',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
              }}>
                <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{f.parent_name}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{f.email}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{showList}</p>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  border: `1px solid ${badge.border}`,
                  borderRadius: '2px',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: badge.color,
                }}>
                  {f.portal_role}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '80px 40px',
          textAlign: 'center',
          background: 'var(--layer)',
        }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', marginBottom: '12px' }}>
            No portal users yet
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Invite cast, crew, and parents to give them access to the member portal.
          </p>
        </div>
      )}
    </div>
  )
}
