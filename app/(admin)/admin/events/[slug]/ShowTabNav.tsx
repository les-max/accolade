import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

export type ShowTab = 'overview' | 'details' | 'schedule' | 'tickets' | 'people' | 'finances' | 'comms'

const TABS: { id: ShowTab; label: string }[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'details',   label: 'Details' },
  { id: 'schedule',  label: 'Schedule' },
  { id: 'tickets',   label: 'Tickets' },
  { id: 'people',    label: 'Roster' },
  { id: 'finances',  label: 'Show Fees' },
  { id: 'comms',     label: 'Comms & Waivers' },
]

export default function ShowTabNav({
  slug,
  activeTab,
}: {
  slug: string
  activeTab: ShowTab
  role: StaffRole
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      borderBottom: '1px solid var(--border)',
      marginBottom: '32px',
      overflowX: 'auto',
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <Link
            key={tab.id}
            href={`/admin/events/${slug}?tab=${tab.id}`}
            className={`admin-tab-link${isActive ? ' admin-tab-link--active' : ''}`}
            style={{
              padding: '12px 20px',
              fontSize: '0.68rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: isActive ? 'var(--gold)' : 'var(--muted)',
              borderBottom: `2px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
