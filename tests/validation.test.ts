import { describe, expect, it } from 'vitest'
import { rsvpSchema } from '../shared/validation/rsvp'

describe('RSVP validation', () => {
  const valid = { firstName: '  Ada ', lastName: 'Lovelace', email: 'ADA@EXAMPLE.COM ', attendance: 'attending', reminderConsent: true, idempotencyKey: 'f61322b5-7026-4a6a-abda-56efc15ab436' }
  it('normalizes names and email', () => { const result = rsvpSchema.parse(valid); expect(result.firstName).toBe('Ada'); expect(result.email).toBe('ada@example.com') })
  it('rejects unknown attendance and honeypot content', () => { expect(rsvpSchema.safeParse({ ...valid, attendance: 'maybe' }).success).toBe(false); expect(rsvpSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false) })
  it('limits guest messages', () => { expect(rsvpSchema.safeParse({ ...valid, message: 'x'.repeat(1001) }).success).toBe(false) })
})
