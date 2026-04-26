import Link from 'next/link'
import ShowStaffManager from '../ShowStaffManager'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string; slug: string; status: string; event_type: string }
  slug: string
  role: StaffRole
  performancesData: { id: string; type: string }[]
  membersData: { id: string }[]
  staffAssignments: { id: string; role: string; admin_users: { id: string; email: string } }[]
  availableDirectorStaff: { id: string; email: string; role: string }[]
}

export default function OverviewTab({ show, slug, role, performancesData, membersData, staffAssignments, availableDirectorStaff }: Props) {
  const publicPath = `/shows/${slug}`
  const performanceCount = performancesData.filter(p => p.type === 'performance').length
  const memberCount = membersData.length

  const quickLinks = [
    { label: 'Communications', href: `/admin/events/${slug}/communications`, cta: 'Send Email →' },
    { label: 'Playbill Bios',  href: `/admin/events/${slug}/bios`,           cta: 'View Bios →' },
    { label: 'Waivers',        href: `/admin/events/${slug}/waivers`,         cta: 'View Signatures →' },
    { label: 'Fee Orders',     href: `/admin/events/${slug}/fees`,            cta: 'View Orders →' },
  ]

  return (
    <div>
      {/* Public URL */}
      <div style={{
        background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
        padding: '16px 20px', marginBottom: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Public Event URL
          </span>
          <p style={{ fontSize: '0.85rem', color: 'var(--warm-white)', marginTop: '4px' }}>{publicPath}</p>
        </div>
        <Link href={publicPath} target="_blank" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Preview →
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Cast & Crew', value: memberCount },
          { label: 'Performances', value: performanceCount },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            padding: '20px 24px',
          }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: '1.6rem', fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick-action links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px',
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            textDecoration: 'none',
          }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {link.label}
            </p>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>{link.cta}</span>
          </Link>
        ))}
      </div>

      {/* Show Staff — admin only */}
      {role === 'admin' && (
        <ShowStaffManager
          showId={show.id}
          slug={slug}
          currentStaff={staffAssignments}
          availableStaff={availableDirectorStaff}
        />
      )}
    </div>
  )
}
