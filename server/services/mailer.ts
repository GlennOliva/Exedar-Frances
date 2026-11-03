import nodemailer from 'nodemailer'
import { getEnv } from '../config/env'

export interface MailContent { subject: string; html: string; text: string }
interface SmtpOutcome { accepted: number; rejected: number; pending: number; responseCode: number | null }
export type DeliveryResult =
  | ({ status: 'sent' | 'simulated'; messageId: string } & SmtpOutcome)
  | ({ status: 'failed' | 'uncertain'; code: string; attempts: number } & SmtpOutcome)

export function createSmtpTransport() {
  const env = getEnv()
  if (!env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) throw new Error('SMTP configuration is incomplete')
  return nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }, connectionTimeout: 10000, socketTimeout: 20000 })
}

function transport() {
  return getEnv().MAIL_DELIVERY_MODE === 'log' ? nodemailer.createTransport({ jsonTransport: true }) : createSmtpTransport()
}

function classification(error: unknown) {
  const value = error as { responseCode?: number; code?: string; command?: string }
  const code = String(value.responseCode ?? value.code ?? 'SMTP_ERROR').slice(0, 80)
  const outcome = { accepted: 0, rejected: 0, pending: 0, responseCode: value.responseCode ?? null }
  if (value.command === 'DATA' || value.command === '.') return { status: 'uncertain' as const, code, retry: false, ...outcome }
  return { status: 'failed' as const, code, retry: Boolean(value.responseCode && [421, 450, 451, 452].includes(value.responseCode)), ...outcome }
}

function responseCode(response: unknown) {
  const match = typeof response === 'string' ? response.match(/^(\d{3})\b/) : null
  return match ? Number(match[1]) : null
}

export function resolveRecipient(mode: 'log' | 'test' | 'production', submittedRecipient: string, testRecipient?: string) {
  return mode === 'test' ? testRecipient : submittedRecipient
}

export async function sendMail(to: string, content: MailContent, maxAttempts = 1): Promise<DeliveryResult> {
  const env = getEnv()
  const recipient = resolveRecipient(env.MAIL_DELIVERY_MODE, to, env.TEST_EMAIL_TO)
  if (!recipient) return { status: 'failed', code: 'TEST_EMAIL_TO_REQUIRED', attempts: 0, accepted: 0, rejected: 0, pending: 0, responseCode: null }
  let attempts = 0
  while (attempts < maxAttempts) {
    attempts += 1
    try {
      const info = await transport().sendMail({ from: env.SMTP_FROM || 'Wedding Invitation <local@example.invalid>', to: recipient, subject: content.subject, html: content.html, text: content.text, headers: { 'X-Auto-Response-Suppress': 'All' } })
      const smtp = info as { accepted?: unknown[]; rejected?: unknown[]; pending?: unknown[]; response?: string }
      const outcome = { accepted: smtp.accepted?.length ?? 0, rejected: smtp.rejected?.length ?? 0, pending: smtp.pending?.length ?? 0, responseCode: responseCode(smtp.response) }
      if (env.MAIL_DELIVERY_MODE === 'log') return { status: 'simulated', messageId: info.messageId, ...outcome }
      if (!outcome.accepted) {
        if (outcome.pending) return { status: 'uncertain', code: 'SMTP_PENDING', attempts, ...outcome }
        return { status: 'failed', code: outcome.rejected ? 'SMTP_REJECTED' : 'SMTP_NOT_ACCEPTED', attempts, ...outcome }
      }
      return { status: 'sent', messageId: info.messageId, ...outcome }
    } catch (error) {
      const result = classification(error)
      if (!result.retry || attempts >= maxAttempts) return { status: result.status, code: result.code, attempts, accepted: result.accepted, rejected: result.rejected, pending: result.pending, responseCode: result.responseCode }
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempts - 1)))
    }
  }
  return { status: 'failed', code: 'SMTP_RETRY_EXHAUSTED', attempts, accepted: 0, rejected: 0, pending: 0, responseCode: null }
}
