import RosterManager, { type Member, type Auditioner } from '../RosterManager'
import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string }
  slug: string
  role: StaffRole
  membersData: Member[]
  auditioners?: Auditioner[]
}

export default function PeopleTab({ show, slug, membersData, auditioners = [] }: Props) {
  return (
    <div>
      <RosterManager
        showId={show.id}
        slug={slug}
        members={membersData}
        auditioners={auditioners}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
        <Link href={`/admin/events/${slug}/bios`} className="admin-link-card" style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Playbill Bios
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View Bios →</span>
        </Link>

        <Link href={`/admin/events/${slug}/communications`} className="admin-link-card" style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Communications
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>Send Email →</span>
        </Link>
      </div>
    </div>
  )
}
