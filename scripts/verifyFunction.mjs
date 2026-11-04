import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import request from 'supertest'

Object.assign(process.env, {
  NODE_ENV: 'test',
  SUPABASE_URL: 'https://verify-only.supabase.co',
  SUPABASE_SECRET_KEY: 'verify-only-supabase-secret-key',
  SUPABASE_PUBLISHABLE_KEY: 'verify-only-supabase-publishable-key',
  APP_BASE_URL: 'https://verify-only.example',
  TOKEN_SIGNING_SECRET: 'verify-only-token-signing-secret-value',
  SCHEDULER_SECRET: 'verify-only-scheduler-secret-value-32',
  MAIL_DELIVERY_MODE: 'log',
})
delete process.env.VERCEL

const emitted = [
  'api/server.js',
  'server/app.js',
  'server/config/env.js',
  'server/config/wedding.js',
  'server/db/supabase.js',
  'server/emails/templates.js',
  'server/lib/adminCookies.js',
  'server/lib/safeError.js',
  'server/routes/admin.js',
  'server/routes/api.js',
  'server/services/adminAuth.js',
  'server/services/adminData.js',
  'server/services/mailer.js',
  'server/services/rateLimit.js',
  'server/services/reminders.js',
  'server/services/rsvp.js',
  'server/services/tokens.js',
  'shared/types/index.js',
  'shared/validation/admin.js',
  'shared/validation/rsvp.js',
  'shared/wedding.js',
]

for (const relativePath of emitted) {
  const absolutePath = resolve('.server-build', relativePath)
  assert.ok(existsSync(absolutePath), `Missing compiled backend module: ${relativePath}`)
}

const relativeImport = /(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/g
function javascriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return javascriptFiles(path)
    return entry.isFile() && entry.name.endsWith('.js') ? [path] : []
  })
}

const unresolved = javascriptFiles('.server-build').flatMap((file) => {
  const source = readFileSync(file, 'utf8')
  return [...source.matchAll(relativeImport)]
    .map((match) => match[1])
    .filter((specifier) => !existsSync(resolve(dirname(file), specifier)))
    .map((specifier) => `${file} -> ${specifier}`)
})
assert.deepEqual(unresolved, [], `Compiled imports must resolve to emitted files:\n${unresolved.join('\n')}`)

const entry = pathToFileURL(resolve('.server-build/api/server.js')).href
const handlerModule = await import(entry)

assert.equal(typeof handlerModule.default, 'function', 'The Vercel entry must export a request handler')
assert.equal(handlerModule.config?.runtime, 'nodejs', 'The Vercel entry must declare the nodejs runtime')
assert.equal(handlerModule.config?.maxDuration, 300)

const health = await request(handlerModule.default).get('/api/server?__vercel_api_path=health')
assert.equal(health.status, 200)
assert.deepEqual(health.body, { ok: true })

const invalidRsvp = await request(handlerModule.default).post('/api/server?__vercel_api_path=rsvps').send({})
assert.equal(invalidRsvp.status, 400)
assert.equal(invalidRsvp.body.message, 'Please review your RSVP details.')

console.log(`Verified ${emitted.length} compiled backend modules and the plain-Node handler response.`)
