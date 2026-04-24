'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ConflictPicker from './ConflictPicker'
import { submitAudition } from './actions'
import { computeAge } from '@/lib/utils/age'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '2px',
  padding: '13px 16px',
  color: 'var(--warm-white)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.62rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  fontWeight: 600,
  marginBottom: '8px',
}

const fieldWrap: React.CSSProperties = { marginBottom: '20px' }

type Slot = {
  id: string
  label: string
  capacity: number
  waitlist_enabled: boolean
  registeredCount: number
}

type Role = { id: string; role_name: string }

type CustomQuestion = {
  id: string
  label: string
  type: 'text' | 'textarea' | 'checkbox' | 'select'
  required: boolean
  options?: string[]
}

type FieldConfig = {
  show_grade: boolean
  show_headshot_upload: boolean
  custom_questions?: CustomQuestion[]
}

type FamilyMember = {
  id: string
  name: string
  birthdate: string | null
  age: number | null
  grade: string | null
}

type Family = {
  id: string
  parent_name: string
  email: string
  phone: string | null
}

export default function AuditionForm({
  showId,
  showSlug,
  slots,
  roles,
  fieldConfig,
  family,
  familyMembers = [],
}: {
  showId: string
  showSlug: string
  slots: Slot[]
  roles: Role[]
  fieldConfig: FieldConfig
  family?: Family
  familyMembers?: FamilyMember[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [error, setError] = useState('')
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries((fieldConfig.custom_questions ?? []).map(q => [q.id, q.type === 'checkbox' ? false : '']))
  )

  function memberAge(m: FamilyMember): string {
    if (m.birthdate) return String(computeAge(m.birthdate))
    return m.age != null ? String(m.age) : ''
  }

  const initialMember = familyMembers[0] ?? null
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMember?.id ?? null)
  const [auditionerName, setAuditionerName] = useState(initialMember?.name ?? '')
  const [age, setAge] = useState(initialMember ? memberAge(initialMember) : '')
  const [auditionerGrade, setAuditionerGrade] = useState(initialMember?.grade ?? '')

  function handleMemberSelect(memberId: string) {
    if (!memberId) {
      setSelectedMemberId(null)
      setAuditionerName('')
      setAge('')
      setAuditionerGrade('')
    } else {
      const member = familyMembers.find(m => m.id === memberId)!
      setSelectedMemberId(member.id)
      setAuditionerName(member.name)
      setAge(memberAge(member))
      setAuditionerGrade(member.grade ?? '')
    }
  }

  const isAdult = Number(age) >= 18

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!selectedSlot) { setError('Please select an audition slot.'); return }

    const form = e.currentTarget
    const data = new FormData(form)
    data.set('show_id', showId)
    data.set('slot_id', selectedSlot)
    data.set('is_adult', String(isAdult))
    data.set('extra_fields', JSON.stringify(customAnswers))
    if (family && selectedMemberId) {
      data.set('family_id', family.id)
      data.set('family_member_id', selectedMemberId)
    }

    startTransition(async () => {
      const result = await submitAudition(data)
      if (!result.success) {
        setError(result.error)
      } else {
        router.push(`/auditions/${showSlug}/confirmation?id=${result.auditionId}&status=${result.status}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Child Selector (signed-in parents) ──────── */}
      {familyMembers.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <label>
            <span style={labelStyle}>Who is auditioning?</span>
            <select
              value={selectedMemberId ?? ''}
              onChange={e => handleMemberSelect(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' }}
              onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              {familyMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
              <option value="">Someone else</option>
            </select>
          </label>
        </div>
      )}

      {/* ── Slot Selection ─────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ ...labelStyle, marginBottom: '16px' }}>Choose Your Slot</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {slots.map(slot => {
            const full = slot.registeredCount >= slot.capacity
            const canWaitlist = full && slot.waitlist_enabled
            const unavailable = full && !slot.waitlist_enabled
            const selected = selectedSlot === slot.id

            return (
              <button
                key={slot.id}
                type="button"
                disabled={unavailable}
                onClick={() => !unavailable && setSelectedSlot(slot.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  border: `1px solid ${selected ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '2px',
                  background: selected ? 'rgba(212,168,83,0.08)' : unavailable ? 'rgba(255,255,255,0.02)' : 'transparent',
                  cursor: unavailable ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  opacity: unavailable ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                    border: `1px solid ${selected ? 'var(--gold)' : 'rgba(255,255,255,0.2)'}`,
                    background: selected ? 'var(--gold)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ink)' }} />}
                  </div>
                  <span style={{ fontSize: '0.9rem', color: unavailable ? 'var(--muted)' : 'var(--warm-white)' }}>
                    {slot.label}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: full ? (canWaitlist ? 'var(--teal)' : 'var(--muted)') : 'var(--muted)',
                }}>
                  {unavailable ? 'Full' : canWaitlist ? 'Join Waitlist' : `${slot.capacity - slot.registeredCount} spots left`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Auditioner Info ────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
          Auditioner
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ ...fieldWrap, gridColumn: '1 / -1' }}>
            <label>
              <span style={labelStyle}>Full Name</span>
              <input name="auditioner_name" type="text" required placeholder="First and last name" style={inputStyle}
                value={auditionerName} onChange={e => setAuditionerName(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </label>
          </div>
          <div style={fieldWrap}>
            <label>
              <span style={labelStyle}>Age</span>
              <input name="auditioner_age" type="number" min={1} max={99} required placeholder="e.g. 12"
                value={age} onChange={e => setAge(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </label>
          </div>
          {fieldConfig.show_grade && (
            <div style={fieldWrap}>
              <label>
                <span style={labelStyle}>Grade in School</span>
                <input name="auditioner_grade" type="text" placeholder="e.g. 7th" style={inputStyle}
                  value={auditionerGrade} onChange={e => setAuditionerGrade(e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ── Parent / Guardian Info ─────────────────── */}
      {!isAdult && age !== '' && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
            Parent / Guardian
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ ...fieldWrap, gridColumn: '1 / -1' }}>
              <label>
                <span style={labelStyle}>Parent / Guardian Name</span>
                <input name="parent_name" type="text" required placeholder="Full name" style={inputStyle}
                  defaultValue={family?.parent_name ?? ''}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </label>
            </div>
            <div style={fieldWrap}>
              <label>
                <span style={labelStyle}>Email</span>
                <input name="parent_email" type="email" required placeholder="email@example.com" style={inputStyle}
                  defaultValue={family?.email ?? ''}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </label>
            </div>
            <div style={fieldWrap}>
              <label>
                <span style={labelStyle}>Phone</span>
                <input name="parent_phone" type="tel" placeholder="(555) 555-5555" style={inputStyle}
                  defaultValue={family?.phone ?? ''}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Adult contact info */}
      {isAdult && age !== '' && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
            Contact Info
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={fieldWrap}>
              <label>
                <span style={labelStyle}>Your Email</span>
                <input name="parent_email" type="email" required placeholder="email@example.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </label>
            </div>
            <div style={fieldWrap}>
              <label>
                <span style={labelStyle}>Phone</span>
                <input name="parent_phone" type="tel" placeholder="(555) 555-5555" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Role Preference ────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '0.65rex', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
          Role
        </p>

        <div style={{ ...fieldWrap }}>
          <label>
            <span style={labelStyle}>Role Preference</span>
            <select name="role_preference" style={{ ...inputStyle, appearance: 'none' }}
              onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              <option value="">Any Role / No Preference</option>
              {roles.map(r => (
                <option key={r.id} value={r.role_name}>{r.role_name}</option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span style={{ ...labelStyle, marginBottom: '12px', display: 'block' }}>Will you accept other roles if offered?</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }].map(({ label, value }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="accept_other_roles" value={value} defaultChecked={value === 'true'}
                  style={{ accentColor: 'var(--gold)' }}
                />
                <span style={{ fontSize: '0.88rem' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Custom Questions ───────────────────────── */}
      {(fieldConfig.custom_questions ?? []).length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
            Additional Questions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(fieldConfig.custom_questions ?? []).map(q => (
              <div key={q.id}>
                <span style={labelStyle}>
                  {q.label}{q.required && <span style={{ color: 'var(--rose)', marginLeft: '4px' }}>*</span>}
                </span>

                {q.type === 'text' && (
                  <input
                    type="text"
                    required={q.required}
                    value={customAnswers[q.id] as string ?? ''}
                    onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                )}

                {q.type === 'textarea' && (
                  <textarea
                    required={q.required}
                    value={customAnswers[q.id] as string ?? ''}
                    onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                )}

                {q.type === 'select' && (
                  <select
                    required={q.required}
                    value={customAnswers[q.id] as string ?? ''}
                    onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    style={{ ...inputStyle, appearance: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(212,168,83,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  >
                    <option value="">Select an option…</option>
                    {(q.options ?? []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {q.type === 'checkbox' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={customAnswers[q.id] as boolean ?? false}
                      onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.checked }))}
                      style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.88rem' }}>Yes</span>
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Conflicts ──────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
          Schedule Conflicts
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.6 }}>
          List any dates you are unavailable for rehearsals, tech week, or performances. Being upfront helps the director plan.
        </p>
        <ConflictPicker key={selectedMemberId ?? 'guest'} name="conflicts" />
      </div>

      {error && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(200,90,122,0.1)',
          border: '1px solid rgba(200,90,122,0.3)',
          borderRadius: '2px',
          marginBottom: '24px',
        }}>
          <p style={{ color: 'var(--rose)', fontSize: '0.85rem' }}>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !selectedSlot || age === ''}
        className="btn-primary"
        style={{ opacity: isPending || !selectedSlot || age === '' ? 0.5 : 1, cursor: isPending || !selectedSlot || age === '' ? 'not-allowed' : 'pointer' }}
      >
        <span>{isPending ? 'Submitting…' : 'Submit Registration'}</span>
      </button>

      {(!selectedSlot || age === '') && (
        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '12px' }}>
          {!selectedSlot && age === '' ? 'Select a slot and enter your age to continue.' : !selectedSlot ? 'Select a slot to continue.' : 'Enter your age to continue.'}
        </p>
      )}
    </form>
  )
}
