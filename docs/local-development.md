# Local development

Next.js runs directly in WSL; only PostgreSQL runs in Docker Compose. This
guide covers the DEV-1 database and DEV-2 development authentication. Linxo
Sandbox payment acceptance and ngrok setup remain separate workstreams.
Before starting Next.js, remove production Supabase and
Linxo credentials from local configuration and replace them as described below.

## Requirements and startup

Use WSL, Docker with the Compose plugin, and Node.js supported by the installed
Next.js/Prisma versions (Node 20.19+ or supported newer LTS). Use npm and the
committed lockfile. Run commands from the repository root.

Configure `.env.local` as described below before these commands. Client generation
also loads the Prisma configuration during `npm ci`.

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

Use **`.env.local` as the single local application configuration file**. Use
[.env.example](../.env.example) as a reference and edit `.env.local` manually;
setup scripts never overwrite it. Replace its production database setting:

```dotenv
DATABASE_URL="postgresql://linxo_dev:linxo_dev_only@127.0.0.1:5433/linxo_money_pools_dev"
```

Before starting Next.js, also replace the Linxo base URL, client ID and client
secret with the **matching Sandbox endpoint and credentials**. Set
`LINXO_PAYMENTS_ENVIRONMENT=sandbox`, and use a new local `LINXO_WEBHOOK_SECRET`.
The environment field is only a validated label: it does **not** choose an API
endpoint or credentials. Token and payment requests use `LINXO_PAYMENTS_BASE_URL`
and the configured client credentials directly. Do not keep any production
Supabase or Linxo credentials in `.env.local` or exported shell variables. Until
Sandbox is configured, keep the example's nonfunctional Linxo placeholders and
do not exercise payment flows.

Keep `NEXTAUTH_URL=http://localhost:3000`; later DEV-4 may replace that one value
with an HTTPS ngrok origin. Set a local `AUTH_SECRET` and
`ENABLE_DEV_AUTH=true` for the DEV-2 passwordless test identity. Google OAuth
credentials can be omitted in this mode. Leave the flag absent or `false` to
retain normal Google authentication.

### Development sign-in (DEV-2)

After setting the flag, restart `npm run dev`. Open `http://localhost:3000`, click
**Connexion développeur**, create/view pools in the dashboard, and use
**Se déconnecter** to sign out. A second sign-in retrieves the same `dev@linxo.com`
user and owned pools. Auth.js still requires `AUTH_SECRET`; generate a local
secret rather than reusing production's value.

The provider is disabled by default and never registered outside development or
on Vercel, even with the flag set. It derives the identity on the server and
requires the local PostgreSQL database. Auth.js Credentials requires JWT
sessions: only the enabled development mode uses JWTs; production and disabled
mode keep Google/database sessions. Sign out before changing the flag, restart
and sign in again to switch strategies. Pool ownership checks and the collector
reference derived from the persisted user ID are unchanged.

