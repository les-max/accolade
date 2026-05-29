import { resend } from './client'
import { baseTemplate } from './base-template'

const TEST_EMAIL = process.env.RESEND_TEST_EMAIL || null
const FROM = TEST_EMAIL
  ? 'Accolade Community Theatre <onboarding@resend.dev>'
  : 'Accolade Community Theatre <events@accoladetheatre.org>'
const REPLY_TO = 'info@accoladetheatre.org'
const SITE = 'https://accoladetheatre.org'

export interface RegistrationConfirmationParams {
  email: string
  name: string
  showTitle: string
  partySize: number
}

export async function sendRegistrationConfirmation(params: RegistrationConfirmationParams) {
  const { email, name, showTitle, partySize } = params
  const guestLabel = partySize === 1 ? '1 guest' : `${partySize} guests`

  const content = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#e8e4dc;font-weight:normal;">
      You're registered!
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#d4a853;letter-spacing:1px;text-transform:uppercase;">
      Registration Confirmation
    </p>

    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#c8c4bc;">
      Hi ${name},<br/>
      You're all set for <strong style="color:#e8e4dc;">${showTitle}</strong>. We can't wait to see you there!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0d14;border-radius:6px;margin:0 0 28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Event</p>
          <p style="margin:0 0 16px;font-size:16px;color:#e8e4dc;">${showTitle}</p>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Party Size</p>
          <p style="margin:0;font-size:22px;color:#d4a853;font-family:Georgia,serif;">${guestLabel}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#c8c4bc;">
      Want to manage your registration and stay connected with Accolade?
      <a href="${SITE}/auth/signup" style="color:#d4a853;text-decoration:none;">Create a family account</a>
      or <a href="${SITE}/auth/login" style="color:#d4a853;text-decoration:none;">sign in</a> if you already have one.
    </p>
  `

  return resend.emails.send({
    from: FROM,
    to: TEST_EMAIL ?? email,
    replyTo: REPLY_TO,
    subject: `You're registered for ${showTitle}`,
    html: baseTemplate(content),
  })
}
