import { getEnv } from '../config/env'

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const tokenPattern = /\b(?:eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sb_(?:secret|publishable)_[A-Za-z0-9_-]+|[a-f0-9]{32,})\b/gi
const uuidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi

function secrets() {
  try {
    const env = getEnv()
    return [env.SUPABASE_SECRET_KEY, env.SMTP_PASS, env.TOKEN_SIGNING_SECRET, env.SCHEDULER_SECRET].filter(Boolean)
  } catch {
    return []
  }
}

function sanitize(message: string) {
  let value = message
  for (const secret of secrets()) value = value.split(secret).join('[redacted]')
  return value.replace(emailPattern, '[redacted-email]').replace(tokenPattern, '[redacted-token]').replace(uuidPattern, '[redacted-id]').slice(0, 500)
}

function asRecord(value: unknown) {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined
}

function asText(value: unknown) {
  return typeof value === 'string' && value ? value : undefined
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function logServerError(operation: string, error: unknown) {
  const primary = asRecord(error)
  const source = asRecord(primary?.cause) ?? primary
  const name = asText(source?.name) ?? asText(primary?.name) ?? 'Error'
  const code = asText(source?.code) ?? asText(primary?.code)
  const status = asNumber(source?.status) ?? asNumber(primary?.status)
  const message = asText(source?.message) ?? asText(primary?.message) ?? 'Unknown server error'
  console.error(JSON.stringify({ level: 'error', operation, name, ...(code ? { code } : {}), ...(status ? { status } : {}), message: sanitize(message) }))
}
