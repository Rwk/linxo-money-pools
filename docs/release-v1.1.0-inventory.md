# v1.1.0 — Informational release inventory

Audit date: 2026-11-13. **No production release is started.** DESIGN-1 through
DESIGN-5 and the specified functional improvements are manually accepted;
DESIGN-6 is implemented, pending final developer acceptance.

## Git scope

- Branch: `master`.
- HEAD inspected at the start of DESIGN-6: `e28a806f41abece1079382d047a8330565609e3a`.
- Baseline: `v1.0.0`, commit `73495310146ec82d6c4a0de3879a411f6acfc527`.
- The focused `style: finalize v1.1.0 interface polish` commit containing this
  inventory follows that inspected HEAD. Its final hash is reported on completion;
  the next release task must inspect its own current HEAD rather than treating
  this audit snapshot as a mutable release pointer.
- `package.json` remains at `0.1.0`; no version/release metadata was bumped.
- Working tree was clean at the start. No push, deployment, new tag or production
  migration/configuration operation was performed by DESIGN-6.

## Commits after v1.0.0, oldest first

The 23 existing commits at the inspected HEAD are:

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
```

The DESIGN-6 commit adds `style: finalize v1.1.0 interface polish` to this list.
This inventory does not create a release branch, RC artifact or release tag.

## New Prisma migrations, in order

Only these three migration files were added after `v1.0.0`; the initial schema
and payment-handoff tracking migration already exist in the baseline.

| Order | Migration | Effect |
| --- | --- | --- |
| 1 | `20261112180000_collector_reuse_provenance` | Adds `CollectorEntityType` and nullable `Pool.collectorEntityType` / `collectorProjectKey`. Legacy provenance stays null; existing collectors keep working but cannot become reusable sources without verified provenance. |
| 2 | `20261112190000_fixed_contributions` | Adds `ContributionMode`, `Pool.contributionMode` (default FREE), nullable integer-cent `fixedUnitPriceCents`, and the FREE/FIXED pricing check constraint. Existing pools default to FREE. |
| 3 | `20261112200000_permanent_pool_archive` | Adds nullable `Pool.archivedAt`; existing pools stay unarchived. |

There is **no DESIGN-6 migration**. A subsequent release must review the target's
migration history and matching generated Prisma Client before running code using
these fields. No target database was queried or migrated here, and there is no
backfill or production operation authorized by this inventory.

## Automated checks and remaining issues

- Full Vitest: **689 passed, zero failures, 15 skipped** (74 files passed, two
  skipped). Targeted UI/auth/accessibility regression set: **137 passed**.
- ESLint and production build pass. Build uses synthetic process-only settings;
  it does not establish production configuration or service connectivity.
- Standalone TypeScript remains **failing with eight historical test-fixture
  errors**, already reported before DESIGN-6. No new error:
  - `payment-handoff-presenter.test.ts`: three simplified amount objects are not
    Prisma Decimal instances (lines 64, 82, 99).
  - `sync-contribution-status.test.ts`: three dependency fixtures omit
    `findContributionByLinxoOrderId` (lines 47, 76, 131).
  - `pool-detail-sections.test.ts` and `pool-detail-sections-private.test.tsx`:
    two detail fixtures omit current card/readiness/count fields.
- Skipped suites: `infrastructure/db/local-database.test.ts` and
  `infrastructure/db/fixed-price-concurrency.test.ts`, gated by
  `LOCAL_DATABASE_CHECK=1`. They are guarded local-database checks and were not
  opted into for this visual pass. Full results contain no other failing suite.
- Final developer acceptance of DESIGN-6 remains pending. Browser/axe checks are
  fictional fixtures and do not replace real-device/screen-reader or Sandbox
  end-to-end acceptance. See [DESIGN-6 evidence](./design-system.md#design-6--final-consistency-and-accessibility-pass).
- The historical DEV-4 authorization-then-execution scenario did not show its
  expected transition during the observation period. Cause remains unconfirmed;
  this is not a confirmed Linxo defect. The local environment was accepted with
  this documented observation. No functional defect was confirmed in DESIGN-6.

## Environment-specific considerations for the subsequent task

No new mandatory payment/authentication secret is introduced by these UI changes.
This is a source/configuration inventory, not an inspection of production values.

| Setting / prerequisite | Consideration |
| --- | --- |
| Database / Prisma Client | The three migrations above and generated client must match the application schema. Install/build from the committed lockfile; Prisma generation is already a postinstall step. Review target history separately before migration planning. |
| `ENABLE_DEV_AUTH` | New local-development opt-in since baseline. Keep disabled/unset outside local development; code additionally gates registration to development and excludes Vercel. Production retains Google/Auth.js and employee restrictions. |
| `LINXO_API_LOG_LEVEL` | Optional `off`, `error` or `info`. Existing logger defaults to off outside local development unless explicitly configured. Do not enable payload logging; structured safe metadata is the existing contract. |
| `NEXTAUTH_URL` | Existing public-origin setting must match the intended environment for shared/payment/return URLs. Local ngrok origins are local testing configuration, not production defaults. No new domain is hardcoded. |
| Linxo credentials / declared environment | Preserve the intended matching endpoint, OAuth client and webhook secret. `LINXO_PAYMENTS_ENVIRONMENT` is a label, not proof of connectivity. Reuse provenance binds normalized base URL, client ID and environment; legacy/null or different-context aliases remain excluded. No production credential/project verification was performed here. |
| Auth / database settings | Existing `AUTH_SECRET`, Google credentials and `DATABASE_URL` remain environment-specific. `.env.example` now describes guarded local PostgreSQL/Sandbox defaults; do not copy them into production. `.env.local` is preserved. |

The favorite-provider list is centralized in application code; it requires no
new environment variable and remains a preference, never a bank whitelist.
Local Compose, development env loading and ngrok setup add no production
infrastructure requirement. No Vercel setting, production configuration or
production migration was changed. The subsequent release task must handle its
own review/approval and verification; this task stops at documentation and commit.
