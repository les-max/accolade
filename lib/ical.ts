export type CalEvent = {
  uid: string
  summary: string
  start: Date
  end: Date
  description?: string
  location?: string
}

function formatDt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// RFC 5545 line folding: max 75 octets per line, fold with CRLF + space
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line
  let result = ''
  let currentLine = ''
  let byteCount = 0
  const isFirst = { v: true }
  for (const char of line) {
    const charBytes = encoder.encode(char).length
    if (byteCount + charBytes > 75) {
      result += (isFirst.v ? '' : '\r\n ') + currentLine
      isFirst.v = false
      currentLine = char
      byteCount = charBytes
    } else {
      currentLine += char
      byteCount += charBytes
    }
  }
  if (currentLine) result += (isFirst.v ? '' : '\r\n ') + currentLine
  return result
}

export function generateIcal(events: CalEvent[], calName: string): string {
  const stamp = formatDt(new Date())
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Accolade Community Theatre//Family Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
    'X-WR-TIMEZONE:America/Chicago',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
  ]

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatDt(event.start)}`,
      `DTEND:${formatDt(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
    )
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    if (event.location)    lines.push(`LOCATION:${escapeText(event.location)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
