'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Dashboard',  href: '/account' },
  { label: 'My Family',  href: '/account/family' },
  { label: 'Auditions',  href: '/account/auditions' },
  { label: 'Calendar',   href: '/account/calendar' },
]

export default function AccountNav({ hasFamily, isAdmin }: { hasFamily: boolean; isAdmin: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--deep)',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 clamp(20px, 5vw, 48px)',
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
        {navItems.map(({ label, href }) => {
          const active = pathname === href || (href !== '/account' && pathname.startsWith(href))
          const disabled = !hasFamily && href !== '/account' && href !== '/account/family'
          return (
            <Link
              key={href}
              href={disabled ? '#' : href}
              style={{
                display: 'inline-block',
                padding: '18px 20px',
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontWeight: 500,
                textDecoration: 'none',
                color: active ? 'var(--gold)' : disabled ? 'var(--muted-dim)' : 'var(--muted)',
                borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s',
                cursor: disabled ? 'not-allowed' : 'pointer',
                pointerEvents: disabled ? 'none' : 'auto',
              }}
            >
              {label}
            </Link>
          )
        })}
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            style={{
              display: 'inline-block',
              padding: '18px 20px',
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 500,
              textDecoration: 'none',
              color: 'var(--rose)',
              borderBottom: '2px solid transparent',
              whiteSpace: 'nowrap',
            }}
          >
            Admin
          </Link>
        )}
        <button
          onClick={handleSignOut}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '18px 0 18px 20px',
            fontSize: '0.72rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            flexShrink: 0,
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
