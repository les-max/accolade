'use server'

import { createClient } from '@/lib/supabase/server'
import { sendRegistrationConfirmation } from '@/lib/email/registration-emails'
import { redirect } from 'next/navigation'

export type RegisterResult = { error: string; remaining?: number } | null

export async function registerForShow(
  slug: string,
  _prev: RegisterResult,
  formData: FormData
): Promise<RegisterResult> {
  const supabase = await createClient()

  const name      = (formData.get('name') as string)?.trim()
  const email     = (formData.get('email') as string)?.trim()
  const partySize = parseInt(formData.get('party_size') as string, 10)

  if (!name || !email || !partySize || partySize < 1) {
    return { error: 'Please fill in all fields.' }
  }

  const { data: show } = await supabase
    .from('shows')
    .select('id, title, status')
    .eq('slug', slug)
    .single()

  if (!show || show.status !== 'active') {
    return { error: 'Registration is not available for this event.' }
  }

  const { data: result, error: rpcError } = await supabase.rpc('register_for_show', {
    p_show_id:    show.id,
    p_name:       name,
    p_email:      email,
    p_party_size: partySize,
  })

  if (rpcError) {
    return { error: 'Something went wrong. Please try again.' }
  }

  const payload = result as { error?: string; remaining?: number; id?: string }

  if (payload.error) {
    return {
      error: payload.remaining === 0
        ? 'Sorry, this event is now full.'
        : `Only ${payload.remaining} seat${payload.remaining === 1 ? '' : 's'} remaining — please reduce your party size.`,
      remaining: payload.remaining,
    }
  }

  // Non-blocking — registration succeeds even if the email fails
  sendRegistrationConfirmation({ email, name, showTitle: show.title, partySize }).catch(() => {})

  redirect(`/register/${slug}/confirmation`)
}
