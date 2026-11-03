import { supabase } from '../db/supabase'
import { getEnv } from '../config/env'
import { weddingConfig } from '../config/wedding'
import { reminderEmail, type GuestEmail } from '../emails/templates'
import { sendMail } from './mailer'
import { createToken } from './tokens'

interface ClaimedDelivery { id: string; rsvp_id: string }

function links(guest: GuestEmail) {
  const base = getEnv().APP_BASE_URL
  const manage = createToken(guest.id, guest.token_version, 'manage', 30 * 86400)
  const unsubscribe = createToken(guest.id, guest.token_version, 'unsubscribe', 400 * 86400)
  return { manageUrl: `${base}/manage#token=${encodeURIComponent(manage)}`, unsubscribeUrl: `${base}/unsubscribe#token=${encodeURIComponent(unsubscribe)}` }
}

export async function runReminders(now = new Date()) {
  if (now >= weddingConfig.startsAt) return { claimed: 0, sent: 0 }
  const stale = await supabase.rpc('mark_stale_email_deliveries', { p_now: now.toISOString() })
  if (stale.error) throw new Error('Stale delivery reconciliation failed', { cause: stale.error })
  let claimed = 0; let sent = 0
  for (const reminder of weddingConfig.reminders) {
    const age = now.getTime() - reminder.sendAt.getTime()
    if (age < 0 || age > 30 * 60 * 1000) continue
    const claim = await supabase.rpc('claim_reminder_deliveries', {
      p_email_type: `reminder:${reminder.key}`,
      p_scheduled_for: reminder.sendAt.toISOString(),
      p_now: now.toISOString(),
    })
    if (claim.error) throw new Error('Reminder claim failed', { cause: claim.error })
    if (!Array.isArray(claim.data)) throw new Error('Reminder claim returned no result')
    const deliveries = claim.data as ClaimedDelivery[]
    claimed += deliveries.length
    for (const delivery of deliveries) {
      const current = await supabase.from('rsvps').select('*').eq('id', delivery.rsvp_id).eq('attendance', 'attending').eq('reminder_consent', true).is('unsubscribed_at', null).maybeSingle()
      if (current.error) throw new Error('Reminder eligibility check failed', { cause: current.error })
      const guest = current.data as GuestEmail | null
      if (!guest) {
        const skipped = await supabase.from('email_deliveries').update({ status: 'skipped', error_code: 'NO_LONGER_ELIGIBLE', updated_at: now.toISOString() }).eq('id', delivery.id)
        if (skipped.error) throw new Error('Reminder skip update failed', { cause: skipped.error })
        continue
      }
      const { manageUrl, unsubscribeUrl } = links(guest)
      const outcome = await sendMail(guest.email, reminderEmail(guest, manageUrl, unsubscribeUrl), 3)
      console.info(JSON.stringify({ level: 'info', operation: 'email.dispatch', emailType: `reminder:${reminder.key}`, state: outcome.status === 'sent' ? 'smtp-accepted' : outcome.status, accepted: outcome.accepted, rejected: outcome.rejected, pending: outcome.pending, responseCode: outcome.responseCode, messageId: 'messageId' in outcome ? outcome.messageId : null, errorCode: 'code' in outcome ? outcome.code : null }))
      const updated = await supabase.from('email_deliveries').update({
        status: outcome.status === 'simulated' ? 'skipped' : outcome.status,
        attempts: 'attempts' in outcome ? outcome.attempts : 1,
        smtp_message_id: 'messageId' in outcome ? outcome.messageId : null,
        error_code: outcome.status === 'simulated' ? 'LOG_MODE_SIMULATED' : 'code' in outcome ? outcome.code : null,
        sent_at: outcome.status === 'sent' ? now.toISOString() : null,
        updated_at: now.toISOString(),
      }).eq('id', delivery.id)
      if (updated.error) throw new Error('Reminder delivery update failed', { cause: updated.error })
      if (outcome.status === 'sent') sent += 1
    }
  }
  return { claimed, sent }
}
