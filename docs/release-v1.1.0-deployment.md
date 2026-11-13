# RELEASE-1 — v1.1.0 production deployment procedure

**2026-11-13 — NOT DEPLOYED. BLOCKED — ACTION REQUIRED.**
Code/schema rehearsal passes. A usable production backup/restore point is not
confirmed (operator reports no manual backup). The origin SSH transport also
fails host-key verification in this workspace; authenticated write access must
be available for RELEASE-2. Do not run the production commands below until those
items and the explicit RELEASE-2 approval are resolved.

## 1. Verified refs and production difference

| Item | Verified result |
| --- | --- |
| Reviewed application candidate | `27dd519293c27a380f95437787eb57ead64a721b`, branch `master`; working tree clean at audit start/end of checks |
| Baseline | Annotated local/remote `v1.0.0`: tag object `721e44e1952aeb859d52615667e6c80620bc0525`, peeled commit `73495310146ec82d6c4a0de3879a411f6acfc527`; matches the supplied baseline (not a signature attestation) |
| Remote master / local tracking ref | Both `0f295cddac804b83959aa9b8628951d604d84da1`; candidate is 22 ahead, zero behind |
| Current production source | Operator's Vercel Source confirms `master` / `0f295cd`; GitHub Production deployment `7717923528` has success status dated 2026-11-11 18:13:15 UTC |
| Known working deployment | [Vercel deployment Gaw5rL5QpkQuTFdbyL4jRufEy87F](https://vercel.com/rwk1s-projects/linxo-money-pools/Gaw5rL5QpkQuTFdbyL4jRufEy87F); URL `https://linxo-money-pools-h292h4dob-rwk1s-projects.vercel.app` |
| Release tag | `v1.1.0` absent locally and remotely at audit time |

Thus the first two commits below (`d37253b`, `0f295cd`) are already in production;
the production-to-candidate delta is the following 22 commits, not all 24.
The full chronological baseline-to-candidate list is:

```text
d37253b fix: sanitize Linxo payment order labels
0f295cd chore: add structured Linxo API request logging
28c7b25 docs: document v1.1.0 product roadmap
1128811 chore: add local PostgreSQL development setup
f66ccfe chore: standardize local environment loading
3d2bb7f feat: add local development authentication
5d99aa5 docs: document DEV-4 Sandbox payment acceptance
63a47fe fix: sanitize Linxo beneficiary complementary names
9cebd14 docs: accept local development environment milestones
84b01aa fix: respect contribution amount privacy in public views
b8573e4 feat: reuse existing collector accounts for new pools
133b8ec feat: support fixed-price money pool contributions
9205d30 feat: manage fixed contribution price on pool details
03efa96 feat: implement permanent money pool archiving
e71b10b feat: add lifecycle tabs and archive controls
efe05ad feat: prioritize favorite Linxo payment providers
8a8031c style: establish money pool visual identity
c5db9ff fix: refine sign-in and mobile navigation
2386107 feat: redesign homepage and add public FAQ
5c05491 style: redesign compact money pool dashboard
6ba5ac3 style: streamline pool creation and management
4e313bc style: consolidate pool management actions
e28a806 style: streamline public contribution experience
27dd519 style: finalize v1.1.0 interface polish
```

This readiness documentation commit follows the candidate and changes no runtime
code. Its final HEAD is reported in the completion message; include it in the
approved ref for the next task. Recheck refs immediately before release:

```bash
git status --short
git rev-parse HEAD
git ls-remote origin refs/heads/master refs/tags/v1.0.0 'refs/tags/v1.0.0^{}' refs/tags/v1.1.0
git log --oneline 0f295cddac804b83959aa9b8628951d604d84da1..HEAD
git diff 27dd519293c27a380f95437787eb57ead64a721b..HEAD -- src prisma scripts package.json package-lock.json next.config.ts
```

Expect a clean tree, unchanged remote production source, no release tag and an
empty runtime diff after the reviewed candidate. Stop/review if refs changed.
HTTPS read-only refs and anonymous GitHub deployment metadata succeeded; SSH
failed host-key verification and `gh api` authentication returned HTTP 401. No
SSH trust, credential, remote, branch or tag was changed. Repair normal trusted
Git access before RELEASE-2; never bypass host-key verification or force-push.

## 2. Migration audit and rehearsal

| Order / migration | Expansion and historical compatibility | Lock consideration |
| --- | --- | --- |
| 1 — `20261112180000_collector_reuse_provenance` | Creates enum `CollectorEntityType` (NATURAL_PERSON/COMPANY); adds nullable `Pool.collectorEntityType` and `collectorProjectKey`, no default/backfill. Old aliases still serve their original pools; null-provenance legacy collectors are deliberately not offered for reuse. A newly configured verified collector establishes a reusable source. | `ALTER TABLE Pool` needs an exclusive lock. |
| 2 — `20261112190000_fixed_contributions` | Creates enum `ContributionMode`; adds NOT NULL `Pool.contributionMode` default FREE and nullable integer `fixedUnitPriceCents`. `Pool_contribution_pricing_check` requires FREE/null or FIXED/non-null/positive. Historical rows become FREE/null without monetary changes. | Constant default can avoid a table rewrite on modern PostgreSQL, but constraint validation scans Pool while holding its lock. |
| 3 — `20261112200000_permanent_pool_archive` | Adds nullable `Pool.archivedAt` (timestamp without timezone, precision 3); existing rows remain unarchived. No automatic lifecycle backfill. | Brief exclusive Pool lock, potentially delayed by long transactions. |

No SQL updates/deletes contributions, orders or existing collector references.
No index/FK is dropped. Baseline migration SQL files are byte-identical to
`v1.0.0`; all rehearsal SQL matches the committed files. This is an additive
expansion, not a guarantee of zero downtime: live queries/transactions can block
DDL or wait behind it. Use a quiet window; do not start a second migration runner.
Production row count, lock load and PostgreSQL version were not inspected.
[PostgreSQL documents lock/validation behavior](https://www.postgresql.org/docs/17/sql-altertable.html).

Rehearsal used a separate disposable PostgreSQL **17.11** container on loopback
port 53522, with tmpfs and no shared development volume. The existing developer
container/database on 5433 was untouched. No production data or real Linxo refs
were copied. Steps/results:

1. `prisma migrate deploy` (installed **7.8.0**) applied the two baseline migrations.
2. Seeded one fictional user, three historical pools (open/closed/expired) and six
   contributions across PENDING/EXECUTED/REJECTED/CANCELLED/EXPIRED/COLLECTED, with
   public/hidden/name preferences and fictional order references.
3. The same command applied the three new migrations in order. Full JSON snapshots
   of all original columns/rows and relationships remained equal; all old pools
   have FREE/null pricing and null provenance/archive. Three invalid price updates
   were rejected by the CHECK constraint. Five history entries finished cleanly.
4. Baseline-schema generated client: historical reads and a post-expansion pool
   insert pass. Candidate client: defaults, FIXED price and archive-field writes
   pass. `migrate diff --from-config-datasource --to-schema prisma/schema.prisma
   --exit-code` reported **No difference detected**; the extra SQL CHECK was also
   verified explicitly (Prisma schema diff alone is not a full constraint audit).
5. Running **the repository's actual config** with explicit `NODE_ENV=production`,
   `CI=1` and the disposable URL reported **No pending migrations to apply**.
   No `.env.local` edit/loading was needed. All 15 opt-in PostgreSQL tests passed
   on that disposable target, including fixed-price/lifecycle concurrency.

The disposable database is removed after verification; this rehearsal provides
no measurement of production-size lock time. No production history was queried.

**Rollback compatibility limit:** v1.0.0/current production code can perform its
old SQL against the expanded schema. It does not understand FIXED pricing,
`archivedAt`, or the new privacy protections. After v1.1.0 features are used,
blindly returning traffic to that old code can violate business rules. Prefer a
compatible v1.1.0 forward fix; otherwise explicitly prevent affected new payments
and owner mutations through an approved operational method while keeping existing
orders/webhooks working. There is no new maintenance-mode switch in this release.

## 3. Production prerequisites (operator checks)

The operator confirms existing variables are present/configured. No Vercel CLI,
linked project or connector was available to independently inspect Production
scopes/values. Review in **Vercel → Project → Settings → Environment Variables**,
without pasting secret values into logs/chat:

- `DATABASE_URL`: intended Supabase Production runtime database/role, not local.
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: working Production values;
  preserve employee restrictions. Google callback uses the production origin and
  `/api/auth/callback/google`.
- `NEXTAUTH_URL`: actual production HTTPS origin, never localhost/ngrok; it drives
  shared/payment/return links. Match existing Linxo return/webhook registrations.
- `LINXO_PAYMENTS_BASE_URL`, `LINXO_PAYMENTS_CLIENT_ID`,
  `LINXO_PAYMENTS_CLIENT_SECRET`: matching **production** endpoint/project/client;
  declared `LINXO_PAYMENTS_ENVIRONMENT=production` alone does not select them.
- `LINXO_WEBHOOK_SECRET`: matches the Production webhook registration at
  `/api/linxo/webhooks/payments`; preserve existing validation/signatures.
- `ENABLE_DEV_AUTH`: false/unset; code also prevents registration in production
  and on Vercel regardless of flag. No change to Google/Auth.js behavior.
- `LINXO_API_LOG_LEVEL`: off by default outside local development; use only
  existing safe off/error/info logging. No payloads, tokens or banking data.

Do not copy `.env.example` or `.env.local` into Production. No new mandatory
secret/production infrastructure is introduced. Prisma config uses `DATABASE_URL`,
**not `DIRECT_URL`**. Supply a migration-specific direct/session URL via that key
for the CLI only; keep the runtime pooling setting unchanged. Supabase recommends
[direct or session connections (5432) for migrations](https://supabase.com/docs/guides/database/prisma),
not transaction pooling on 6543. The migration role must own/have DDL rights.

**Backup gate:** inspect **Supabase → production project → Database → Backups**.
Record project, completed backup timestamp, retention/restore availability or PITR
window, and who can restore. Check that it covers the application schema and
`_prisma_migrations`. If none exists, arrange a consistent authorized backup and
restore capability in a separate approved step **before any migration**. A table
CSV or a Vercel code rollback is not a database backup. Supabase availability
[depends on the project plan/settings](https://supabase.com/docs/guides/platform/backups).
No backup/restore point was confirmed, downloaded or created here.

## 4. RELEASE-2 only — exact migration and deployment sequence

No command in this section was run against Production in RELEASE-1.
First record the known-good Vercel deployment above, verify the backup gate,
restore Git write access, and approve the final HEAD. Check the project's
production Git branch/auto-deploy behavior: a push may trigger Vercel immediately.
**Migrate before pushing new code.** The running old build tolerates expansion.

Use the reviewed checkout and lockfile. If dependencies need installation:
`CI=1 NODE_ENV=production npm ci --include=dev` (Prisma CLI is a dev dependency;
postinstall generates the client). Do not upgrade Prisma or alter old migrations.
The repository's `db:dev:*`, `db:studio` and `db:migrate:dev` scripts are local-only
wrappers; none is suitable for Production. There is no production npm script.

Open a dedicated **Bash** session; leave shell tracing off. Select the project and
5432 host from that project's Supabase Connect panel. Enter the password-bearing
URL privately; include `sslmode=require`. These prompts write no environment file:

```bash
bash --noprofile --norc
set -euo pipefail
set +x
export NODE_ENV=production CI=1
unset DATABASE_URL DIRECT_URL NODE_OPTIONS
read -r -p 'Supabase PRODUCTION project ref: ' RELEASE_PROJECT_REF
read -r -p 'Expected migration host from its Connect panel: ' RELEASE_DB_HOST
read -r -s -p 'Production direct/session migration URL (5432, sslmode=require): ' DATABASE_URL
printf '
'
export RELEASE_PROJECT_REF RELEASE_DB_HOST DATABASE_URL
node <<'NODE'
let valid = false;
try {
  const u = new URL(process.env.DATABASE_URL);
  const ref = process.env.RELEASE_PROJECT_REF;
  const direct = ref && u.hostname === `db.${ref}.supabase.co`;
  const session = ref && u.hostname.endsWith('.pooler.supabase.com') &&
    decodeURIComponent(u.username).endsWith(`.${ref}`);
  valid = ['postgres:', 'postgresql:'].includes(u.protocol) &&
    u.hostname === process.env.RELEASE_DB_HOST && (direct || session) &&
    (u.port || '5432') === '5432' && u.pathname === '/postgres' &&
    u.searchParams.get('sslmode') === 'require' && Boolean(u.password);
} catch {}
if (!valid) { console.error('STOP: production target selection failed; URL withheld.'); process.exit(1); }
console.log('Selected project/host/database/TLS verified; credentials withheld.');
NODE
./node_modules/.bin/prisma migrate status || {
  printf 'Nonzero status: review the report before continuing.
'
}
```

`NODE_ENV=production` and `CI=1` make `loadDevelopmentEnvironment()` return false;
Prisma 7 does not load `.env.local` through this config. The explicit validated URL
overrides its local fallback. Do not use `next dev` or local DB wrappers here.
Do not paste the URL into a command line, logs, docs or source control.

Pre-status should show the two baseline migrations applied and **only the three
expected migrations pending**. Pending migrations can produce a nonzero status;
so can a failed connection/history. Stop for connection errors, failed migrations,
missing baseline history, extra pending files or inconsistent names/checksums.
`migrate status` is not a complete drift audit. If already applied, inspect the
history/schema rather than rerunning SQL manually or marking anything applied.

Only after the report/backup/target are verified:

```bash
read -r -p 'Expected three migrations only, backup verified — type MIGRATE: ' RELEASE_CONFIRM
[[ "$RELEASE_CONFIRM" == MIGRATE ]] || exit 1
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/prisma migrate status
unset DATABASE_URL RELEASE_PROJECT_REF RELEASE_DB_HOST RELEASE_CONFIRM
exit
```

Expected: three migrations applied successfully (or none if previously applied
and verified), then **Database schema is up to date!** Do not proceed to new code
if either command fails. `migrate deploy` applies pending files only: no reset,
seed, new migration generation or shadow database. It does not generate a client;
postinstall/build must use the matching schema/client. This exact CLI/config path
was exercised against the disposable target. See [Prisma ORM 7 production workflow](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production).

After migration success, in the approved clean checkout, with remote master still
at the reviewed production ref and normal authenticated Git access:

```bash
git push origin HEAD:master
```

This is **RELEASE-2 only**, a normal fast-forward push, no force/reset/rebase/tag.
Use the existing Vercel Git integration for that exact HEAD; verify build/Ready
status, Production environment and source SHA in Deployments, then the assigned
production domain. If it does not auto-deploy, stop and select the approved Git
commit using the project's established deployment workflow; do not change build
settings or blindly redeploy the old commit. Run smoke checks below before any
separate release-tag decision. This task has not pushed/deployed anything.

## 5. Failure / rollback

- Migration failure: **do not deploy new code**. Preserve safe error metadata;
  examine the failed `_prisma_migrations` record and actual objects via the
  authorized operator. Earlier migrations may already be applied; do not assume
  the entire batch or an interrupted script rolled back.
- Do not blindly rerun, reset, db-push, delete history, change published SQL or use
  `migrate resolve` to hide a failure. After diagnosis, an explicit recovery plan
  may revert partial steps and mark rolled-back, or complete the exact remaining
  SQL and mark applied. Resolve changes history, not the missing SQL itself.
  Follow [Prisma's failed-migration procedure](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/patching-and-hotfixing)
  only after reviewing the real state and approving that recovery separately.
- New app fails: Vercel Deployments → recorded known-good production deployment →
  Instant Rollback (subject to project availability/permissions). Confirm domain,
  SHA, health and retained deployment configuration. No database rollback occurs:
  expansion/defaults/new v1.1.0 records remain. Review the FIXED/archive/privacy
  compatibility limit above before restoring traffic; prefer a compatible forward
  fix once those features have been used. [Vercel rollback details](https://vercel.com/docs/instant-rollback).
- Database restore is a separate operator decision, not the normal rollback for
  these additive migrations. Restoring can lose newer confirmed contributions and
  webhook updates and requires reconciliation with Linxo; do not execute it
  automatically. No rollback or restore was performed or backup claimed here.

## 6. Post-deployment smoke checklist

Use fictional descriptive data where possible. Retain snapshots/counts privately
before/after; never log banking fields or tokens. **No real order is automated.**

1. Homepage/FAQ and production Google login/logout work; no development provider.
2. Existing open/closed pools, historical contributions and monetary totals remain
   visible/intact; old collector aliases still work for their original pools.
3. Create a new pool with optional description and accented/emoji title. Configure
   an authorized collector and verify eligible owner-only reuse; null-provenance
   legacy accounts not being offered is expected, not data loss.
4. Check FREE/FIXED mode, unit price, quantity 1/10 and price locking after the
   first contribution. Compare visible/hidden amount totals and name choices on
   public versus owner views. Do not expose private totals in public indicators.
5. On disposable test pools, close/reopen, explicitly date an expired reopen, and
   archive only after the irreversible confirmation. Archived pools stay read-only.
6. **Only an explicitly authorized account and operator-controlled low-value real
   payment:** check bank favorites and access to other banks, order creation,
   authorization, correct return, webhook receipt and persisted confirmation.
   Returning from the bank is not payment confirmation. Review safe request IDs.
   Check existing order/webhook/reconciliation behavior after closure/archive.

## 7. Verification / remaining gates

- Critical paths: **145 + 89 = 234** tests pass across 19 files (creation/edit,
  reuse/ownership, FREE/FIXED/pricing, privacy, lifecycle/archive, order payloads,
  favorites, webhook/reconciliation, development isolation and Google UI/config).
- Full Vitest: **689 pass, zero failures; 15 opt-in DB checks skipped** in the
  default run. All **15** pass separately on disposable PostgreSQL; historical
  date-fixture failures did not recur. No production connection or Linxo operation.
- ESLint / production build pass (build uses synthetic process-only settings).
- Standalone TypeScript: same **eight historical fixture errors**, no new error:
  three Decimal stubs in `payment-handoff-presenter.test.ts` (64/82/99), three
  missing lookup dependencies in `sync-contribution-status.test.ts` (47/76/131),
  incomplete public/private detail fixtures in `pool-detail-sections.test.ts` and
  `pool-detail-sections-private.test.tsx`. Not silently waived as a green check;
  acceptance or correction belongs to the release decision, not this docs task.
- Operator confirms environment variables configured and active production Source
  `0f295cd`. Actual Vercel scopes/secret values, Supabase migration history,
  current lock load and restorable backup remain uninspected here by design.
- **Blocking actions:** confirm/create an authorized usable backup/restore point;
  restore trusted Git push authentication in the release environment. Review the
  rollback limitations and acknowledge/resolve historical TypeScript debt before
  approving RELEASE-2. No application code, environment or old SQL was changed.
