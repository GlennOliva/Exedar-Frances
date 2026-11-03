import { beforeAll, describe, expect, it } from 'vitest'

describe('mailer delivery states', () => {
  beforeAll(() => {
    Object.assign(process.env, {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'test-only-supabase-secret-key',
      APP_BASE_URL: 'https://example.com',
      TOKEN_SIGNING_SECRET: 'test-only-signing-secret-at-least-32-characters',
      SCHEDULER_SECRET: 'test-only-scheduler-secret-at-least-32-chars',
      MAIL_DELIVERY_MODE: 'log',
    })
  })

  it('reports JSON transport as simulated rather than SMTP accepted', async () => {
    const { sendMail } = await import('../server/services/mailer')
    const result = await sendMail('test@example.invalid', { subject: 'Test', text: 'Test', html: '<p>Test</p>' })
    expect(result).toMatchObject({ status: 'simulated' })
  })

  it('uses the submitted address in production and the configured redirect only in test mode', async () => {
    const { resolveRecipient } = await import('../server/services/mailer')
    expect(resolveRecipient('production', 'submitted@example.invalid', 'redirect@example.invalid')).toBe('submitted@example.invalid')
    expect(resolveRecipient('test', 'submitted@example.invalid', 'redirect@example.invalid')).toBe('redirect@example.invalid')
  })
})
