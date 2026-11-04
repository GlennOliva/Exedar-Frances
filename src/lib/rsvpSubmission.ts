import type { ApiMessage, RsvpInput } from '../../shared/types/index.js'

export interface ResettableForm {
  reset(): void
}

export type RsvpSubmission =
  | { kind: 'success'; message: string; emailStatus?: ApiMessage['emailStatus']; resetFailed: boolean }
  | { kind: 'network'; message: string }
  | { kind: 'parse'; message: string }
  | { kind: 'server'; message: string }

const networkMessage = 'We could not reach the RSVP service. Please try again in a moment.'
const parseMessage = 'The RSVP service returned an unexpected response. Please try again in a moment.'
const serverMessage = 'The RSVP service could not save your reply. Please try again in a moment.'

function isApiMessage(value: unknown): value is ApiMessage {
  if (value === null || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (typeof candidate.ok !== 'boolean' || typeof candidate.message !== 'string') return false
  return candidate.emailStatus === undefined || ['sent', 'skipped', 'failed', 'uncertain'].includes(String(candidate.emailStatus))
}

export async function submitRsvp(input: RsvpInput, form: ResettableForm, fetcher: typeof fetch = fetch): Promise<RsvpSubmission> {
  let response: Response
  try {
    response = await fetcher('/api/rsvps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify(input),
    })
  } catch {
    return { kind: 'network', message: networkMessage }
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { kind: 'parse', message: parseMessage }
  }
  if (!isApiMessage(body)) return { kind: 'parse', message: parseMessage }
  if (!response.ok || !body.ok) return { kind: 'server', message: body.message || serverMessage }

  let resetFailed = false
  try {
    form.reset()
  } catch {
    resetFailed = true
  }
  return { kind: 'success', message: body.message, emailStatus: body.emailStatus, resetFailed }
}
