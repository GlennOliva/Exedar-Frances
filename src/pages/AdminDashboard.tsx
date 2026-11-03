import { useDeferredValue, useEffect, useState, type FormEvent } from 'react'
import type { AdminRsvpDetail, AdminRsvpList, AdminSession, AdminSummary } from '../../shared/types'
import { Monogram } from '../components/Monogram'
import { AdminApiError, adminApi } from '../lib/adminApi'

const manilaDate = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })
function formatDate(value: string | null) { return value ? manilaDate.format(new Date(value)) : 'Not recorded' }

export function AdminDashboard() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [list, setList] = useState<AdminRsvpList | null>(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [attendance, setAttendance] = useState('all')
  const [reminders, setReminders] = useState('all')
  const [sort, setSort] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<AdminRsvpDetail | null>(null)

  function handleError(value: unknown) {
    if (value instanceof AdminApiError && value.status === 401) { location.replace('/admin/login?expired=1'); return }
    if (value instanceof AdminApiError && (value.status === 428 || value.code === 'PASSWORD_CHANGE_REQUIRED')) { setSession((current) => current ? { ...current, mustChangePassword: true } : current); return }
    setError(value instanceof AdminApiError ? value.message : 'The administrator dashboard could not be loaded.')
  }

  useEffect(() => {
    let active = true
    adminApi.session().then((value) => { if (active) setSession(value) }).catch(handleError).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!session || session.mustChangePassword) return
    let active = true
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search: deferredSearch, attendance, reminders, sort })
    Promise.all([adminApi.summary(), adminApi.list(params)]).then(([nextSummary, nextList]) => {
      if (!active) return
      setSummary(nextSummary); setList(nextList)
    }).catch((value) => { if (active) handleError(value) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session, deferredSearch, attendance, reminders, sort, page, pageSize, refresh])

  async function logout() {
    try { await adminApi.logout() } finally { location.replace('/admin/login') }
  }

  async function viewDetails(id: string) {
    setError('')
    try { setDetail(await adminApi.detail(id)) } catch (value) { handleError(value) }
  }

  if (loading && !session) return <main className="admin-loading" aria-busy="true"><p>Loading administrator session…</p></main>
  if (!session) return null
  if (session.mustChangePassword) return <PasswordChange email={session.email} onLogout={logout} />

  return <main className="admin-page">
    <header className="admin-header">
      <a className="admin-brand admin-brand--light" href="/"><Monogram ampersand /><span>Exedar &amp; Frances</span></a>
      <div><span>{session.email}</span><button type="button" onClick={logout}>Log out</button></div>
    </header>
    <div className="admin-shell">
      <section className="admin-heading">
        <div><p className="admin-eyebrow">Wedding administration</p><h1>RSVP Dashboard</h1><p>Counts represent submitted RSVP records, not reserved seats or people who have not responded.</p></div>
        <button className="admin-button admin-button--secondary" type="button" onClick={() => setRefresh((value) => value + 1)}>Refresh</button>
      </section>

      <section className="admin-summary" aria-label="RSVP summary">
        <SummaryCard label="Total RSVP records" value={summary?.total} />
        <SummaryCard label="Confirmed attendees" value={summary?.attending} />
        <SummaryCard label="Declined attendees" value={summary?.declined} />
        <SummaryCard label="Confirmed with reminders" value={summary?.attendingWithReminders} />
      </section>

      <section className="admin-records" aria-labelledby="admin-records-title">
        <div className="admin-records-heading"><div><p className="admin-eyebrow">Attendee records</p><h2 id="admin-records-title">Submitted replies</h2></div>{list && <p>{list.total} record{list.total === 1 ? '' : 's'}</p>}</div>
        <div className="admin-filters">
          <label>Search<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Name or email" /></label>
          <label>Attendance<select value={attendance} onChange={(event) => { setAttendance(event.target.value); setPage(1) }}><option value="all">All</option><option value="attending">Confirmed</option><option value="declining">Declined</option></select></label>
          <label>Reminders<select value={reminders} onChange={(event) => { setReminders(event.target.value); setPage(1) }}><option value="all">All</option><option value="opted-in">Opted in</option><option value="not-opted-in">Not opted in</option></select></label>
          <label>Sort<select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}><option value="created_desc">Newest submitted</option><option value="created_asc">Oldest submitted</option><option value="name_asc">Name A–Z</option><option value="name_desc">Name Z–A</option></select></label>
        </div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        {loading ? <p className="admin-state" aria-live="polite">Loading RSVP records…</p> : list?.records.length ? <>
          <div className="admin-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Attendance</th><th>Reminders</th><th>Submitted</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{list.records.map((record) => <tr key={record.id}>
            <td data-label="Name">{record.firstName} {record.lastName}</td><td data-label="Email"><a href={`mailto:${record.email}`}>{record.email}</a></td><td data-label="Attendance"><StatusBadge attendance={record.attendance} /></td><td data-label="Reminders">{record.reminderConsent ? 'Opted in' : 'Not opted in'}</td><td data-label="Submitted">{formatDate(record.createdAt)}</td><td data-label="Updated">{formatDate(record.updatedAt)}</td><td data-label="Action"><button className="admin-text-button" type="button" onClick={() => viewDetails(record.id)}>View details</button></td>
          </tr>)}</tbody></table></div>
          <div className="admin-pagination"><label>Rows<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label><span>Page {list.page} of {list.totalPages}</span><button type="button" disabled={list.page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button type="button" disabled={list.page >= list.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
        </> : <p className="admin-state">No RSVP records match these filters.</p>}
      </section>
    </div>
    {detail && <DetailPanel detail={detail} onClose={() => setDetail(null)} />}
  </main>
}

