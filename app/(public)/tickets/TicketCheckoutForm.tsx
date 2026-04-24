'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TicketPerf = {
  id: string
  price: number
  capacity: number
  available: number
  date: string
  start_time: string | null
  label: string | null
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

export default function TicketCheckoutForm({ performances }: { performances: TicketPerf[] }) {
  const router = useRouter()
  const available = performances.filter(p => p.available > 0)

  const [selectedId, setSelectedId] = useState(available[0]?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = performances.find(p => p.id === selectedId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !name.trim() || !email.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/tickets/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_performance_id: selectedId,
          quantity,
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

  if (available.length === 0) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#a09db8', fontSize: '1rem' }}>Tickets are sold out. Contact us about group or partner reservations.</p>
      </div>
    )
  }

  const maxQty = Math.min(8, selected?.available ?? 8)
  const total = selected ? (selected.price * quantity).toFixed(2) : '0.00'

  return (
    <form onSubmit={handleSubmit}>

      {/* Performance selection */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '12px' }}>Select Performance</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {performances.map(p => {
            const sold = p.capacity - p.available
            const pctSold = p.capacity > 0 ? sold / p.capacity : 0
            const isSelected = selectedId === p.id
            const isSoldOut = p.available === 0
            return (
              <label
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  border: `1px solid ${isSelected ? '#d4a853' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(212,168,83,0.08)' : 'rgba(255,255,255,0.02)',
                  cursor: isSoldOut ? 'not-allowed' : 'pointer',
                  opacity: isSoldOut ? 0.5 : 1,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="performance"
                  value={p.id}
                  checked={isSelected}
                  disabled={isSoldOut}
                  onChange={() => { setSelectedId(p.id); setQuantity(1) }}
                  style={{ accentColor: '#d4a853' }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#e8e4dc', fontWeight: isSelected ? 600 : 400 }}>
                    {formatDate(p.date)}
                    {p.start_time && <span style={{ color: '#a09db8', fontWeight: 400 }}> &middot; {formatTime(p.start_time)}</span>}
                  </p>
                  {p.label && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b6880' }}>{p.label}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: '1rem', color: '#d4a853', fontWeight: 600 }}>${p.price.toFixed(2)}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: pctSold > 0.8 ? '#e07070' : '#6b6880' }}>
                    {isSoldOut ? 'Sold out' : pctSold > 0.8 ? `${p.available} left` : 'Available'}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Quantity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '8px' }}>
            Quantity
          </label>
          <select
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}
          >
            {Array.from({ length: maxQty }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n} ticket{n !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '2px' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b6880' }}>Total</p>
          <p style={{ margin: '2px 0 0', fontSize: '1.6rem', color: '#d4a853', fontWeight: 700, letterSpacing: '-0.02em' }}>${total}</p>
        </div>
      </div>

      {/* Buyer info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '8px' }}>
            Your Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full name"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a09db8', marginBottom: '8px' }}>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <p style={{ color: '#e07070', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !selected || !name.trim() || !email.trim()}
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
          cursor: loading ? 'wait' : 'pointer',
          opacity: !selected || !name.trim() || !email.trim() ? 0.5 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {loading ? 'Redirecting to checkout…' : `Buy ${quantity} Ticket${quantity !== 1 ? 's' : ''} — $${total}`}
      </button>

      <p style={{ margin: '16px 0 0', fontSize: '0.75rem', color: '#6b6880', textAlign: 'center', lineHeight: 1.5 }}>
        Secure checkout via Stripe. You'll receive a confirmation email after purchase.
      </p>
    </form>
  )
}
