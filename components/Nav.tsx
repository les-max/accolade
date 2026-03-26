'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/about',        label: 'About' },
  { href: '/auditions',    label: 'Auditions' },
  { href: '/past-shows',   label: 'Past Shows' },
  { href: '/volunteering', label: 'Volunteer' },
  { href: '/partners',     label: 'Partners' },
  { href: '/donate',       label: 'Donate' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  const pathname                = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      padding: scrolled ? '18px 48px' : '28px 48px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'background 0.4s, padding 0.4s',
      background: scrolled ? 'rgba(14,13,20,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : undefined,
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : undefined,
    }}>

      {/* Logo */}
      <Link href="/" aria-label="Accolade Community Theatre — home" style={{ display: 'flex', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/accolade-logo.png" alt="Accolade Community Theatre" style={{ height: '40px', width: 'auto', display: 'block' }} />
      </Link>

      {/* Desktop nav links */}
      <ul style={{ display: 'flex', gap: '36px', listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}>
        {navLinks.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} style={{
              color: pathname === href ? 'var(--gold)' : 'var(--warm-white)',
              textDecoration: 'none',
              fontSize: '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}>
              {label}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/tickets" style={{
            padding: '8px 20px',
            border: '1px solid var(--gold)',
            color: 'var(--gold)',
            borderRadius: '2px',
            textDecoration: 'none',
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            Get Tickets
          </Link>
        </li>
      </ul>
    </nav>
  );
}
