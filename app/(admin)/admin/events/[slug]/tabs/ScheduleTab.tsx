import PerformancesManager from '../PerformancesManager'
import TicketManager from '../TicketManager'
import RehearsalManager from '../RehearsalManager'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string; event_type: string }
  slug: string
  role: StaffRole
  performancesData: { id: string; type: string; date: string; start_time: string | null; label: string | null }[]
  ticketConfigData: { show_performance_id: string; capacity: number; price: number; sales_enabled: boolean }[]
  showEventsData: { id: string; event_type: string; title: string; start_time: string; end_time: string | null; location: string | null; notes: string | null }[]
}

export default function ScheduleTab({ show, slug, role, performancesData, ticketConfigData, showEventsData }: Props) {
  const perfReadOnly = role !== 'admin'

  return (
    <div>
      <PerformancesManager
        showId={show.id}
        slug={slug}
        performances={performancesData}
        eventType={show.event_type}
        readOnly={perfReadOnly}
      />
      <TicketManager
        showId={show.id}
        slug={slug}
        performances={performancesData.filter(p => p.type === 'performance')}
        ticketConfig={ticketConfigData}
        readOnly={perfReadOnly}
      />
      <RehearsalManager
        showId={show.id}
        slug={slug}
        events={showEventsData}
      />
    </div>
  )
}
