'use client'

import { useEffect } from 'react'

type Props = {
  videoId: string
  title: string
  onClose: () => void
}

export default function VideoModal({ videoId, title, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(5,4,10,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 48px)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: '100%', maxWidth: '1200px' }}
      >
        <button
          onClick={onClose}
          aria-label="Close video"
          style={{
            position: 'absolute', top: '-44px', right: '0',
            background: 'transparent', border: 'none', color: 'var(--warm-white)',
            fontSize: '1.4rem', cursor: 'pointer', padding: '4px 8px',
            letterSpacing: '0.1em',
          }}
        >
          Close ✕
        </button>
        <div style={{ position: 'relative', aspectRatio: '16/9', width: '100%', background: '#000', borderRadius: '4px', overflow: 'hidden' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
