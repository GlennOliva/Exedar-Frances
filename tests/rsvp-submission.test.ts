import { describe, expect, it, vi } from 'vitest'
import { submitRsvp } from '../src/lib/rsvpSubmission.js'
import type { RsvpInput } from '../shared/types/index.js'

const input: RsvpInput = {
  firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', attendance: 'attending',
  message: '', reminderConsent: true, idempotencyKey: 'be7b4367-bc0e-43f5-86a4-5a498de4a5fd', website: '',
}
const successBody = { ok: true, emailStatus: 'sent', message: 'Your reply has been received. Please check your email for confirmation or a secure management link.' }
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const fetcherFor = (response: Response | Error) => vi.fn(async () => { if (response instanceof Error) throw response; return response }) as unknown as typeof fetch

describe('RSVP browser submission', () => {
  it('accepts the real 201 response contract and resets the captured form', async () => {
    const reset = vi.fn()
    const result = await submitRsvp(input, { reset }, fetcherFor(jsonResponse(successBody, 201)))
    expect(result).toMatchObject({ kind: 'success', message: successBody.message, emailStatus: 'sent', resetFailed: false })
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('keeps RSVP success when email delivery failed', async () => {
    const reset = vi.fn()
    const result = await submitRsvp(input, { reset }, fetcherFor(jsonResponse({ ...successBody, emailStatus: 'failed', message: 'Your RSVP was received, but we could not send your confirmation email.' }, 201)))
    expect(result).toMatchObject({ kind: 'success', emailStatus: 'failed' })
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it.each(['skipped', 'uncertain'] as const)('keeps RSVP persistence successful when email is %s', async (emailStatus) => {
    const reset = vi.fn()
    const result = await submitRsvp(input, { reset }, fetcherFor(jsonResponse({ ...successBody, emailStatus, message: `Email ${emailStatus}` }, 201)))
    expect(result).toMatchObject({ kind: 'success', emailStatus })
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('keeps RSVP success when the form reset throws', async () => {
    const result = await submitRsvp(input, { reset: () => { throw new Error('reset failed') } }, fetcherFor(jsonResponse(successBody, 201)))
    expect(result).toMatchObject({ kind: 'success', resetFailed: true })
  })

  it('uses the server message and does not reset on a valid error response', async () => {
    const reset = vi.fn()
    const result = await submitRsvp(input, { reset }, fetcherFor(jsonResponse({ ok: false, message: 'We could not save your RSVP. Please try again in a moment.' }, 503)))
    expect(result).toEqual({ kind: 'server', message: 'We could not save your RSVP. Please try again in a moment.' })
    expect(reset).not.toHaveBeenCalled()
  })

  it('requires response.ok even if the body claims success', async () => {
    const result = await submitRsvp(input, { reset: vi.fn() }, fetcherFor(jsonResponse(successBody, 500)))
    expect(result.kind).toBe('server')
  })

  it('separates malformed responses from network failures', async () => {
    const malformed = await submitRsvp(input, { reset: vi.fn() }, fetcherFor(new Response('not-json', { status: 201 })))
    expect(malformed).toMatchObject({ kind: 'parse', message: 'The RSVP service returned an unexpected response. Please try again in a moment.' })
    const invalidShape = await submitRsvp(input, { reset: vi.fn() }, fetcherFor(jsonResponse({ ok: true, emailStatus: 'maybe' }, 201)))
    expect(invalidShape.kind).toBe('parse')
    const network = await submitRsvp(input, { reset: vi.fn() }, fetcherFor(new TypeError('Failed to fetch')))
    expect(network).toMatchObject({ kind: 'network', message: 'We could not reach the RSVP service. Please try again in a moment.' })
  })
})
