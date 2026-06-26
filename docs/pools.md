# Pools

This first product flow lets authenticated Linxo employees create and manage their own money pools.

## Access model

- Only authenticated `@linxo.com` users can create or manage a pool.
- Public pool pages are accessible only through a non-guessable link.
- The application does not expose a public directory of pools.
- A creator sees only their own pools in the dashboard.

## Current scope

- Creators can create a pool with a title, description, event type, closing date, and collector display name.
- Public pages display pool information through the slug link.
- Online payments and contribution submission are intentionally not implemented yet.
- Linxo Payments integration will be added in a later step.

## Data constraints

- The application does not collect or store IBANs.
- The application does not collect or store beneficiary KYC data.
- The celebrated person is described in the pool content, not modeled as a separate entity.
