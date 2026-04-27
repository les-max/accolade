import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import WaiverForm from './WaiverForm'

const LIABILITY_TEXT = `RELEASE, WAIVER AND INDEMNITY AGREEMENT

IT IS THE INTENTION OF THE UNDERSIGNED PARTICIPANT(S) OR PARENT/GUARDIAN OF THE BELOW LISTED PARTICIPANT(S) BY THIS AGREEMENT TO EXEMPT AND RELIEVE ACCOLADE THEATRE AND ITS OFFICERS, AGENTS, SERVANTS, OR EMPLOYEES FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE, OR WRONGFUL DEATH OF THE BELOW LISTED PARTICIPANT(S) CAUSED BY ANY ACT OF NEGLIGENCE OF ACCOLADE COMMUNITY THEATRE AND ITS OFFICERS, AGENTS, SERVANTS, OR EMPLOYEES.

For and in consideration of permitting THE BELOW LISTED PARTICIPANT(S) to observe, or use any facility or equipment of ACCOLADE COMMUNITY THEATRE, or engage in and/or receive instruction in any activity or activity incidental thereto SOME OF WHICH MAY INVOLVE DANGERS AND RISK OF BODILY INJURY at: the meeting locations of ACCOLADE COMMUNITY THEATRE in the cities of Dallas, Addison, Garland, Plano or Richardson, Counties of Dallas or Collin and State of Texas, beginning on the day of January 1, 2025, THE UNDERSIGNED PARTICIPANT(S) OR THE PARENT/GUARDIAN of THE BELOW LISTED PARTICIPANT(S) : hereby voluntarily and absolutely releases, discharges, waives, and relinquishes any and all loss or damages or actions or causes of action for personal injury, property damage, or wrongful death occurring to THE BELOW LISTED PARTICIPANT(S) as a result of said participant's observing or using facilities or equipment of ACCOLADE COMMUNITY THEATRE, or engaging in or receiving instructions in any activities SOME OF WHICH MAY INVOLVE DANGERS AND RISK OF BODILY INJURY or in activities incidental thereto wherever or however the same may occur, and for whatever period said activities or instructions may continue.

THE UNDERSIGNED PARTICIPANT(S) OR PARENT/GUARDIAN of THE BELOW LISTED PARTICIPANT(S) for himself/herself, his/her heirs, executors, administrators, or assigns agrees that in the event any claim for personal injury, property damage, or wrongful death shall be prosecuted against ACCOLADE COMMUNITY THEATRE or its officers, agents, servants, or employees, THE UNDERSIGNED PARTICIPANT(S) OR PARENT/GUARDIAN OF THE BELOW LISTED PARTICIPANT(S) will indemnify and hold harmless ACCOLADE COMMUNITY THEATRE and its officers, agents, servants, or employees from any and all claims or causes of action by THE UNDERSIGNED PARTICIPANT(S) OR PARENT/GUARDIAN of THE BELOW LISTED PARTICIPANT(S) or by any other person or entity, by whomever or wherever made or presented, and under no circumstances will THE UNDERSIGNED PARTICIPANT OR PARENT/GUARDIAN of THE BELOW LISTED PARTICIPANT present any claim against ACCOLADE COMMUNITY THEATRE and said persons for personal injuries, property damage, wrongful death, or otherwise, caused by any act of negligence by ACCOLADE COMMUNITY THEATRE and said persons.

THE UNDERSIGNED PARTICIPANT(S) OR PARENT/GUARDIAN of THE BELOW LISTED PARTICIPANT(S) represents that he/she has read this Release, has requested and has been provided with, or has requested and declined advisement on the foreseeable potential dangers/risks of engaging in the observation, activities, or instruction offered, assumes all foreseeable and unforeseeable risks associated with such dangers and risks, and is fully aware of and understands the terms and the legal consequences of the signing of this Release. The undersigned parent or legal guardian intends his or her signature to be a complete and unconditional release of all liability to the greatest extent allowed by law and if any portion of the Release is held invalid, it is agreed that the balance shall, notwithstanding, continue in full legal force and effect.`

const PHOTO_VIDEO_TEXT = `I hereby grant Accolade Community Theatre the right to take photographs and videos of my child(ren) (listed below) and of my family in connection with all productions of Accolade Community Theatre. I authorize Accolade Community Theatre, its assigns, and transferee to copyright, use, and publish the same in print and/or electronically.

I agree that Accolade Community Theatre may use such photographs and video of me with or without my name or my approval of the final product for any lawful purpose, including but not limited to such purposes as publicity, illustration, advertising, and web content.

I understand and agree that since my participation with Accolade Community Theatre is voluntary, my child(ren) will not receive any compensation. All photos are the property of Accolade Community Theatre and will not be returned to you.`

export default async function WaiversPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fu } = await supabase.from('family_users').select('family_id').eq('user_id', user.id).single()
  if (!fu) redirect('/account/setup')
  const family = { id: fu.family_id }

  const { data: show } = await supabase
    .from('shows')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  const { data: waivers } = await supabase
    .from('show_waivers')
    .select('waiver_type, signature, signed_at')
    .eq('show_id', show.id)
    .eq('family_id', family.id)

  const signed = Object.fromEntries(
    (waivers ?? []).map(w => [w.waiver_type, { signature: w.signature, signed_at: w.signed_at }])
  )

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href="/account"
          style={{ color: 'var(--muted)', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
        >
          ← Dashboard
        </Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
          Waivers
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
          {show.title} — please read and sign both documents below.
        </p>
      </div>

      <WaiverForm
        showId={show.id}
        slug={slug}
        waiverType="liability"
        title="Liability Waiver"
        text={LIABILITY_TEXT}
        signed={signed['liability'] ?? null}
      />

      <WaiverForm
        showId={show.id}
        slug={slug}
        waiverType="photo_video"
        title="Photo & Video Release"
        text={PHOTO_VIDEO_TEXT}
        signed={signed['photo_video'] ?? null}
      />
    </div>
  )
}
