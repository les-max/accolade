'use client'

import { useState, useTransition } from 'react'
import { addTicketCoupon, deleteTicketCoupon, type TicketCouponRow } from './ticket-actions'
export type { TicketCouponRow }

interface Props {
  showId: string
  slug: string
  coupons: TicketCouponRow[]
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '8px 12px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

export default function TicketCouponManager({ showId, slug, coupons }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [maxUses, setMaxUses] = useState('')

  function handleAdd() {
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) { setError('Code is required'); return }
    const value = parseFloat(discountValue)
    if (isNaN(value) || value <= 0) { setError('Discount value must be a positive number'); return }
    if (discountType === 'percent' && value > 100) { setError('Percent discount cannot exceed 100'); return }
    const uses = maxUses.trim() === '' ? null : parseInt(maxUses)
    if (maxUses.trim() !== '' && (isNaN(uses!) || uses! < 1)) { setError('Max uses must be a positive integer or blank for unlimited'); return }

    setError('')
    startTransition(async () => {
      try {
        await addTicketCoupon(showId, slug, trimmedCode, discountType, value, uses ?? null)
        setCode('')
        setDiscountValue('')
        setMaxUses('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error saving coupon')
      }
    })
  }

  function handleDelete(couponId: string) {
    setError('')
    startTransition(async () => {
      try {
        await deleteTicketCoupon(couponId, showId, slug)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting coupon')
      }
    })
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div
        style={{
          background: 'var(--layer)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Ticket Coupon Codes
          </p>
        </div>

        {/* Add form */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: coupons.length > 0 ? '1px solid var(--border)' : 'none',
            display: 'grid',
            gridTemplateColumns: '1fr 130px 130px 100px auto',
            gap: '10px',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Code
            </label>
            <input
              type="text"
              placeholder="e.g. OPENING20"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              disabled={isPending}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Type
            </label>
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as 'percent' | 'amount')}
              disabled={isPending}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="percent">% off</option>
              <option value="amount">$ off</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Value
            </label>
            <input
              type="number"
              min="0.01"
              step={discountType === 'percent' ? '1' : '0.01'}
              placeholder={discountType === 'percent' ? '10' : '5.00'}
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              disabled={isPending}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Max Uses
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="∞"
              value={maxUses}
              onChange={e => setMaxUses(e.target.value)}
              disabled={isPending}
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !code.trim() || !discountValue.trim()}
            style={{
              padding: '8px 16px',
              background: 'rgba(61,158,140,0.15)',
              border: '1px solid rgba(61,158,140,0.3)',
              borderRadius: '2px',
              color: 'var(--teal)',
              fontSize: '0.78rem',
              cursor: isPending || !code.trim() || !discountValue.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: isPending || !code.trim() || !discountValue.trim() ? 0.5 : 1,
            }}
          >
            Add
          </button>
        </div>

        {/* Existing coupons */}
        {coupons.length > 0 && (
          <div>
            {coupons.map((c, i) => (
              <div
                key={c.id}
                style={{
                  padding: '12px 24px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      color: 'var(--warm-white)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {c.code}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--gold)' }}>
                    {c.discount_type === 'percent'
                      ? `${c.discount_value}% off`
                      : `$${c.discount_value.toFixed(2)} off`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {c.use_count} used
                    {c.max_uses !== null ? ` / ${c.max_uses} max` : ' (unlimited)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={isPending}
                  style={{
                    padding: '4px 12px',
                    background: 'transparent',
                    border: '1px solid rgba(224,112,112,0.3)',
                    borderRadius: '2px',
                    color: 'var(--rose, #e07070)',
                    fontSize: '0.72rem',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--border)',
              color: '#e07070',
              fontSize: '0.82rem',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
