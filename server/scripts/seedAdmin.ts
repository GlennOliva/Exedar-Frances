import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getEnv } from '../config/env'
import { supabase } from '../db/supabase'
import { seedAdmin, type AdminSeedDependencies } from '../services/adminSeed'

const seedSchema = z.object({
  ADMIN_SEED_EMAIL: z.string().trim().email().transform((value) => value.toLowerCase()),
  ADMIN_SEED_PASSWORD: z.string().min(10).max(200),
})

async function main() {
  const credentials = seedSchema.parse(process.env)
  const env = getEnv()
  const publicClient = () => createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  const dependencies: AdminSeedDependencies = {
    async findUserByEmail(email) {
      for (let page = 1; page <= 100; page += 1) {
        const result = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
        if (result.error) throw result.error
        const match = result.data.users.find((user) => user.email?.toLowerCase() === email)
        if (match) return { id: match.id }
        if (result.data.users.length < 1000) break
      }
      return null
    },
    async verifyCredentials(email, password) {
      const result = await publicClient().auth.signInWithPassword({ email, password })
      if (result.error || !result.data.user) return null
      if (result.data.session) await supabase.auth.admin.signOut(result.data.session.access_token, 'local')
      return { id: result.data.user.id }
    },
    async createUser(email, password) {
      const result = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
      if (result.error || !result.data.user) throw result.error ?? new Error('Supabase did not return the created user.')
      return { id: result.data.user.id }
    },
    async hasAdminRole(userId) {
      const result = await supabase.from('admin_users').select('role').eq('user_id', userId).maybeSingle()
      if (result.error) throw result.error
      return result.data?.role === 'admin'
    },
    async assignAdminRole(userId) {
      const result = await supabase.from('admin_users').insert({ user_id: userId, role: 'admin', must_change_password: true })
      if (result.error) throw result.error
    },
  }

  const result = await seedAdmin(credentials.ADMIN_SEED_EMAIL, credentials.ADMIN_SEED_PASSWORD, dependencies)
  console.log(JSON.stringify({ ok: true, created: result.created, roleAssigned: result.roleAssigned, alreadyProvisioned: result.alreadyProvisioned, mustChangePassword: true }))
}

void main().catch((error: Error) => {
  const secrets = [process.env.ADMIN_SEED_EMAIL, process.env.ADMIN_SEED_PASSWORD].filter((value): value is string => Boolean(value))
  const message = secrets.reduce((value, secret) => value.split(secret).join('[redacted]'), error.message)
  console.error(JSON.stringify({ ok: false, message }))
  process.exitCode = 1
})
