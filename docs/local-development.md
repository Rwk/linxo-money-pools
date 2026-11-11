# Local development — DEV-1

Next.js runs directly in WSL; only PostgreSQL runs in Docker Compose. This
milestone isolates the database. Authentication, Linxo Sandbox and ngrok remain
separate workstreams; do not exercise payment flows with existing production
credentials.

## Requirements and startup

Use WSL, Docker with the Compose plugin, and Node.js supported by the installed
Next.js/Prisma versions (Node 20.19+ or supported newer LTS). Use npm and the
committed lockfile. Run commands from the repository root.

```bash
npm ci
docker compose up -d --wait
npm run db:dev:migrate
npm run db:generate
npm run db:dev:check
```

Compose uses PostgreSQL 17, a dedicated `linxo_money_pools_dev` database, and
development-only credentials. Port 5433 is bound to **127.0.0.1 only**. Data lives
in the Compose project's named `postgres_data` volume, not the container.
Keep the checkout/project name consistent to reuse the same volume.

## Application environment

Preserve existing `.env.local` secrets. If creating it for the first time, use
[.env.example](../.env.example); do not copy over an existing file. Manually
replace only its `DATABASE_URL` with this development-only value:

```dotenv
DATABASE_URL="postgresql://linxo_dev:linxo_dev_only@127.0.0.1:5433/linxo_money_pools_dev"
```

No `DIRECT_URL` or additional database environment file is required. Vercel
continues using its existing platform-managed Supabase configuration; do not
change those values. No production credentials or data are needed here.

Environment precedence matters:

- [Prisma CLI configuration](../prisma.config.ts) loads `.env.local`, then `.env`
  without overriding already-set process variables.
- Next.js development uses existing process variables first, then
  `.env.development.local`, `.env.local`, `.env.development`, and `.env`.
  Keep the database setting in `.env.local`; remove conflicting local overrides
  yourself if present, without sharing or printing their values.
- The provided database development commands deliberately ignore any inherited
  `DATABASE_URL` and dotenv database values. Their wrapper supplies the fixed
  loopback URL above, using only `LOCAL_POSTGRES_PORT` for the port. They print
  the host, port and database name, never a connection secret.
- `npm run dev` uses Next.js environment loading, **not** the database wrapper.
  Before starting it, set the local URL as above and clear a stale shell override
  with `unset DATABASE_URL` if needed. Restart Next.js after configuration edits.

Once configured:

```bash
docker compose up -d --wait
npm run db:dev:migrate
npm run dev
```

The existing production authentication and authorization rules still apply.
Opening the authenticated dashboard requires the existing Google setup; DEV-1
does not add a test login. `db:dev:check` verifies the application database client
without Google OAuth or Linxo calls.

For a port conflict, set a single shell override before both Compose and npm:

```bash
export LOCAL_POSTGRES_PORT=5543
docker compose up -d --wait
npm run db:dev:migrate
```

Update only the port in `.env.local`'s `DATABASE_URL` to match. Compose does not
automatically load Next.js's `.env.local`; the shell variable keeps the commands
consistent. Database names and credentials are intentionally fixed for this setup.

## Migrations and connection checks

The existing Prisma 7 schema and both committed migrations are reused unchanged.
`db:dev:migrate` runs `prisma migrate dev`; it can create a local shadow database
using the development PostgreSQL role. No `db push` or production import is used.
Client generation remains the existing `db:generate` command.

```bash
docker compose config --quiet
docker compose ps
docker compose exec postgres pg_isready -U linxo_dev -d linxo_money_pools_dev
npm run db:dev:status
npm run db:dev:check
npm run db:studio
```

`db:dev:check` opts into a read-only Vitest integration check using the
application's actual Prisma singleton: it checks `current_database()` and counts
users through Prisma. It needs the container, migrations and generated client;
normal unit tests skip it and make no database connection.

`db:dev:migrate`, the existing `db:migrate:dev` alias, `db:dev:status`, `db:studio`
and `db:dev:reset` all use the local wrapper. It rejects Vercel/production
execution, invalid ports and extra arguments that could override the target.
Bare `npx prisma` commands bypass this safeguard and follow the Prisma environment
precedence above; use the provided scripts for local operations. Generation and
schema validation do not connect to a database.

The runtime adapter disables TLS only for loopback connections outside production
and Vercel. Existing remote/production Supabase TLS behavior is preserved.

## Stop, preserve or clear data

Stop PostgreSQL without losing data:

```bash
docker compose stop
docker compose start --wait
npm run db:dev:check
```

`docker compose down` removes containers and networking but preserves the named
volume. `docker compose up -d --wait` reuses that data. To inspect persistence,
create a fake non-banking record in local Prisma Studio, restart PostgreSQL and
confirm that the record remains.

To **intentionally erase local application data** and replay migrations:

```bash
npm run db:dev:reset
npm run db:generate
```

Prisma asks for interactive confirmation; the wrapper never supplies `--force`.
To instead delete the **entire local PostgreSQL volume**, deliberately run
`docker compose down --volumes`, then repeat startup and migrations. Neither
destructive operation is part of normal startup. Never run a reset against an
unknown database.

## Troubleshooting and remaining milestones

DEV-1 verification (2026-11-11): Compose validation and health checks passed;
both existing migrations applied to an empty local database. The application
Prisma query check passed, and a temporary fake user survived a PostgreSQL
container restart before being removed. Guard/TLS unit tests and lint passed.
The full suite still reports four date-dependent pool action failures, and
TypeScript reports eight existing test-fixture errors described in the roadmap.

- If Docker cannot reach its daemon, start Docker/Desktop and enable WSL
  integration. If the port is occupied, use the port override above.
- If migration/check fails, confirm the wrapper's printed target, container
  health and client generation. Report migration failures rather than rewriting
  historical migrations. Existing volume credentials do not change when a
  container is recreated.
- An existing `.env.local` with a non-local URL is preserved by this change.
  The developer must manually change its database setting before `npm run dev`;
  the guarded migration/check commands are already independent of it.
- **DEV-2:** configure Linxo Payments Sandbox credentials and sandbox-only
  validation. No sandbox integration or real Linxo requests are included here.
- **DEV-3:** local development authentication with a test identity, preserving
  production Auth.js and authorization behavior.
- **DEV-4:** ngrok setup for local HTTPS callbacks and webhooks.

See the [v1.1.0 roadmap](./roadmap-v1.1.0.md#immediate-prerequisite--safe-local-development)
for the broader isolation requirements. DEV-1 alone does not establish complete
payment/authentication isolation.
