import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const slotFilter   = searchParams.get('slot') || null
  const statusFilter = searchParams.get('status') || null

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })

  let query = supabase
    .from('auditions')
    .select('*, audition_slots(label)')
    .eq('show_id', show.id)
    .order('status', { ascending: true })
    .order('created_at', { ascending: true })

  if (slotFilter)                              query = query.eq('slot_id', slotFilter)
  if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter)

  const { data: regs } = await query

  if (!regs || regs.length === 0) {
    return new NextResponse('No registrations found.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const headers = [
    'Status',
    'Waitlist Position',
    'Auditioner Name',
    'Age',
    'Grade',
    'Parent / Guardian Name',
    'Email',
    'Phone',
    'Slot',
    'Role Preference',
    'Accepts Other Roles',
    'Conflicts',
    'Registered At',
  ]

  function esc(val: string | number | boolean | null | undefined): string {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = regs.map(r => [
    esc(r.status),
    esc(r.waitlist_position),
    esc(r.auditioner_name),
    esc(r.auditioner_age),
    esc(r.auditioner_grade),
    esc(r.parent_name),
    esc(r.parent_email),
    esc(r.parent_phone),
    esc((r.audition_slots as { label: string } | null)?.label),
    esc(r.role_preference ?? 'Any Role'),
    esc(r.accept_other_roles ? 'Yes' : 'No'),
    esc(r.conflicts),
    esc(new Date(r.created_at).toLocaleString('en-US')),
  ].join(','))

  const csv = [headers.join(','), ...rows].join('\n')
  const filename = `${show.title.replace(/\s+/g, '-').toLowerCase()}-registrations.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
