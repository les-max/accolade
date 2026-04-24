'use client'
import { useTransition, useState } from 'react'
import { saveFeeConfig, addCouponCode, deleteCouponCode } from './fees-actions'

interface Coupon {
  id: string
  code: string
  waive_tuition: boolean
  waive_shirts: boolean
  used_by_family_id: string | null
}

interface FeesManagerProps {
  showId: string
  slug: string
  eventType: string
  config: { shirt_price: number | null; tuition_amount: number | null; fees_enabled: boolean } | null
  coupons: Coupon[]
}

export default function FeesManager({ showId, slug, eventType, config, coupons }: FeesManagerProps) {
  const [pending, startTransition] = useTransition()
  const [feesEnabled, setFeesEnabled] = useState(config?.fees_enabled ?? false)
  const [shirtPrice, setShirtPrice] = useState(config?.shirt_price?.toString() ?? '')
  const [tuitionAmount, setTuitionAmount] = useState(config?.tuition_amount?.toString() ?? '')
  const [configError, setConfigError] = useState<string | null>(null)

  const [newCode, setNewCode] = useState('')
  const [waiveTuition, setWaiveTuition] = useState(false)
  const [waiveShirts, setWaiveShirts] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const isCamp = eventType === 'camp' || eventType === 'workshop'

  function handleSaveConfig() {
    setConfigError(null)
    const shirt = shirtPrice ? parseFloat(shirtPrice) : null
    const tuition = tuitionAmount ? parseFloat(tuitionAmount) : null
    startTransition(async () => {
      try {
        await saveFeeConfig(showId, slug, { shirt_price: shirt, tuition_amount: tuition, fees_enabled: feesEnabled })
      } catch (e) {
        setConfigError((e as Error).message)
      }
    })
  }

  function handleAddCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(null)
    if (!newCode.trim()) return
    startTransition(async () => {
      try {
        await addCouponCode(showId, slug, { code: newCode, waive_tuition: waiveTuition, waive_shirts: waiveShirts })
        setNewCode('')
        setWaiveTuition(false)
        setWaiveShirts(false)
      } catch (e) {
        setCodeError((e as Error).message)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteCouponCode(id, slug)
      } catch (e) {
        console.error(e)
      }
    })
  }

  const SECTION: React.CSSProperties = { marginBottom: '32px' }
  const LABEL: React.CSSProperties = { fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '6px' }
  const INPUT: React.CSSProperties = { background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 14px', fontSize: '0.85rem', color: 'var(--warm-white)', width: '100%' }

  return (
    <div style={SECTION}>
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
        Fees
      </p>

      {/* Config */}
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px 24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input
            type="checkbox"
            id="fees-enabled"
            checked={feesEnabled}
            onChange={e => setFeesEnabled(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }}
          />
          <label htmlFor="fees-enabled" style={{ fontSize: '0.85rem', color: 'var(--warm-white)', cursor: 'pointer' }}>
            Fees enabled (show form to families)
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {!isCamp && (
            <div>
              <label style={LABEL}>Shirt Price ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={shirtPrice}
                onChange={e => setShirtPrice(e.target.value)}
                placeholder="Leave blank = no shirt upsell"
                style={INPUT}
              />
            </div>
          )}
          {isCamp && (
            <div>
              <label style={LABEL}>Tuition per Child ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={tuitionAmount}
                onChange={e => setTuitionAmount(e.target.value)}
                placeholder="Flat tuition per child"
                style={INPUT}
              />
            </div>
          )}
        </div>

        {configError && <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginBottom: '12px' }}>{configError}</p>}

        <button onClick={handleSaveConfig} disabled={pending} className="btn-primary" style={{ fontSize: '0.72rem' }}>
          <span>Save Config</span>
        </button>
      </div>

      {/* Coupon Codes */}
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px 24px' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Coupon Codes</p>

        {coupons.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {coupons.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: c.used_by_family_id ? 'var(--muted-dim)' : 'var(--gold)' }}>{c.code}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                    {[c.waive_tuition && 'waives tuition', c.waive_shirts && 'waives shirts'].filter(Boolean).join(' + ')}
                  </span>
                  {c.used_by_family_id && <span style={{ fontSize: '0.65rem', color: 'var(--rose)', letterSpacing: '0.1em' }}>USED</span>}
                </div>
                {!c.used_by_family_id && (
                  <button onClick={() => handleDelete(c.id)} disabled={pending} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: '0.72rem', padding: '0' }}>
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddCode} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={LABEL}>New Code</label>
            <input
              type="text" value={newCode} onChange={e => setNewCode(e.target.value)}
              placeholder="e.g. SMITH2025" style={INPUT} maxLength={20}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'flex-end', paddingBottom: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={waiveTuition} onChange={e => setWaiveTuition(e.target.checked)} />
              Waive Tuition
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={waiveShirts} onChange={e => setWaiveShirts(e.target.checked)} />
              Waive Shirts
            </label>
          </div>
          <div />
          <button type="submit" disabled={pending || !newCode.trim()} className="btn-primary" style={{ fontSize: '0.72rem', alignSelf: 'end' }}>
            <span>Add Code</span>
          </button>
        </form>
        {codeError && <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginTop: '8px' }}>{codeError}</p>}
      </div>
    </div>
  )
}
