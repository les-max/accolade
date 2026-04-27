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

    if (data?.user) {
      const meta = data.user.user_metadata
      const service = createServiceClient()

      if (meta?.invited_as_co_parent && meta?.family_id) {
        // Spouse accepting an invite — link them to the existing family
        const { data: existing } = await service
          .from('family_users')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (!existing) {
          await service.from('family_users').insert({
            family_id: meta.family_id,
            user_id:   data.user.id,
            name:      meta.name ?? '',
          })
        }
      } else if (meta?.invited_by_admin) {
        // Admin invite — create families record and family_users row
        const { data: existingFamily } = await service
          .from('families')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (!existingFamily) {
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

          if (family) {
            await service.from('family_users').insert({
              family_id: family.id,
              user_id:   data.user.id,
              name:      meta.name ?? '',
            })

            if (meta.show_id) {
              await service.from('show_members').insert({
                show_id:   meta.show_id,
                family_id: family.id,
                show_role: meta.show_role ?? 'parent',
              })
            }
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirect}`)
}
