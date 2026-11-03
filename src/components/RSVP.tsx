import { useState, type FormEvent } from 'react'
import { rsvpSchema } from '../../shared/validation/rsvp'
import type { ApiMessage, RsvpInput } from '../../shared/types'
import { Monogram } from './Monogram'
import { submitRsvp } from '../lib/rsvpSubmission'

type Errors = Partial<Record<'firstName' | 'lastName' | 'email' | 'attendance' | 'message', string>>

export function RSVP() {
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<ApiMessage | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [key, setKey] = useState(() => crypto.randomUUID())

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const input: RsvpInput = {
      firstName: String(form.get('firstName') ?? ''), lastName: String(form.get('lastName') ?? ''),
      email: String(form.get('email') ?? ''), attendance: String(form.get('attendance') ?? '') as RsvpInput['attendance'],
      message: String(form.get('message') ?? ''), reminderConsent: form.get('reminderConsent') === 'on',
      idempotencyKey: key, website: String(form.get('website') ?? ''),
    }
    const parsed = rsvpSchema.safeParse(input)
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof Errors] ??= issue.message
      setErrors(next); setStatus({ ok: false, message: 'Please review the highlighted fields.' }); return
    }
    setErrors({}); setStatus(null); setSubmitting(true)
    try {
      const result = await submitRsvp(parsed.data, formElement)
      if (result.kind === 'success') {
        setStatus({ ok: true, message: result.message, emailStatus: result.emailStatus })
        try { setKey(crypto.randomUUID()) } catch { /* Retaining the key keeps a retry idempotent. */ }
      } else {
        setStatus({ ok: false, message: result.message })
      }
    } finally { setSubmitting(false) }
  }

  const errorProps = (name: keyof Errors) => ({ 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined })
  return (
    <section className="rsvp-section panel-section panel-section--wine section-anchor" id="rsvp" aria-labelledby="rsvp-heading">
      <div className="section-inner rsvp-inner">
        <div className="rsvp-intro" data-reveal><Monogram ampersand /><p className="eyebrow">RSVP</p><h2 id="rsvp-heading" className="script">Kindly Reply</h2><p>We would love to celebrate with you.</p><p className="seat-note">Please refer to your invitation for your reserved seats.</p></div>
        <form onSubmit={submit} noValidate data-reveal data-reveal-delay="1">
          <div className="form-grid">
            <Field label="First name" name="firstName" error={errors.firstName}><input id="firstName" name="firstName" autoComplete="given-name" required {...errorProps('firstName')} /></Field>
            <Field label="Last name" name="lastName" error={errors.lastName}><input id="lastName" name="lastName" autoComplete="family-name" required {...errorProps('lastName')} /></Field>
          </div>
          <Field label="Email address" name="email" error={errors.email}><input id="email" name="email" type="email" autoComplete="email" required {...errorProps('email')} /></Field>
          <fieldset aria-describedby={errors.attendance ? 'attendance-error' : undefined}><legend>Will you be joining us?</legend><label className="radio"><input type="radio" name="attendance" value="attending" /> <span>Joyfully accepts.</span></label><label className="radio"><input type="radio" name="attendance" value="declining" /> <span>Regretfully declines.</span></label>{errors.attendance && <span className="field-error" id="attendance-error">{errors.attendance}</span>}</fieldset>
          <Field label="Message to the couple (optional)" name="message" error={errors.message}><textarea id="message" name="message" rows={4} {...errorProps('message')} /></Field>
          <label className="check"><input type="checkbox" name="reminderConsent" /> <span>Email me reminders about the wedding. I can unsubscribe at any time.</span></label>
          <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
          <button className="button submit-button" type="submit" disabled={submitting}>{submitting ? 'Sending your reply…' : 'Submit RSVP'}</button>
          <div className={`form-status${status?.ok ? ' form-status--success' : ''}`} role="status" aria-live="polite">{status?.message}</div>
        </form>
      </div>
    </section>
  )
}

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return <div className="field"><label htmlFor={name}>{label}</label>{children}{error && <span className="field-error" id={`${name}-error`}>{error}</span>}</div>
}
