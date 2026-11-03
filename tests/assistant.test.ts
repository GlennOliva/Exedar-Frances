import { describe, expect, it } from 'vitest'
import { assistantAnswers, matchAssistantIntent, suggestedQuestions } from '../src/data/assistantContent'

describe('wedding assistant content', () => {
  it.each([
    ['When did they start dating?', 'dating'],
    ['how   did they MEET', 'meeting'],
    ['Who made the first move!', 'firstMove'],
    ['Where is the ceremony venue?', 'wedding'],
    ['What colors should I wear?', 'dressCode'],
    ['Can I respond to the RSVP?', 'rsvp'],
    ['Can you read my private record?', 'unknown'],
  ] as const)('matches %s as %s', (question, expected) => {
    expect(matchAssistantIntent(question)).toBe(expected)
  })

  it('keeps unverified relationship facts honest', () => {
    expect(assistantAnswers.dating.text).toBe('The couple’s dating story will be shared here soon.')
    expect(assistantAnswers.meeting.text).toContain('preparing this part of their story')
    expect(assistantAnswers.firstMove.text).toContain('still a secret')
  })

  it('provides only verified contextual destinations', () => {
    expect(suggestedQuestions).toHaveLength(6)
    expect(assistantAnswers.wedding.action?.target).toBe('#celebration')
    expect(assistantAnswers.dressCode.action?.target).toBe('#details')
    expect(assistantAnswers.rsvp.action?.target).toBe('#rsvp')
  })

  it('uses the shared formal and semi-formal attire guidance', () => {
    expect(assistantAnswers.dressCode.text).toContain('Formal / Semi-Formal')
    expect(assistantAnswers.dressCode.text).toContain('black is reserved for gentlemen')
    expect(assistantAnswers.dressCode.text).toContain('deep burgundy, champagne, or soft blush')
  })
})
