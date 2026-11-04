import type { Request, Response } from 'express'
import type { AdminAuthSession } from '../services/adminAuth.js'
import { getEnv } from '../config/env.js'

export const adminAccessCookie = 'wedding_admin_access'
export const adminRefreshCookie = 'wedding_admin_refresh'

export function readCookies(request: Request) {
  const values: Record<string, string> = {}
  for (const part of (request.get('Cookie') ?? '').split(';')) {
    const index = part.indexOf('=')
    if (index < 1) continue
    try { values[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim()) } catch { /* Ignore malformed cookies. */ }
  }
  return values
}

function options(maxAge: number) {
  return { httpOnly: true, secure: getEnv().NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/admin', maxAge }
}

export function setAdminCookies(response: Response, session: AdminAuthSession) {
  response.cookie(adminAccessCookie, session.accessToken, options((session.expiresIn ?? 3600) * 1000))
  response.cookie(adminRefreshCookie, session.refreshToken, options(30 * 24 * 60 * 60 * 1000))
}

export function clearAdminCookies(response: Response) {
  response.clearCookie(adminAccessCookie, options(0))
  response.clearCookie(adminRefreshCookie, options(0))
}
