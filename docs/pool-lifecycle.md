# Pool lifecycle and permanent archive — P1-A

Implemented locally on 2026-11-12. P1-B dashboard tabs and management controls
remain planned. No production migration, deployment or Linxo test transaction
was performed for this milestone.

## Findings and effective states

Previously, manual closure used `status: OPEN | CLOSED` and `closedAt`. Expiry
was derived from `closingDate`, so an expired pool could remain persisted OPEN.
The reopen action incorrectly called it already open. The contribution insertion
lock protected the fixed-price snapshot but did not recheck effective lifecycle;
a stale preflight could insert after closure. Both issues are corrected.

`getPoolLifecycle(pool, now)` derives one state, in priority order:

| State | Rule |
| --- | --- |
| ARCHIVED | `archivedAt` is present, regardless of status/date. |
| COMPLETED | Not archived, and manually CLOSED or past its closing day. |
| ACTIVE | Not archived, OPEN, closing day still valid. |

Established date semantics are preserved: the UTC calendar day of stored
`closingDate` is compared with today's server-local calendar day. The closing day
itself remains valid. Explicit reopening dates use strict `YYYY-MM-DD`, reject
invalid/rolled dates, and are stored at the end of that UTC day. This is not a
new timezone or instant-based expiry policy.

## Data and owner operations

Migration `20261112200000_permanent_pool_archive` only adds nullable
`Pool.archivedAt`. Existing rows default to NULL; no historical contribution or
order is changed. Existing migrations are untouched. Applied only to the guarded
Docker PostgreSQL development database. At the future v1.1.0 production release,
deploy this migration alongside all previous pending migrations before serving
the corresponding application code, then regenerate Prisma Client.

Authenticated owner actions reuse the existing close/reopen path and add
`archivePoolAction`:

- Close ACTIVE; repeated closure of completed pools is harmless.
- Reopen COMPLETED, preserving an unexpired closing date where appropriate.
  An expired pool, including persisted OPEN, requires explicit valid new date
  input. `reopenPoolAction` accepts optional FormData field `closingDate`; it
  never invents a date. Existing owner editing can also explicitly extend the
  date of an expired OPEN pool; CLOSED pools remain CLOSED until reopened.
- Archive only COMPLETED. Persist only `archivedAt`; preserve manual closure,
  dates, contributions and payment references. Repeat archive is a no-op and
  preserves its original timestamp.
- Archived pools cannot reopen or be edited. There is no unarchive operation.
  Reads remain owner-authorized and historical payment processing remains valid.

`listPoolsByCreatorLifecycle(creatorId, lifecycle, now)` provides P1-B server-side
classification. The database query is scoped to that creator before classification;
it does not load all owners' data. Existing dashboard queries/layout are retained.
The helper currently loads that owner's pools and contributions using the existing
repository selection; pagination/optimization is outside this milestone.

## Atomic contribution cutoff and concurrency

The approved cutoff is successful contribution acceptance in PostgreSQL while
the pool is effectively ACTIVE. All acceptance transactions, fixed-price edits,
close, reopen and archive transitions share the existing pool `SELECT ... FOR
UPDATE` row lock at READ COMMITTED. Owner transitions recheck ownership and
lifecycle after acquiring the lock. Acceptance rereads lifecycle and the stored
price snapshot before inserting a contribution. This applies to FREE and FIXED.
Payment readiness and quantity checks remain in the existing service.

If closure wins, acceptance fails and no Linxo order is requested. If acceptance
wins, that contribution may complete Linxo initialization even if closure and
archive occur before the external request. The transaction has already ended;
no PostgreSQL lock spans any Linxo network call. A contribution accepted before
expiry may likewise finish afterwards. Closure/archive do not cancel that work.

Ordinary detail/collector-reference updates use an atomic owner-scoped
`archivedAt: null` update predicate. PostgreSQL waits for competing row locks and
rechecks the predicate. Thus archive winning prevents a later edit; a date edit
winning may reactivate an expired OPEN pool, in which case archive rejects it.
Fixed-price edits retain their all-contribution count and snapshot protection.

Linxo errors, including uncertain responses after a request, retain existing
behavior: initiation failures are marked using the existing failure handler;
there is no automatic retry or new remote idempotency mechanism. P1-A does not
resolve the pre-existing uncertainty of a remote order whose response is lost.

## Existing payments and privacy

Order initialization persistence, handoff links, webhook verification, status
synchronization and owner reconciliation do not impose new pool-lifecycle guards.
Late updates to accepted contributions continue after closure/archive. Webhook
secret validation is unchanged. Public totals still exclude confirmed hidden
amounts; owner totals and recorded contributor data remain available. Archive
neither rewrites amounts nor changes name visibility.

Tests cover a webhook-triggered sync on a CLOSED/archived source, archived-owner
reconciliation, actual post-archive database order/status writes, and hidden
amount totals. Linxo is mocked; this is automated compatibility evidence, not a
claim of new manual Sandbox acceptance.

## Verification

- Targeted lifecycle/payment/compatibility Vitest checks: 235 tests passed
  across 19 files.
- Local migration status: all five migrations applied, schema up to date.
- Guarded PostgreSQL integration: 15 tests passed, including real lock waits in
  both orders for close/accept, archive/reopen, archive/price-and-date edit;
  archive/accept and archive/ordinary edit rejection; repeated archive;
  FREE expiry; and late initialization/status persistence. Temporary fixtures
  are uniquely named and cleaned up. No Linxo calls.
- Full Vitest: 516 passed, 3 failed, 15 skipped (the 15 local database tests
  pass separately via `db:dev:check`). The three historical failures use expired July
  2026 dates in `create-pool-action.test.ts` (one) and
  `update-pool-action.test.ts` (two). Touched lifecycle tests now fix their clock.
- TypeScript: eight historical test-fixture errors: three Decimal stubs in
  `payment-handoff-presenter.test.ts`, three missing dependency methods in
  `sync-contribution-status.test.ts`, two incomplete detail view-model fixtures
  in `pool-detail-sections*.test.ts(x)`. No new application-code type error.
- ESLint and production build pass. Initial sandbox runs
  encountered EPERM for Node subprocesses/Turbopack local ports; verification was
  rerun with execution permission. Build uses synthetic payment configuration.

## Pending manual acceptance and P1-B

Restart the Next development server after Prisma generation/migration so its
cached client sees `archivedAt`. Keep local Sandbox-only configuration.

P1-A deliberately adds no tabs, archive button, confirmation dialog or separate
editing page. Existing UI badges/control visibility are not yet archive-aware;
server rules enforce the restrictions. P1-B must connect the owner-scoped
classification and actions, display effective states, explain irreversible
archive, and provide explicit closing-date input for expired reopening.

Manual P1-B acceptance must cover ACTIVE/COMPLETED/ARCHIVED membership,
owner isolation, expiry and manual closure, expired OPEN reopening with a new
date, refusal without a date, permanent archive and unchanged timestamp on
repeat, rejection of fresh public contributions, readable owner history, and
continued Sandbox authorization/late webhook/reconciliation for a previously
accepted contribution. Verify public amount privacy and owner totals, including
hidden amounts. Browser Sandbox acceptance for the new lifecycle remains pending.
