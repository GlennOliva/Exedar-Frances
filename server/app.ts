import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'node:url'
import { getEnv } from './config/env'
import { logServerError } from './lib/safeError'
import { adminApi } from './routes/admin'
import { api } from './routes/api'

interface AppOptions {
  serveStatic?: boolean
}

export function createApp(options: AppOptions = {}) {
  const env = getEnv()
  const app = express()

  if (env.TRUST_PROXY === 'true') app.set('trust proxy', 1)
  app.disable('x-powered-by')
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"] } }, referrerPolicy: { policy: 'no-referrer' } }))
  app.use(express.json({ limit: '20kb' }))
  app.use('/api/admin', rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: 'draft-8', legacyHeaders: false, message: { ok: false, message: 'Too many administrator requests. Please wait before trying again.' } }), adminApi)
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 80, standardHeaders: 'draft-8', legacyHeaders: false, message: { ok: false, message: 'Too many requests. Please wait before trying again.' } }), api)
  app.use('/api', (_request, response) => response.status(404).json({ ok: false, message: 'API route not found.' }))

  if (options.serveStatic) {
    const dist = fileURLToPath(new URL('../dist', import.meta.url))
    app.use(express.static(dist, { index: false, maxAge: '1h' }))
    app.get('*splat', (_request, response) => response.sendFile(`${dist}/index.html`))
  }

  app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (response.headersSent) return next(error)
    if (error instanceof SyntaxError && 'status' in error && error.status === 400) return response.status(400).json({ ok: false, message: 'The request body is not valid JSON.' })
    logServerError('http.unhandled', error)
    return response.status(500).json({ ok: false, message: 'The server could not complete this request.' })
  })

  return app
}
