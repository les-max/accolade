'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { importAuditioners, type ImportRow } from './actions'

// Flexible column name aliases
const NAME_COLS    = ['name', 'auditioner name', 'student name', 'child name', 'performer name', 'first name']
const AGE_COLS     = ['age']
const GRADE_COLS   = ['grade']
const P_NAME_COLS  = ['parent name', 'guardian name', 'parent/guardian', 'parent', 'guardian', 'contact name']
const P_EMAIL_COLS = ['email', 'parent email', 'contact email', 'guardian email', 'email address']
const P_PHONE_COLS = ['phone', 'parent phone', 'contact phone', 'guardian phone', 'phone number']

function matchCol(headers: string[], aliases: string[]): number {
  return headers.findIndex(h => aliases.includes(h.toLowerCase().trim()))
}

function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => {
      const cols: string[] = []
      let cur = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') { inQuotes = !inQuotes }
        else if (ch === ',' && !inQuotes) { cols.push(cur.trim()); cur = '' }
        else { cur += ch }
      }
      cols.push(cur.trim())
      return cols
    })
}

function rowsFromCSV(text: string): { rows: ImportRow[]; errors: string[] } {
  const lines = parseCSV(text)
  if (lines.length < 2) return { rows: [], errors: ['CSV must have a header row and at least one data row.'] }

  const headers = lines[0]
  const iName   = matchCol(headers, NAME_COLS)
  const iAge    = matchCol(headers, AGE_COLS)
  const iGrade  = matchCol(headers, GRADE_COLS)
  const iPName  = matchCol(headers, P_NAME_COLS)
  const iPEmail = matchCol(headers, P_EMAIL_COLS)
  const iPPhone = matchCol(headers, P_PHONE_COLS)

  if (iName === -1)   return { rows: [], errors: ['Could not find a "Name" column. Expected: Name, Student Name, Child Name, or similar.'] }
  if (iPEmail === -1) return { rows: [], errors: ['Could not find an "Email" column. Expected: Email, Parent Email, Contact Email, or similar.'] }

  const rows: ImportRow[] = []
  const errors: string[] = []

  lines.slice(1).forEach((cols, i) => {
    const lineNum = i + 2
    const name  = cols[iName]?.trim() ?? ''
    const email = cols[iPEmail]?.trim() ?? ''

    if (!name)  { errors.push(`Row ${lineNum}: missing name — skipped`); return }
    if (!email) { errors.push(`Row ${lineNum}: missing email — skipped`); return }

    const rawAge = iAge !== -1 ? cols[iAge]?.trim() : ''
    const age    = rawAge ? (parseInt(rawAge, 10) || null) : null

    rows.push({
      auditioner_name: name,
      auditioner_age:  age,
      auditioner_grade: iGrade !== -1 ? (cols[iGrade]?.trim() || null) : null,
      parent_name:      iPName !== -1 ? (cols[iPName]?.trim() || null) : null,
      parent_email:     email,
      parent_phone:     iPPhone !== -1 ? (cols[iPPhone]?.trim() || null) : null,
    })
  })

  return { rows, errors }
}

