import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import VenueManager from './VenueManager'

export default async function VenuesPage() {
  const supabase = await createClient()
  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .order('name')

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
          Admin
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700 }}>Venues</h1>
      </div>

      <VenueManager venues={venues ?? []} />
    </div>
  )
}
