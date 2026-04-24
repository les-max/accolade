'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { archiveShow, deleteShow } from './actions'

export default function EventRowActions({
  id,
  archived,
}: {
  id: string
  archived: boolean
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleArchive() {
    startTransition(async () => {
      await archiveShow(id, !archived)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm('Permanently delete this event? This will remove all associated audition slots and registrations and cannot be undone.')) return
    startTransition(async () => {
      await deleteShow(id)
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
      <button
        onClick={handleArchive}
        disabled={pending}
        style={{
          background: 'none',
          border: 'none',
          cursor: pending ? 'default' : 'pointer',
          fontSize: '0.68rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: archived ? 'var(--teal)' : 'var(--muted)',
          opacity: pending ? 0.5 : 1,
          padding: 0,
        }}
      >
        {archived ? 'Restore' : 'Archive'}
      </button>
      <button
        onClick={handleDelete}
        disabled={pending}
        style={{
          background: 'none',
          border: 'none',
          cursor: pending ? 'default' : 'pointer',
          fontSize: '0.68rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--rose)',
          opacity: pending ? 0.5 : 1,
          padding: 0,
        }}
      >
        Delete
      </button>
    </div>
  )
}
