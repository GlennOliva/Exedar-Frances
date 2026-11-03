import { beforeAll, describe, expect, it, vi } from 'vitest'

describe('secure tokens', () => {
  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SECRET_KEY = 'test-only-supabase-secret-key'
    process.env.APP_BASE_URL = 'https://example.com'
    process.env.TOKEN_SIGNING_SECRET = 'test-only-signing-secret-at-least-32-characters'
    process.env.SCHEDULER_SECRET = 'test-only-scheduler-secret-at-least-32-chars'
  })
  it('enforces action scope and signature', async () => {
    const { createToken, verifyToken } = await import('../server/services/tokens')
    const token = createToken('guest-id', 'version-id', 'manage', 60)
    expect(verifyToken(token, 'manage').id).toBe('guest-id')
    expect(() => verifyToken(token, 'unsubscribe')).toThrow('invalid_token')
    expect(() => verifyToken(`${token}x`, 'manage')).toThrow('invalid_token')
  })
  it('rejects expired tokens', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2027-01-01T00:00:00Z'))
    const { createToken, verifyToken } = await import('../server/services/tokens')
    const token = createToken('guest-id', 'version-id', 'manage', 1)
    vi.setSystemTime(new Date('2027-01-01T00:00:02Z'))
    expect(() => verifyToken(token, 'manage')).toThrow('invalid_token'); vi.useRealTimers()
  })
})
