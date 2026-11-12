# Fixed-price contributions

The original fixed-price flow was **manually accepted in Sandbox by the developer**.
The owner detail/price-edit follow-up is implemented; its manual acceptance is
pending.

## Behavior and server enforcement

Pools have two creation-time contribution modes:

- **FREE** (default): the contributor enters a positive amount with at most two
  decimal places, using a comma or dot as before.
- **FIXED**: the organizer sets a positive unit price. The contributor selects
  an integer quantity from 1 to 10, defaulting to 1 in the form. The form shows
  the public unit price and immediately updates the payable total.

`pool.pricing.ts` parses the unit price into integer cents. On contribution
submission, the existing order service loads the persisted pool, validates its
mode/price and the quantity, then calculates `fixedUnitPriceCents * quantity`
with integer arithmetic. That one formatted total is used for both the local
contribution and the Linxo instruction. Client-supplied amount, total, mode or
unit-price fields cannot override a FIXED pool's persisted configuration.
Forged total/price fields are ignored; missing or invalid quantities are rejected
before any contribution or order is created. FREE amounts are validated by the
same existing normalizer at the service boundary.

The existing amount validator enforces positivity and two decimal places; it
has no additional application-level bank-specific maximum. The new cents column
is PostgreSQL `Int`, so the unit price range is EUR 0.01–21,474,836.47. At quantity
10, the largest total is EUR 214,748,364.70: integer-safe, within the existing
Prisma `Decimal(14,2)` storage and Linxo amount representation. These are storage
and representation bounds, not a promise that every bank accepts those amounts.
The normalizer also validates the calculated total. No Linxo API client changes
or new payment implementation were needed.

Both new and reused collectors use the same creation and payment paths.
Mode remains immutable. The owner may edit a FIXED unit price only before any
contribution exists. Once a contribution of any status exists, price is locked.
Other pool details remain editable, and closing/reopening does not change pricing. Contribution history, order
references, status synchronization and webhooks retain their existing behavior.

## Owner details and safe price editing

The existing **Détails de la cagnotte** card always shows **Montant libre** or
**Montant fixe**. FIXED details include the stored unit price formatted as French
euros. These additional owner props are supplied only after authentication and
ownership checks. The public page receives no new private eligibility/history
information.

The existing edit form offers the unit-price input only for FIXED pools with no
contributions. The same creation-time euro parser validates it and produces
integer cents. FREE pools cannot become FIXED, nor FIXED pools become FREE.
A French explanation states that pending, failed, rejected, cancelled, expired
and confirmed contributions all lock the price. Submitting a price field against
a locked pool is rejected without partially saving the other details; ordinary
detail editing without that field remains available.

