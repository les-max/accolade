import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ShowWaiversPage({
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

  const { data: waivers } = await supabase
    .from('show_waivers')
    .select('family_id, waiver_type, signature, signed_at, ip_address, families(parent_name, email)')
    .eq('show_id', show.id)
    .order('signed_at', { ascending: false })

  const familyMap = new Map<string, {
    parent_name: string
    email: string
    liability: { signature: string; signed_at: string; ip_address: string } | null
    photo_video: { signature: string; signed_at: string; ip_address: string } | null
  }>()

  for (const w of waivers ?? []) {
    const f = w.families as unknown as { parent_name: string; email: string }
    if (!familyMap.has(w.family_id)) {
      familyMap.set(w.family_id, { parent_name: f.parent_name, email: f.email, liability: null, photo_video: null })
    }
    const entry = familyMap.get(w.family_id)!
    if (w.waiver_type === 'liability') {
      entry.liability = { signature: w.signature, signed_at: w.signed_at, ip_address: w.ip_address }
    } else if (w.waiver_type === 'photo_video') {
      entry.photo_video = { signature: w.signature, signed_at: w.signed_at, ip_address: w.ip_address }
    }
  }

  const families = Array.from(familyMap.values()).sort((a, b) => a.parent_name.localeCompare(b.parent_name))

  const check = (signed: boolean) => (
    <span style={{ color: signed ? 'var(--teal)' : 'var(--rose)', fontSize: '0.78rem' }}>
      {signed ? '✓' : '–'}
    </span>
  )

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href={`/admin/events/${slug}`}
          style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
        >
          ← {show.title}
        </Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>
          Waivers
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '6px' }}>
          {families.length} famil{families.length !== 1 ? 'ies' : 'y'} have signed at least one waiver
        </p>
      </div>

      {families.length === 0 ? (
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No waivers signed yet.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', borderBottom: '1px solid var(--border)', padding: '10px 24px', background: 'rgba(0,0,0,0.2)' }}>
            <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>Family</span>
            <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center' }}>Liability</span>
            <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center' }}>Photo/Video</span>
          </div>

          {families.map((fam, i) => (
            <div
              key={fam.email}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px',
                padding: '14px 24px',
                borderBottom: i < families.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: '0.88rem' }}>{fam.parent_name}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>{fam.email}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                {check(!!fam.liability)}
                {fam.liability && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--muted-dim)', marginTop: '2px' }}>
                    {new Date(fam.liability.signed_at).toLocaleDateString('en-US')}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                {check(!!fam.photo_video)}
                {fam.photo_video && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--muted-dim)', marginTop: '2px' }}>
                    {new Date(fam.photo_video.signed_at).toLocaleDateString('en-US')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
