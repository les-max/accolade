'use server'

import { createClient } from '@/lib/supabase/server'
import { sendAuditionConfirmation, sendWaitlistConfirmation } from '@/lib/email/audition-emails'

export type SubmitResult =
  | { success: true; status: 'registered' | 'waitlisted'; auditionId: string }
  | { success: false; error: string }

export async function submitAudition(formData: FormData): Promise<SubmitResult> {
  const supabase = await createClient()

  const show_id       = formData.get('show_id') as string
  const slot_id       = formData.get('slot_id') as string
  const auditioner_name = formData.get('auditioner_name') as string
  const auditioner_age  = formData.get('auditioner_age') ? Number(formData.get('auditioner_age')) : null
  const auditioner_grade = formData.get('auditioner_grade') as string || null
  const is_adult      = formData.get('is_adult') === 'true'
  const parent_name   = is_adult ? null : (formData.get('parent_name') as string)
  const parent_email  = formData.get('parent_email') as string
  const parent_phone  = formData.get('parent_phone') as string || null
  const role_preference      = formData.get('role_preference') as string || null
  const accept_other_roles   = formData.get('accept_other_roles') === 'true'
  const conflicts     = formData.get('conflicts') as string || null
  const family_id     = formData.get('family_id') as string || null
  const family_member_id = formData.get('family_member_id') as string || null

  let extra_fields: Record<string, unknown> = {}
  try {
    const raw = formData.get('extra_fields') as string
    if (raw) extra_fields = JSON.parse(raw)
  } catch { /* ignore malformed JSON */ }

  if (!auditioner_name || !parent_email || !slot_id) {
    return { success: false, error: 'Missing required fields.' }
  }

  // Check slot capacity (also fetch label + start_time for confirmation email)
  const { data: slot } = await supabase
    .from('audition_slots')
    .select('capacity, waitlist_enabled, label, start_time')
    .eq('id', slot_id)
    .single()

  if (!slot) return { success: false, error: 'Invalid slot.' }

  const { count: registered } = await supabase
    .from('auditions')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', slot_id)
    .eq('status', 'registered')

  const isFull = (registered ?? 0) >= slot.capacity

  if (isFull && !slot.waitlist_enabled) {
    return { success: false, error: 'This slot is full and no waitlist is available. Please choose another slot.' }
  }

  let status: 'registered' | 'waitlisted' = isFull ? 'waitlisted' : 'registered'
  let waitlist_position: number | null = null

  if (status === 'waitlisted') {
    const { count: waitlisted } = await supabase
      .from('auditions')
      .select('id', { count: 'exact', head: true })
      .eq('slot_id', slot_id)
      .eq('status', 'waitlisted')

    waitlist_position = (waitlisted ?? 0) + 1
  }

  const { data: inserted, error } = await supabase
    .from('auditions')
    .insert({
      show_id,
      slot_id,
      status,
      waitlist_position,
      auditioner_name,
      auditioner_age,
      auditioner_grade,
      is_adult,
      parent_name,
      parent_email,
      parent_phone,
      role_preference,
      accept_other_roles,
      conflicts,
      extra_fields,
      family_id,
      family_member_id,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  // Fetch show title for the confirmation email
  const { data: show } = await supabase
    .from('shows')
    .select('title')
    .eq('id', show_id)
    .single()

  // Send confirmation email — non-blocking, registration succeeds regardless
  try {
    if (status === 'registered') {
      await sendAuditionConfirmation({
        parentEmail: parent_email,
        auditionerName: auditioner_name,
        showTitle: show?.title ?? 'the show',
        slotLabel: slot.label,
        slotStart: slot.start_time ?? null,
      })
    } else {
      await sendWaitlistConfirmation({
        parentEmail: parent_email,
        auditionerName: auditioner_name,
        showTitle: show?.title ?? 'the show',
        slotLabel: slot.label,
        waitlistPosition: waitlist_position ?? 1,
      })
    }
  } catch (emailErr) {
    console.error('[email] Failed to send audition confirmation:', emailErr)
  }

  return { success: true, status, auditionId: inserted.id }
}
