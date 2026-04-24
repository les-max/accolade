import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ShowBiosPage({
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

  const { data: bios } = await supabase
    .from('show_bios')
    .select('id, first_name, last_name, role, age, grade, bio, submitted_at, families(parent_name, email)')
    .eq('show_id', show.id)
    .order('last_name')
    .order('first_name')

  const count = (bios ?? []).length

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href={`/admin/events/${slug}`}
          style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
        >
          ← {show.title}
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>
              Playbill Bios
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '6px' }}>
              {count} bio{count !== 1 ? 's' : ''} submitted
            </p>
          </div>
          {count > 0 && (
            <a
              href={`/admin/events/${slug}/bios/download`}
              style={{
                fontSize: '0.72rem',
                color: 'var(--gold)',
                textDecoration: 'none',
                padding: '8px 16px',
                border: '1px solid rgba(212,168,83,0.3)',
                borderRadius: '2px',
                whiteSpace: 'nowrap',
              }}
            >
              Download CSV ↓
            </a>
          )}
        </div>
      </div>

      {count === 0 ? (
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No bios submitted yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(bios ?? []).map(bio => {
            const family = bio.families as unknown as { parent_name: string; email: string }
            return (
              <div key={bio.id} style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '2px' }}>
                      {bio.first_name} {bio.last_name}
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {bio.role} · Age {bio.age} · Grade {bio.grade}
                    </p>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted-dim)' }}>
                    {family?.parent_name} — {family?.email}
                  </p>
                </div>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--warm-white)', whiteSpace: 'pre-wrap' }}>
                  {bio.bio}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
