# Database

For isolated local PostgreSQL and guarded migration commands, follow the
[local development guide](./local-development.md). The Supabase configuration
below describes hosted environments; local development must use its own URL.

This project uses Prisma 7 with PostgreSQL for persistence.

Supabase is the intended PostgreSQL provider for this project. Auth.js uses the Prisma Adapter, so the database is required for end-to-end Google authentication because users, accounts, and sessions are persisted there.

Prisma migrations must be applied before testing Google sign-in end-to-end.

Prisma 7 reads the database URL from `prisma.config.ts`, not from the `datasource` block in `schema.prisma`.

For normal local commands, `prisma.config.ts` uses the shared `@next/env`
development loader and requires a loopback database URL from `.env.local` or an
explicit process override. Competing local environment files are rejected.
Vercel, production, CI and test processes retain their managed environment;
see [loading and precedence](./local-development.md#loading-and-precedence).

At runtime, Prisma uses `@prisma/adapter-pg` in the server-only Prisma singleton. Supabase connections use SSL, and the current runtime setup accepts the Supabase or Supavisor certificate chain for local and serverless compatibility. A future hardening step can provide a CA certificate and switch back to strict certificate validation.

## Supabase setup

1. Create a Supabase project.
2. Open `Project Settings` > `Database`.
3. Copy the PostgreSQL connection string.
4. Store it as `DATABASE_URL` in the target Vercel environment's variables.
5. Keep it out of local `.env.local`; that file uses Docker PostgreSQL only.
6. Keep the Supabase connection string in SSL mode.
7. Run Prisma client generation (this does not connect to the database):

   ```bash
   npm run db:generate
   ```

8. Hosted schema deployment follows the [deployment checklist](./deployment.md).
   `npm run db:migrate:dev` now explicitly targets Docker PostgreSQL and must
   not be used to initialize Supabase.

9. Validate the schema when needed:

   ```bash
   npm run db:validate
   ```

## Required environment variables

Use environment variables only. Never commit real values.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
AUTH_SECRET="replace-with-a-generated-secret"
AUTH_GOOGLE_ID="replace-with-google-client-id"
AUTH_GOOGLE_SECRET="replace-with-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
LINXO_PAYMENTS_BASE_URL="https://payments-api.example"
LINXO_PAYMENTS_CLIENT_ID="replace-with-linxo-client-id"
LINXO_PAYMENTS_CLIENT_SECRET="replace-with-linxo-client-secret"
LINXO_PAYMENTS_ENVIRONMENT="sandbox"
LINXO_WEBHOOK_SECRET="replace-with-a-shared-secret"
```

`NEXTAUTH_URL` is the public app base URL used by Auth.js and by the app when
it builds absolute return or share URLs. For local-only browser testing, it can
stay on `http://localhost:3000`. For mobile return-flow or webhook testing, use
an HTTPS ngrok URL or a deployed domain instead.

Server-only variables:

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

Public variables:

- `NEXT_PUBLIC_APP_NAME`

Notes:

- Server-only secrets must not use a `NEXT_PUBLIC_` prefix.
- `AUTH_SECRET`, Google OAuth credentials, Linxo credentials, and the webhook
  secret must stay in server-managed environment variables only.
- The Google OAuth callback URL must match the current `NEXTAUTH_URL` domain.
- The Linxo webhook callback URL must be configured manually in Linxo Payments.

Production and preview environments must use platform-managed environment variables. Secrets and database URLs must never be committed to the repository.

## Useful commands

```bash
npm run db:generate
npm run db:validate
npm run db:migrate:dev
npm run db:studio
```

Migration and Studio scripts validate the resolved `DATABASE_URL` and refuse
non-local targets. See [local commands](./local-development.md#migrations-and-connection-checks).

## Security note

- Never commit `.env.local`.
- Never commit production credentials.
- Rotate credentials immediately if they are accidentally exposed.
- This public repository does not include deployable production configuration.
- Do not disable TLS globally; runtime SSL handling is scoped to the Prisma PostgreSQL adapter.

## Data handling constraints

- Auth.js persists users, linked accounts, and sessions in PostgreSQL through Prisma.
- Store money amounts as decimal values, not cents.
- Do not store IBANs.
- Do not store beneficiary KYC details.
- Store only Linxo reference identifiers for bank or KYC-related resources when needed.
