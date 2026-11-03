import { useEffect, useState, type FormEvent } from 'react'
import { Monogram } from '../components/Monogram'
import { AdminApiError, adminApi } from '../lib/adminApi'

export function AdminLogin() {
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(new URLSearchParams(location.search).has('expired') ? 'Your session expired. Sign in again.' : '')

  useEffect(() => {
    let active = true
    adminApi.session().then(() => { if (active) location.replace('/admin') }).catch((error) => {
      if (!active) return
      if (error instanceof AdminApiError && error.status !== 401) setMessage(error.message)
      setChecking(false)
    })
    return () => { active = false }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true); setMessage('')
    try {
      await adminApi.login(String(form.get('email') ?? ''), String(form.get('password') ?? ''))
      location.replace('/admin')
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : 'Administrator login failed.')
    } finally { setSubmitting(false) }
  }

  return <main className="admin-auth-page">
    <section className="admin-auth-card" aria-labelledby="admin-login-title">
      <a className="admin-brand" href="/"><Monogram ampersand /><span>Exedar &amp; Frances</span></a>
      <p className="admin-eyebrow">Private administration</p>
      <h1 id="admin-login-title">Administrator Login</h1>
      <p className="admin-auth-copy">Sign in with the administrator account. Public registration is not available.</p>
      {checking ? <p className="admin-notice" role="status">Checking your session…</p> : <form onSubmit={submit}>
        <label htmlFor="admin-email">Email address</label>
        <input id="admin-email" name="email" type="email" autoComplete="username" required />
        <label htmlFor="admin-password">Password</label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
        <button className="admin-button" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        <p className="admin-form-message" role="alert">{message}</p>
      </form>}
      <a className="admin-return" href="/">Return to the invitation</a>
    </section>
  </main>
}
