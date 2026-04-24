'use server'

import { createClient } from '@/lib/supabase/server'
import { sendBroadcastEmail } from '@/lib/email/pm-emails'

export async function sendShowEmail({
  showId,
  showTitle,
  groups,
  subject,
  body,
}: {
  showId: string
  showTitle: string
  groups: string[]
  subject: string
  body: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  if (!subject.trim() || !body.trim()) throw new Error('Subject and body are required')
  if (groups.length === 0) throw new Error('Select at least one recipient group')

  const emailSet = new Map<string, string>() // email → name

  const memberGroups = groups.filter(g => g !== 'auditioners')
  if (memberGroups.length > 0) {
    const { data: members } = await supabase
      .from('show_members')
      .select('families(parent_name, email)')
      .eq('show_id', showId)
      .in('show_role', memberGroups)

    for (const m of members ?? []) {
      const f = m.families as unknown as { parent_name: string; email: string }
      if (f?.email) emailSet.set(f.email.toLowerCase(), f.parent_name ?? f.email)
    }
  }

  if (groups.includes('auditioners')) {
    const { data: auditions } = await supabase
      .from('auditions')
      .select('parent_name, parent_email')
      .eq('show_id', showId)
      .in('status', ['registered', 'waitlisted'])

    for (const a of auditions ?? []) {
      if (a.parent_email) emailSet.set(a.parent_email.toLowerCase(), a.parent_name ?? a.parent_email)
    }
  }

  const recipients = Array.from(emailSet.entries()).map(([email, name]) => ({ email, name }))
  const { sent } = await sendBroadcastEmail({ recipients, subject, body, showTitle })
  return { sent }
}
