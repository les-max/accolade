'use client'

import { useState } from 'react'

export default function AnnouncementButton({ announcement }: { announcement: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost"
        style={{ fontSize: '0.72rem' }}
      >
        <span>Audition Announcement</span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(14,13,20,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: 'clamp(28px, 5vw, 48px)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', fontSize: '1.2rem', lineHeight: 1,
                padding: '4px 8px',
              }}
            >
              ×
            </button>

            <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>
              Audition Announcement
            </p>

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--warm-white)', fontSize: '0.9rem' }}>
              {announcement}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
