import { useEffect, useState, type FormEvent } from 'react'
import type { ApiMessage, ManagedRsvp } from '../../shared/types'
import { Monogram } from '../components/Monogram'

function hashToken() { return new URLSearchParams(location.hash.slice(1)).get('token') ?? '' }

export function ManageRSVP() {
  const [guest, setGuest] = useState<ManagedRsvp | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const token = hashToken()
  useEffect(() => {
    fetch('/api/manage/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<ManagedRsvp> })
      .then(setGuest).catch(() => setError('This management link is invalid or has expired. Request a fresh link below.'))
  }, [token])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const response = await fetch('/api/manage/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, attendance: form.get('attendance'), reminderConsent: form.get('reminderConsent') === 'on', confirmed: true }) })
    const data = await response.json() as ApiMessage; setResult(data.message)
  }
  return <main className="utility-page"><div className="utility-inner"><a href="/"><Monogram /></a><p className="eyebrow">Guest Response</p><h1 className="utility-title">Manage your RSVP</h1>{error && <p role="alert">{error}</p>}{guest && <form onSubmit={save}><p>For <strong>{guest.firstName} {guest.lastName}</strong> ({guest.emailMasked})</p><fieldset><legend>Attendance</legend><label className="radio"><input type="radio" name="attendance" value="attending" defaultChecked={guest.attendance === 'attending'} /> Joyfully accepts.</label><label className="radio"><input type="radio" name="attendance" value="declining" defaultChecked={guest.attendance === 'declining'} /> Regretfully declines.</label></fieldset><label className="check"><input type="checkbox" name="reminderConsent" defaultChecked={guest.reminderConsent && !guest.unsubscribed} /> Email me wedding reminders.</label><div className="confirm-box"><p>This will update your saved attendance and reminder preference. Please confirm your choices.</p><button className="button">Confirm changes</button></div><p role="status">{result}</p></form>}<RequestLink /><a className="text-button" href="/">Return to the invitation</a></div></main>
}

function RequestLink() {
  const [message, setMessage] = useState('')
  async function request(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const email = String(new FormData(event.currentTarget).get('email')); const response = await fetch('/api/manage/request-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const data = await response.json() as ApiMessage; setMessage(data.message) }
  return <form className="request-link" onSubmit={request}><h2>Need a fresh link?</h2><label htmlFor="request-email">Email address</label><input id="request-email" type="email" name="email" required /><button className="button button--outline">Email a secure link</button><p role="status">{message}</p></form>
}