If ngrok exposes this app publicly, anyone reaching the passwordless sign-in can
access the shared local test account. Use fake data and Sandbox credentials only,
never production data or payment credentials. Details are in
[Authentication](./authentication.md#local-development-authentication-dev-2).

No `DIRECT_URL` or extra environment file is required. Production continues
using Vercel-managed variables; leave those unchanged.

### Loading and precedence

Native Next.js gives exported process variables first priority, then reads the
following files in order (the first value for a key wins):

- Development: `.env.development.local`, `.env.local`, `.env.development`, `.env`.
- Build: `.env.production.local`, `.env.local`, `.env.production`, `.env`.

Thus `.env.development.local` can override `.env.local`; `.env.development` and
`.env` cannot, but can supply missing values. For predictable normal development,
the shared loader **rejects** `.env`, `.env.development` and
`.env.development.local` when any exists. Consolidate their settings into
`.env.local` manually and remove the competing files. Environment files are
ignored by Git; `.env.example` remains tracked.

| Command                                                                            | Configuration source after standardization                                                                                                                                        |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                                                      | Native Next.js development loading, followed by the shared competing-file and local-database checks in `next.config.ts`.                                                          |
| `npm run build`                                                                    | Unchanged native Next.js production loading described above. No custom local loader is forced.                                                                                    |
| `db:dev:migrate`, `db:dev:status`, `db:dev:reset`, `db:dev:studio`, `db:dev:check` | Shared `@next/env` development loader and loopback database guard, then the resolved URL passed to Prisma/Vitest.                                                                 |
| `db:migrate:dev`, `db:studio`                                                      | Compatibility aliases using the same guarded wrapper.                                                                                                                             |
| `db:generate`, `db:validate`, install-time Prisma generation                       | `prisma.config.ts` uses the same development loader and local database guard. Generation/validation themselves do not connect.                                                    |
| Vitest (`npm test`, watch)                                                         | Environment-file loading explicitly disabled. Tests use inherited process variables and per-test mocks. `db:dev:check` deliberately supplies the guarded application environment. |

Previously Prisma used dotenv (`.env.local`, then `.env`) and the database wrapper
constructed a separate fixed URL. Both now use the same resolved `DATABASE_URL`
as development Next.js. Vitest previously inherited Vite's test-mode file lookup
(`.env`, `.env.local`, `.env.test`, `.env.test.local`, later files winning) for
`VITE_` variables; non-prefixed database settings were not loaded into test
processes from those files. That implicit file lookup is now disabled.
The shared loader skips Vercel, production, CI and test
processes, leaving their process configuration intact. The database wrapper
always refuses Vercel/production execution and always validates its target,
including in CI. Ordinary Next.js builds retain native file loading; CI/Vercel
should supply platform variables and have no local secret files checked out.

Process overrides still win, intentionally. Clear stale exports such as
`DATABASE_URL` and Linxo settings before using `.env.local`; never print them.
A non-local database override fails the local guard. Restart commands after
editing configuration. Only file conflicts are detected automatically; checking
that Sandbox credentials actually belong to Sandbox remains a separate manual task.

Once configured:

```bash
docker compose up -d --wait
npm run db:dev:migrate
npm run dev
```

Production authentication and all ownership checks remain unchanged. With
`ENABLE_DEV_AUTH=true`, local dashboard access requires no Google setup.
`db:dev:check` verifies the database client without authentication or Linxo calls.

For a port conflict, first update `.env.local`'s database URL to use port 5543,
then set the Compose port in the shell:

```bash
export LOCAL_POSTGRES_PORT=5543
docker compose up -d --wait
npm run db:dev:migrate
```

`LOCAL_POSTGRES_PORT` configures Compose only; the application and Prisma read the
URL. Compose does not automatically read `.env.local`. Database names and
credentials remain those defined in [compose.yaml](../compose.yaml).

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
npm run db:dev:studio
```

`db:dev:check` opts into a read-only Vitest integration check using the
application's actual Prisma singleton: it checks `current_database()` and counts
users through Prisma. It needs the container, migrations and generated client;
normal unit tests skip it and make no database connection.

All database development commands require a PostgreSQL URL on `127.0.0.1`,
`localhost` or `::1` for `linxo_money_pools_dev`. Query parameters are rejected
(including host overrides). The wrapper prints only host, port and database,
and rejects extra arguments that could override configuration or force reset.
Normal local bare Prisma commands also run the guard through `prisma.config.ts`.
Production/CI Prisma execution deliberately uses its managed process settings;
do not set those deployment flags to bypass local safeguards.

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

The environment-loading follow-up uses fake environment fixtures to verify native
Next.js precedence, matching development database resolution, process overrides,
managed-environment bypass and refusal of remote database targets for every local
database action. It does not start Next.js, run migrations or contact databases or
Linxo with the currently configured production credentials.

- If Docker cannot reach its daemon, start Docker/Desktop and enable WSL
  integration. If the port is occupied, use the port override above.
- If migration/check fails, confirm the wrapper's printed target, container
  health and client generation. Report migration failures rather than rewriting
  historical migrations. Existing volume credentials do not change when a
  container is recreated.
- An existing `.env.local` with production values is preserved by this change.
  Manually replace them before local startup. Local Next.js and Prisma now refuse
  its non-local database URL instead of using a separate hardcoded URL.
- **DEV-2:** local development authentication is implemented. Verify sign-in,
  pool persistence across sign-ins and sign-out with the local setup above.
- **Remaining payment work:** Sandbox credentials are configured manually;
  payment acceptance is separate. Development authentication makes no Linxo calls.
- **DEV-4:** ngrok setup for local HTTPS callbacks and webhooks.

See the [v1.1.0 roadmap](./roadmap-v1.1.0.md#immediate-prerequisite--safe-local-development)
for the broader isolation requirements. DEV-1 alone does not establish complete
payment/authentication isolation.
