import { Router, type Request, type Response } from 'express'
import { createHash, timingSafeEqual } from 'node:crypto'
import { rsvpSchema, linkRequestSchema, manageUpdateSchema, tokenSchema } from '../../shared/validation/rsvp.js'
import { createRsvp, getManagedRsvp, requestManagementLink, unsubscribe, updateManagedRsvp } from '../services/rsvp.js'
import { runReminders } from '../services/reminders.js'
import { getEnv } from '../config/env.js'
import { logServerError } from '../lib/safeError.js'

export const api = Router()
const genericLinkMessage = 'If an RSVP exists for that address, a secure link will arrive shortly.'
const invalidLinkMessage = 'This secure link is invalid or has expired.'

api.get('/health', (_request, response) => response.json({ ok: true }))
api.post('/rsvps', async (request, response) => {
  const parsed = rsvpSchema.safeParse({ ...request.body, idempotencyKey: request.get('Idempotency-Key') || request.body?.idempotencyKey })
  if (!parsed.success) return response.status(400).json({ ok: false, message: 'Please review your RSVP details.', errors: parsed.error.flatten().fieldErrors })
  if (parsed.data.website) return response.status(202).json({ ok: true, message: 'Your reply has been received.' })
  try { return response.status(201).json(await createRsvp(parsed.data)) } catch (error) { logServerError('rsvp.create', error); return response.status(503).json({ ok: false, message: 'We could not save your RSVP. Please try again in a moment.' }) }
})
api.post('/manage/view', async (request, response) => {
  const parsed = tokenSchema.safeParse(request.body); if (!parsed.success) return response.status(400).json({ ok: false, message: invalidLinkMessage })
  try { return response.json(await getManagedRsvp(parsed.data.token)) } catch { return response.status(401).json({ ok: false, message: invalidLinkMessage }) }
})
api.post('/manage/update', async (request, response) => {
  const parsed = manageUpdateSchema.safeParse(request.body); if (!parsed.success) return response.status(400).json({ ok: false, message: 'Confirm valid attendance and reminder choices.' })
  try { await updateManagedRsvp(parsed.data.token, parsed.data.attendance, parsed.data.reminderConsent); return response.json({ ok: true, message: 'Your RSVP and reminder preferences have been updated.' }) } catch { return response.status(401).json({ ok: false, message: invalidLinkMessage }) }
})
api.post('/manage/request-link', async (request, response) => {
  const parsed = linkRequestSchema.safeParse(request.body); if (!parsed.success) return response.status(400).json({ ok: false, message: 'Enter a valid email address.' })
  try { await requestManagementLink(parsed.data.email) } catch { /* Keep this response private and non-enumerable. */ }
  return response.json({ ok: true, message: genericLinkMessage })
})
api.post('/manage/unsubscribe', async (request, response) => {
  const parsed = tokenSchema.safeParse(request.body)
  if (!parsed.success || request.body?.confirmed !== true) return response.status(400).json({ ok: false, message: 'Explicit confirmation is required.' })
  try { await unsubscribe(parsed.data.token); return response.json({ ok: true, message: 'You have been unsubscribed from wedding reminders. Your RSVP remains unchanged.' }) } catch { return response.status(401).json({ ok: false, message: invalidLinkMessage }) }
})
async function runReminderJob(request: Request, response: Response) {
  const supplied = request.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const expected = getEnv().SCHEDULER_SECRET
  const suppliedHash = createHash('sha256').update(supplied).digest(); const expectedHash = createHash('sha256').update(expected).digest()
  if (!timingSafeEqual(suppliedHash, expectedHash)) return response.status(401).json({ ok: false })
  try { return response.json({ ok: true, ...(await runReminders()) }) } catch (error) { logServerError('reminders.run', error); return response.status(503).json({ ok: false }) }
}

api.get('/jobs/reminders', runReminderJob)
api.post('/jobs/reminders', runReminderJob)