function SummaryCard({ label, value }: { label: string; value?: number }) { return <article><strong>{value ?? '—'}</strong><span>{label}</span></article> }
function StatusBadge({ attendance }: { attendance: 'attending' | 'declining' }) { return <span className={`admin-badge admin-badge--${attendance}`}>{attendance === 'attending' ? 'Confirmed' : 'Declined'}</span> }

function PasswordChange({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); setSubmitting(true); setMessage('')
    try {
      const result = await adminApi.changePassword(String(form.get('currentPassword') ?? ''), String(form.get('newPassword') ?? ''))
      setMessage(result.message); formElement.reset()
    } catch (error) { setMessage(error instanceof AdminApiError ? error.message : 'The password could not be changed.') }
    finally { setSubmitting(false) }
  }
  return <main className="admin-auth-page"><section className="admin-auth-card" aria-labelledby="password-change-title"><Monogram ampersand /><p className="admin-eyebrow">Security required</p><h1 id="password-change-title">Change Initial Password</h1><p>Before attendee records can be viewed, replace the one-time password for {email} with a unique password of at least 12 characters.</p><form onSubmit={submit}><label htmlFor="current-password">Current password</label><input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required /><label htmlFor="new-password">New password</label><input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} required /><button className="admin-button" disabled={submitting}>{submitting ? 'Changing password…' : 'Change password'}</button><p className="admin-form-message" role="status">{message}</p></form><button className="admin-text-button" type="button" onClick={onLogout}>Log out</button></section></main>
}

function DetailPanel({ detail, onClose }: { detail: AdminRsvpDetail; onClose: () => void }) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; addEventListener('keydown', close); return () => removeEventListener('keydown', close) }, [onClose])
  return <div className="admin-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="admin-detail" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title"><button className="admin-detail-close" type="button" onClick={onClose} aria-label="Close details" autoFocus>×</button><p className="admin-eyebrow">RSVP details</p><h2 id="admin-detail-title">{detail.firstName} {detail.lastName}</h2><a href={`mailto:${detail.email}`}>{detail.email}</a><dl><div><dt>Attendance</dt><dd><StatusBadge attendance={detail.attendance} /></dd></div><div><dt>Reminder preference</dt><dd>{detail.reminderConsent ? 'Opted in' : 'Not opted in'}</dd></div><div><dt>Unsubscribed</dt><dd>{detail.unsubscribedAt ? 'Yes' : 'No'}</dd></div><div><dt>Submitted</dt><dd>{formatDate(detail.createdAt)}</dd></div><div><dt>Last updated</dt><dd>{formatDate(detail.updatedAt)}</dd></div><div><dt>Consent recorded</dt><dd>{formatDate(detail.consentAt)}</dd></div></dl><div className="admin-detail-message"><h3>Message</h3><p>{detail.message || 'No message provided.'}</p></div></section></div>
}
