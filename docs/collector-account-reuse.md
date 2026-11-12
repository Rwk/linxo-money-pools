# Reusing collector accounts

## Data model and migration

Originally a pool stored its creator, collector display name, authorized-account
reference and alias reference. The alias was created with the session user's
persisted ID as `user_reference`. Entity type and the credential context were
not saved; ownership of a local pool alone could not establish the provenance
of legacy references after a credential/environment change.

Migration `20261112180000_collector_reuse_provenance` adds two nullable fields to
`Pool`, with no new table:

- `collectorEntityType`: `NATURAL_PERSON` or `COMPANY`.
- `collectorProjectKey`: SHA-256 of the normalized API base URL, OAuth client ID
  and declared environment. It contains neither the client secret nor a token.

These fields are recorded together with the returned reference pair after
successful collector setup. Configuration is captured once per operation so
the fingerprint and requests use the same credentials. Existing rows remain
null: no provenance or entity type is guessed or backfilled. Existing payments
and references are preserved, but incomplete legacy collectors are not offered
for reuse. Configure a new collector to establish a reusable source.

The migration was applied only to the guarded local development database, and
Prisma Client was regenerated. Other environments require the migration before
running this application version; no production migration or deployment was
performed. Local commands are `npm run db:dev:migrate` and `npm run db:generate`.
Restart the development server after generation.

## Selection and server-side authorization

The new-pool page uses the authenticated session to query only that creator's
previous pools in the current credential context. It requires both reference
IDs, entity type and a nonempty display name. No Linxo list request is made on
page render, and no project-wide alias lookup exists.

Options contain only the source pool ID, display name, entity type and source
pool title. The title helps distinguish accounts without introducing alias
renaming or retrieving banking data for display. Deduplication uses the alias ID
within the owner/credential context: the payment flow uses that stable alias.
The authorized-account ID is never substituted for an alias ID. Different aliases
are retained even if they share an authorized-account reference (notably Sandbox
fixtures). Conflicting authorized-account/entity pairs for one alias are excluded
entirely. For consistent duplicates, the newest source pool supplies the label.

The creation action reads only the selected source pool ID, never client-provided
`user_reference`, alias IDs, authorized-account IDs or provenance. Before creating
the new pool, the service repeats the scoped lookup and validates the selection.
It then performs one targeted `GET /v1/alias/{aliasId}` with the captured
credentials. Both returned alias ID and `user_reference` must match the saved
alias and authenticated user's persisted ID. Any mismatch or inaccessible,
invalid or unavailable alias fails closed with a French message offering another
selection or the new-collector path. No pool is created on failed validation.

The developer explicitly authorized the API's transient server-side response,
which includes banking fields. Only `{ id, userReference }` leaves the client
method; the IBAN and other banking fields are not persisted, logged or sent to
the browser. Existing structured logs record only the static endpoint, operation,
status, safe error code and request ID.

The new pool copies the original display name, entity type, credential key and
the paired authorized-account/alias references from the same source record. It
does not update the original pool or create another authorized account or alias.
Order creation continues to use the saved alias without changes to payments,
contributions, webhooks or authentication providers.

## User experience and limits

With eligible collectors, the creation form defaults to **Utiliser un compte
collecteur existant** and shows a responsive selector. The user can switch to
**Créer un nouveau compte collecteur** and back before submitting. Without
eligible collectors, the original creation fields appear directly, with no
selection step.

The existing two-stage new-collector flow is retained: create the pool with its
display name, then complete the unchanged banking/KYC form on its management
page. Reuse skips the banking setup because the new pool already has its pair.
There is no new page, wizard or collector management screen.

The credential fingerprint is a conservative same-client binding, not a claim
to know Linxo's human-readable project name or to verify Sandbox solely from an
environment label. A different OAuth client, API URL or environment declaration
hides previous options, even if a human knows the clients share a project.
Secret rotation with the same client preserves eligibility; remote access still
has to succeed. Supporting multiple project credentials per pool remains outside
this feature. Aliases can become inaccessible after submission; subsequent
payment failures retain the existing behavior.

## Automated verification

Verification on 2026-11-12:

- Targeted Vitest: **140 tests passed** across collector sources, repository and
  action authorization, form switching, alias client/logging, setup, stable
  development authentication and contribution order compatibility.
- Full suite: **376 passed, 4 failed, 1 skipped**. The failures are the known
  July 2026 date-dependent pool create/update/reopen action tests.
- ESLint and production build: **passed**. The build used process-only synthetic
  auth/webhook secrets and nonfunctional Linxo credentials/endpoint.
- `npm run db:dev:check`: **passed**, using the actual Prisma client against the
  migrated local database in a read-only check.
- Standalone TypeScript: **eight pre-existing fixture errors** remain (Decimal
  stubs in handoff presenter tests, missing lookup dependencies in synchronization
  tests, and incomplete public/private pool detail view models). No errors were
  reported in the new implementation or tests.

Changed implementation files are the new-pool page and form, creation action and
service, collector setup service, pool repository, new reusable-collector
repository/service, Linxo client/config/logger, centralized French translations,
Prisma schema and the additive migration. Focused tests cover those boundaries;
the roadmap and Payments integration guide link to this acceptance record.

## Manual Sandbox acceptance

Use the accepted local setup, fictional user details and only confirmed Sandbox
credentials. The developer performs these checks; no live Linxo calls or payment
orders were created by the implementation's automated tests.

1. **First collector:** after the local migration/client generation and restart,
   use the existing development identity. With no eligible source (legacy rows
   without provenance do not qualify), create a dedicated test pool. Verify the
   existing fields appear directly and complete its normal collector setup with
   the official Sandbox examples. Expect authorized-account/alias creation, then
   the paired references, entity type and non-null provenance in local PostgreSQL.
2. **Reuse:** create another pool. Verify reuse is selected by default and the
   first pool's collector appears once. Submit without banking details. Expect a
   targeted `getAccountAlias` HTTP 200 and no `createAuthorizedAccount` or
   `createAccountAlias` operations (OAuth token acquisition is normal). In local
   Prisma Studio compare the new pool's pair, entity type, provenance and display
   name with the source. Confirm the source row and its contributions are unchanged.
3. **Payment compatibility:** manually initiate a fictional Sandbox contribution
   on the new pool and verify order creation uses the reused alias. Do not use
   real accounts or initiate a real payment.
4. **Another new collector:** create a third pool, switch to the new option, then
   back to reuse and back to new. Check the selected source/name state is retained.
   Finish the original new-collector setup and verify the usual creation calls.
5. **Isolation:** automated tests cover another user's sources, forged IDs and
   `user_reference`, incompatible contexts and remote ownership mismatches. No
   extra development identity is needed. Sign out and in again with the existing
   developer identity; its own eligible list must remain stable. Do not change
   production or Sandbox credentials merely to test isolation.
6. **Inaccessible alias:** in tests, 401/403/404/500 and malformed ownership
   metadata all fail safely. For any observed manual failure, preserve only the
   structured status/code/request ID and verify the new-collector choice remains
   available. Do not delete a working Sandbox collector just for this test.

Manual browser/provider acceptance remains pending. Contract reference:
[Linxo Payments alias lookup](https://developers.linxo.com/payments/reference-direct-payment-api/).
