# Exedar & Frances Wedding Invitation

An accessible React and TypeScript invitation with a Supabase-backed RSVP API, Gmail SMTP confirmation emails, secure RSVP management links, and server-side wedding reminders.

## Requirements

- Node.js 22 or later
- A Supabase project
- A Supabase secret key for server-side access
- A Gmail account with 2-Step Verification and a Google App Password for live delivery
- An always-on Node host, or an external scheduler that calls the protected reminder endpoint every five minutes

Supabase is the durable source of truth for RSVPs, consent, unsubscribe state, idempotency keys, rate limits, and delivery records. Browser storage, server memory, and local files are not used for RSVP persistence.

## Supabase setup

The complete schema is in `supabase/migrations/202611030001_wedding_rsvp.sql`. It creates all tables, constraints, indexes, RLS settings, and atomic database functions.

Choose one migration method:

1. Supabase SQL Editor: open the project dashboard, select **SQL Editor**, paste the entire migration file, and run it once.
2. Supabase CLI: authenticate and link the project, then run `npm run db:migrate`.

CLI setup:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:migrate
```

All four private tables have Row Level Security enabled and forced. No `anon` or `authenticated` policies are created, and their table and function privileges are revoked. Only the server secret role can read records or execute the RSVP functions. Guest submissions continue through the validated Express API; the browser never connects directly to Supabase.

The migration provides these atomic functions:

- `submit_rsvp`: serializes idempotency keys and saves the RSVP plus key in one transaction.
- `consume_rate_limit`: serializes durable rate-limit admission.
- `update_managed_rsvp`: updates attendance, consent, and consent timestamps together.
- `unsubscribe_rsvp`: idempotently removes reminder consent without changing attendance.
- `claim_reminder_deliveries`: atomically claims each guest/reminder once.
- `mark_stale_email_deliveries`: marks ambiguous abandoned sends as uncertain.

## Local setup

1. Run `npm install`.
2. Create `.env.local` from `.env.example` and replace every placeholder.
3. Apply the Supabase migration using SQL Editor or the CLI instructions above.
4. Keep `MAIL_DELIVERY_MODE=log` while verifying locally.
5. Run `npm run dev` for the Vite site on `http://localhost:5174` and API on `http://localhost:3001`.

`.env.local` loads before `.env` and before environment validation. Existing process environment variables retain highest priority. Never prefix `SUPABASE_SECRET_KEY`, SMTP credentials, or signing secrets with `VITE_`.

## Commands

- `npm run dev`: frontend and backend development servers
- `npm run dev:web`: frontend only
- `npm run dev:server`: backend only
- `npm run typecheck`: frontend and server TypeScript checks
- `npm run lint`: ESLint
- `npm test`: unit checks; Supabase integration checks run only with dedicated test variables
- `npm run build`: checked Vite production build
- `npm run db:migrate`: push migrations with the linked Supabase CLI
- `npm run admin:seed`: provision or verify the one-time Supabase Auth administrator
- `npm start`: serve `dist/`, the API, and the internal scheduler in production

To run the destructive integration suite, use a dedicated test project with the migration already applied:

```bash
TEST_SUPABASE_URL=https://your-test-project.supabase.co \
TEST_SUPABASE_SECRET_KEY=your-test-secret-key \
npm test
```

The integration test clears wedding tables. Never point these test variables at production.

## Administrator dashboard

The private dashboard is available at `/admin/login`. Supabase Auth establishes identity, while attendee data remains behind the same-origin Express API and the server-only Supabase secret client. The forced-RLS `admin_users` table grants no access to `anon` or `authenticated` and stores the trusted role plus the initial-password-change requirement.

Apply all migrations before provisioning the first administrator:

```bash
npm run db:migrate
```

Set these server-only variables in `.env.local` using the one-time credentials supplied by the site owner. Do not use a `VITE_` prefix and do not commit them:

```dotenv
ADMIN_SEED_EMAIL=replace-with-the-initial-admin-email
ADMIN_SEED_PASSWORD=replace-with-the-one-time-initial-password
```

