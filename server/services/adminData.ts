import type { z } from 'zod'
import type { AdminRsvpDetail, AdminRsvpList, AdminRsvpRow, AdminSummary } from '../../shared/types'
import type { adminListQuerySchema } from '../../shared/validation/admin'
import { supabase } from '../db/supabase'

export type AdminListQuery = z.infer<typeof adminListQuerySchema>

interface RsvpRow {
  id: string
  first_name: string
  last_name: string
  email: string
  attendance: 'attending' | 'declining'
  message?: string | null
  reminder_consent: boolean
  consent_at?: string | null
  unsubscribed_at?: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: RsvpRow): AdminRsvpRow {
  return { id: row.id, firstName: row.first_name, lastName: row.last_name, email: row.email, attendance: row.attendance, reminderConsent: row.reminder_consent, createdAt: row.created_at, updatedAt: row.updated_at }
}

export interface AdminDataService {
  summary(): Promise<AdminSummary>
  list(query: AdminListQuery): Promise<AdminRsvpList>
  detail(id: string): Promise<AdminRsvpDetail | null>
}

export const adminDataService: AdminDataService = {
  async summary() {
    const [total, attending, declined, reminders] = await Promise.all([
      supabase.from('rsvps').select('id', { count: 'exact', head: true }),
      supabase.from('rsvps').select('id', { count: 'exact', head: true }).eq('attendance', 'attending'),
      supabase.from('rsvps').select('id', { count: 'exact', head: true }).eq('attendance', 'declining'),
      supabase.from('rsvps').select('id', { count: 'exact', head: true }).eq('attendance', 'attending').eq('reminder_consent', true),
    ])
    const error = total.error ?? attending.error ?? declined.error ?? reminders.error
    if (error) throw new Error('Admin summary query failed', { cause: error })
    return { total: total.count ?? 0, attending: attending.count ?? 0, declined: declined.count ?? 0, attendingWithReminders: reminders.count ?? 0 }
  },

  async list(input) {
    const from = (input.page - 1) * input.pageSize
    let query = supabase.from('rsvps').select('id,first_name,last_name,email,attendance,reminder_consent,created_at,updated_at', { count: 'exact' })
    if (input.search) {
      const search = input.search.replace(/[%_]/g, '\\$&')
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (input.attendance !== 'all') query = query.eq('attendance', input.attendance)
    if (input.reminders !== 'all') query = query.eq('reminder_consent', input.reminders === 'opted-in')
    if (input.sort.startsWith('created_')) query = query.order('created_at', { ascending: input.sort === 'created_asc' })
    else query = query.order('last_name', { ascending: input.sort === 'name_asc' }).order('first_name', { ascending: input.sort === 'name_asc' })
    const result = await query.range(from, from + input.pageSize - 1)
    if (result.error) throw new Error('Admin RSVP list query failed', { cause: result.error })
    const total = result.count ?? 0
    return { records: ((result.data ?? []) as RsvpRow[]).map(mapRow), page: input.page, pageSize: input.pageSize, total, totalPages: Math.max(1, Math.ceil(total / input.pageSize)) }
  },

  async detail(id) {
    const result = await supabase.from('rsvps').select('id,first_name,last_name,email,attendance,message,reminder_consent,consent_at,unsubscribed_at,created_at,updated_at').eq('id', id).maybeSingle()
    if (result.error) throw new Error('Admin RSVP detail query failed', { cause: result.error })
    if (!result.data) return null
    const row = result.data as RsvpRow
    return { ...mapRow(row), message: row.message ?? null, consentAt: row.consent_at ?? null, unsubscribedAt: row.unsubscribed_at ?? null }
  },
}
