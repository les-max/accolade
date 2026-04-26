import FeesManager from '../FeesManager'
import Link from 'next/link'
import type { StaffRole } from '@/lib/staff'

interface Props {
  show: { id: string; event_type: string }
  slug: string
  role: StaffRole
  feesConfigData: { shirt_price: number | null; tuition_amount: number | null; fees_enabled: boolean } | null
  couponsData: { id: string; code: string; waive_tuition: boolean; waive_shirts: boolean; used_by_family_id: string | null }[]
}

export default function FinancesTab({ show, slug, role, feesConfigData, couponsData }: Props) {
  return (
    <div>
      <FeesManager
        showId={show.id}
        slug={slug}
        eventType={show.event_type}
        config={feesConfigData ?? null}
        coupons={couponsData}
        role={role}
      />

      <div style={{ marginTop: '16px' }}>
        <Link href={`/admin/events/${slug}/fees`} className="admin-link-card" style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Production Orders
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>View Orders →</span>
        </Link>
      </div>
    </div>
  )
}