Run the idempotent seed command:

```bash
npm run admin:seed
```

The seed uses Supabase's supported administrative user-creation API. If the email already exists, it verifies the supplied password and matching user identity before assigning a role; it never resets an existing password. Remove `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` from the runtime environment after provisioning.

Sign in at `/admin/login`. The backend blocks every attendee endpoint until the administrator replaces the one-time password with a unique password of at least 12 characters. Password change revokes the current browser session and requires signing in again.

Production also requires `SUPABASE_PUBLISHABLE_KEY`, the exact public `APP_BASE_URL` origin, HTTPS for secure administrator cookies, and the Supabase Email/Password provider enabled. There is no public administrator registration route.

## Gmail SMTP

Enable 2-Step Verification on the sender Google account, create an App Password, and set `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Never use the normal Google account password. `MAIL_DELIVERY_MODE=log` renders and records test messages without network delivery. `test` redirects all recipients to `TEST_EMAIL_TO`; `production` enables real guest delivery.

With `MAIL_DELIVERY_MODE=test`, run `npm run mail:test` to verify SMTP connectivity/authentication and send exactly one standalone message to `TEST_EMAIL_TO`. This command bypasses RSVP duplicate and rate-limit handling and does not create an `email_deliveries` row. A successful `verify()` confirms only the SMTP connection and credentials. A successful send means Gmail accepted the message; it does not prove inbox placement.

Delivery-state meanings:

- `skipped` with `LOG_MODE_SIMULATED` or `RATE_LIMITED`: no network delivery occurred.
- `pending` or `sending`: queued locally or currently being attempted.
- `sent`: accepted by the SMTP server and assigned a message ID; inbox delivery remains unconfirmed.
- `failed`: SMTP rejected the attempt or no recipient was accepted.
- `uncertain`: the connection failed after transmission may have started, so automatic retries could duplicate mail.

Gmail quotas vary by account type. The scheduler sends individually, retries only clear temporary pre-acceptance failures, and persists `uncertain` when SMTP may have accepted a message. Uncertain deliveries are not blindly retried.

## RSVP privacy and management

The public form validates on both client and server. Email is normalized and unique, idempotency keys prevent double-click duplicates, and duplicate-email submissions never overwrite an RSVP. Public responses do not reveal whether an email exists.

Management and unsubscribe tokens are HMAC-signed, action-scoped, expiring, and tied to a database token version. Tokens remain in URL fragments and are POSTed to the API, so they do not enter HTTP access-log URLs. Attendance and consent changes require explicit confirmation. Unsubscribe is idempotent and does not change attendance.

## Reminder scheduling

Reminder instants remain centralized in `server/config/wedding.ts`:

- January 16, 2027 at 9:00 AM Asia/Manila
- January 22, 2027 at 9:00 AM Asia/Manila

The internal `node-cron` job checks every five minutes. Supabase atomically claims one delivery per guest/reminder, including across concurrent server instances. Eligibility is rechecked immediately before SMTP delivery.

For hosts without persistent processes, schedule `POST /api/jobs/reminders` every five minutes with `Authorization: Bearer $SCHEDULER_SECRET`. Running internal and external schedulers together is safe because claims are unique.

## Production deployment

1. Apply all files in `supabase/migrations/` to the production Supabase project.
2. Configure all server variables from `.env.example`, using `APP_BASE_URL=https://your-public-domain` and independent random signing and scheduler secrets.
3. Run `npm run build`, then `npm start` on an always-on Node service.
4. Set `TRUST_PROXY=true` only behind a trusted single reverse proxy.
5. Verify `/api/health` with `MAIL_DELIVERY_MODE=log`, then use `test` with `TEST_EMAIL_TO` before explicitly enabling `production` mail.

The server does not log request bodies, guest records, Supabase keys, SMTP credentials, or management tokens. The static website design, entourage, dress-code illustration, animations, and scripted wedding assistant are independent of Supabase and remain unchanged.
