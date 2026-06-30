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