export default function ImportForm({ slug }: { slug: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportRow[] | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [result, setResult] = useState<{ success?: boolean; count?: number; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setResult(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const { rows, errors } = rowsFromCSV(text)
      setPreview(rows.length > 0 ? rows : null)
      setParseErrors(errors)
    }
    reader.readAsText(file)
  }

  function handleConfirm() {
    if (!preview || preview.length === 0) return
    startTransition(async () => {
      const res = await importAuditioners(slug, preview)
      setResult(res)
      if (res.success) {
        setTimeout(() => router.push(`/admin/events/${slug}/registrations`), 1500)
      }
    })
  }

  function handleReset() {
    setPreview(null)
    setParseErrors([])
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const colStyle: React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }
  const cellStyle: React.CSSProperties = { fontSize: '0.82rem', padding: '14px 16px', borderRight: '1px solid var(--border)' }

  return (
    <div>
      {/* Instructions */}
      <div style={{
        background: 'var(--layer)', border: '1px solid var(--border)', borderRadius: '4px',
        padding: '20px 24px', marginBottom: '32px',
      }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '12px' }}>
          Upload a CSV file with your audition list. The file must have a header row. Column names are flexible — the importer will match common variations automatically.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 32px' }}>
          {[
            ['Name', 'required — Name, Student Name, Child Name'],
            ['Email', 'required — Email, Parent Email, Contact Email'],
            ['Age', 'optional'],
            ['Grade', 'optional'],
            ['Parent Name', 'optional — Parent Name, Guardian Name'],
            ['Phone', 'optional — Phone, Parent Phone'],
          ].map(([col, hint]) => (
            <div key={col} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--warm-white)', minWidth: '90px' }}>{col}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{hint}</span>
            </div>
          ))}
        </div>
      </div>

      {/* File input */}
      {!preview && (
        <div>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '12px 24px',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            cursor: 'pointer',
            fontSize: '0.68rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
          }}>
            Choose CSV File
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div style={{
          marginTop: '20px',
          background: 'rgba(200,60,60,0.08)',
          border: '1px solid rgba(200,60,60,0.3)',
          borderRadius: '4px',
          padding: '16px 20px',
        }}>
          {parseErrors.map((e, i) => (
            <p key={i} style={{ fontSize: '0.78rem', color: '#e07070', marginBottom: i < parseErrors.length - 1 ? '4px' : 0 }}>{e}</p>
          ))}
        </div>
      )}

      {/* Preview table */}
      {preview && !result && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              <span style={{ color: 'var(--warm-white)', fontWeight: 600 }}>{preview.length}</span> auditioner{preview.length !== 1 ? 's' : ''} ready to import
            </p>
            <button
              onClick={handleReset}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Choose different file
            </button>
          </div>

          {/* Parse warnings */}
          {parseErrors.length > 0 && (
            <div style={{
              marginBottom: '16px',
              background: 'rgba(212,168,83,0.08)',
              border: '1px solid rgba(212,168,83,0.25)',
              borderRadius: '4px',
              padding: '12px 16px',
            }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--gold)', marginBottom: '4px' }}>Some rows were skipped:</p>
              {parseErrors.map((e, i) => <p key={i} style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{e}</p>)}
            </div>
          )}

          <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'auto', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--layer)', borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Age', 'Grade', 'Parent Name', 'Email', 'Phone'].map(h => (
                    <th key={h} style={{ ...cellStyle, ...colStyle, fontWeight: 600, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < preview.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={cellStyle}>{row.auditioner_name}</td>
                    <td style={{ ...cellStyle, color: row.auditioner_age ? 'var(--warm-white)' : 'var(--muted)' }}>{row.auditioner_age ?? '—'}</td>
                    <td style={{ ...cellStyle, color: row.auditioner_grade ? 'var(--warm-white)' : 'var(--muted)' }}>{row.auditioner_grade ?? '—'}</td>
                    <td style={{ ...cellStyle, color: row.parent_name ? 'var(--warm-white)' : 'var(--muted)' }}>{row.parent_name ?? '—'}</td>
                    <td style={cellStyle}>{row.parent_email}</td>
                    <td style={{ ...cellStyle, color: row.parent_phone ? 'var(--warm-white)' : 'var(--muted)', borderRight: 'none' }}>{row.parent_phone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isPending}
            style={{
              padding: '12px 32px',
              background: 'var(--gold)',
              border: 'none',
              borderRadius: '2px',
              color: '#000',
              fontSize: '0.68rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 700,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Importing…' : `Import ${preview.length} Auditioner${preview.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginTop: '24px',
          background: result.success ? 'rgba(61,158,140,0.08)' : 'rgba(200,60,60,0.08)',
          border: `1px solid ${result.success ? 'rgba(61,158,140,0.35)' : 'rgba(200,60,60,0.3)'}`,
          borderRadius: '4px',
          padding: '20px 24px',
        }}>
          {result.success ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--teal)' }}>
              {result.count} auditioner{result.count !== 1 ? 's' : ''} imported successfully. Redirecting…
            </p>
          ) : (
            <p style={{ fontSize: '0.88rem', color: '#e07070' }}>Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
