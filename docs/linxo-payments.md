# Linxo Payments OpenAPI Types

Linxo Payments OpenAPI is public and documented at `https://developers.linxo.com/payments/reference-direct-payment-api`.

TypeScript types are generated from the public OpenAPI YAML:

- `https://developers.linxo.com/swaggers/payments/swagger-payments-api.yaml`

## Regenerate types

Run:

```bash
npm run linxo:generate-types
```

This command regenerates:

- `src/generated/linxo-payments-api.ts`

The generated file is committed so the repository stays reproducible and does not require network access during builds.

## Runtime integration

Runtime HTTP calls now have a server-only foundation:

- OAuth2 client credentials token retrieval with in-memory caching
- Typed Linxo Payments HTTP client methods for order creation and order URL shortening
- Typed Linxo Payments authorized account creation for collector account setup
- Typed Linxo Payments account alias creation for contribution compatibility
- Forced `ask_for_alias=false` when shortening order authorization URLs for this product

The application now creates orders, prepares a short payment URL, and routes
contributors through an internal payment handoff page before they reach Linxo.

## Collector account setup

Before a pool can receive contributions in a future step, the pool creator must
configure a collector account in the protected dashboard.

- The app sends SEPA identification and entity KYC details to Linxo server-side
  through `POST /v1/authorized_accounts`
- The app then creates an alias through `POST /v1/alias` because the current
  contribution order flow still uses `beneficiary: { schema: "ALIAS", alias_id }`
- The app stores only safe Linxo references in the pool:
  `collectorAuthorizedAccountId` and `collectorAliasId`
- The app does not store IBAN, BIC, account number, birth data, company KYC
  data, or natural person KYC data locally

Collector reuse for new pools uses owner-scoped local references and a targeted
alias ownership/accessibility check at submission. See
[collector reuse](./collector-account-reuse.md) for provenance, migration,
legacy-record exclusions and manual Sandbox acceptance. The existing new-account
form and authorized-account/alias creation path remain available.

### Example request samples

The Linxo documentation explicitly requires using its documented request samples
when testing Authorized Accounts in Sandbox Mode.

Company example:

```json
{
  "identification": {
    "schema": "SEPA",
    "iban": "FR8530003000307599775722N09",
    "name": "MY SANDBOX COMPANY"
  },
  "entity": {
    "type": "COMPANY",
    "company_name": "MY SANDBOX COMPANY",
    "national_identification": "99999999999999",
    "country": "FR"
  }
}
```

Natural person entity example:

```json
{
  "entity": {
    "type": "NATURAL_PERSON",
    "firstname": "Joe",
    "surname": "Sandbox",
    "birth_date": "1978/09/13",
    "birth_city": "Paris",
    "birth_country": "fr"
  }
}
```

The application still normalizes user input before sending it to Linxo, but
these documented examples are the right reference when validating test data for
non-production environments.

When runtime integration is added, it should remain:

- hand-written
- server-only
- typed using the generated OpenAPI types

## Secrets

Secrets and API credentials must be provided through environment variables and must never be committed.

Do not expose Linxo client credentials to the browser.

## Environment note

Test environments can reject collector account data that does not match their
documented request samples.

Because of that, the app treats missing Linxo identifiers as a setup failure
and does not mark a pool as payment-ready without the required stored
references.

## API observability

`LINXO_API_LOG_LEVEL` controls all application-owned Linxo diagnostics:

| Value   | Events                                                                 |
| ------- | ---------------------------------------------------------------------- |
| `off`   | None                                                                   |
| `error` | Failed HTTP attempts and safe application diagnostics                  |
| `info`  | Successful and failed HTTP attempts, plus safe application diagnostics |

When unset, the default is `error` for local development (`NODE_ENV=development`)
and `off` for Vercel Preview and Production. Other runtimes default to `off`.
Explicit values override defaults; invalid values (including empty values) mean
`off`. The setting does not select Linxo credentials or sandbox/production mode.

For temporary local diagnostics, set `LINXO_API_LOG_LEVEL=info` in `.env.local`
and restart the server. On Vercel, set `error` or `info` for the relevant deployment
environment. Changing Vercel environment variables requires a deployment or
redeployment to use the updated configuration. Restore `off` after diagnosis.

Each HTTP attempt emits one JSON `linxo.api.request` event, including token
acquisition, order creation, running-order retrieval, order shortening, alias
creation, and authorized account creation. Authorized account content-type retries
produce separate events. A failed token acquisition emits only its token event;
no order request was sent. Cached token reads emit no event. Shortening failures
are visible even when the existing fallback succeeds.

Events contain an internal operation name, static endpoint template, method,
HTTP status when available, monotonic elapsed `durationMs`, and the outbound
`X-FWD-Request-ID` as `requestId`. OAuth requests also send this correlation header.
A different returned correlation header is included as `responseRequestId` only
when it has UUID syntax. Search local terminal output or Vercel application logs
for either ID; use it to locate the corresponding request in Linxo logs or when
contacting support. Token and API attempts have separate IDs; there is no
cross-request trace; no new public-facing diagnostic ID is introduced.

Failures include a controlled category and, when available, an allowlisted error
code (`UNKNOWN` for unrecognized codes). Timeouts/aborts are classified when the
transport reports them; logging adds no timeout, retry, network call, or database
operation. Durations include response parsing and exclude prior token acquisition.
No event can be emitted until a pending request settles. Console failures are
ignored so they cannot affect payment results or exception propagation.

Logs intentionally exclude bodies, arbitrary headers, raw exceptions and error
descriptions, credentials, tokens, banking/KYC details, personal information,
redirect URLs, query strings, and resource IDs. Endpoint templates never include
actual order IDs. Returned correlation headers that are not UUIDs are omitted.
The configured Linxo environment is omitted because its declaration does not
verify which credentials are in use.

Independent action logs were replaced by transport events to prevent duplicates.
Configuration failures, invalid collector responses, missing payment redirect
URLs, and local webhook lookup/processing failures retain only a safe operation
and category in `linxo.diagnostic` events. Pool, user, and resource context is
intentionally removed; correlate HTTP failures using request IDs instead. There
are no remaining application-owned Linxo logs outside this configuration.
Webhook processing and HTTP responses are unchanged.

This setting controls application diagnostics only. It does not suppress Next.js
framework logs, Vercel request/platform logs, or unrelated application logs. It
provides no external log storage or retention guarantee and does not diagnose or
repair missing Linxo resources.
