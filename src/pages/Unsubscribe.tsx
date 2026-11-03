import { useState } from 'react'
import type { ApiMessage } from '../../shared/types'
import { Monogram } from '../components/Monogram'

export function Unsubscribe() {
  const [message, setMessage] = useState('')
  const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? ''
  async function unsubscribe() { const response = await fetch('/api/manage/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, confirmed: true }) }); const data = await response.json() as ApiMessage; setMessage(data.message) }
  return <main className="utility-page"><div className="utility-inner"><a href="/"><Monogram /></a><p className="eyebrow">Reminder Preferences</p><h1 className="utility-title">Unsubscribe from reminders</h1><p>Confirm below to stop future wedding reminder emails. Your attendance response will not change.</p>{message ? <p className="completion" role="status">{message}</p> : <button className="button" onClick={unsubscribe}>Confirm unsubscribe</button>}<a className="text-button" href="/">Return to the invitation</a></div></main>
}
