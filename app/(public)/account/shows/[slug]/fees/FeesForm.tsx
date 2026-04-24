'use client'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ACCOLADE_AD_PRICES, AD_LABELS, SHIRT_SIZES, computeShowTuition,
  type AdSize, type ShirtSize,
} from '@/lib/fees-constants'
import { validateCoupon } from './fees-actions'

interface Member { id: string; first_name: string; last_name: string }

interface FeesFormProps {
  showId: string
  showSlug: string
  showTitle: string
  eventType: string
  feesConfig: { shirt_price: number | null; tuition_amount: number | null }
  members: Member[]
}

export default function FeesForm({ showId, showSlug, showTitle, eventType, feesConfig, members }: FeesFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [shirtSizes, setShirtSizes] = useState<Record<string, ShirtSize | ''>>({})
  const [selectedAds, setSelectedAds] = useState<AdSize[]>([])
  const [couponInput, setCouponInput] = useState('')
  const [couponState, setCouponState] = useState<null | { valid: false; error: string } | { valid: true; waiveTuition: boolean; waiveShirts: boolean }>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isCamp = eventType === 'camp' || eventType === 'workshop'
  const isShow = eventType === 'show'
  const shirtPrice = feesConfig.shirt_price ?? 0
  const campTuition = feesConfig.tuition_amount ?? 0

  const selectedList = members.filter(m => selectedIds.has(m.id))

  // Compute totals
  const childCount = selectedList.length
  const rawTuition = isShow ? computeShowTuition(childCount) : campTuition * childCount
  const rawShirts = isShow && shirtPrice > 0
    ? selectedList.filter(m => shirtSizes[m.id]).length * shirtPrice
    : 0
  const adsTotal = selectedAds.reduce((sum, size) => sum + ACCOLADE_AD_PRICES[size], 0)

  let tuitionTotal = rawTuition
  let shirtsTotal = rawShirts
  if (couponState?.valid) {
    if (couponState.waiveTuition) tuitionTotal = 0
    if (couponState.waiveShirts) shirtsTotal = 0
  }
  const grandTotal = tuitionTotal + shirtsTotal + adsTotal

  function toggleMember(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAd(size: AdSize) {
    setSelectedAds(prev =>
      prev.includes(size) ? prev.filter(a => a !== size) : [...prev, size]
    )
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return
    const result = await validateCoupon(showId, couponInput)
    if (result.valid) {
      setCouponState({ valid: true, waiveTuition: result.waiveTuition, waiveShirts: result.waiveShirts })
    } else {
      setCouponState({ valid: false, error: result.error ?? 'Invalid code' })
    }
  }

  function handleSubmit() {
    if (selectedList.length === 0) return
    setSubmitError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/fees/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            show_slug: showSlug,
            family_member_ids: selectedList.map(m => m.id),
            shirt_sizes: shirtSizes,
            ads: selectedAds,
            coupon_code: couponState?.valid ? couponInput.toUpperCase().trim() : undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setSubmitError(data.error ?? 'Something went wrong')
          return
        }
        router.push(data.url)
      } catch {
        setSubmitError('Network error. Please try again.')
      }
    })
  }

  const LABEL_SM: React.CSSProperties = { fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '8px' }
  const SELECT: React.CSSProperties = { background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '8px 12px', fontSize: '0.82rem', color: 'var(--warm-white)', width: '100%' }

  return (
    <div>
      {/* Member selection */}
      <div style={{ marginBottom: '32px' }}>
        <p style={LABEL_SM}>Who is participating?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {members.map(m => (
            <div key={m.id} style={{ background: 'var(--layer)', border: `1px solid ${selectedIds.has(m.id) ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '4px', padding: '14px 18px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(m.id)}
                  onChange={() => toggleMember(m.id)}
                  style={{ marginTop: '2px', accentColor: 'var(--gold)' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--warm-white)' }}>{m.first_name} {m.last_name}</span>

                  {/* Shirt size — shows only (with shirt price) or camp (size required, $0) */}
                  {selectedIds.has(m.id) && (isCamp || shirtPrice > 0) && (
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ ...LABEL_SM, letterSpacing: '0.1em' }}>
                        Shirt Size{isCamp ? '' : ` (+$${shirtPrice.toFixed(2)})`}
                      </label>
                      <select
                        value={shirtSizes[m.id] ?? ''}
                        onChange={e => setShirtSizes(prev => ({ ...prev, [m.id]: e.target.value as ShirtSize }))}
                        style={SELECT}
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="">Select size{isCamp ? ' (required)' : ' (optional)'}</option>
                        {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Accolade ads — shows only */}
      {isShow && (
        <div style={{ marginBottom: '32px' }}>
          <p style={LABEL_SM}>Accolade Playbill Ads (optional)</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.5 }}>
            Support your performer with an ad in the production playbill.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {(Object.entries(ACCOLADE_AD_PRICES) as [AdSize, number][]).map(([size, price]) => (
              <label key={size} style={{
                display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                background: 'var(--layer)', border: `1px solid ${selectedAds.includes(size) ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: '4px', padding: '12px 14px',
              }}>
                <input
                  type="checkbox"
                  checked={selectedAds.includes(size)}
                  onChange={() => toggleAd(size)}
                  style={{ accentColor: 'var(--gold)' }}
                />
                <span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--warm-white)', display: 'block' }}>{AD_LABELS[size]}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>${price}.00</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Coupon code */}
      <div style={{ marginBottom: '32px' }}>
        <p style={LABEL_SM}>Coupon Code</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={couponInput}
            onChange={e => { setCouponInput(e.target.value); setCouponState(null) }}
            placeholder="Enter code"
            style={{ ...SELECT, flex: 1 }}
            maxLength={20}
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={!couponInput.trim() || couponState?.valid === true}
            className="btn-primary"
            style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
          >
            <span>Apply</span>
          </button>
        </div>
        {couponState && (
          <p style={{ fontSize: '0.78rem', marginTop: '6px', color: couponState.valid ? 'var(--teal)' : 'var(--rose)' }}>
            {couponState.valid
              ? `Applied: ${[couponState.waiveTuition && 'tuition waived', couponState.waiveShirts && 'shirts waived'].filter(Boolean).join(' + ')}`
              : couponState.error}
          </p>
        )}
      </div>

      {/* Order summary */}
      <div style={{ background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px 24px', marginBottom: '24px' }}>
        <p style={LABEL_SM}>Order Summary</p>
        {childCount === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Select at least one participant above.</p>
        ) : (
          <>
            {tuitionTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '6px' }}>
                <span>Tuition ({childCount} {childCount === 1 ? 'child' : 'children'})</span>
                <span>${tuitionTotal.toFixed(2)}</span>
              </div>
            )}
            {rawTuition > 0 && tuitionTotal === 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '6px' }}>
                <span>Tuition <s>${rawTuition.toFixed(2)}</s></span>
                <span style={{ color: 'var(--teal)' }}>$0.00</span>
              </div>
            )}
            {shirtsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '6px' }}>
                <span>Shirts</span>
                <span>${shirtsTotal.toFixed(2)}</span>
              </div>
            )}
            {rawShirts > 0 && shirtsTotal === 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '6px' }}>
                <span>Shirts <s>${rawShirts.toFixed(2)}</s></span>
                <span style={{ color: 'var(--teal)' }}>$0.00</span>
              </div>
            )}
            {adsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '6px' }}>
                <span>Playbill Ads</span>
                <span>${adsTotal.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--warm-white)', fontWeight: 600, marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--gold)' }}>${grandTotal.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {submitError && <p style={{ fontSize: '0.78rem', color: 'var(--rose)', marginBottom: '12px' }}>{submitError}</p>}

      <button
        onClick={handleSubmit}
        disabled={pending || selectedList.length === 0}
        className="btn-primary"
        style={{ fontSize: '0.85rem', width: '100%' }}
      >
        <span>{grandTotal === 0 ? 'Confirm (No Charge)' : `Pay $${grandTotal.toFixed(2)}`}</span>
      </button>
    </div>
  )
}
