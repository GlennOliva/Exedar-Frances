import { beforeAll, describe, expect, it } from 'vitest'

const enabled = Boolean(process.env.TEST_SUPABASE_URL && process.env.TEST_SUPABASE_SECRET_KEY)
describe.runIf(enabled)('Supabase RSVP integration', () => {
  let modules: Awaited<ReturnType<typeof loadModules>>

  beforeAll(async () => {
    process.env.SUPABASE_URL = process.env.TEST_SUPABASE_URL
    process.env.SUPABASE_SECRET_KEY = process.env.TEST_SUPABASE_SECRET_KEY
    process.env.APP_BASE_URL = 'https://wedding.example'
    process.env.TOKEN_SIGNING_SECRET = 'integration-signing-secret-at-least-32-characters'
    process.env.SCHEDULER_SECRET = 'integration-scheduler-secret-at-least-32-chars'
    process.env.MAIL_DELIVERY_MODE = 'log'
    modules = await loadModules()
    for (const table of ['rate_limit_events', 'email_deliveries', 'idempotency_keys', 'rsvps']) {
      const result = await modules.supabase.from(table).delete().neq('created_at', '1900-01-01T00:00:00.000Z')
      if (result.error) throw result.error
    }
  })

  it('persists an RSVP and does not overwrite an existing email', async () => {
    const first = await modules.createRsvp(input('ada@example.com', 'attending', true, 'be7b4367-bc0e-43f5-86a4-5a498de4a5fd'))
    expect(first.ok).toBe(true); expect(first.emailStatus).toBe('skipped')
    await modules.createRsvp({ ...input('ADA@example.com', 'declining', false, 'd03ed41e-9375-4b7a-94bb-74cb7309be62'), firstName: 'Attacker' })
    const saved = await modules.supabase.from('rsvps').select('first_name,attendance,reminder_consent').eq('email', 'ada@example.com').single()
    expect(saved.error).toBeNull(); expect(saved.data).toMatchObject({ first_name: 'Ada', attendance: 'attending', reminder_consent: true })
  })

  it('requires a signed link to update and unsubscribes without changing attendance', async () => {
    const selected = await modules.supabase.from('rsvps').select('id,token_version').eq('email', 'ada@example.com').single()
    if (selected.error) throw selected.error
    const row = selected.data
    const manage = modules.createToken(row.id, row.token_version, 'manage', 60)
    await modules.updateManagedRsvp(manage, 'declining', true)
    let saved = await modules.supabase.from('rsvps').select('attendance,reminder_consent,unsubscribed_at').eq('id', row.id).single()
    expect(saved.data).toMatchObject({ attendance: 'declining', reminder_consent: false })
    await modules.updateManagedRsvp(manage, 'attending', true)
    const unsub = modules.createToken(row.id, row.token_version, 'unsubscribe', 60)
    await modules.unsubscribe(unsub); await modules.unsubscribe(unsub)
    saved = await modules.supabase.from('rsvps').select('attendance,reminder_consent,unsubscribed_at').eq('id', row.id).single()
    expect(saved.data?.attendance).toBe('attending'); expect(saved.data?.reminder_consent).toBe(false); expect(saved.data?.unsubscribed_at).toBeTruthy()
  })

  it('deduplicates concurrent reminders and excludes later unsubscribes', async () => {
    await modules.createRsvp(input('grace@example.com', 'attending', true, '8e44f329-e89a-4390-8d23-a7674edbeff7'))
    const scheduled = new Date('2027-01-16T01:01:00.000Z')
    await Promise.all([modules.runReminders(scheduled), modules.runReminders(scheduled)])
    const selected = await modules.supabase.from('rsvps').select('id,token_version').eq('email', 'grace@example.com').single()
    if (selected.error) throw selected.error
    const grace = selected.data
    let deliveries = await modules.supabase.from('email_deliveries').select('status').eq('rsvp_id', grace.id).eq('email_type', 'reminder:one-week')
    expect(deliveries.data).toEqual([{ status: 'skipped' }])
    await modules.unsubscribe(modules.createToken(grace.id, grace.token_version, 'unsubscribe', 60))
    await modules.runReminders(new Date('2027-01-22T01:01:00.000Z'))
    deliveries = await modules.supabase.from('email_deliveries').select('status').eq('rsvp_id', grace.id).eq('email_type', 'reminder:one-day')
    expect(deliveries.data).toEqual([])
  })
})

function input(email: string, attendance: 'attending' | 'declining', reminderConsent: boolean, idempotencyKey: string) {
  return { firstName: 'Ada', lastName: 'Lovelace', email, attendance, message: '', reminderConsent, idempotencyKey, website: '' }
}

async function loadModules() {
  const [{ supabase }, rsvp, tokens, reminders] = await Promise.all([
    import('../server/db/supabase'), import('../server/services/rsvp'), import('../server/services/tokens'), import('../server/services/reminders'),
  ])
  return { supabase, ...rsvp, ...tokens, ...reminders }
}
