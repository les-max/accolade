import EventDetailsManager from '../EventDetailsManager'
import type { StaffRole } from '@/lib/staff'

type EDMProps = Parameters<typeof EventDetailsManager>[0]

interface Props {
  showId: string
  slug: string
  role: StaffRole
  show: EDMProps['show']
  venues: EDMProps['venues']
  parentShows: EDMProps['parentShows']
}

export default function DetailsTab({ showId, slug, role, show, venues, parentShows }: Props) {
  return (
    <EventDetailsManager
      showId={showId}
      slug={slug}
      show={show}
      venues={venues}
      parentShows={parentShows}
      role={role}
    />
  )
}
