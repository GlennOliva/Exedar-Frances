import type { AdminRsvpDetail, AdminRsvpList, AdminSession, AdminSummary } from '../../shared/types'

export class AdminApiError extends Error {
  readonly status: number
  readonly code?: string
  constructor(status: number, message: string, code?: string) { super(message); this.status = status; this.code = code }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try { response = await fetch(`/api/admin${path}`, { credentials: 'same-origin', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }) }
  catch { throw new AdminApiError(0, 'The administrator service could not be reached.') }
  let body: unknown
  try { body = await response.json() } catch { throw new AdminApiError(response.status, 'The administrator service returned an unexpected response.') }
  if (!response.ok) {
    const value = body as { message?: unknown; code?: unknown }
    throw new AdminApiError(response.status, typeof value.message === 'string' ? value.message : 'The request could not be completed.', typeof value.code === 'string' ? value.code : undefined)
  }
  return body as T
}

export const adminApi = {
  login: (email: string, password: string) => request<AdminSession & { ok: true }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  session: () => request<AdminSession>('/auth/session'),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST', body: '{}' }),
  changePassword: (currentPassword: string, newPassword: string) => request<{ ok: true; message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  summary: () => request<AdminSummary>('/summary'),
  list: (params: URLSearchParams) => request<AdminRsvpList>(`/rsvps?${params.toString()}`),
  detail: (id: string) => request<AdminRsvpDetail>(`/rsvps/${encodeURIComponent(id)}`),
}
