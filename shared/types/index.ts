export type Attendance = 'attending' | 'declining'
export type EmailStatus = 'sent' | 'skipped' | 'failed' | 'uncertain'

export interface RsvpInput {
  firstName: string
  lastName: string
  email: string
  attendance: Attendance
  message?: string
  reminderConsent: boolean
  idempotencyKey: string
  website?: string
}

export interface ApiMessage {
  ok: boolean
  message: string
  emailStatus?: EmailStatus
}

export interface ManagedRsvp {
  firstName: string
  lastName: string
  emailMasked: string
  attendance: Attendance
  reminderConsent: boolean
  unsubscribed: boolean
}

export interface AdminSession {
  authenticated: true
  email: string
  mustChangePassword: boolean
}

export interface AdminSummary {
  total: number
  attending: number
  declined: number
  attendingWithReminders: number
}

export interface AdminRsvpRow {
  id: string
  firstName: string
  lastName: string
  email: string
  attendance: Attendance
  reminderConsent: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminRsvpDetail extends AdminRsvpRow {
  message: string | null
  consentAt: string | null
  unsubscribedAt: string | null
}

export interface AdminRsvpList {
  records: AdminRsvpRow[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
