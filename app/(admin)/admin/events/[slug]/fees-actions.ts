'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveFeeConfig(showId: string, slug: string, config: {
  shirt_price: number | null
  tuition_amount: number | null
  fees_enabled: boolean
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('show_fees_config')
    .upsert({ show_id: showId, ...config }, { onConflict: 'show_id' })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}

export async function addCouponCode(showId: string, slug: string, data: {
  code: string
  waive_tuition: boolean
  waive_shirts: boolean
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('show_coupon_codes')
    .insert({ show_id: showId, code: data.code.toUpperCase().trim(), waive_tuition: data.waive_tuition, waive_shirts: data.waive_shirts })
  if (error) {
    if (error.code === '23505') throw new Error('Code already exists for this show')
    throw new Error(error.message)
  }
  revalidatePath(`/admin/events/${slug}`)
}

export async function deleteCouponCode(id: string, slug: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('show_coupon_codes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/events/${slug}`)
}
