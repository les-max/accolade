'use server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function validateCoupon(showId: string, code: string): Promise<{
  valid: boolean
  waiveTuition: boolean
  waiveShirts: boolean
  error?: string
}> {
  // Require auth to prevent unauthenticated coupon fishing
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return { valid: false, waiveTuition: false, waiveShirts: false, error: 'Not authenticated' }

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('show_coupon_codes')
    .select('id, waive_tuition, waive_shirts, used_by_family_id')
    .eq('show_id', showId)
    .eq('code', code.toUpperCase().trim())
    .single()

  if (!data) return { valid: false, waiveTuition: false, waiveShirts: false, error: 'Code not found' }
  if (data.used_by_family_id) return { valid: false, waiveTuition: false, waiveShirts: false, error: 'Code already used' }
  return { valid: true, waiveTuition: data.waive_tuition, waiveShirts: data.waive_shirts }
}
