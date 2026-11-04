import { describe, expect, it } from 'vitest'
import { confirmationEmail, reminderEmail, type GuestEmail } from '../server/emails/templates.js'

const guest: GuestEmail = {
  id: 'guest-1',
  first_name: 'Alex',
  last_name: 'Guest',
  email: 'alex@example.com',
  attendance: 'attending',
  reminder_consent: true,
  token_version: '1',
}

describe('guest email attire guidance', () => {
  it.each([
    confirmationEmail(guest, 'https://example.com/manage'),
    reminderEmail(guest, 'https://example.com/manage', 'https://example.com/unsubscribe'),
  ])('includes the complete guidance in HTML and plain text', (email) => {
    for (const content of [email.html, email.text]) {
      expect(content).toContain('Formal / Semi-Formal')
      expect(content).toContain('black suit or black dress shirt paired with black trousers')
      expect(content).toContain('deep burgundy, champagne, or soft blush')
      expect(content).toContain('Deep Burgundy, Champagne, and Soft Blush')
      expect(content).toContain('Gentlemen’s attire only')
    }
  })
})
