'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type OptionGroup = {
  id: string
  name: string
  required: boolean
  options: { id: string; name: string }[]
}

type TicketPerf = {
  id: string
  price: number
  capacity: number
  available: number
  date: string
  start_time: string | null
  label: string | null
  optionGroups: OptionGroup[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '4px',
  padding: '12px 16px',
  color: '#e8e4dc',
  fontSize: '1rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const stepperBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '32px',
  height: '32px',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '4px',
  background: 'rgba(255,255,255,0.04)',
  color: disabled ? '#3a3850' : '#e8e4dc',
  fontSize: '1.2rem',
  lineHeight: 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

export default function TicketCheckoutForm({ performances }: { performances: TicketPerf[] }) {
  const router = useRouter()

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(performances.map(p => [p.id, 0]))
  )
  // optionQtys[ticket_perf_id][option_id] = quantity chosen
  const [optionQtys, setOptionQtys] = useState<Record<string, Record<string, number>>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedItems = performances.filter(p => (quantities[p.id] ?? 0) > 0)
  const total = selectedItems.reduce((sum, p) => sum + (quantities[p.id] ?? 0) * p.price, 0)
  const totalQty = selectedItems.reduce((sum, p) => sum + (quantities[p.id] ?? 0), 0)
  const hasSelection = selectedItems.length > 0

  function optionsValid(): boolean {
    for (const p of selectedItems) {
      for (const group of p.optionGroups) {
        if (!group.required) continue
        const total = group.options.reduce((sum, opt) => sum + (optionQtys[p.id]?.[opt.id] ?? 0), 0)
        if (total !== (quantities[p.id] ?? 0)) return false
      }
    }
    return true
  }
  const allOptionsValid = optionsValid()

  function setQty(id: string, n: number) {
    setQuantities(q => ({ ...q, [id]: n }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasSelection || !name.trim() || !email.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/tickets/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map(p => ({
            ticket_performance_id: p.id,
            quantity: quantities[p.id],
            options: p.optionGroups.flatMap(g =>
              g.options
                .map(opt => ({ ticket_option_id: opt.id, quantity: optionQtys[p.id]?.[opt.id] ?? 0 }))
                .filter(o => o.quantity > 0)
            ),
          })),
          buyer_name: name.trim(),
          buyer_email: email.trim().toLowerCase(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      router.push(data.url)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (performances.every(p => p.available === 0)) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#a09db8', fontSize: '1rem' }}>Tickets are sold out. Contact us about group or partner reservations.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* Performance rows with qty steppers */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '12px' }}>
          {performances.length === 1 ? 'Performance' : 'Select Performances'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {performances.map(p => {
            const qty = quantities[p.id] ?? 0
            const isSoldOut = p.available === 0
            const maxQty = Math.min(8, p.available)
            const sold = p.capacity - p.available
            const pctSold = p.capacity > 0 ? sold / p.capacity : 0
            const isSelected = qty > 0
            return (
              <div key={p.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  border: `1px solid ${isSelected ? '#d4a853' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(212,168,83,0.08)' : isSoldOut ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                  opacity: isSoldOut ? 0.5 : 1,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#e8e4dc', fontWeight: isSelected ? 600 : 400 }}>
                    {formatDate(p.date)}
                    {p.start_time && <span style={{ color: '#a09db8', fontWeight: 400 }}> &middot; {formatTime(p.start_time)}</span>}
                  </p>
                  {p.label && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#a09db8' }}>{p.label}</p>}
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: pctSold > 0.8 ? '#e07070' : '#6b6880' }}>
                    {isSoldOut ? 'Sold out' : pctSold > 0.8 ? `${p.available} left · $${p.price.toFixed(2)}` : `$${p.price.toFixed(2)} per ticket`}
                  </p>
                </div>
                {!isSoldOut && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => setQty(p.id, Math.max(0, qty - 1))} disabled={qty === 0} style={stepperBtnStyle(qty === 0)}>−</button>
                    <span style={{ width: '24px', textAlign: 'center', fontSize: '1rem', color: '#e8e4dc', fontWeight: isSelected ? 700 : 400 }}>
                      {qty}
                    </span>
                    <button type="button" onClick={() => setQty(p.id, Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} style={stepperBtnStyle(qty >= maxQty)}>+</button>
                  </div>
                )}
              </div>
              {/* Option groups — shown when this performance has qty selected */}
              {qty > 0 && p.optionGroups.length > 0 && (
                <div style={{ marginTop: '2px' }}>
                  {p.optionGroups.map(group => {
                    const chosen = group.options.reduce((sum, opt) => sum + (optionQtys[p.id]?.[opt.id] ?? 0), 0)
                    const needed = qty
                    const complete = chosen === needed
                    return (
                      <div
                        key={group.id}
                        style={{
                          padding: '12px 20px',
                          border: `1px solid ${complete ? 'rgba(61,158,140,0.3)' : 'rgba(212,168,83,0.3)'}`,
                          borderTop: 'none',
                          borderRadius: '0 0 6px 6px',
                          background: 'rgba(0,0,0,0.15)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <p style={{ margin: 0, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a09db8' }}>
                            {group.name}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: complete ? 'var(--teal, #3d9e8c)' : '#d4a853' }}>
                            {chosen} / {needed} selected
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {group.options.map(opt => {
                            const optQty = optionQtys[p.id]?.[opt.id] ?? 0
                            const remaining = needed - chosen
                            return (
                              <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.88rem', color: '#e8e4dc' }}>{opt.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setOptionQtys(s => ({ ...s, [p.id]: { ...(s[p.id] ?? {}), [opt.id]: Math.max(0, optQty - 1) } }))}
                                    disabled={optQty === 0}
                                    style={stepperBtnStyle(optQty === 0)}
                                  >−</button>
                                  <span style={{ width: '24px', textAlign: 'center', fontSize: '1rem', color: '#e8e4dc' }}>{optQty}</span>
                                  <button
                                    type="button"
                                    onClick={() => setOptionQtys(s => ({ ...s, [p.id]: { ...(s[p.id] ?? {}), [opt.id]: optQty + 1 } }))}
                                    disabled={remaining <= 0}
                                    style={stepperBtnStyle(remaining <= 0)}
                                  >+</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            )
          })}
        </div>
      </div>

      {/* Buyer info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '8px' }}>
            Your Name
          </label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '8px' }}>
            Email
          </label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
        </div>
      </div>

      {/* Total */}
      {hasSelection && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6880' }}>Total</p>
            <p style={{ margin: '2px 0 0', fontSize: '1.6rem', color: '#d4a853', fontWeight: 700, letterSpacing: '-0.02em' }}>${total.toFixed(2)}</p>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: '#e07070', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !hasSelection || !name.trim() || !email.trim() || !allOptionsValid}
        style={{
          width: '100%',
          padding: '16px',
          background: loading ? 'rgba(212,168,83,0.5)' : '#d4a853',
          color: '#0e0d14',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.9rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: loading ? 'wait' : !hasSelection || !name.trim() || !email.trim() || !allOptionsValid ? 'not-allowed' : 'pointer',
          opacity: !hasSelection || !name.trim() || !email.trim() || !allOptionsValid ? 0.5 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {loading
          ? 'Redirecting to checkout…'
          : hasSelection
            ? `Buy ${totalQty} Ticket${totalQty !== 1 ? 's' : ''} — $${total.toFixed(2)}`
            : 'Select tickets above'}
      </button>

      <p style={{ margin: '16px 0 0', fontSize: '0.75rem', color: '#6b6880', textAlign: 'center', lineHeight: 1.5 }}>
        Secure checkout via Stripe. You&apos;ll receive a confirmation email after purchase.
      </p>
    </form>
  )
}
