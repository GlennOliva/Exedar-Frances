import { describe, expect, it } from 'vitest'
import { weddingConfig } from '../server/config/wedding'

describe('wedding schedule', () => {
  it('uses the required Manila instants', () => {
    expect(weddingConfig.startsAt.toISOString()).toBe('2027-01-23T06:00:00.000Z')
    expect(weddingConfig.reminders.map((item) => item.sendAt.toISOString())).toEqual(['2027-01-16T01:00:00.000Z', '2027-01-22T01:00:00.000Z'])
    expect(weddingConfig.timeZone).toBe('Asia/Manila')
  })
})
