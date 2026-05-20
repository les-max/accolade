import VolunteerPositionsManager from '../VolunteerPositionsManager'
import type { StaffRole } from '@/lib/staff'

interface Signup {
  id: string
  position_id: string
  family_id: string
  assigned_by: string | null
  created_at: string
  families: { parent_name: string; email: string } | null
}

interface Position {
  id: string
  show_id: string
  name: string
  description: string | null
  capacity: number
  position_type: 'open' | 'assigned'
  sort_order: number
  signups: Signup[]
}

interface Props {
  show: { id: string }
  slug: string
  role: StaffRole
  published: boolean
  positions: Position[]
}

export default function VolunteersTab({ show, slug, published, positions }: Props) {
  return (
    <div>
      <VolunteerPositionsManager
        showId={show.id}
        slug={slug}
        published={published}
        positions={positions}
      />
    </div>
  )
}
