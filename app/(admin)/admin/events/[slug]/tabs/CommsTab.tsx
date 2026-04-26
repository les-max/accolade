import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string }
  slug: string
  role: StaffRole
}

export default function CommsTab({ slug, role }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Link href={`/admin/events/${slug}/communications`} className="admin-link-card" style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Communications
        </p>
        <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>Send Email →</span>
      </Link>

      <Link href={`/admin/events/${slug}/waivers`} className="admin-link-card" style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Waivers
        </p>
        <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>
          {role === 'admin' ? 'Manage Signatures →' : 'View Signatures →'}
        </span>
      </Link>
    </div>
  )
}
