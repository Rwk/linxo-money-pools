# Local development

Next.js runs directly in WSL; only PostgreSQL runs in Docker Compose. This
guide covers the local database, development authentication, and the DEV-4
ngrok/Sandbox payment acceptance procedure.
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

Use `NEXTAUTH_URL=http://localhost:3000` without a tunnel; for DEV-4, replace it
manually with the current HTTPS ngrok origin as described below. Set a local `AUTH_SECRET` and
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

## Sandbox callbacks through the existing ngrok tunnel (DEV-4)

Use the existing ngrok tunnel forwarding to port 3000; no installation or new
tunnel configuration is needed. Copy its current HTTPS origin from the ngrok
terminal or the existing local inspector at `http://127.0.0.1:4040`. Edit only
the URL value in `.env.local` manually:

```dotenv
NEXTAUTH_URL="https://<current-ngrok-host>"
```

Replace the placeholder with the actual host. Keep the existing Sandbox client
credentials and `LINXO_WEBHOOK_SECRET`. Sandbox credentials select the Linxo
mode; both modes use `https://pay.oxlin.io`. An environment label alone is not
proof of Sandbox credentials. Restart `npm run dev` after any URL change and
use the HTTPS origin for the browser test, including developer sign-in. Sign in
again there if your existing session belongs to localhost. Next.js already
derives its development origin allowlist from `NEXTAUTH_URL`.

`NEXTAUTH_URL` controls public pool links, payment QR/start links, and the
`redirect_url` sent when a contribution order is created:

```text
https://<current-ngrok-host>/contributions/<contributionId>/return?pool_slug=<slug>&token=<payment-access-token>
```

The return page uses the contribution's database pool, then offers a link back
to `/p/<slug>`. Existing Linxo orders keep their original redirect; create a
**new contribution** after changing the URL. Do not change the existing
collector or reuse an old DEV-3 order for the new redirect test.

### Register the Sandbox webhook

The local endpoint is **GET `/api/linxo/webhooks/payments`**. The complete URL
to register is the current HTTPS origin plus this path and the URL-encoded
existing secret:

```text
https://<current-ngrok-host>/api/linxo/webhooks/payments?token=<URL-encoded-LINXO_WEBHOOK_SECRET>
```

This endpoint authenticates the query token with a timing-safe comparison. It
does not use HMAC headers or a signed JSON body. Keep this validation enabled.
Linxo adds `resource_type=orders` and `resource_id=<order-id>` to the callback;
do not include a fixed order ID when registering it. The application does not
register subscriptions automatically.

Register the URL for the **confirmed Sandbox client** through Linxo's
`POST /v1/subscribe` API (`callback_url` JSON property). From the repository
root, the following optional manual command reads `.env.local`, constructs the
complete URL in memory, and registers it without printing the secret or token.
It changes the callback subscription for those credentials; run it only for
the intended Sandbox project, never a production/shared client whose callback
must be preserved. If registration is managed by your Linxo contact, give them
the complete URL privately instead.

```bash
node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { parse } from 'dotenv';
const e = parse(readFileSync('.env.local'));
const codes = ['invalid_client', 'invalid_request', 'FORMAT_ERROR', 'BAD_PARAMETER'];
async function request(endpoint, headers, body) {
  const requestId = randomUUID();
  const r = await fetch(`https://pay.oxlin.io${endpoint}`, {
    method: 'POST', headers: { ...headers, 'X-FWD-Request-ID': requestId },
    body, signal: AbortSignal.timeout(15000)
  });
  const data = await r.json().catch(() => null);
  console.log(JSON.stringify({ endpoint, status: r.status, requestId,
    ...(!r.ok ? { errorCode: codes.includes(data?.error) ? data.error : 'UNKNOWN' } : {}) }));
  if (!r.ok) throw new Error('Request failed');
  return data;
}
try {
  if (e.LINXO_PAYMENTS_ENVIRONMENT !== 'sandbox' ||
      e.LINXO_PAYMENTS_BASE_URL?.replace(/\/+$/, '') !== 'https://pay.oxlin.io' ||
      !e.LINXO_PAYMENTS_CLIENT_ID || !e.LINXO_PAYMENTS_CLIENT_SECRET ||
      !e.LINXO_WEBHOOK_SECRET?.trim()) throw new Error('Check Sandbox settings');
  const origin = new URL(e.NEXTAUTH_URL);
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search ||
      origin.hash || origin.username || origin.password) throw new Error('Check HTTPS origin');
  const callback = new URL('/api/linxo/webhooks/payments', origin);
  callback.searchParams.set('token', e.LINXO_WEBHOOK_SECRET.trim());
  const oauth = await request('/token', {
    Authorization: `Basic ${Buffer.from(`${e.LINXO_PAYMENTS_CLIENT_ID}:${e.LINXO_PAYMENTS_CLIENT_SECRET}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  }, new URLSearchParams({ grant_type: 'client_credentials' }));
  if (!oauth?.access_token || oauth.token_type !== 'Bearer') throw new Error('Invalid OAuth response');
  await request('/v1/subscribe', {
    Authorization: `Bearer ${oauth.access_token}`, 'Content-Type': 'application/json'
  }, JSON.stringify({ callback_url: callback.href }));
} catch {
  console.error('Registration stopped. Check configuration and safe status metadata; do not print credentials.');
  process.exitCode = 1;
}
NODE
```

Expect OAuth HTTP 200 and subscription HTTP 201. Re-register when the tunnel
origin or secret changes. No subscription registration was performed as part
of preparing this guide.

### Run acceptance and inspect failures

Follow the [DEV-4 acceptance checklist](./dev-4-sandbox-validation.md#manual-acceptance-procedure)
using the existing DEV-3 pool and collector. The developer performs all bank
selection and Sandbox simulation manually. Keep query tokens, ngrok request
details and payment URLs out of screenshots, issue reports and committed files.

Use `LINXO_API_LOG_LEVEL=info` temporarily in `.env.local`, then restart, to see
the existing safe `linxo.api.request` events. Record operation, endpoint template,
HTTP status, allowlisted error code and request ID. Successful webhook reception
is visible in ngrok's request history; the application logs the ensuing
`getRunningOrder` API request, not a separate webhook-success event.

Webhook responses: 401 means a missing/incorrect secret; 400 means a missing
order ID; 204 acknowledges processing, ignored non-order resources, or an order
not found locally; 500 means synchronization failed. For 204, verify the known
contribution actually changed and check for `local_order_not_found`. A return-page
update alone does not prove webhook delivery. Reload public/private views after
the callback. The handoff polls local database state every three seconds; it
does not poll Linxo. The owner already has **Synchronisation manuelle** in the
dashboard to reconcile nonterminal orders; using it is a fallback, not proof of
webhook reception.

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
- **DEV-4:** the existing ngrok/Sandbox callback procedure is documented above;
  banking simulation and genuine webhook acceptance require manual confirmation.

See the [v1.1.0 roadmap](./roadmap-v1.1.0.md#immediate-prerequisite--safe-local-development)
for the broader isolation requirements. DEV-1 alone does not establish complete
payment/authentication isolation.