Both `updatePoolPriceAndDetails` and `createContributionRecord` take the same
PostgreSQL row lock (`SELECT ... FOR UPDATE` on the pool) in short **READ
COMMITTED** transactions. Ownership, mode and the unfiltered contribution count
are checked after acquiring the edit lock; details and price are then written
atomically. Contribution insertion checks the server's pricing snapshot after
acquiring the same lock. If an edit committed first, a stale insertion fails; if
an insertion committed first, the edit sees the new contribution and fails.
Locks are released before any Linxo network request. No schema change, extra
infrastructure or changes to existing contribution amounts/orders are needed.
See [PostgreSQL row-lock behavior](https://www.postgresql.org/docs/17/explicit-locking.html#LOCKING-ROWS).

FIXED forms also send the displayed `expectedUnitPriceCents` as a freshness check.
The server compares it with the stored price, but never uses it to calculate the
charge. Missing/stale values produce a French reload message before payment
initiation. This prevents an old open form from silently accepting a newly
increased price. Existing open FIXED forms from before this update need a reload.
Quantity and amount calculations still use the persisted price exclusively.

## Schema, history and privacy

Migration `20261112190000_fixed_contributions` adds:

- `Pool.contributionMode`, enum `FREE | FIXED`, non-null default `FREE`.
- `Pool.fixedUnitPriceCents`, nullable integer.
- A database constraint requiring FREE/null or FIXED/positive-price pairs.

Historical pools become FREE through the additive default; historical
contributions and payment orders are untouched. No earlier migration is edited.
Quantity is not stored: this milestone displays the immutable monetary amount
already recorded on each contribution and does not require quantity history.
This also avoids publishing quantities that would reconstruct hidden amounts.

The unit price is intentionally public. Public lists retain the existing name
visibility and masked-amount labels, but never publish historical quantities.
Public confirmed/in-progress totals still exclude hidden amounts; the owner sees
complete confirmed totals and individual amounts. A contributor sees their own
quantity/total while submitting the form, as required to authorize their payment.

## Local setup and future release note

The migration was applied **only to local PostgreSQL** and Prisma Client was
regenerated. Run the local guarded checks as needed:

```bash
npm run db:dev:status
npm run db:dev:check
```

**Restart `npm run dev` after schema/client generation**: stop the current server
with Ctrl+C and start it again. Hot reload may retain an older Prisma singleton
and report unknown-field errors. No database reset is needed.

**v1.1.0 release requirement:** apply the new fixed-contribution migration, along
with any earlier pending migrations, to **Supabase Production during the future
v1.1.0 deployment**, before serving the new application code. Generate the matching
Prisma Client for that build. This implementation did not connect to or migrate
Supabase Production, push, deploy or create a release tag.

## Verification

Automated tests use fictional fixtures and mocked Linxo calls; no live order is
created. Coverage includes default/historical FREE behavior, price syntax and
bounds, quantities 1–10 and invalid quantities, cent arithmetic, forged totals,
equal persisted/order amounts, both collector paths, editing preservation,
privacy, public form updates and unchanged payment status handling.

Initial implementation verification on 2026-11-12:

- Targeted Vitest: **150 tests passed** across pricing, creation, form updates,
  collector reuse, privacy, editing preservation and payment lifecycle behavior.
- Full suite: **438 passed, 4 failed, 1 skipped**. The failures are the known
  date-dependent July 2026 pool create/update/reopen action tests.
- ESLint and production build: **passed**. Build verification used process-only
  synthetic auth/webhook secrets and a nonfunctional Linxo endpoint/credentials.
- Standalone TypeScript: **eight pre-existing fixture errors** remain: three
  Decimal stubs in handoff presenter tests, three missing lookup dependencies in
  status synchronization tests and two incomplete pool detail view models. No
  errors were reported in the changed implementation or new tests.
- Local Prisma status: **four migrations applied, schema up to date**. The
  read-only local database/client check also passed.

Owner price-management follow-up verification on 2026-11-12:

- **75 targeted tests passed**, including read-only display, eligible/locked edit
  UI, repeat editing, ownership, invalid prices, unchanged ordinary fields,
  stale-form rejection and absence of Linxo calls after a rejected insertion.
- **Four local database checks passed** through `npm run db:dev:check`, including
  real row-lock waits for both competing transaction orders and a test of all
  cash-in statuses (including an order marked failed). Temporary fixtures were
  cleaned up; existing pools and provider resources were not changed.
- Full suite: **471 passed, 4 historical date-dependent failures, 4 skipped**.
  The skipped tests are the four real-database checks run separately above.
- ESLint and production build passed. Standalone TypeScript still reports only
  the eight historical test-fixture errors described above.
- No new schema migration is needed for this follow-up. Production data was not
  accessed or modified. Manual acceptance of the owner UI remains pending.

## Manual acceptance in local Sandbox

Use fictional contributor data and confirmed Sandbox credentials/collectors.
The developer performs bank simulation; do not use real accounts or payments.

1. **FREE:** create a pool with the default mode. Configure a new collector or
   reuse an eligible one. Confirm the public form has the existing editable
   amount field, then create a custom-amount Sandbox contribution.
2. **FIXED:** create a dedicated pool with **Montant fixe par participation** and
   a unit price of **12,50**. Confirm the public amount is not editable, quantity
   defaults to 1 and the selector runs through 10. Verify totals for quantities
   1, 3 and 10 are respectively **12.50, 37.50 and 125.00 EUR**. Submit separate
   fictional contributions and compare their local amount with the corresponding
   Linxo Sandbox order. Repeat the creation choice with the other collector path.
3. **Privacy:** manually execute a Sandbox FIXED contribution with its amount
   hidden. After synchronization, the public confirmed total must exclude it;
   the owner total includes it. Public rows show **Montant masqué**, keep existing
   name rules and expose no quantity in markup, RSC or status JSON.
4. **Tampering:** use local browser developer tools to submit quantity 0, 11,
   negative, fractional, missing or non-numeric. Expect a French quantity error
   and no contribution/order creation. For a valid quantity 3, adding forged
   `amount=0.01`, total, mode or unit-price fields must still charge **37.50 EUR**.
   Automated tests verify this without creating provider orders.
5. **Owner details and price editing:** before contributing to a fresh FIXED pool,
   verify its read-only mode/price, edit the price, save and reopen editing to
   confirm the stored value. Keep a public form open at the previous price: its
   submission must request a reload and create no contribution/order. Reload it
   and verify subsequent quantity totals use the new stored price.
6. **Price lock and lifecycle:** create a pending contribution, then verify the
   owner details explain the lock and the price input is absent. Rejected/failed
   or confirmed contributions must retain that lock. Try a forged edit request
   with a new price: it must fail while a normal title/description/date edit still
   succeeds. Exercise the usual Sandbox return/status flow and verify public and
   owner totals. The mode remains unchanged throughout.

Record the owner-management follow-up outcomes before marking that follow-up
manually accepted.
