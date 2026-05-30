import TicketManager from '../TicketManager'
import TicketOptionManager, { type OptionGroup } from '../TicketOptionManager'
import TicketCouponManager, { type TicketCouponRow } from '../TicketCouponManager'
import type { StaffRole } from '@/lib/staff'

type TicketConfigRow = {
  id: string
  show_performance_id: string
  capacity: number
  price: number
  sales_enabled: boolean
  ticket_option_groups: OptionGroup[]
}

interface Props {
  show: { id: string }
  slug: string
  role: StaffRole
  performancesData: { id: string; type: string; date: string; start_time: string | null; label: string | null }[]
  ticketConfigData: TicketConfigRow[]
  ticketCouponsData: TicketCouponRow[]
}

export default function TicketsTab({ show, slug, role, performancesData, ticketConfigData, ticketCouponsData }: Props) {
  const perfPerformances = performancesData.filter(p => p.type === 'performance')

  // Build the list of performances that have a ticket_performance record, with their option groups
  const configByShowPerfId = Object.fromEntries(ticketConfigData.map(t => [t.show_performance_id, t]))

  const perfsWithOptions = perfPerformances
    .filter(p => configByShowPerfId[p.id])
    .map(p => {
      const config = configByShowPerfId[p.id]
      return {
        ticketPerformanceId: config.id,
        date: p.date,
        start_time: p.start_time,
        label: p.label,
        groups: config.ticket_option_groups ?? [],
      }
    })

  const hasOrders = ticketConfigData.length > 0

  return (
    <>
      {role === 'admin' && hasOrders && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <a
            href={`/api/tickets/export?showId=${show.id}`}
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--teal)',
              border: '1px solid rgba(61,158,140,0.3)',
              borderRadius: '2px',
              padding: '8px 16px',
              textDecoration: 'none',
            }}
          >
            Download CSV
          </a>
        </div>
      )}
      <TicketManager
        showId={show.id}
        slug={slug}
        performances={perfPerformances}
        ticketConfig={ticketConfigData}
        readOnly={role !== 'admin'}
      />
      {role === 'admin' && perfsWithOptions.length > 0 && (
        <TicketOptionManager slug={slug} performances={perfsWithOptions} />
      )}
      {role === 'admin' && (
        <TicketCouponManager
          showId={show.id}
          slug={slug}
          coupons={ticketCouponsData}
        />
      )}
    </>
  )
}
