import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'node:url'
import { api } from './routes/api'
import { getEnv } from './config/env'
import { startScheduler } from './jobs/scheduler'
import { adminApi } from './routes/admin'

const env = getEnv()
const app = express()
if (env.TRUST_PROXY === 'true') app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"] } }, referrerPolicy: { policy: 'no-referrer' } }))
app.use(express.json({ limit: '20kb' }))
app.use('/api/admin', rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: 'draft-8', legacyHeaders: false, message: { ok: false, message: 'Too many administrator requests. Please wait before trying again.' } }), adminApi)
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 80, standardHeaders: 'draft-8', legacyHeaders: false, message: { ok: false, message: 'Too many requests. Please wait before trying again.' } }), api)

if (env.NODE_ENV === 'production') {
  const dist = fileURLToPath(new URL('../dist', import.meta.url))
  app.use(express.static(dist, { index: false, maxAge: '1h' }))
  app.get('*splat', (_request, response) => response.sendFile(`${dist}/index.html`))
}

const server = app.listen(env.PORT, () => console.log(`Wedding server listening on port ${env.PORT}`))
const scheduler = startScheduler()
function shutdown() { scheduler.stop(); server.close() }
process.on('SIGTERM', () => void shutdown())
process.on('SIGINT', () => void shutdown())

export { app }
