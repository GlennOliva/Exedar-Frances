import { createHash } from 'node:crypto'
import { supabase } from '../db/supabase'

export async function durableRateLimit(scope: string, value: string, maximum: number, minutes: number) {
  const hash = createHash('sha256').update(value.toLowerCase()).digest('hex')
  const { data, error } = await supabase.rpc('consume_rate_limit', {
    p_scope: scope, p_key_hash: hash, p_maximum: maximum, p_window_minutes: minutes,
  })
  if (error) throw new Error('Rate limit check failed', { cause: error })
  if (typeof data !== 'boolean') throw new Error('Rate limit check returned no result')
  return data
}
