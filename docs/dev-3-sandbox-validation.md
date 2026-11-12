# DEV-3 Sandbox validation — 2026-11-12

**Accepted by the developer.** This report preserves the DEV-3 observations;
subsequent browser/webhook acceptance and its known limitation are recorded in
[DEV-4 validation](./dev-4-sandbox-validation.md#developer-acceptance-results).

## Configuration and scope

- `.env.local` was read without printing secrets and was not changed. OAuth credentials and webhook secret are present. The configured API base is `https://pay.oxlin.io` and the declared environment is `sandbox`.
- Linxo documents a shared base URL for Sandbox and production; credentials select the mode. The application environment flag only validates configuration syntax and does not select or prove Sandbox connectivity.
- The developer explicitly confirmed that these credentials belong to the intended Sandbox project and authorized the official company test fixture. Project ownership was not independently verified through a developer portal. Successful OAuth alone does not establish ownership.
- PostgreSQL was initially stopped (`ECONNREFUSED`). The existing Docker Compose service was started; both existing migrations are applied. Before testing, the database contained one pool and zero authorized-account or alias references, so there were no production collector references to reuse.
- The existing development user has the expected stable database identity. The collector action obtains `user_reference` from `requireLinxoSession().id`; it does not accept this reference from form input.
- A new local pool, **DEV-3 — Été solidaire 🧪💶**, slug `dev-3-ete-solidaire-sandbox`, was used exclusively. Its display name is **Équipe DEV-3 🧪**. No other pool was modified.

## Live results

The existing application services and API client performed collector setup and contribution creation against the local database. A temporary local harness invoked the services directly; this was not a browser end-to-end test. The application client used its existing structured HTTP logs. A separate read-only alias probe recorded only status, correlation ID, and equality checks.

| Operation                                           | Endpoint                            | HTTP status | Request ID                             |
| --------------------------------------------------- | ----------------------------------- | ----------- | -------------------------------------- |
| Create authorized account, initial HAL content type | `POST /v1/authorized_accounts`      | 415         | `baa2ca6a-f7c4-4e6f-9e5f-9751351c659f` |
| Create authorized account, existing JSON fallback   | `POST /v1/authorized_accounts`      | 201         | `46559939-14bb-40a0-a36c-1c00b3e35dd7` |
| Create collector alias                              | `POST /v1/alias`                    | 201         | `77171ef9-4f6b-4574-a91a-cc937c4b168d` |
| Read alias, final verification                      | `GET /v1/alias/{alias_id}`          | 200         | `70661a7b-e52a-48d9-9788-ea66d8857991` |
| Create initial order                                | `POST /v1/orders`                   | 201         | `956c716a-0e70-4d6b-a285-4e3367d44ea3` |
| Create order after correction                       | `POST /v1/orders`                   | 201         | `02e8ae53-950e-4acd-ba98-ce88cfa48c6d` |
| Shorten final order URL                             | `POST /v1/orders/{orderId}/shorten` | 200         | `d99e3bba-0947-4e1d-9eb2-bad9b610defa` |

The initial 415 was logged with category `api_error` and safe code `UNKNOWN`. The existing fallback handled it successfully; no client retry changes were needed. OAuth acquisition returned 200 throughout.

- Authorized-account creation returned the documented Sandbox fixture identifier. Its exact returned reference and the created alias reference were compared with the stored local fields; both matched.
- The same configured credentials created both resources and retrieved the alias. The returned alias ID and `user_reference` matched the database values. The authorized-account response is a documented Sandbox fixture, so its shared identifier is not independent proof of unique project ownership.
- Two test contributions of EUR 1.00 were created, one before and one after the correction, using the same collector. Both orders were stored with status `NEW` and payment redirect URLs. Neither authorization URL was opened and no bank payment was authorized.
- For the final live request, the actual serialized JSON was checked in memory: both the order label and beneficiary complementary name matched their respective contract patterns. No API payload, access token, banking data, or redirect URL was printed.

## Confirmed defect and smallest correction

`buildLinxoOrderRequest` already sanitizes the order label, but passed `collectorDisplayName` directly into `beneficiary.complementary_name`. The pool form allows accents, emojis, and punctuation that this Linxo field forbids. The Sandbox accepted the initial request despite this documented contract violation.

Only complementary-name serialization was corrected: reuse the existing ASCII normalizer, allow letters, digits, spaces, commas and hyphens, collapse whitespace, cap at 140 characters, and use `Money pool` when nothing remains. The stored display name and title are preserved.

For the dedicated pool, the resulting label is `Contribution to DEV-3 - Ete solidaire` and the complementary name is `Equipe DEV-3`. Regression tests cover accents, emojis, forbidden punctuation, an empty normalized result, maximum length, and preservation of the source display name.

## Automated checks

- Targeted Linxo, collector, contribution, payment-domain and development-auth tests: **153 passed** across 15 files after the correction.
- ESLint: **passed**.
- Initial full suite, before code changes: **310 passed, 4 failed, 1 skipped**. Failures are in existing create/update/reopen pool action tests using July 2026 dates that are now in the past. These unrelated tests were left unchanged.
- `tsc --noEmit`: **failed** with eight errors in existing test fixtures: Decimal stubs in `payment-handoff-presenter.test.ts`, missing `findContributionByLinxoOrderId` dependencies in `sync-contribution-status.test.ts`, and incomplete pool view models in the two pool-detail test files. No errors were reported in the changed service or its test.

## DEV-4 handoff at the time of this validation

Subject to the DEV-4 scope, validate the browser payment handoff and simulated bank authorization, return flow, webhook delivery to the local application, and contribution status synchronization using this dedicated Sandbox pool. Test rejection, cancellation and expiration scenarios as appropriate. These flows were not exercised here and no webhook code was changed.

Resolve the existing unrelated test-date and TypeScript fixture failures before requiring a fully green repository baseline. Retain the two `NEW` Sandbox orders and local contributions as validation artifacts until deliberately cleaned up.

No schema, authentication, webhook, environment-file or architecture changes were made. Nothing was pushed, deployed or tagged.

Contract reference: [Linxo Payments API](https://developers.linxo.com/payments/reference-direct-payment-api/) and its [OpenAPI specification](https://developers.linxo.com/swaggers/payments/swagger-payments-api.yaml), including `Label` (`^[a-zA-Z0-9\- ?:().,+]{1,50}$`) and `ComplementaryName` (`^[a-zA-Z0-9 ,-]{1,140}$`).
