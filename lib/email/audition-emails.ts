import { resend } from './client'

// If RESEND_TEST_EMAIL is set, all emails go to that address via Resend's
// free test sender. Remove this var (or leave it empty) in production.
const TEST_EMAIL = process.env.RESEND_TEST_EMAIL || null

const FROM = TEST_EMAIL
  ? 'Accolade Community Theatre <onboarding@resend.dev>'
  : 'Accolade Community Theatre <auditions@accoladetheatre.org>'
const REPLY_TO = 'info@accoladetheatre.org'
const SITE = 'https://accoladetheatre.org'

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accolade Community Theatre</title>
</head>
<body style="margin:0;padding:0;background:#0e0d14;font-family:Georgia,serif;color:#e8e4dc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0d14;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#1a1828;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#1a1828;border-bottom:2px solid #d4a853;padding:28px 40px;">
              <img src="https://accolade-theatre.vercel.app/accolade-logo.png" alt="Accolade Community Theatre" width="200" style="display:block;height:auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2e2c3e;">
              <p style="margin:0;font-size:12px;color:#6b6880;line-height:1.6;">
                Questions? Reply to this email or visit <a href="${SITE}" style="color:#d4a853;text-decoration:none;">${SITE}</a><br/>
                Accolade Community Theatre &mdash; Richardson, TX
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export interface AuditionConfirmationParams {
  parentEmail: string
  auditionerName: string
  showTitle: string
  slotLabel: string
  slotStart: string | null
}

export async function sendAuditionConfirmation(params: AuditionConfirmationParams) {
  const { parentEmail, auditionerName, showTitle, slotLabel, slotStart } = params

  const dateLine = slotStart
    ? new Date(slotStart).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        timeZone: 'America/Chicago',
      })
    : null

  const timeLine = slotStart
    ? new Date(slotStart).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago',
      })
    : null

  const content = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#e8e4dc;font-weight:normal;">
      You're registered!
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#d4a853;letter-spacing:1px;text-transform:uppercase;">
      Audition Confirmation
    </p>

    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#c8c4bc;">
      Hi${params.parentEmail ? '' : ''},<br/>
      <strong style="color:#e8e4dc;">${auditionerName}</strong> is registered to audition for
      <strong style="color:#e8e4dc;">${showTitle}</strong>. We look forward to seeing them!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0d14;border-radius:6px;margin:0 0 28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Show</p>
          <p style="margin:0 0 16px;font-size:16px;color:#e8e4dc;">${showTitle}</p>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Slot</p>
          <p style="margin:0 0 ${dateLine ? '16px' : '0'};font-size:16px;color:#e8e4dc;">${slotLabel}</p>
          ${dateLine ? `
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Date &amp; Time</p>
          <p style="margin:0;font-size:16px;color:#e8e4dc;">${dateLine}${timeLine ? ` at ${timeLine}` : ''}</p>
          ` : ''}
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#d4a853;text-transform:uppercase;letter-spacing:1px;">What to bring</p>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#c8c4bc;">
      Arrive a few minutes early. The director will walk everyone through the process.
      If you have a headshot or resume, feel free to bring it &mdash; but it is not required.
    </p>

    <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#c8c4bc;">
      If your plans change and you can no longer attend, please reply to this email so we can open the spot for someone on the waitlist.
    </p>
  `

  return resend.emails.send({
    from: FROM,
    to: TEST_EMAIL ?? parentEmail,
    replyTo: REPLY_TO,
    subject: `Audition confirmed: ${showTitle}`,
    html: baseTemplate(content),
  })
}

export interface WaitlistConfirmationParams {
  parentEmail: string
  auditionerName: string
  showTitle: string
  slotLabel: string
  waitlistPosition: number
}

export async function sendWaitlistConfirmation(params: WaitlistConfirmationParams) {
  const { parentEmail, auditionerName, showTitle, slotLabel, waitlistPosition } = params

  const position = waitlistPosition === 1 ? '1st' : waitlistPosition === 2 ? '2nd' : waitlistPosition === 3 ? '3rd' : `${waitlistPosition}th`

  const content = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#e8e4dc;font-weight:normal;">
      You're on the waitlist
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#d4a853;letter-spacing:1px;text-transform:uppercase;">
      Waitlist Confirmation
    </p>

    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#c8c4bc;">
      <strong style="color:#e8e4dc;">${auditionerName}</strong> has been added to the waitlist for
      <strong style="color:#e8e4dc;">${showTitle}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0d14;border-radius:6px;margin:0 0 28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Show</p>
          <p style="margin:0 0 16px;font-size:16px;color:#e8e4dc;">${showTitle}</p>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Slot</p>
          <p style="margin:0 0 16px;font-size:16px;color:#e8e4dc;">${slotLabel}</p>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b6880;">Waitlist Position</p>
          <p style="margin:0;font-size:22px;color:#d4a853;font-family:Georgia,serif;">${position}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#c8c4bc;">
      This slot is currently full. If a spot opens up, we will contact you right away &mdash; so keep an eye on your inbox.
    </p>

    <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#c8c4bc;">
      If you would like to be removed from the waitlist, simply reply to this email.
    </p>
  `

  return resend.emails.send({
    from: FROM,
    to: TEST_EMAIL ?? parentEmail,
    replyTo: REPLY_TO,
    subject: `Waitlist confirmed: ${showTitle}`,
    html: baseTemplate(content),
  })
}
