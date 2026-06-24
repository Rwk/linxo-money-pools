# Linxo Money Pools

Linxo Money Pools is the initial web application scaffold for an internal service that will let Linxo employees create online money pools and let anyone join them through a private, non-guessable link.

## What this project is

- A clean and minimal Next.js foundation using the App Router.
- A place to build future money pool workflows powered by Linxo Payments.
- A small, testable codebase with strict TypeScript and unit tests.
- A Prisma persistence layer targeting PostgreSQL.

## What this project is not

- It is not connected to Linxo Payments yet.
- It does not include authentication or production business flows yet.
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

- Format the codebase:

  ```bash
  npm run format
  ```

## Security note

Production credentials must never be committed to the repository. Only placeholder values belong in tracked environment files such as `.env.example`.

## Database note

The project uses Prisma 7 with PostgreSQL. Prisma CLI reads the database URL from `prisma.config.ts`, which in turn reads `process.env.DATABASE_URL` and falls back to a clearly local-only PostgreSQL URL for development commands such as `prisma validate` and `prisma generate`.

Supabase is the intended free PostgreSQL provider for future development. Configure `DATABASE_URL` through environment variables only, and never commit a production connection string.

Useful Prisma development commands are documented in [docs/database.md](/home/raph/projects/linxo-money-pools/docs/database.md).
