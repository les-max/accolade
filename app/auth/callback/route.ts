import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') ?? '/account'

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // When a user arrives via an admin invite, create their families record
    if (data?.user) {
      const meta = data.user.user_metadata
      if (meta?.invited_by_admin) {
        const service = createServiceClient()
        const { data: existing } = await service
          .from('families')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (!existing) {
          const { data: family } = await service
            .from('families')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              parent_name: meta.name,
              phone: meta.phone ?? null,
              portal_role: meta.portal_role ?? 'user',
            })
            .select('id')
            .single()

          if (family && meta.show_id) {
            await service.from('show_members').insert({
              show_id: meta.show_id,
              family_id: family.id,
              show_role: meta.show_role ?? 'parent',
            })
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirect}`)
}
