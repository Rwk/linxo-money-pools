# Pools

Authenticated Linxo employees can create and manage their own money pools.

## Access model

- Only authenticated `@linxo.com` users can create or manage a pool.
- Public pool pages are accessible only through a non-guessable link.
- The application does not expose a public directory of pools.
- A creator sees only their own pools in the dashboard.

## Current scope

- Creators can create a pool with a title, description, event type, closing
  date, and collector display name.
- Creators can edit a pool and close or reopen it.
- Public pages display pool information through the slug link.
- Contributors can submit contributions through Linxo Payments when the pool is
  open and the collector account is configured.
- Contributions are sent directly to the collector account through Linxo
  Payments.
- The application does not act as escrow.

## Data constraints

- The application does not collect or store IBANs.
- The application does not collect or store beneficiary KYC data.
- The application does not collect or store payer bank account details.
- The celebrated person is described in the pool content, not modeled as a separate entity.
