# Pool lifecycle and permanent archive — P1-A

P1-A and P1-B implemented locally on 2026-11-12. Dashboard tabs and owner
controls are implemented; manual Sandbox acceptance of P1-B remains pending. No production migration, deployment or Linxo test transaction
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

`listPoolsByCreatorLifecycle(creatorId, lifecycle, now)` provides server-side
classification for the P1-B dashboard. The database query is scoped to that creator before classification;
it does not load all owners' data. The dashboard reuses this query for the selected tab and the existing owner query
for global metrics (total pools and confirmed amounts across all three states).
The in-progress count uses effective ACTIVE state.
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

## P1-A verification

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

## P1-B interface and action wiring

Implemented locally; manual acceptance is **pending**. Dashboard navigation uses
`/dashboard?tab=active|completed|archived`; absent or unknown values default to
`active`. The three links are keyboard-accessible, wrap on small screens, expose
`aria-current="page"`, and render distinct French empty states. Membership uses
the owner-scoped P1-A query and shared lifecycle rules. No client state library,
new schema, or P2 dashboard redesign was introduced.

Cards and private/public details consistently show `En cours`, `Terminée`, or
`Archivée`. Non-active pools no longer show the contradictory payment-ready
badge; public completed/archived pages show the existing closure message and no
new-contribution form. No private management controls are exposed publicly.

The existing owner action panel now uses shared lifecycle controls:

- ACTIVE: close and existing owner editing.
- COMPLETED: reopen and permanent archive, alongside permitted editing.
- Expired COMPLETED (including persisted OPEN): reopen has a required, initially
  empty `Nouvelle date de clôture` input, sent as `closingDate` FormData to the
  existing P1-A action. Native required validation and server date validation
  apply. No future date is invented. Unexpired manual closure needs no date input.
- Archive: expand the native keyboard-accessible disclosure, read the irreversible
  warning, select the required confirmation checkbox, then submit. The warning
  explicitly says no reopening or unarchiving and preserves contribution/payment
  history. The submit button stays disabled until confirmation; server ownership
  and locked lifecycle checks remain authoritative.
- ARCHIVED: clear archived notice; no close/reopen/archive, edit or collector-setup
  controls. Details and contribution/payment history remain readable. A previously
  open edit panel becomes read-only when archive props arrive. Status reconciliation
  remains available; late callbacks/webhooks are unchanged.

Status/error messages are announced through a live region. Pending lifecycle
requests disable competing lifecycle submissions. Close/reopen/archive invalidate
both the owner/public detail pages and dashboard. Existing price/quantity rules,
amount privacy, API logs and payment error-handling semantics are preserved.

### Automated P1-B verification

- Targeted UI/lifecycle/payment/privacy/collector regression checks: 267 tests
  passed across 24 files (including 25 new P1-B tests).
- Full Vitest: 541 passed, 3 historical date-fixture failures, 15 opt-in local
  database checks skipped. These database checks passed separately in P1-A;
  this UI milestone adds no database mutation or migration.
- ESLint: passed. Production build: passed with synthetic Linxo configuration.
- Standalone TypeScript: the same eight historical test-fixture errors listed
  under P1-A; no new application or P1-B test errors.
- All external Linxo operations in the test suites are mocked. No new browser
  banking simulation or manual webhook acceptance has been claimed.

### Manual Sandbox acceptance checklist — pending

Restart Next development after P1-A migration/client generation if needed. Use
only local pools and authorized Sandbox accounts with fictional data. Prepare
ACTIVE, manually CLOSED, expired OPEN, and archived fixtures through supported
local flows. The earlier P1-A migration must be present in the local database.

1. Sign in as owner. `/dashboard` defaults to `En cours`. Visit all three tabs,
   reload/bookmark their URLs, and verify each pool appears in exactly one tab.
   Test empty states; verify an unrelated owner's pools never appear. Check mobile
   wrapping and keyboard focus/navigation.
2. Open ACTIVE details, edit existing fields, then close. Verify `Terminée`, its
   completed-tab membership, and no public contribution form. Cards/details must
   agree. Existing contribution amounts and global metrics must be preserved.
3. Reopen a manually closed, unexpired pool without changing its date. Verify
   `En cours`, active-tab membership and working public contribution form.
4. Open an expired OPEN pool: it must be `Terminée`, with reopen/archive actions.
   Reopen with empty/past date must fail safely; an explicitly selected valid new
   closing date succeeds. Verify persistence and active membership after refresh.
5. On a completed pool expand `Archiver définitivement`. Read the warning. The
   final button must remain disabled before checking confirmation. Archive, reload,
   and verify `Archivées`, `Cagnotte archivée`, readable details/history, and no edit,
   setup, reopen, close or archive controls. No unarchive action may exist.
6. Use its public link: archive/expiry/closure must offer no contribution form or
   private management controls. Verify hidden amounts remain `Montant masqué`,
   public totals exclude them, and owner history/totals still include them.
7. Manually complete the Sandbox banking simulation for a contribution accepted
   before closure/archive. Confirm its existing handoff/callback still works, its
   late webhook updates PostgreSQL, and owner reconciliation remains available.
   Never initiate real transactions. Report browser/webhook outcomes separately
   from automated test results.

Known limits: classification refreshes on navigation/reload or action invalidation;
there is no new expiry timer or background UI polling. The repository still loads
that owner's existing contribution selection without new pagination. Existing
remote-order uncertainty on lost Linxo responses is unchanged. P2 redesign is
outside this milestone. No production connection, migration, push or deployment
was performed. For the future v1.1.0 production release, deploy
`20261112200000_permanent_pool_archive` with earlier pending migrations and
regenerate Prisma Client before the corresponding application code serves traffic.
