import { describe, expect, it } from 'vitest'
import { weddingConfig } from '../server/config/wedding.js'

describe('wedding schedule', () => {
  it('uses the required Manila instants', () => {
    expect(weddingConfig.startsAt.toISOString()).toBe('2027-01-23T06:00:00.000Z')
    expect(weddingConfig.reminders.map((item) => item.sendAt.toISOString())).toEqual(['2027-01-16T01:00:00.000Z', '2027-01-22T01:00:00.000Z'])
    expect(weddingConfig.timeZone).toBe('Asia/Manila')
  })

  it('keeps the attire guidance and motif restrictions together', () => {
    expect(weddingConfig.dressCode).toBe('Formal / Semi-Formal')
    expect(weddingConfig.motif).toBe('Deep Burgundy, Champagne, and Soft Blush')
    expect(weddingConfig.dressCodeGuidance.gentlemen).toContain('black formal or semi-formal attire')
    expect(weddingConfig.dressCodeGuidance.ladies).toContain('black is reserved for gentlemen')
    expect(weddingConfig.dressCodeGuidance.blackLabel).toBe('Gentlemen’s attire only')
  })
})
