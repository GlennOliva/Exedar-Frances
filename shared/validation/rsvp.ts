import { z } from 'zod'

const cleanName = z.string().trim().min(1, 'This field is required.').max(80, 'Please use 80 characters or fewer.')

export const rsvpSchema = z.object({
  firstName: cleanName,
  lastName: cleanName,
  email: z.string().trim().email('Enter a valid email address.').max(254).transform((value) => value.toLowerCase()),
  attendance: z.enum(['attending', 'declining'], { message: 'Please select your attendance.' }),
  message: z.string().trim().max(1000, 'Please use 1,000 characters or fewer.').optional().default(''),
  reminderConsent: z.boolean().default(false),
  idempotencyKey: z.string().uuid(),
  website: z.string().max(0).optional(),
})

export const manageUpdateSchema = z.object({
  token: z.string().min(20),
  attendance: z.enum(['attending', 'declining']),
  reminderConsent: z.boolean(),
  confirmed: z.literal(true),
})

export const tokenSchema = z.object({ token: z.string().min(20) })
export const linkRequestSchema = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()) })
