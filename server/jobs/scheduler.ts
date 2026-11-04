import cron from 'node-cron'
import { runReminders } from '../services/reminders.js'
import { logServerError } from '../lib/safeError.js'

export function startScheduler() {
  return cron.schedule('*/5 * * * *', () => { void runReminders().catch((error) => logServerError('reminders.scheduled', error)) }, { timezone: 'Asia/Manila', noOverlap: true })
}
