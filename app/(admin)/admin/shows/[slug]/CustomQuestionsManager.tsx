'use client'

import { useState, useTransition } from 'react'
import { updateCustomQuestions, type CustomQuestion } from './actions'

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  padding: '10px 14px',
  color: 'var(--warm-white)',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  display: 'block',
  marginBottom: '6px',
}

const TYPE_LABELS: Record<CustomQuestion['type'], string> = {
  text: 'Short text',
  textarea: 'Long text',
  checkbox: 'Yes / No',
  select: 'Dropdown',
}

export default function CustomQuestionsManager({
  slug,
  initialQuestions,
}: {
  slug: string
  initialQuestions: CustomQuestion[]
}) {
  const [questions, setQuestions] = useState<CustomQuestion[]>(initialQuestions)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // New question form state
  const [label, setLabel] = useState('')
  const [type, setType] = useState<CustomQuestion['type']>('text')
  const [required, setRequired] = useState(false)
  const [optionsRaw, setOptionsRaw] = useState('') // comma-separated for select type

  function save(updated: CustomQuestion[]) {
    startTransition(async () => {
      try {
        await updateCustomQuestions(slug, updated)
        setQuestions(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!label.trim()) return

    const newQ: CustomQuestion = {
      id: crypto.randomUUID(),
      label: label.trim(),
      type,
      required,
      options: type === 'select'
        ? optionsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
    }

    const updated = [...questions, newQ]
    save(updated)
    setLabel('')
    setType('text')
    setRequired(false)
    setOptionsRaw('')
    setShowForm(false)
  }

  function handleDelete(id: string) {
    save(questions.filter(q => q.id !== id))
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        background: 'var(--layer)', border: '1px solid var(--border)',
        borderRadius: '4px', overflow: 'hidden',
      }}>
        {/* Section header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px',
          borderBottom: questions.length > 0 || showForm ? '1px solid var(--border)' : 'none',
        }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Custom Questions
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--gold)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer' }}
            >
              + Add Question
            </button>
          )}
        </div>

        {/* Existing questions */}
        {questions.length > 0 && (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 110px 70px 40px',
              padding: '10px 24px', gap: '16px',
              borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
            }}>
              {['Question', 'Type', 'Required', ''].map(h => (
                <span key={h} style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
              ))}
            </div>
            {questions.map((q, i) => (
              <div key={q.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 110px 70px 40px',
                padding: '14px 24px', gap: '16px', alignItems: 'center',
                borderBottom: i < questions.length - 1 || showForm ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <p style={{ fontSize: '0.85rem' }}>{q.label}</p>
                  {q.type === 'select' && q.options && q.options.length > 0 && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                      {q.options.join(', ')}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{TYPE_LABELS[q.type]}</p>
                <p style={{ fontSize: '0.75rem', color: q.required ? 'var(--gold)' : 'var(--muted)' }}>
                  {q.required ? 'Yes' : 'No'}
                </p>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={isPending}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                  title="Delete question"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {questions.length === 0 && !showForm && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              No custom questions yet. Add questions the director wants to ask every auditioner.
            </p>
          </div>
        )}

        {/* Add question form */}
        {showForm && (
          <form onSubmit={handleAdd} style={{ padding: '24px', background: 'rgba(212,168,83,0.03)' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>
              New Question
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label style={{ gridColumn: '1 / -1' }}>
                <span style={labelStyle}>Question</span>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Can you do a British accent?"
                  style={inputStyle}
                />
              </label>

              <label>
                <span style={labelStyle}>Type</span>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as CustomQuestion['type'])}
                  style={{ ...inputStyle, appearance: 'none' }}
                >
                  {(Object.keys(TYPE_LABELS) as CustomQuestion['type'][]).map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
                <div
                  onClick={() => setRequired(!required)}
                  style={{
                    width: '36px', height: '20px', borderRadius: '10px',
                    background: required ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '2px',
                    left: required ? '18px' : '2px',
                    width: '16px', height: '16px',
                    borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s',
                  }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--warm-white)' }}>Required</span>
              </label>

              {type === 'select' && (
                <label style={{ gridColumn: '1 / -1' }}>
                  <span style={labelStyle}>Options (comma-separated)</span>
                  <input
                    type="text"
                    value={optionsRaw}
                    onChange={e => setOptionsRaw(e.target.value)}
                    placeholder="e.g. Yes, No, Maybe"
                    style={inputStyle}
                  />
                </label>
              )}
            </div>

            {error && <p style={{ color: 'var(--rose)', fontSize: '0.78rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '12px 28px', opacity: isPending ? 0.6 : 1 }}>
                <span>{isPending ? 'Saving…' : 'Add'}</span>
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }} className="btn-ghost" style={{ padding: '12px 20px' }}>
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
