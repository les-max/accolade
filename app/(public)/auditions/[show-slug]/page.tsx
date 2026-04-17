import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PageHero from '@/components/PageHero'
import AuditionForm from './AuditionForm'

export async function generateMetadata({ params }: { params: Promise<{ 'show-slug': string }> }) {
  const { 'show-slug': slug } = await params
  const supabase = await createClient()
  const { data: show } = await supabase.from('shows').select('title').eq('slug', slug).single()
  return { title: show ? `Audition Registration — ${show.title} | Accolade Community Theatre` : 'Auditions' }
}

export default async function AuditionRegistrationPage({
  params,
}: {
  params: Promise<{ 'show-slug': string }>
}) {
  const { 'show-slug': slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  if (show.status !== 'active') {
    return (
      <>
        <PageHero
          eyebrow="Auditions"
          title={show.title}
          titleItalic="Registration"
          accentColor="var(--gold)"
        />
        <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', marginBottom: '16px' }}>
              Registration is not open yet
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
              Audition registration for <strong style={{ color: 'var(--warm-white)' }}>{show.title}</strong> is not currently open.
              Check back soon or follow us on social media for updates.
            </p>
          </div>
        </section>
      </>
    )
  }

  // Fetch slots with registration counts
  const [{ data: rawSlots }, { data: roles }, { data: regCounts }] = await Promise.all([
    supabase.from('audition_slots').select('*').eq('show_id', show.id).order('start_time', { ascending: true }),
    supabase.from('show_roles').select('id, role_name').eq('show_id', show.id).order('sort_order', { ascending: true }),
    supabase.from('auditions').select('slot_id').eq('show_id', show.id).eq('status', 'registered'),
  ])

  const countBySlot: Record<string, number> = {}
  for (const r of (regCounts ?? [])) {
    if (r.slot_id) countBySlot[r.slot_id] = (countBySlot[r.slot_id] ?? 0) + 1
  }

  const slots = (rawSlots ?? []).map(s => ({
    ...s,
    registeredCount: countBySlot[s.id] ?? 0,
  }))

  const ageRange = show.age_min && show.age_max
    ? `Ages ${show.age_min}–${show.age_max}`
    : show.age_min ? `Ages ${show.age_min}+` : null

  return (
    <>
      <PageHero
        eyebrow="Auditions"
        title={show.title}
        titleItalic="Register Now"
        subtitle={[ageRange, show.description].filter(Boolean).join(' · ') || undefined}
        accentColor="var(--gold)"
      />

      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {slots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                No audition slots have been added yet. Check back soon.
              </p>
            </div>
          ) : (
            <AuditionForm
              showId={show.id}
              showSlug={slug}
              slots={slots}
              roles={roles ?? []}
              fieldConfig={show.field_config ?? { show_grade: false, show_headshot_upload: false }}
            />
          )}
        </div>
      </section>
    </>
  )
}
