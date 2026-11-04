import request from 'supertest'
import { describe, expect, it } from 'vitest'
import handler from '../api/server.js'

describe('Vercel API function routing', () => {
  it('forwards the health route into the shared Express application', async () => {
    const response = await request(handler).get('/api/server?__vercel_api_path=health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true })
  })

  it('forwards RSVP requests to validation without contacting persistence', async () => {
    const response = await request(handler).post('/api/server?__vercel_api_path=rsvps').send({})
    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Please review your RSVP details.')
  })

  it('includes management, admin, and protected scheduler routes', async () => {
    const [management, admin, scheduler] = await Promise.all([
      request(handler).post('/api/server?__vercel_api_path=manage/view').send({}),
      request(handler).get('/api/server?__vercel_api_path=admin/auth/session'),
      request(handler).get('/api/server?__vercel_api_path=jobs/reminders'),
    ])
    expect(management.status).toBe(400)
    expect(admin.status).toBe(401)
    expect(scheduler.status).toBe(401)
  })
})
