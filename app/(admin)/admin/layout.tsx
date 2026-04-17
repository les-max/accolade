import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from './AdminNav'
import Nav from '@/components/Nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <>
      <Nav />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--ink)', paddingTop: '64px' }}>
        <AdminNav userEmail={user.email ?? ''} />
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <main style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
