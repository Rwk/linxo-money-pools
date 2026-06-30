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
- Typed Linxo Payments account alias creation for collector account setup
- Forced `ask_for_alias=false` when shortening order authorization URLs for this product

The application now creates orders, prepares a short payment URL, and routes
contributors through an internal payment handoff page before they reach Linxo.

## Collector account setup

Before a pool can receive contributions in a future step, the pool creator must
configure a collector account in the protected dashboard.

- The app sends the submitted IBAN to Linxo server-side through `POST /v1/alias`
- The app stores only the returned Linxo `alias_id` in `Pool.collectorAliasId`
- The app does not store IBAN, BIC, account number or beneficiary KYC data locally
- Future payment orders will use `beneficiary: { schema: "ALIAS", alias_id }`

When runtime integration is added, it should remain:

- hand-written
- server-only
- typed using the generated OpenAPI types

## Secrets

Secrets and API credentials must be provided through environment variables and must never be committed.

Do not expose Linxo client credentials to the browser.
