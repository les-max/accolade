'use client'

import { useTransition } from 'react'
import { updateShowStatus } from './actions'

type Status = 'draft' | 'active' | 'closed'

const TRANSITIONS: Record<Status, { next: Status; label: string; color: string }> = {
  draft:  { next: 'active', label: 'Set Active',  color: 'var(--gold)' },
  active: { next: 'closed', label: 'Close Show',  color: 'var(--rose)' },
  closed: { next: 'draft',  label: 'Reopen Draft', color: 'var(--muted)' },
}

export default function StatusControl({
  showId,
  currentStatus,
  slug,
}: {
  showId: string
  currentStatus: Status
  slug: string
}) {
  const [isPending, startTransition] = useTransition()
  const t = TRANSITIONS[currentStatus]

  function handleClick() {
    startTransition(async () => {
      await updateShowStatus(showId, t.next, slug)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        background: 'none',
        border: `1px solid ${t.color}`,
        borderRadius: '2px',
        color: t.color,
        fontSize: '0.65rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        padding: '10px 18px',
        cursor: 'pointer',
        opacity: isPending ? 0.6 : 1,
        whiteSpace: 'nowrap',
        transition: 'all 0.2s',
      }}
    >
      {isPending ? 'Updating…' : t.label}
    </button>
  )
}
