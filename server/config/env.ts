import { config } from 'dotenv'
import { z } from 'zod'

// Vercel injects process.env; local files are only a development convenience.
if (!process.env.VERCEL) {
  config({ path: '.env.local', quiet: true })
  config({ path: '.env', quiet: true })
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default(process.env.VERCEL ? 'production' : 'development'),
  PORT: z.coerce.number().int().positive().default(3001),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(20),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20).optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20).optional(),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().default(''), SMTP_PASS: z.string().default(''), SMTP_FROM: z.string().default(''),
  APP_BASE_URL: z.string().url(), TOKEN_SIGNING_SECRET: z.string().min(32), SCHEDULER_SECRET: z.string().min(32),
  TEST_EMAIL_TO: z.string().email().optional(), MAIL_DELIVERY_MODE: z.enum(['log', 'test', 'production']).default('log'),
  TRUST_PROXY: z.enum(['true', 'false']).default(process.env.VERCEL ? 'true' : 'false'),
})

export type Env = z.infer<typeof schema>
let cached: Env | undefined
export function getEnv() {
  if (!cached) {
    const parsed = schema.parse(process.env)
    const publishable = parsed.SUPABASE_PUBLISHABLE_KEY ?? parsed.VITE_SUPABASE_PUBLISHABLE_KEY
    if (!publishable) throw new Error('SUPABASE_PUBLISHABLE_KEY is required')
    cached = { ...parsed, SUPABASE_PUBLISHABLE_KEY: publishable }
  }
  return cached
}
