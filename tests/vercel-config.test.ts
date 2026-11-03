import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

interface VercelConfig {
  framework: string
  outputDirectory: string
  rewrites: Array<{ source: string; destination: string }>
  crons: Array<{ path: string; schedule: string }>
}

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as VercelConfig

describe('Vercel deployment configuration', () => {
  it('routes the API function before explicit SPA fallbacks', () => {
    expect(config.framework).toBe('vite')
    expect(config.outputDirectory).toBe('dist')
    expect(config.rewrites[0]).toEqual({ source: '/api/:path*', destination: '/api/server?__vercel_api_path=:path*' })
    expect(config.rewrites.slice(1).map((rewrite) => rewrite.source)).toEqual(['/admin', '/admin/login', '/manage', '/unsubscribe'])
  })

  it('uses the protected reminder endpoint instead of a serverless timer', () => {
    expect(config.crons).toEqual([{ path: '/api/jobs/reminders', schedule: '0 1 * * *' }])
  })
})
