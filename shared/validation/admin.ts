import { z } from 'zod'

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
})

export const adminPasswordChangeSchema = z.object({
  currentPassword: z.string().min(8).max(200),
  newPassword: z.string().min(12, 'Use at least 12 characters.').max(200),
}).refine((value) => value.currentPassword !== value.newPassword, { path: ['newPassword'], message: 'Choose a password different from the current password.' })

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine((value) => [10, 20, 50].includes(value), 'Use a supported page size.').default(20),
  search: z.string().trim().max(100).regex(/^[\p{L}\p{N}\s@._+'-]*$/u, 'Search contains unsupported characters.').default(''),
  attendance: z.enum(['all', 'attending', 'declining']).default('all'),
  reminders: z.enum(['all', 'opted-in', 'not-opted-in']).default('all'),
  sort: z.enum(['created_desc', 'created_asc', 'name_asc', 'name_desc']).default('created_desc'),
})

export const adminRsvpIdSchema = z.string().uuid()
