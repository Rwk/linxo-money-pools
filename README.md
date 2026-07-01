# Linxo Money Pools

Linxo Money Pools is an internal MVP that lets Linxo employees create trusted
money pools and share private links so contributors can send money directly to
the collector through Linxo Payments.

The product is designed for demos, product validation, and operational
readiness around the core contribution flow. It is not an escrow service and it
does not hold contributor funds in the application.

The product UI is intentionally in French. Translation keys are centralized in
`src/i18n`, and raw Linxo technical statuses remain untranslated on private
technical displays by design.

## Product flow

1. A Linxo employee signs in with a `@linxo.com` Google account.
2. The employee creates a money pool and configures the collector account.
3. The app creates a private public URL based on a non-guessable slug.
4. A contributor opens the public page and starts a contribution.
5. The app creates a local contribution, creates a Linxo order, and shows a
   payment handoff page with a direct link and QR code.
6. The contributor authorizes the transfer with their bank.
7. Webhooks and manual refresh keep local statuses aligned with Linxo.

## Stack

- Next.js App Router
- TypeScript in strict mode
- Prisma 7
- PostgreSQL / Supabase
- Auth.js with Google OAuth
- Vitest
- ESLint

## Security model

- Only authenticated `@linxo.com` users can create and manage pools.
- Creators can access only their own management routes and actions.
- Public pool pages are accessible only through non-guessable links.
- Linxo client credentials stay server-side.
- Webhooks are protected with `LINXO_WEBHOOK_SECRET`.
- The app does not store IBAN locally, payer bank account details, or Linxo
  credentials.
- Supabase / PostgreSQL access is server-side, with RLS enabled on application
  tables.

More details are documented in [docs/security.md](docs/security.md).

## Implemented MVP

- Google sign-in restricted to `@linxo.com`
- Prisma persistence on PostgreSQL / Supabase
- Pool creation
- Pool editing
- Pool close / reopen lifecycle
- Collector account setup through Linxo authorized account registration and alias creation
- Public contribution form
- Linxo order creation
- Short payment URL generation with `ask_for_alias=false`
- Payment handoff page with QR code and direct link
- Return-page status synchronization
- Webhook-based asynchronous status synchronization
- Manual status refresh from the creator dashboard
- Public / private contribution status display

## Intentionally out of scope

- Refunds
- Final transfer flow
- Objective / gauge amount
- Image upload
- Polling / cron / WebSockets beyond the existing handoff page polling
- Admin-wide pool management
- Collector account editing after setup
- Local storage of IBAN or payer bank account details

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create an untracked `.env.local` file with the required variables.

3. Generate the Prisma client:

   ```bash
   npm run db:generate
   ```

4. Apply the database migrations:

   ```bash
   npm run db:migrate:dev
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

6. For mobile return flow and webhook testing, expose the app through HTTPS
   with ngrok or deploy it to a public environment.

## Environment variables

Required server-side variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_URL`
- `LINXO_PAYMENTS_BASE_URL`
- `LINXO_PAYMENTS_CLIENT_ID`
- `LINXO_PAYMENTS_CLIENT_SECRET`
- `LINXO_PAYMENTS_ENVIRONMENT`
- `LINXO_WEBHOOK_SECRET`

Optional public variable:

- `NEXT_PUBLIC_APP_NAME`

Never expose server-side secrets to the browser and never commit real values.

See:

- [docs/database.md](docs/database.md)
- [docs/security.md](docs/security.md)
- [docs/demo-guide.md](docs/demo-guide.md)

## Quality checks

```bash
npm run lint
npm run test
npm run build
npm run db:validate
npm run db:generate
```

## Documentation

- Documentation index: [docs/README.md](docs/README.md)
- Authentication: [docs/authentication.md](docs/authentication.md)
- Database and environment setup: [docs/database.md](docs/database.md)
- Pool product scope: [docs/pools.md](docs/pools.md)
- Pool management: [docs/pool-management.md](docs/pool-management.md)
- Contributions: [docs/contributions.md](docs/contributions.md)
- Contribution statuses: [docs/contribution-statuses.md](docs/contribution-statuses.md)
- Payment handoff: [docs/payment-handoff.md](docs/payment-handoff.md)
- Linxo Payments integration: [docs/linxo-payments.md](docs/linxo-payments.md)
- Linxo webhooks: [docs/linxo-webhooks.md](docs/linxo-webhooks.md)
- Manual status refresh: [docs/manual-status-refresh.md](docs/manual-status-refresh.md)
- Demo guide: [docs/demo-guide.md](docs/demo-guide.md)
- Security checklist: [docs/security.md](docs/security.md)
