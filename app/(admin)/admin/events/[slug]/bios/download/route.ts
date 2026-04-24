import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: isAdmin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!isAdmin) return new NextResponse('Forbidden', { status: 403 })

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) return new NextResponse('Not found', { status: 404 })

  const { data: bios } = await supabase
    .from('show_bios')
    .select('first_name, last_name, role, age, grade, bio, submitted_at, families(parent_name, email)')
    .eq('show_id', show.id)
    .order('last_name')
    .order('first_name')

  const escape = (val: string | number | null | undefined) => {
    const str = String(val ?? '')
    return `"${str.replace(/"/g, '""')}"`
  }

  const header = 'Show,First Name,Last Name,Role,Age,Grade,Bio,Parent Name,Parent Email,Submitted'
  const rows = (bios ?? []).map(b => {
    const family = b.families as unknown as { parent_name: string; email: string }
    return [
      escape(show.title),
      escape(b.first_name),
      escape(b.last_name),
      escape(b.role),
      b.age,
      escape(b.grade),
      escape(b.bio),
      escape(family?.parent_name),
      escape(family?.email),
      escape(b.submitted_at ? new Date(b.submitted_at).toLocaleDateString('en-US') : ''),
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="bios-${slug}.csv"`,
    },
  })
}
