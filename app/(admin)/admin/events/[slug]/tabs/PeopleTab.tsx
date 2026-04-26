import RosterManager from '../RosterManager'
import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

type RosterMember = Parameters<typeof RosterManager>[0]['members'][number]

interface Props {
  show: { id: string }
  slug: string
  role: StaffRole
  membersData: RosterMember[]
}

export default function PeopleTab({ show, slug, membersData }: Props) {
  return (
    <div>
      <RosterManager
        showId={show.id}
        slug={slug}
        members={membersData}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
        <Link
          href={`/admin/events/${slug}/bios`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px',
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Playbill Bios
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View Bios →</span>
        </Link>

        <Link
          href={`/admin/events/${slug}/communications`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px',
            background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Communications
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>Send Email →</span>
        </Link>
      </div>
    </div>
  )
}
