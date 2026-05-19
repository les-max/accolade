import { resend } from './client'

const TEST_EMAIL = process.env.RESEND_TEST_EMAIL || null

const FROM = TEST_EMAIL
  ? 'Accolade Community Theatre <onboarding@resend.dev>'
  : 'Accolade Community Theatre <no-reply@accoladetheatre.org>'
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
          <tr>
            <td style="background:#1a1828;border-bottom:2px solid #d4a853;padding:28px 40px;">
              <img src="https://accolade-theatre.vercel.app/accolade-logo.png" alt="Accolade Community Theatre" width="200" style="display:block;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
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

export async function sendSpouseInvite({
  spouseEmail,
  spouseName,
  invitedByName,
  magicLink,
}: {
  spouseEmail: string
  spouseName: string | null
  invitedByName: string
  magicLink: string
}) {
  const greeting = spouseName ? `Hi ${spouseName.split(' ')[0]},` : 'Hi,'

  const html = baseTemplate(`
    <p style="margin:0 0 8px;font-size:13px;color:#9992b0;letter-spacing:0.1em;text-transform:uppercase;">You're invited</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:700;color:#f0ece4;line-height:1.2;">Join Your Family Account</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c8c4bc;">
      ${greeting}
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#c8c4bc;">
      <strong style="color:#f0ece4;">${invitedByName}</strong> has added you as a co-parent on their Accolade Community Theatre family account.
      Click below to sign in and access your shared family dashboard.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#d4a853;border-radius:4px;">
          <a href="${magicLink}" style="display:inline-block;padding:14px 28px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0e0d14;text-decoration:none;letter-spacing:0.05em;">
            Access My Account
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#6b6880;line-height:1.6;">
      This link expires in 24 hours. If you weren't expecting this invitation, you can safely ignore this email.
    </p>
  `)

  await resend.emails.send({
    from: FROM,
    to: TEST_EMAIL ?? spouseEmail,
    replyTo: REPLY_TO,
    subject: `${invitedByName} has added you to their Accolade account`,
    html,
  })
}
