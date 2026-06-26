# Linxo Money Pools

Linxo Money Pools is the initial web application scaffold for an internal service that will let Linxo employees create online money pools and let anyone join them through a private, non-guessable link.

## What this project is

- A clean and minimal Next.js foundation using the App Router.
- A place to build future money pool workflows powered by Linxo Payments.
- A small, testable codebase with strict TypeScript and unit tests.
- A Prisma persistence layer targeting PostgreSQL.

## What this project is not

- It is not connected to Linxo Payments yet.
- It does not include pool creation or Linxo Payments production flows yet.
- It does not store any real credential or secret.

## Planned stack

- Next.js
- TypeScript in strict mode
- Tailwind CSS
- Prisma
- PostgreSQL
- Vitest
- ESLint
- Prettier

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template if needed:

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. To test Google sign-in locally, add placeholder values first, then replace them with real Google OAuth credentials in your untracked `.env.local`:

   ```bash
   AUTH_SECRET=replace-with-a-local-secret
   AUTH_GOOGLE_ID=replace-with-your-google-client-id
   AUTH_GOOGLE_SECRET=replace-with-your-google-client-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

5. Configure PostgreSQL before testing Google authentication end-to-end.
   Setup steps and migration commands are documented in [docs/database.md](docs/database.md).

## Run checks

- Run the test suite:

  ```bash
  npm run test
  ```

- Run the linter:

  ```bash
  npm run lint
  ```

- Validate the Prisma schema:

  ```bash
  npm run db:validate
  ```

- Generate the Prisma client:

  ```bash
  npm run db:generate
  ```

- Open Prisma Studio:

  ```bash
  npm run db:studio
  ```

- Format the codebase:

  ```bash
  npm run format
  ```

## Security note

Production credentials must never be committed to the repository. Only placeholder values belong in tracked environment files such as `.env.example`.

- Never commit `.env.local`.
- Rotate credentials immediately if they are accidentally exposed.
- This public repository does not include deployable production configuration.

## Database note

The project uses Prisma 7 with PostgreSQL, and Supabase is the intended provider. Prisma CLI reads the database URL from `prisma.config.ts`, which in turn reads `process.env.DATABASE_URL`.

Auth.js depends on PostgreSQL because users, accounts, and sessions are stored through the Prisma Adapter. Setup details are documented in [docs/database.md](docs/database.md).

## Authentication

- Authentication uses Auth.js with the Prisma adapter and Google OAuth.
- Only users with a valid `@linxo.com` Google account can sign in.
- The public home page stays accessible without authentication.
- The dashboard at `/dashboard` is protected server-side.

## Money pools

- Authenticated Linxo employees can create and manage their own money pools.
- Public pool pages are accessible only through a non-guessable slug link.
- Online payments are intentionally not implemented yet.

Product scope notes are documented in [docs/pools.md](docs/pools.md).

## Documentation

- Money pool scope and product notes: [docs/pools.md](docs/pools.md)
- Database setup and Prisma notes: [docs/database.md](docs/database.md)
- Linxo Payments OpenAPI type generation: [docs/linxo-payments.md](docs/linxo-payments.md)

## Manual Google OAuth setup

1. Create a Google OAuth client in Google Cloud for a web application.
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI for local development.
3. Add your deployed `/api/auth/callback/google` URL for each non-local environment.
4. Put the client ID and client secret in `.env.local` as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
5. Set `AUTH_SECRET` to a strong random value and keep it private.
