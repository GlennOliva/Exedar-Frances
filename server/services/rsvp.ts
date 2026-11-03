import { createHash } from 'node:crypto'
import type { EmailStatus, RsvpInput } from '../../shared/types'
import { supabase } from '../db/supabase'
import { getEnv } from '../config/env'
import { confirmationEmail, managementEmail, type GuestEmail } from '../emails/templates'
import { sendMail } from './mailer'
import { durableRateLimit } from './rateLimit'
import { createToken, verifyToken } from './tokens'

interface RsvpRecord extends GuestEmail {
  message: string | null
  consent_at: string | null
  unsubscribed_at: string | null
  created_at: string
  updated_at: string
}

interface SubmittedRsvp extends RsvpRecord { created: boolean }

const genericMessage = 'Your reply has been received. Please check your email for confirmation or a secure management link.'
function manageUrl(guest: GuestEmail) { const token = createToken(guest.id, guest.token_version, 'manage', 30 * 86400); return `${getEnv().APP_BASE_URL}/manage#token=${encodeURIComponent(token)}` }

function logDelivery(type: string, result: Awaited<ReturnType<typeof sendMail>>) {
  console.info(JSON.stringify({ level: 'info', operation: 'email.dispatch', emailType: type, state: result.status === 'sent' ? 'smtp-accepted' : result.status, accepted: result.accepted, rejected: result.rejected, pending: result.pending, responseCode: result.responseCode, messageId: 'messageId' in result ? result.messageId : null, errorCode: 'code' in result ? result.code : null }))
}

async function recordAndSend(guest: GuestEmail, type: string, content: ReturnType<typeof confirmationEmail>) {
  const inserted = await supabase.from('email_deliveries').insert({ rsvp_id: guest.id, email_type: type, status: 'sending' }).select('id').single()
  if (inserted.error) throw new Error('Email delivery record creation failed', { cause: inserted.error })
  if (!inserted.data) throw new Error('Email delivery record creation returned no id')
  const result = await sendMail(guest.email, content)
  logDelivery(type, result)
  const updated = await supabase.from('email_deliveries').update({
    status: result.status === 'simulated' ? 'skipped' : result.status,
    attempts: 'attempts' in result ? result.attempts : 1,
    smtp_message_id: 'messageId' in result ? result.messageId : null,
    error_code: result.status === 'simulated' ? 'LOG_MODE_SIMULATED' : 'code' in result ? result.code : null,
    sent_at: result.status === 'sent' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', inserted.data.id)
  if (updated.error) throw new Error('Email delivery record update failed', { cause: updated.error })
  return result.status
}

async function recordSkippedDelivery(guest: GuestEmail, type: string, reason: string) {
  const result = await supabase.from('email_deliveries').insert({ rsvp_id: guest.id, email_type: type, status: 'skipped', error_code: reason })
  if (result.error) throw new Error('Skipped email delivery record creation failed', { cause: result.error })
  console.info(JSON.stringify({ level: 'info', operation: 'email.dispatch', emailType: type, state: 'skipped', reason, accepted: 0, rejected: 0, pending: 0, responseCode: null, messageId: null }))
}

export async function createRsvp(input: RsvpInput) {
  const keyHash = createHash('sha256').update(input.idempotencyKey).digest('hex')
  const result = await supabase.rpc('submit_rsvp', {
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_email: input.email,
    p_attendance: input.attendance,
    p_message: input.message ?? '',
    p_reminder_consent: input.reminderConsent,
    p_key_hash: keyHash,
  })
  if (result.error) throw new Error('RSVP save failed', { cause: result.error })
  if (!Array.isArray(result.data) || !result.data[0]) throw new Error('RSVP save returned no record')
  const { created, ...guest } = result.data[0] as SubmittedRsvp

  let status: EmailStatus = 'skipped'
  const emailType = created ? 'confirmation' : 'management-link'
  const allowed = await durableRateLimit('rsvp-email', guest.email, 3, 60)
  if (allowed) {
    const content = created ? confirmationEmail(guest, manageUrl(guest)) : managementEmail(guest, manageUrl(guest))
    const delivery = await recordAndSend(guest, emailType, content)
    status = delivery === 'simulated' ? 'skipped' : delivery
  } else {
    await recordSkippedDelivery(guest, emailType, 'RATE_LIMITED')
  }
  const message = status === 'sent' ? genericMessage
    : status === 'skipped' ? 'Your RSVP was received, but no email was sent for this request.'
      : status === 'uncertain' ? 'Your RSVP was received, but email delivery could not be confirmed.'
        : 'Your RSVP was received, but we could not send your confirmation email.'
  return { ok: true, emailStatus: status, message }
}

export async function getManagedRsvp(token: string) {
  const payload = verifyToken(token, 'manage')
  const result = await supabase.from('rsvps').select('*').eq('id', payload.id).eq('token_version', payload.version).maybeSingle()
  if (result.error || !result.data) throw new Error('invalid_token')
  const guest = result.data as RsvpRecord
  const [local, domain] = guest.email.split('@'); const masked = `${local?.slice(0, 2)}***@${domain}`
  return { firstName: guest.first_name, lastName: guest.last_name, emailMasked: masked, attendance: guest.attendance, reminderConsent: guest.reminder_consent, unsubscribed: Boolean(guest.unsubscribed_at) }
}

export async function updateManagedRsvp(token: string, attendance: 'attending' | 'declining', consent: boolean) {
  const payload = verifyToken(token, 'manage')
  const result = await supabase.rpc('update_managed_rsvp', {
    p_id: payload.id, p_token_version: payload.version, p_attendance: attendance, p_reminder_consent: consent,
  })
  if (result.error || result.data !== true) throw new Error('invalid_token')
}

export async function requestManagementLink(email: string) {
  if (!(await durableRateLimit('management-link', email, 2, 60))) return
  const result = await supabase.from('rsvps').select('*').eq('email', email).maybeSingle()
  if (result.error) throw new Error('Management link lookup failed')
  const guest = result.data as RsvpRecord | null
  if (guest) await recordAndSend(guest, 'management-link', managementEmail(guest, manageUrl(guest)))
}

export async function unsubscribe(token: string) {
  const payload = verifyToken(token, 'unsubscribe')
  const result = await supabase.rpc('unsubscribe_rsvp', { p_id: payload.id, p_token_version: payload.version })
  if (result.error || result.data !== true) throw new Error('invalid_token')
}
