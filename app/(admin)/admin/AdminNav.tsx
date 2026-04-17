'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { label: 'Shows', href: '/admin/shows' },
    { label: 'Sponsors', href: '/admin/sponsors' },
  ]

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      overflowY: 'auto',
      background: 'var(--deep)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 0',
    }}>
      {/* Nav links */}
      <nav style={{ flex: 1, padding: '24px 12px' }}>
        {navItems.map(({ label, href }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              display: 'block',
              padding: '10px 12px',
              borderRadius: '2px',
              fontSize: '0.78rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 500,
              textDecoration: 'none',
              color: active ? 'var(--gold)' : 'var(--muted)',
              background: active ? 'rgba(212,168,83,0.08)' : 'transparent',
              transition: 'all 0.2s',
            }}>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + sign out */}
      <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '12px', wordBreak: 'break-all' }}>
          {userEmail}
        </p>
        <button
          onClick={signOut}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            color: 'var(--muted)',
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '8px 14px',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => {
            (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)'
            ;(e.target as HTMLButtonElement).style.color = 'var(--warm-white)'
          }}
          onMouseOut={e => {
            (e.target as HTMLButtonElement).style.borderColor = 'var(--border)'
            ;(e.target as HTMLButtonElement).style.color = 'var(--muted)'
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
