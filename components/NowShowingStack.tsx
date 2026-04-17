'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type StackEvent = {
  id: string
  title: string
  event_type: string
  start_date: string | null
  end_date: string | null
  show_image_wide: string | null
  cta_label: string | null
  cta_url: string | null
}

const TYPE_COLORS: Record<string, string> = {
  show:     'var(--teal)',
  audition: 'var(--gold)',
  camp:     'var(--rose)',
  workshop: 'var(--amber)',
  event:    'var(--muted)',
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return ''
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  if (!end || end === start) return s
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return `${s} – ${e}`
}

function SlotCard({ event, visible }: { event: StackEvent; visible: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        borderRadius: '4px',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      {event.show_image_wide ? (
        <Image src={event.show_image_wide} alt={event.title} fill style={{ objectFit: 'cover' }} sizes="40vw" />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a2030, #0e1020)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.9) 0%, rgba(14,13,20,0.1) 60%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '32px', zIndex: 2 }}>
        <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: TYPE_COLORS[event.event_type] ?? 'var(--muted)', marginBottom: '10px', fontWeight: 500 }}>
          {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
          {formatDateRange(event.start_date, event.end_date) && (
            <span style={{ color: 'var(--muted)', marginLeft: '10px' }}>
              {formatDateRange(event.start_date, event.end_date)}
            </span>
          )}
        </p>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700 }}>{event.title}</h3>
        {event.cta_label && event.cta_url && (
          <Link href={event.cta_url} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
            {event.cta_label} →
          </Link>
        )}
      </div>
    </div>
  )
}

export default function NowShowingStack({ events }: { events: StackEvent[] }) {
  const [idx1, setIdx1] = useState(0)
  const [idx2, setIdx2] = useState(Math.min(1, events.length - 1))
  const [vis1, setVis1] = useState(true)
  const [vis2, setVis2] = useState(true)

  const timer1 = useRef<ReturnType<typeof setInterval> | null>(null)
  const timer2 = useRef<ReturnType<typeof setInterval> | null>(null)
  const delay2 = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shouldRotate = events.length > 2

  useEffect(() => {
    if (!shouldRotate) return

    function cycleSlot(
      setIdx: React.Dispatch<React.SetStateAction<number>>,
      setVis: React.Dispatch<React.SetStateAction<boolean>>,
    ) {
      setVis(false)
      setTimeout(() => {
        setIdx(prev => (prev + 1) % events.length)
        setVis(true)
      }, 400)
    }

    timer1.current = setInterval(() => cycleSlot(setIdx1, setVis1), 8000)

    // Slot 2 starts 3.5s after slot 1 so they stagger visibly
    delay2.current = setTimeout(() => {
      timer2.current = setInterval(() => cycleSlot(setIdx2, setVis2), 8000)
    }, 3500)

    return () => {
      if (timer1.current) clearInterval(timer1.current)
      if (timer2.current) clearInterval(timer2.current)
      if (delay2.current) clearTimeout(delay2.current)
    }
  }, [shouldRotate, events.length])

  const event1 = events[idx1]
  const event2 = events.length > 1 ? events[idx2] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SlotCard event={event1} visible={vis1} />
      {event2 && <SlotCard event={event2} visible={vis2} />}
    </div>
  )
}
