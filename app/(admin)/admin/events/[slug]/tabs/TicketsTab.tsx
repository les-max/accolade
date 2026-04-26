import TicketManager from '../TicketManager'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string }
  slug: string
  role: StaffRole
  performancesData: { id: string; type: string; date: string; start_time: string | null; label: string | null }[]
  ticketConfigData: { show_performance_id: string; capacity: number; price: number; sales_enabled: boolean }[]
}

export default function TicketsTab({ show, slug, role, performancesData, ticketConfigData }: Props) {
  return (
    <TicketManager
      showId={show.id}
      slug={slug}
      performances={performancesData.filter(p => p.type === 'performance')}
      ticketConfig={ticketConfigData}
      readOnly={role !== 'admin'}
    />
  )
}
