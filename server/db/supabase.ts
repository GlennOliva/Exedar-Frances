import { createClient } from '@supabase/supabase-js'
import { getEnv } from '../config/env'

const env = getEnv()

// This privileged client must remain server-only. Never import it from src/ or shared/.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { 'X-Client-Info': 'exedar-frances-server' } },
})

export function requireData<T>(data: T | null, error: { message: string } | null, operation: string): T {
  if (error || data === null) throw new Error(`${operation} failed`)
  return data
}
