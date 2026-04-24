'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type DropdownItem = { href: string; label: string };
type NavItem =
  | { type: 'link';     href: string; label: string }
  | { type: 'dropdown'; label: string; items: DropdownItem[] };

const NAV_ITEMS: NavItem[] = [
  { type: 'link', href: '/about', label: 'About' },
  {
    type: 'dropdown',
    label: 'Upcoming',
    items: [
      { href: '/current-season', label: 'Current Season' },
      { href: '/auditions',      label: 'Auditions' },
    ],
  },
  { type: 'link', href: '/past-shows', label: 'Past Shows' },
  {
    type: 'dropdown',
    label: 'Join Us',
    items: [
      { href: '/volunteering', label: 'Volunteer' },
      { href: '/partners',     label: 'Partner' },
      { href: '/partners',     label: 'Sponsor' },
      { href: '/donate',       label: 'Donate' },
    ],
  },
  { type: 'link', href: '/tickets', label: 'Tickets' },
];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.55, flexShrink: 0 }}
    >
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Nav() {
  const [scrolled, setScrolled]         = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [signedIn, setSignedIn]         = useState(false);
  const pathname                        = usePathname();
  const navRef                          = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const baseLinkStyle: React.CSSProperties = {
    color: 'var(--warm-white)',
    textDecoration: 'none',
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontWeight: 500,
  };

  return (
    <nav
      ref={navRef}
      className={`site-nav${scrolled ? ' scrolled' : ''}`}
      style={{
        background: (scrolled || menuOpen) ? 'rgba(14,13,20,0.95)' : 'transparent',
        backdropFilter: (scrolled || menuOpen) ? 'blur(16px)' : undefined,
        borderBottom: (scrolled || menuOpen) ? '1px solid rgba(255,255,255,0.07)' : undefined,
      }}
    >
      {/* Logo */}
      <Link href="/" aria-label="Accolade Community Theatre — home" style={{ display: 'flex', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/accolade-logo.png" alt="Accolade Community Theatre" style={{ height: '40px', width: 'auto', display: 'block' }} />
      </Link>

      {/* Hamburger */}
      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Nav links */}
      <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
        {NAV_ITEMS.map(item => {
          if (item.type === 'link') {
            return (
              <li key={item.href}>
                <Link href={item.href} style={{ ...baseLinkStyle, color: pathname === item.href ? 'var(--gold)' : 'var(--warm-white)' }}>
                  {item.label}
                </Link>
              </li>
            );
          }

          const isActive = item.items.some(i => pathname === i.href);
          const isOpen   = openDropdown === item.label;

          return (
            <li
              key={item.label}
              style={{ position: 'relative' }}
              onMouseEnter={() => { if (!menuOpen) setOpenDropdown(item.label); }}
              onMouseLeave={() => { if (!menuOpen) setOpenDropdown(null); }}
            >
              <button
                onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                style={{
                  ...baseLinkStyle,
                  color: isActive ? 'var(--gold)' : 'var(--warm-white)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  verticalAlign: 'middle',
                }}
                aria-haspopup="true"
                aria-expanded={isOpen}
              >
                {item.label}
                <Chevron open={isOpen} />
              </button>

              {/* Desktop floating panel — starts at 100% so no gap breaks hover */}
              {isOpen && !menuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  paddingTop: '16px',
                  zIndex: 100,
                }}>
                  <div style={{
                    position: 'relative',
                    minWidth: '180px',
                    background: 'rgba(14,13,20,0.98)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    padding: '8px 0',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-5px', left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '8px', height: '8px',
                      background: 'rgba(14,13,20,0.98)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderBottom: 'none', borderRight: 'none',
                    }} />
                    {item.items.map(({ href, label }) => (
                      <Link
                        key={label}
                        href={href}
                        style={{
                          display: 'block',
                          padding: '10px 20px',
                          fontSize: '0.72rem',
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: pathname === href ? 'var(--gold)' : 'var(--muted)',
                          textDecoration: 'none',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm-white)')}
                        onMouseLeave={e => (e.currentTarget.style.color = pathname === href ? 'var(--gold)' : 'var(--muted)')}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile inline expansion */}
              {isOpen && menuOpen && (
                <div style={{ paddingLeft: '16px', marginTop: '6px' }}>
                  {item.items.map(({ href, label }) => (
                    <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Link href={href} style={{ ...baseLinkStyle, fontSize: '0.88rem', color: pathname === href ? 'var(--gold)' : 'var(--muted)' }}>
                        {label}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}

        {signedIn && (
          <li key="dashboard">
            <Link href="/account" style={{ ...baseLinkStyle, color: pathname.startsWith('/account') ? 'var(--gold)' : 'var(--warm-white)' }}>
              Dashboard
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
