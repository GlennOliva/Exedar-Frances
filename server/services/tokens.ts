import { createHmac, timingSafeEqual } from 'node:crypto'
import { getEnv } from '../config/env.js'

type TokenAction = 'manage' | 'unsubscribe'
interface Payload { id: string; version: string; action: TokenAction; exp: number }

function encode(value: string) { return Buffer.from(value).toString('base64url') }
function sign(value: string) { return createHmac('sha256', getEnv().TOKEN_SIGNING_SECRET).update(value).digest('base64url') }

export function createToken(id: string, version: string, action: TokenAction, ttlSeconds: number) {
  const body = encode(JSON.stringify({ id, version, action, exp: Math.floor(Date.now() / 1000) + ttlSeconds }))
  return `${body}.${sign(body)}`
}

export function verifyToken(token: string, action: TokenAction): Payload {
  const [body, signature] = token.split('.')
  if (!body || !signature) throw new Error('invalid_token')
  const expected = sign(body)
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('invalid_token')
  let payload: Payload
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Payload } catch { throw new Error('invalid_token') }
  if (payload.action !== action || payload.exp < Math.floor(Date.now() / 1000) || !payload.id || !payload.version) throw new Error('invalid_token')
  return payload
}
