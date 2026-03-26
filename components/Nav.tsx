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
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <nav className={`site-nav${scrolled ? ' scrolled' : ''}`} aria-label="Main navigation">
      <Link href="/" className="nav-logo" aria-label="Accolade Community Theatre — home">
        Accolade&nbsp;Theatre
      </Link>

      {/* Desktop links */}
      <ul className="nav-links" role="list">
        {navLinks.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} aria-current={pathname === href ? 'page' : undefined}>
              {label}
            </Link>
          </li>
        ))}
        <li className="nav-cta">
          <Link href="/tickets">Get Tickets</Link>
        </li>
      </ul>

      {/* Mobile hamburger */}
      <button
        className="nav-hamburger"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span style={{ transform: open ? 'rotate(45deg) translate(5px, 5px)' : undefined }} />
        <span style={{ opacity: open ? 0 : undefined }} />
        <span style={{ transform: open ? 'rotate(-45deg) translate(5px, -5px)' : undefined }} />
      </button>

      {/* Mobile menu */}
      <ul className={`nav-links${open ? ' open' : ''}`} role="list" aria-hidden={!open}>
        {navLinks.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} aria-current={pathname === href ? 'page' : undefined}>
              {label}
            </Link>
          </li>
        ))}
        <li className="nav-cta">
          <Link href="/tickets">Get Tickets</Link>
        </li>
      </ul>
    </nav>
  );
}
