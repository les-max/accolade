import { createClient } from '@/lib/supabase/server'
import NewEventForm from './NewEventForm'

export default async function NewEventPage() {
  const supabase = await createClient()

  const { data: parentShows } = await supabase
    .from('shows')
    .select('id, title, event_type, show_image, show_image_wide, venue_id, season')
    .in('event_type', ['show', 'camp'])
    .eq('archived', false)
    .order('title')

  return <NewEventForm parentShows={parentShows ?? []} />
}
