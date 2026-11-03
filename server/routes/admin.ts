import { Router, type NextFunction, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { adminListQuerySchema, adminLoginSchema, adminPasswordChangeSchema, adminRsvpIdSchema } from '../../shared/validation/admin'
import { clearAdminCookies, adminAccessCookie, adminRefreshCookie, readCookies, setAdminCookies } from '../lib/adminCookies'
import { logServerError } from '../lib/safeError'
import { AdminAuthError, adminAuthService, type AdminAuthService, type AdminAuthSession } from '../services/adminAuth'
import { adminDataService, type AdminDataService } from '../services/adminData'
import { getEnv } from '../config/env'

interface AdminDependencies { auth: AdminAuthService; data: AdminDataService }
type AuthenticatedRequest = Request & { adminUserId?: string }

function noStore(_request: Request, response: Response, next: NextFunction) {
  response.set({ 'Cache-Control': 'no-store, private', Pragma: 'no-cache', Vary: 'Cookie' })
  next()
}

function sameOrigin(request: Request, response: Response, next: NextFunction) {
  const origin = request.get('Origin')
  if (!origin || origin !== new URL(getEnv().APP_BASE_URL).origin) return response.status(403).json({ ok: false, message: 'Request origin was not accepted.' })
  next()
}

function authFailure(response: Response, error: unknown) {
  if (error instanceof AdminAuthError) {
    if (error.code === 'forbidden') return response.status(403).json({ ok: false, message: 'This account is not authorized for administration.' })
    return response.status(401).json({ ok: false, message: 'Your administrator session is invalid or has expired.' })
  }
  logServerError('admin.authenticate', error)
  return response.status(503).json({ ok: false, message: 'Administrator authentication is temporarily unavailable.' })
}

export function createAdminRouter(dependencies: AdminDependencies = { auth: adminAuthService, data: adminDataService }) {
  const router = Router()
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true, standardHeaders: 'draft-8', legacyHeaders: false, message: { ok: false, message: 'Too many login attempts. Please wait and try again.' } })
  const readLimiter = rateLimit({ windowMs: 5 * 60 * 1000, limit: 120, keyGenerator: (request) => (request as AuthenticatedRequest).adminUserId ?? 'unknown-admin', standardHeaders: 'draft-8', legacyHeaders: false, message: { ok: false, message: 'Too many dashboard requests. Please wait before refreshing again.' } })

  router.use(noStore)
  router.post('/auth/login', sameOrigin, loginLimiter, async (request, response) => {
    const parsed = adminLoginSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ ok: false, message: 'Enter a valid email address and password.' })
    try {
      const session = await dependencies.auth.login(parsed.data.email, parsed.data.password)
      setAdminCookies(response, session)
      return response.json({ ok: true, authenticated: true, email: session.email, mustChangePassword: session.mustChangePassword })
    } catch (error) {
      if (error instanceof AdminAuthError && error.code === 'invalid_credentials') return response.status(401).json({ ok: false, message: 'The email address or password is incorrect.' })
      if (error instanceof AdminAuthError && error.code === 'forbidden') return response.status(403).json({ ok: false, message: 'This account is not authorized for administration.' })
      logServerError('admin.login', error)
      return response.status(503).json({ ok: false, message: 'Administrator login is temporarily unavailable.' })
    }
  })

  router.post('/auth/logout', sameOrigin, async (request, response) => {
    const accessToken = readCookies(request)[adminAccessCookie]
    await dependencies.auth.logout(accessToken)
    clearAdminCookies(response)
    return response.json({ ok: true })
  })

  async function requireAdmin(request: Request, response: Response, next: NextFunction) {
    const cookies = readCookies(request)
    try {
      const session = await dependencies.auth.authenticate(cookies[adminAccessCookie], cookies[adminRefreshCookie])
      if (session.refreshed) setAdminCookies(response, session)
      response.locals.admin = session
      ;(request as AuthenticatedRequest).adminUserId = session.userId
      next()
    } catch (error) { return authFailure(response, error) }
  }

  router.get('/auth/session', requireAdmin, (_request, response) => {
    const session = response.locals.admin as AdminAuthSession
    return response.json({ authenticated: true, email: session.email, mustChangePassword: session.mustChangePassword })
  })

  router.post('/auth/change-password', sameOrigin, requireAdmin, async (request, response) => {
    const parsed = adminPasswordChangeSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ ok: false, message: parsed.error.issues[0]?.message ?? 'Choose a valid new password.' })
    try {
      await dependencies.auth.changePassword(response.locals.admin as AdminAuthSession, parsed.data.currentPassword, parsed.data.newPassword)
      clearAdminCookies(response)
      return response.json({ ok: true, message: 'Password changed. Sign in again with your new password.' })
    } catch (error) {
      if (error instanceof AdminAuthError && error.code === 'invalid_credentials') return response.status(400).json({ ok: false, message: 'The current password is incorrect.' })
      logServerError('admin.change-password', error)
      return response.status(503).json({ ok: false, message: 'The password could not be changed.' })
    }
  })

  router.use(requireAdmin)
  router.use((_request, response, next) => {
    const session = response.locals.admin as AdminAuthSession
    if (session.mustChangePassword) return response.status(428).json({ ok: false, code: 'PASSWORD_CHANGE_REQUIRED', message: 'Change the initial password before viewing attendee records.' })
    next()
  })
  router.use(readLimiter)

  router.get('/summary', async (_request, response) => {
    try { return response.json(await dependencies.data.summary()) }
    catch (error) { logServerError('admin.summary', error); return response.status(503).json({ ok: false, message: 'RSVP summary data is temporarily unavailable.' }) }
  })

  router.get('/rsvps', async (request, response) => {
    const parsed = adminListQuerySchema.safeParse(request.query)
    if (!parsed.success) return response.status(400).json({ ok: false, message: 'Review the search, filter, and pagination values.' })
    try { return response.json(await dependencies.data.list(parsed.data)) }
    catch (error) { logServerError('admin.rsvps.list', error); return response.status(503).json({ ok: false, message: 'RSVP records are temporarily unavailable.' }) }
  })

  router.get('/rsvps/:id', async (request, response) => {
    const parsed = adminRsvpIdSchema.safeParse(request.params.id)
    if (!parsed.success) return response.status(400).json({ ok: false, message: 'The RSVP identifier is invalid.' })
    try {
      const record = await dependencies.data.detail(parsed.data)
      return record ? response.json(record) : response.status(404).json({ ok: false, message: 'RSVP record not found.' })
    } catch (error) { logServerError('admin.rsvps.detail', error); return response.status(503).json({ ok: false, message: 'The RSVP record is temporarily unavailable.' }) }
  })

  return router
}

export const adminApi = createAdminRouter()
