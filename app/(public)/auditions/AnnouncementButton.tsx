'use client'

import { useState } from 'react'

export default function AnnouncementButton({ announcement, slug }: { announcement: string; slug: string }) {
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

            <div
              className="announcement-body"
              dangerouslySetInnerHTML={{ __html: announcement }}
            />

            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <a
                href={`/auditions/${slug}/announcement`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--muted)', textDecoration: 'none',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download as PDF
              </a>
            </div>

            <style>{`
              .announcement-body { color: var(--warm-white); font-size: 0.9rem; line-height: 1.8; }
              .announcement-body p { margin: 0 0 10px; }
              .announcement-body p:last-child { margin-bottom: 0; }
              .announcement-body strong { color: var(--warm-white); }
              .announcement-body em { color: var(--muted); }
              .announcement-body h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; margin: 16px 0 8px; }
              .announcement-body ul, .announcement-body ol { padding-left: 20px; margin: 0 0 10px; }
              .announcement-body li { margin-bottom: 4px; }
              .announcement-body blockquote { border-left: 2px solid var(--gold); padding-left: 12px; color: var(--muted); margin: 10px 0; font-style: italic; }
            `}</style>
          </div>
        </div>
      )}
    </>
  )
}
