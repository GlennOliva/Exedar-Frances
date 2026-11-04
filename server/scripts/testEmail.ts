import { getEnv } from '../config/env.js'
import { createSmtpTransport } from '../services/mailer.js'

interface SmtpError extends Error {
  code?: string
  responseCode?: number
  command?: string
  response?: string
}

function sanitize(value: string, secrets: string[]) {
  let result = value
  for (const secret of secrets) if (secret) result = result.split(secret).join('[redacted]')
  return result.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]').slice(0, 500)
}

async function main() {
  const env = getEnv()
  if (env.MAIL_DELIVERY_MODE !== 'test') throw new Error('MAIL_DELIVERY_MODE must be test')
  if (!env.TEST_EMAIL_TO) throw new Error('TEST_EMAIL_TO is required')

  const secrets = [env.SMTP_PASS, env.SMTP_USER, env.SMTP_FROM, env.TEST_EMAIL_TO]
  const transporter = createSmtpTransport()
  let phase = 'verify'
  try {
    await transporter.verify()
    console.log(JSON.stringify({ phase, ok: true, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, note: 'SMTP connectivity and authentication verified; delivery was not tested by this step.' }))

    phase = 'send'
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: env.TEST_EMAIL_TO,
      subject: 'Exedar & Frances SMTP test',
      text: 'This is the single authorized SMTP test message. It is independent of RSVP and reminder processing.',
      html: '<p>This is the single authorized SMTP test message.</p><p>It is independent of RSVP and reminder processing.</p>',
      headers: { 'X-Auto-Response-Suppress': 'All', 'X-Wedding-Mail-Test': 'true' },
    })
    const accepted = info.accepted?.length ?? 0
    const rejected = info.rejected?.length ?? 0
    const pending = info.pending?.length ?? 0
    const state = accepted > 0 ? 'smtp-accepted' : pending > 0 ? 'queued' : rejected > 0 ? 'failed' : 'uncertain'
    console.log(JSON.stringify({ phase, ok: state === 'smtp-accepted', state, accepted, rejected, pending, messageId: info.messageId || null, response: sanitize(info.response ?? '', secrets) }))
    if (state !== 'smtp-accepted') process.exitCode = 1
  } catch (error) {
    const smtpError = error as SmtpError
    console.error(JSON.stringify({ phase, ok: false, state: phase === 'send' && (smtpError.command === 'DATA' || smtpError.command === '.') ? 'uncertain' : 'failed', error: { name: smtpError.name, code: smtpError.code ?? null, responseCode: smtpError.responseCode ?? null, command: smtpError.command ?? null, message: sanitize(smtpError.message, secrets), response: sanitize(smtpError.response ?? '', secrets) } }))
    process.exitCode = 1
  } finally {
    transporter.close()
  }
}

void main().catch((error: Error) => {
  console.error(JSON.stringify({ phase: 'configuration', ok: false, state: 'failed', error: { name: error.name, message: error.message } }))
  process.exitCode = 1
})
