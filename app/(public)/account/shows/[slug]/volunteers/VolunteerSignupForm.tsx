'use client'

import { useState, useTransition } from 'react'
import { claimVolunteerPosition, unclaimVolunteerPosition } from './volunteer-portal-actions'

interface Position {
  id: string
  name: string
  description: string | null
  capacity: number
  position_type: 'open' | 'assigned'
  signupCount: number
  mySignupId: string | null
}

export default function VolunteerSignupForm({
  showId,
  showSlug,
  positions,
}: {
  showId: string
  showSlug: string
  positions: Position[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  function handleClaim(positionId: string, showId: string) {
    setError(null)
    setActiveId(positionId)
    startTransition(async () => {
      try {
        await claimVolunteerPosition(positionId, showId, showSlug)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not claim this position. It may already be full.')
      } finally {
        setActiveId(null)
      }
    })
  }

  function handleUnclaim(signupId: string, positionId: string) {
    setError(null)
    setActiveId(positionId)
    startTransition(async () => {
      try {
        await unclaimVolunteerPosition(signupId, showSlug)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not remove your signup.')
      } finally {
        setActiveId(null)
      }
    })
  }

  const openPositions = positions.filter(p => p.position_type === 'open')
  const mySignups = positions.filter(p => p.mySignupId !== null)

  return (
    <div>
      {error && (
        <div style={{
          background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.3)',
          borderRadius: '4px', padding: '12px 16px', marginBottom: '24px',
          fontSize: '0.82rem', color: 'var(--rose)',
        }}>
          {error}
        </div>
      )}

      {mySignups.length > 0 && (
        <div style={{ background: 'var(--layer)', border: '1px solid rgba(0,189,157,0.3)', borderRadius: '4px', overflow: 'hidden', marginBottom: '32px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--teal)' }}>
              Your Signup{mySignups.length > 1 ? 's' : ''}
            </p>
          </div>
          {mySignups.map((pos, i) => (
            <div key={pos.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
              padding: '16px 20px',
              borderBottom: i < mySignups.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '2px' }}>{pos.name}</p>
                {pos.description && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{pos.description}</p>
                )}
              </div>
              <button
                onClick={() => handleUnclaim(pos.mySignupId!, pos.id)}
                disabled={isPending && activeId === pos.id}
                style={{
                  fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--muted)', background: 'transparent',
                  border: '1px solid rgba(160,160,181,0.3)', borderRadius: '2px',
                  padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
                  opacity: isPending && activeId === pos.id ? 0.5 : 1,
                }}
              >
                {isPending && activeId === pos.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {openPositions.map(pos => {
          const isClaimed = pos.mySignupId !== null
          const spotsLeft = pos.capacity - pos.signupCount
          const isFull = spotsLeft <= 0 && !isClaimed
          const isThisPending = isPending && activeId === pos.id

          return (
            <div key={pos.id} style={{
              background: 'var(--layer)',
              border: `1px solid ${isClaimed ? 'rgba(0,189,157,0.3)' : 'var(--border)'}`,
              borderRadius: '4px',
              padding: '18px 20px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
              opacity: isFull ? 0.6 : 1,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: pos.description ? '4px' : '6px' }}>
                  {pos.name}
                </p>
                {pos.description && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '6px' }}>{pos.description}</p>
                )}
                <p style={{ fontSize: '0.7rem', color: isFull ? 'var(--rose)' : 'var(--muted)' }}>
                  {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining`}
                </p>
              </div>
              {!isFull && (
                <button
                  disabled={isPending || isThisPending}
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                    borderRadius: '2px',
                    opacity: isThisPending ? 0.5 : 1,
                    ...(isClaimed
                      ? { background: 'transparent', color: 'var(--teal)', border: '1px solid rgba(0,189,157,0.4)' }
                      : { background: 'var(--gold)', color: 'var(--black)', border: 'none' }),
                  }}
                  onClick={() => {
                    if (isClaimed) handleUnclaim(pos.mySignupId!, pos.id)
                    else handleClaim(pos.id, showId)
                  }}
                >
                  {isThisPending ? '…' : isClaimed ? 'Signed up ✓' : 'Claim Spot'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {openPositions.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>
          No open volunteer positions are available right now.
        </p>
      )}
    </div>
  )
}
