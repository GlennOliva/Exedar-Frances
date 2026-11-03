import { createClient } from '@supabase/supabase-js'
import type { AdminSession } from '../../shared/types'
import { getEnv } from '../config/env'
import { supabase } from '../db/supabase'

export type AdminAuthCode = 'invalid_credentials' | 'unauthenticated' | 'forbidden' | 'password_change_required' | 'password_change_failed'

export class AdminAuthError extends Error {
  constructor(public readonly code: AdminAuthCode) { super(code) }
}

export interface AdminAuthSession extends AdminSession {
  userId: string
  accessToken: string
  refreshToken: string
  expiresIn?: number
  refreshed: boolean
}

export interface AdminAuthService {
  login(email: string, password: string): Promise<AdminAuthSession>
  authenticate(accessToken?: string, refreshToken?: string): Promise<AdminAuthSession>
  changePassword(session: AdminAuthSession, currentPassword: string, newPassword: string): Promise<void>
  logout(accessToken?: string): Promise<void>
}

function publicClient() {
  const env = getEnv()
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

async function roleFor(userId: string) {
  const result = await supabase.from('admin_users').select('role,must_change_password').eq('user_id', userId).maybeSingle()
  if (result.error) throw new Error('Admin role lookup failed', { cause: result.error })
  return result.data as { role: string; must_change_password: boolean } | null
}

async function authorizedSession(user: { id: string; email?: string }, accessToken: string, refreshToken: string, refreshed: boolean, expiresIn?: number): Promise<AdminAuthSession> {
  const role = await roleFor(user.id)
  if (!role || role.role !== 'admin') throw new AdminAuthError('forbidden')
  if (!user.email) throw new AdminAuthError('unauthenticated')
  return { authenticated: true, userId: user.id, email: user.email, mustChangePassword: role.must_change_password, accessToken, refreshToken, expiresIn, refreshed }
}

export const adminAuthService: AdminAuthService = {
  async login(email, password) {
    const result = await publicClient().auth.signInWithPassword({ email, password })
    if (result.error || !result.data.user || !result.data.session) throw new AdminAuthError('invalid_credentials')
    try {
      return await authorizedSession(result.data.user, result.data.session.access_token, result.data.session.refresh_token, true, result.data.session.expires_in)
    } catch (error) {
      await supabase.auth.admin.signOut(result.data.session.access_token, 'local').catch(() => undefined)
      throw error
    }
  },

  async authenticate(accessToken, refreshToken) {
    if (accessToken) {
      const result = await supabase.auth.getUser(accessToken)
      if (!result.error && result.data.user) return authorizedSession(result.data.user, accessToken, refreshToken ?? '', false)
    }
    if (!refreshToken) throw new AdminAuthError('unauthenticated')
    const refreshed = await publicClient().auth.refreshSession({ refresh_token: refreshToken })
    if (refreshed.error || !refreshed.data.user || !refreshed.data.session) throw new AdminAuthError('unauthenticated')
    return authorizedSession(refreshed.data.user, refreshed.data.session.access_token, refreshed.data.session.refresh_token, true, refreshed.data.session.expires_in)
  },

  async changePassword(session, currentPassword, newPassword) {
    const verified = await publicClient().auth.signInWithPassword({ email: session.email, password: currentPassword })
    if (verified.error || verified.data.user?.id !== session.userId) throw new AdminAuthError('invalid_credentials')
    const changed = await supabase.auth.admin.updateUserById(session.userId, { password: newPassword })
    if (changed.error) throw new AdminAuthError('password_change_failed')
    const role = await supabase.from('admin_users').update({ must_change_password: false, password_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('user_id', session.userId).eq('role', 'admin')
    if (role.error) throw new Error('Admin password state update failed', { cause: role.error })
  },

  async logout(accessToken) {
    if (accessToken) await supabase.auth.admin.signOut(accessToken, 'local').catch(() => undefined)
  },
}
