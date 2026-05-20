import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHero from '@/components/PageHero'

export const metadata = {
  title: 'Camps — Accolade Community Theatre',
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return ''
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  if (!end || end === start) return s
  const e = new Date(end).toLocaleDateString('en-US', opts)
  return `${s} – ${e}`
}

export default async function CampsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('shows')
    .select('id, slug, title, description, age_min, age_max, start_date, end_date, show_image, show_image_wide, cta_label, cta_url, status, parent_show:parent_show_id(show_image, show_image_wide)')
    .eq('event_type', 'camp')
    .eq('archived', false)
    .order('start_date', { ascending: true })

  const camps = data ?? []
  const upcoming = camps.filter(c => c.status === 'active')
  const draft = camps.filter(c => c.status !== 'active')

  return (
    <>
      <PageHero
        eyebrow="Learn & Grow"
        title="Theatre"
        titleItalic="Camps"
        subtitle="Immersive multi-day camps where young performers build skills, make friends, and put on a show."
        accentColor="var(--rose)"
      />

      <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {upcoming.length === 0 && draft.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', marginBottom: '12px' }}>
                No camps scheduled right now
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Check back soon or follow us on social media for announcements.
              </p>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <p className="section-label">Open Registration</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '64px' }}>
                    {upcoming.map(camp => <CampCard key={camp.id} camp={camp} />)}
                  </div>
                </>
              )}
              {draft.length > 0 && (
                <>
                  <p className="section-label">Coming Soon</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {draft.map(camp => <CampCard key={camp.id} camp={camp} comingSoon />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}

type Camp = {
  id: string; slug: string; title: string; description: string | null
  age_min: number | null; age_max: number | null
  start_date: string | null; end_date: string | null
  show_image: string | null; show_image_wide: string | null
  cta_label: string | null; cta_url: string | null; status: string
  parent_show: { show_image: string | null; show_image_wide: string | null } | { show_image: string | null; show_image_wide: string | null }[] | null
}

function CampCard({ camp, comingSoon = false }: { camp: Camp; comingSoon?: boolean }) {
  const parent = Array.isArray(camp.parent_show) ? camp.parent_show[0] : camp.parent_show
  const heroImage = camp.show_image_wide ?? camp.show_image ?? parent?.show_image_wide ?? parent?.show_image ?? null
  const dateStr = formatDateRange(camp.start_date, camp.end_date)
  const ageLabel = camp.age_min && camp.age_max
    ? `Ages ${camp.age_min}–${camp.age_max}`
    : camp.age_min ? `Ages ${camp.age_min}+` : null
  const ctaHref = camp.cta_url ?? `/auditions/${camp.slug}`
  const ctaLabel = camp.cta_label ?? 'Register for Camp'

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--layer)', overflow: 'hidden' }}>
      <div className="g-2s" style={{ display: 'grid' }}>
        <div style={{ position: 'relative', aspectRatio: '16/9' }}>
          {heroImage ? (
            <Image src={heroImage} alt={camp.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 50vw" />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #3d1a2a, #1e0a14)' }} />
          )}
        </div>
        <div style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {dateStr && (
              <span style={{ padding: '6px 14px', border: '1px solid rgba(212,168,83,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                {dateStr}
              </span>
            )}
            {ageLabel && (
              <span style={{ padding: '6px 14px', border: '1px solid rgba(61,158,140,0.3)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)' }}>
                {ageLabel}
              </span>
            )}
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, marginBottom: '12px' }}>
            {camp.title}
          </h2>
          {camp.description && (
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '32px', maxWidth: '520px' }}>
              {camp.description}
            </p>
          )}
          {!comingSoon && (
            <Link href={ctaHref} className="btn-primary">
              <span>{ctaLabel}</span>
            </Link>
          )}
          {comingSoon && (
            <p style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Registration opening soon
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
