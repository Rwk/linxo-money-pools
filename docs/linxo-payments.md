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
- Forced `ask_for_alias=false` when shortening order authorization URLs for this product

The application UI still does not create orders or redirect contributors to Linxo yet.

When runtime integration is added, it should remain:

- hand-written
- server-only
- typed using the generated OpenAPI types

## Secrets

Secrets and API credentials must be provided through environment variables and must never be committed.

Do not expose Linxo client credentials to the browser.
