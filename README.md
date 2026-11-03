# Exedar & Frances Wedding Invitation

An accessible React and TypeScript invitation with a Supabase-backed RSVP API, Gmail SMTP confirmation emails, secure RSVP management links, and server-side wedding reminders.

## Requirements

- Node.js 22 or later
- A Supabase project
- A Supabase secret key for server-side access
- A Gmail account with 2-Step Verification and a Google App Password for live delivery
- An always-on Node host, or a protected platform scheduler

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

The internal `node-cron` job checks every five minutes on an always-on Node host. Supabase atomically claims one delivery per guest/reminder, including across concurrent server instances. Eligibility is rechecked immediately before SMTP delivery.

For hosts without persistent processes, schedule `POST /api/jobs/reminders` every five minutes with `Authorization: Bearer $SCHEDULER_SECRET`. Running internal and external schedulers together is safe because claims are unique.

On Vercel, the local timer is not started. `vercel.json` configures a daily 01:00 UTC Cron invocation, corresponding to 9:00 AM in Manila. The reminder service allows a two-hour processing grace period because Hobby Cron invocations may occur at any point during the configured UTC hour. The route also retains protected POST support for manual or external schedulers. Vercel Cron sends GET requests and automatically supplies `Authorization: Bearer $CRON_SECRET`; configure `CRON_SECRET` with the same value as `SCHEDULER_SECRET`. Do not invoke this route while validating production unless `MAIL_DELIVERY_MODE=log` or `test` is intentionally configured.

## Production deployment

1. Apply all files in `supabase/migrations/` to the production Supabase project.
2. Configure all server variables from `.env.example`, using `APP_BASE_URL=https://your-public-domain` and independent random signing and scheduler secrets.
3. Run `npm run build`, then `npm start` on an always-on Node service.
4. Set `TRUST_PROXY=true` only behind a trusted single reverse proxy.
5. Verify `/api/health` with `MAIL_DELIVERY_MODE=log`, then use `test` with `TEST_EMAIL_TO` before explicitly enabling `production` mail.

The server does not log request bodies, guest records, Supabase keys, SMTP credentials, or management tokens. The static website design, entourage, dress-code illustration, animations, and scripted wedding assistant are independent of Supabase and remain unchanged.

## Vercel deployment

This repository deploys the Vite frontend from `dist/` and routes `/api/*` to the Node.js function in `api/server.ts`. The function imports the same Express application used locally without calling `app.listen()` or starting `node-cron`. The API rewrite is listed before the explicit SPA rewrites, so `/api/rsvps`, management, unsubscribe, administrator, and scheduler requests cannot fall through to `index.html`. Direct navigation to `/admin`, `/admin/login`, `/manage`, and `/unsubscribe` resolves to the SPA.

In the Vercel project dashboard, use the repository root as the Root Directory. `vercel.json` selects the Vite framework, runs `npm run build`, uses `dist` as the Output Directory, and configures the Node.js function and Cron Job. Node.js 22 is pinned in `package.json`.

Configure these Production environment variables in **Project Settings → Environment Variables**:

- `SUPABASE_URL`: production Supabase project URL.
- `SUPABASE_SECRET_KEY`: server secret/service-role key. Never prefix it with `VITE_`.
- `SUPABASE_PUBLISHABLE_KEY`: publishable key used by the server-side administrator authentication client.
- `SMTP_HOST`: normally `smtp.gmail.com`.
- `SMTP_PORT`: normally `465`.
- `SMTP_USER`: Gmail sender address.
- `SMTP_PASS`: Google App Password, not the normal account password.
- `SMTP_FROM`: formatted sender identity.
- `TOKEN_SIGNING_SECRET`: independent random value of at least 32 characters.
- `SCHEDULER_SECRET`: independent random value of at least 32 characters.
- `CRON_SECRET`: set to the same value as `SCHEDULER_SECRET` so Vercel's automatic Cron authorization passes existing scheduler validation.
- `MAIL_DELIVERY_MODE`: use `log` for deployment verification, `test` with `TEST_EMAIL_TO` for an intentional redirected SMTP check, and only then `production` for real recipients.
- `TEST_EMAIL_TO`: required only when `MAIL_DELIVERY_MODE=test`.
- `APP_BASE_URL`: exactly `https://exedarfrances.vercel.app` for the production deployment.
- `TRUST_PROXY`: `true` on Vercel so IP-based Express limits use the trusted forwarded client address.

The browser uses same-origin `/api` requests and does not connect directly to Supabase, so no frontend `VITE_*` key is required. `VITE_SUPABASE_PUBLISHABLE_KEY` remains a server-side fallback for legacy local configuration, but `SUPABASE_PUBLISHABLE_KEY` is preferred in Vercel.

`.env.local` is ignored and is not automatically transferred to Vercel. Add values through the Vercel dashboard or CLI without committing them. Environment-variable changes apply only to new deployments, so redeploy after adding or changing any value. Keep Preview values separate if preview administrator mutations are needed, because `APP_BASE_URL` is enforced as the accepted request origin.

Recommended verification order:

1. Deploy with `MAIL_DELIVERY_MODE=log` and Cron Jobs disabled in the Vercel dashboard.
2. Confirm `GET /api/health` returns `200` JSON rather than an SPA page or `x-vercel-error: NOT_FOUND`.
3. Submit only controlled RSVP test data and verify the Supabase row plus simulated delivery status.
4. Verify `/admin/login`, `/manage`, and `/unsubscribe` direct navigation.
5. Enable Cron Jobs only after environment variables and reminder behavior are confirmed. Vercel Cron is best-effort; Supabase delivery claims preserve idempotency if an invocation is duplicated.

Deployment approach references: [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js), [Express on Vercel](https://vercel.com/docs/frameworks/backend/express), [Vercel rewrites](https://vercel.com/docs/routing/rewrites), and [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs).

The default Express rate-limit stores remain per-process defense-in-depth and therefore reset or vary across Vercel function instances. The existing Supabase-backed RSVP email and management-link limits remain durable across instances. For globally consistent IP limits beyond those durable application limits, add a distributed store or Vercel Firewall rule rather than relying on function memory alone.
