import { resend } from './client'

const TEST_EMAIL = process.env.RESEND_TEST_EMAIL || null

const FROM = TEST_EMAIL
  ? 'Accolade Community Theatre <onboarding@resend.dev>'
  : 'Accolade Community Theatre <tickets@accoladetheatre.org>'
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

export async function sendTicketConfirmation({
  to,
  buyerName,
  showTitle,
  performanceDate,
  performanceTime,
  quantity,
  totalAmount,
  orderId,
}: {
  to: string
  buyerName: string
  showTitle: string
  performanceDate: string
  performanceTime: string | null
  quantity: number
  totalAmount: number
  orderId: string
}) {
  const dest = TEST_EMAIL ?? to
  const formattedTotal = (totalAmount / 100).toFixed(2)
  const ticketWord = quantity === 1 ? 'ticket' : 'tickets'

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;color:#e8e4dc;font-weight:normal;">
      You're going to the show!
    </h2>
    <p style="margin:0 0 28px;font-size:14px;color:#a09db8;line-height:1.6;">
      Thanks, ${buyerName}. Your ${ticketWord} for <strong style="color:#e8e4dc;">${showTitle}</strong> are confirmed.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0d14;border-radius:6px;margin-bottom:28px;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6880;">Performance</p>
          <p style="margin:0 0 20px;font-size:16px;color:#e8e4dc;">${performanceDate}${performanceTime ? ' at ' + performanceTime : ''}</p>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6880;">Tickets</p>
          <p style="margin:0 0 20px;font-size:16px;color:#e8e4dc;">${quantity} ${ticketWord}</p>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6880;">Total Paid</p>
          <p style="margin:0;font-size:18px;color:#d4a853;font-weight:bold;">$${formattedTotal}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#a09db8;line-height:1.6;">
      Please bring this confirmation email (or just your name) to will call at the door.
    </p>
    <p style="margin:0;font-size:11px;color:#6b6880;">Order ID: ${orderId}</p>
  `)

  await resend.emails.send({
    from: FROM,
    to: dest,
    replyTo: REPLY_TO,
    subject: `Your tickets for ${showTitle}`,
    html,
  })
}
