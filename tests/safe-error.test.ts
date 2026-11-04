import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const testSecrets = {
  SUPABASE_URL: 'https://unit-test.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_unit_test_key_1234567890',
  SMTP_PASS: 'unit-test-smtp-password',
  APP_BASE_URL: 'https://unit-test.example',
  TOKEN_SIGNING_SECRET: 'unit-test-signing-secret-at-least-32-characters',
  SCHEDULER_SECRET: 'unit-test-scheduler-secret-at-least-32-chars',
}

describe('safe server error logging', () => {
  beforeAll(() => { Object.assign(process.env, testSecrets) })
  afterEach(() => vi.restoreAllMocks())

  it('logs operation, provider code, and a sanitized cause message', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logServerError } = await import('../server/lib/safeError.js')
    const error = new Error('RSVP save failed', {
      cause: {
        name: 'PostgrestError',
        code: 'PGRST205',
        status: 404,
        message: `Missing table for guest@example.com with ${testSecrets.SUPABASE_SECRET_KEY} and ${testSecrets.TOKEN_SIGNING_SECRET}`,
      },
    })

    logServerError('rsvp.create', error)
    const line = String(spy.mock.calls[0]?.[0])

    expect(line).toContain('"operation":"rsvp.create"')
    expect(line).toContain('"name":"PostgrestError"')
    expect(line).toContain('"code":"PGRST205"')
    expect(line).toContain('"status":404')
    expect(line).toContain('[redacted-email]')
    expect(line).not.toContain('guest@example.com')
    expect(line).not.toContain(testSecrets.SUPABASE_SECRET_KEY)
    expect(line).not.toContain(testSecrets.TOKEN_SIGNING_SECRET)
  })
})
