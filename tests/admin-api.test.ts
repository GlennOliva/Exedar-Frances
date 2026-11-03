import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import type { AdminRsvpRow } from '../shared/types'
import { createAdminRouter } from '../server/routes/admin'
import { AdminAuthError, type AdminAuthService, type AdminAuthSession } from '../server/services/adminAuth'
import type { AdminDataService, AdminListQuery } from '../server/services/adminData'

const records: AdminRsvpRow[] = [
  { id: '11111111-1111-4111-8111-111111111111', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', attendance: 'attending', reminderConsent: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-02T00:00:00Z' },
  { id: '22222222-2222-4222-8222-222222222222', firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', attendance: 'declining', reminderConsent: false, createdAt: '2026-11-03T00:00:00Z', updatedAt: '2026-11-03T00:00:00Z' },
  { id: '33333333-3333-4333-8333-333333333333', firstName: 'Alan', lastName: 'Turing', email: 'alan@example.com', attendance: 'attending', reminderConsent: false, createdAt: '2026-11-02T00:00:00Z', updatedAt: '2026-11-02T00:00:00Z' },
]

function session(accessToken: string, mustChangePassword = false): AdminAuthSession {
  return { authenticated: true, userId: accessToken, email: 'admin@example.com', mustChangePassword, accessToken, refreshToken: 'test-refresh', refreshed: false }
}

const auth: AdminAuthService = {
  async login() { return session('admin') },
  async authenticate(accessToken) {
    if (!accessToken) throw new AdminAuthError('unauthenticated')
    if (accessToken === 'non-admin') throw new AdminAuthError('forbidden')
    return session(accessToken, accessToken === 'must-change')
  },
  async changePassword() {},
  async logout() {},
}

function filtered(input: AdminListQuery) {
  let result = [...records]
  const search = input.search.toLowerCase()
  if (search) result = result.filter((row) => `${row.firstName} ${row.lastName} ${row.email}`.toLowerCase().includes(search))
  if (input.attendance !== 'all') result = result.filter((row) => row.attendance === input.attendance)
  if (input.reminders !== 'all') result = result.filter((row) => row.reminderConsent === (input.reminders === 'opted-in'))
  result.sort((left, right) => input.sort.startsWith('name_')
    ? `${left.lastName}${left.firstName}`.localeCompare(`${right.lastName}${right.firstName}`) * (input.sort === 'name_asc' ? 1 : -1)
    : left.createdAt.localeCompare(right.createdAt) * (input.sort === 'created_asc' ? 1 : -1))
  return result
}

const data: AdminDataService = {
  async summary() { return { total: 3, attending: 2, declined: 1, attendingWithReminders: 1 } },
  async list(input) {
    const matches = filtered(input); const start = (input.page - 1) * input.pageSize
    return { records: matches.slice(start, start + input.pageSize), page: input.page, pageSize: input.pageSize, total: matches.length, totalPages: Math.max(1, Math.ceil(matches.length / input.pageSize)) }
  },
  async detail(id) {
    const row = records.find((record) => record.id === id)
    return row ? { ...row, message: 'Welcome', consentAt: '2026-11-01T00:00:00Z', unsubscribedAt: null } : null
  },
}

function app() {
  const value = express()
  value.use(express.json())
  value.use('/api/admin', createAdminRouter({ auth, data }))
  return value
}

describe('admin API authorization', () => {
  it('rejects unauthenticated requests and prevents caching', async () => {
    const response = await request(app()).get('/api/admin/summary')
    expect(response.status).toBe(401)
    expect(response.headers['cache-control']).toContain('no-store')
  })

  it('rejects an authenticated non-admin user', async () => {
    const response = await request(app()).get('/api/admin/summary').set('Cookie', 'wedding_admin_access=non-admin')
    expect(response.status).toBe(403)
  })

  it('blocks an admin until the initial password is changed', async () => {
    const response = await request(app()).get('/api/admin/rsvps').set('Cookie', 'wedding_admin_access=must-change')
    expect(response.status).toBe(428)
    expect(response.body.code).toBe('PASSWORD_CHANGE_REQUIRED')
  })

  it('returns counts and paginated records to an authorized admin', async () => {
    const summary = await request(app()).get('/api/admin/summary').set('Cookie', 'wedding_admin_access=admin')
    expect(summary.status).toBe(200)
    expect(summary.body).toEqual({ total: 3, attending: 2, declined: 1, attendingWithReminders: 1 })
    const list = await request(app()).get('/api/admin/rsvps?page=1&pageSize=10').set('Cookie', 'wedding_admin_access=admin')
    expect(list.status).toBe(200)
    expect(list.body.total).toBe(3)
    expect(list.body.records).toHaveLength(3)
  })

  it('applies server-side search and filters', async () => {
    const response = await request(app()).get('/api/admin/rsvps?page=1&pageSize=10&search=ada&attendance=attending&reminders=opted-in&sort=name_asc').set('Cookie', 'wedding_admin_access=admin')
    expect(response.status).toBe(200)
    expect(response.body.total).toBe(1)
    expect(response.body.records[0]).toMatchObject({ firstName: 'Ada', attendance: 'attending', reminderConsent: true })
  })

  it('excludes tokens and secrets from detail responses', async () => {
    const response = await request(app()).get(`/api/admin/rsvps/${records[0].id}`).set('Cookie', 'wedding_admin_access=admin')
    expect(response.status).toBe(200)
    const serialized = JSON.stringify(response.body)
    expect(serialized).not.toMatch(/token_version|managementToken|SUPABASE|SIGNING_SECRET|password/i)
  })
})
