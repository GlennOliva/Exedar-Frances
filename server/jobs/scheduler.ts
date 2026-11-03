import cron from 'node-cron'
import { runReminders } from '../services/reminders'
import { logServerError } from '../lib/safeError'

export function startScheduler() {
  return cron.schedule('*/5 * * * *', () => { void runReminders().catch((error) => logServerError('reminders.scheduled', error)) }, { timezone: 'Asia/Manila', noOverlap: true })
}
