'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

// Each column: vertical offset (px) + which photo to start from
const COLUMNS = [
  { offset: 0,    startAt: 0 },
  { offset: -90,  startAt: 2 },
  { offset: 40,   startAt: 4 },
  { offset: -55,  startAt: 1 },
  { offset: 20,   startAt: 3 },
];

export default function HeroPhotoLayer({ photos }: { photos: string[] }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (layerRef.current) {
            layerRef.current.style.transform = `translateY(${window.scrollY * 0.4}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={layerRef}
      style={{
        position: 'absolute',
        top: '-20%',
        left: 0,
        right: 0,
        height: '145%',
        zIndex: 0,
        display: 'flex',
        gap: '5px',
        opacity: 0.38,
        willChange: 'transform',
      }}
    >
      {COLUMNS.map((col, ci) => (
        <div
          key={ci}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            marginTop: `${col.offset}px`,
          }}
        >
          {[0, 1, 2, 3, 4].map((ti) => {
            const src = photos[(col.startAt + ti) % photos.length];
            return (
              <div
                key={ti}
                style={{
                  flex: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '2px',
                  filter: 'grayscale(0.8) brightness(0.55) saturate(0.4)',
                }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="20vw"
                  priority={ti === 0}
                />
                {/* teal → gold color overlay for gradient-map feel */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(160deg, rgba(61,158,140,0.5) 0%, rgba(212,168,83,0.35) 100%)',
                  mixBlendMode: 'overlay',
                }} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
