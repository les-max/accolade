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

      // Check family_invites by email (spouse invite flow)
      if (data.user.email) {
        const { data: invite } = await service
          .from('family_invites')
          .select('id, family_id')
          .eq('email', data.user.email.toLowerCase())
          .is('accepted_at', null)
          .order('invited_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (invite) {
          const { data: existing } = await service
            .from('family_users')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle()

          if (!existing) {
            await service.from('family_users').insert({
              family_id: invite.family_id,
              user_id:   data.user.id,
              name:      meta?.name ?? '',
            })
          }

          await service
            .from('family_invites')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invite.id)
        }
      }

      if (meta?.invited_as_co_parent && meta?.family_id) {
        // Legacy path: old-style invite with metadata
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
