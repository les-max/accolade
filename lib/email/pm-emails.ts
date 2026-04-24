import { resend } from './client'

const TEST_EMAIL = process.env.RESEND_TEST_EMAIL || null

const FROM = TEST_EMAIL
  ? 'Accolade Community Theatre <onboarding@resend.dev>'
  : 'Accolade Community Theatre <production@accoladetheatre.org>'
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

export async function sendBroadcastEmail({
  recipients,
  subject,
  body,
  showTitle,
}: {
  recipients: { name: string; email: string }[]
  subject: string
  body: string
  showTitle: string
}) {
  if (recipients.length === 0) return { sent: 0 }

  const dest = TEST_EMAIL ? [{ name: recipients[0].name, email: TEST_EMAIL }] : recipients

  const bodyHtml = body
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c8c4d4;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')

  const html = baseTemplate(`
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6880;">${showTitle}</p>
    <h2 style="margin:0 0 28px;font-family:'Georgia',serif;font-size:20px;color:#e8e4dc;font-weight:normal;">${subject}</h2>
    ${bodyHtml}
  `)

  const batch = dest.map(r => ({
    from: FROM,
    to: r.email,
    replyTo: REPLY_TO,
    subject,
    html,
  }))

  await resend.batch.send(batch)
  return { sent: dest.length }
}
