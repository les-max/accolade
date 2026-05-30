import TicketManager from '../TicketManager'
import TicketOptionManager, { type OptionGroup } from '../TicketOptionManager'
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
}

export default function TicketsTab({ show, slug, role, performancesData, ticketConfigData }: Props) {
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

  return (
    <>
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
    </>
  )
}
