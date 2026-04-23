import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateIcal, CalEvent } from '@/lib/ical'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token) return new NextResponse('Not found', { status: 404 })

  const supabase = createServiceClient()

  const { data: family } = await supabase
    .from('families')
    .select('id, parent_name')
    .eq('calendar_token', token)
    .single()

  if (!family) return new NextResponse('Not found', { status: 404 })

  const events: CalEvent[] = []

  // ── Auditions ────────────────────────────────────────────
  const { data: auditions } = await supabase
    .from('auditions')
    .select('id, auditioner_name, audition_slots(label, start_time), shows(title)')
    .eq('family_id', family.id)
    .eq('status', 'registered')

  for (const a of auditions ?? []) {
    const slot = a.audition_slots as unknown as { label: string; start_time: string | null } | null
    const show = a.shows as unknown as { title: string } | null
    if (!slot?.start_time) continue
    const start = new Date(slot.start_time)
    const end   = new Date(start.getTime() + 30 * 60 * 1000)
    events.push({
      uid:         `audition-${a.id}@accoladetheatre.org`,
      summary:     `Audition – ${show?.title ?? 'Accolade Theatre'}`,
      start,
      end,
      description: `Auditioner: ${a.auditioner_name}\nSlot: ${slot.label}`,
    })
  }

  // ── Show events (rehearsals, performances, etc.) ─────────
  const { data: memberships } = await supabase
    .from('show_members')
    .select('show_id')
    .eq('family_id', family.id)

  const showIds = (memberships ?? []).map(m => m.show_id)

  if (showIds.length > 0) {
    const { data: showEvents } = await supabase
      .from('show_events')
      .select('id, title, event_type, start_time, end_time, location, notes, shows(title)')
      .in('show_id', showIds)
      .order('start_time')

    for (const e of showEvents ?? []) {
      const start = new Date(e.start_time)
      const end   = e.end_time
        ? new Date(e.end_time)
        : new Date(start.getTime() + 2 * 60 * 60 * 1000)
      const show = e.shows as unknown as { title: string } | null
      events.push({
        uid:         `show-event-${e.id}@accoladetheatre.org`,
        summary:     `${e.title} – ${show?.title ?? 'Accolade Theatre'}`,
        start,
        end,
        description: e.notes ?? undefined,
        location:    e.location ?? undefined,
      })
    }
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime())

  const ical = generateIcal(events, 'Accolade Community Theatre')

  return new NextResponse(ical, {
    headers: {
      'Content-Type':        'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="accolade-calendar.ics"',
      'Cache-Control':       'no-cache, no-store, must-revalidate',
    },
  })
}
