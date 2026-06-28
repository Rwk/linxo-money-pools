# Contribution statuses

Returning from Linxo Payments does not prove that a payment has succeeded.

## Stored status layers

The application stores Linxo status data without collapsing it into a single
provider field:

- `linxoOrderStatus`
- `linxoPaymentStatus`
- `linxoSettlementStatus`
- `linxoInstructionId`
- `linxoPaymentId`
- `linxoSettlementId`

The product-level `cashInStatus` is derived from those raw statuses.

## Product status rules

- `SETTLED` or `MANUALLY_SETTLED` settlement => `COLLECTED`
- `NEW` or `AUTHORIZED` order => `PENDING`
- `REJECTED` or `FAILED` order => `REJECTED`
- `EXPIRED` order => `EXPIRED`
- `CLOSED` + `EXECUTED` payment => `EXECUTED`
- `CLOSED` + `REJECTED` payment => `REJECTED`
- `CLOSED` + `CANCELLED` payment => `CANCELLED`
- `CLOSED` + `SUBMITTED` payment => `PENDING`
- unknown or incomplete combinations => `PENDING`

## Public visibility

Public pages show only:

- confirmed contributions: `EXECUTED` and `COLLECTED`
- in-progress contributions: mainly `AUTHORIZED` orders and `SUBMITTED`
  payments

Public pages do not show:

- `NEW` contributions
- rejected, cancelled, or expired contributions
- failed or incomplete contribution totals
- raw Linxo technical statuses

Confirmed amount is the sum of `EXECUTED` and `COLLECTED`.

In-progress amount is based on authorized or submitted contributions, not every
technical pending contribution.

## Private visibility

The private dashboard shows the same visible contributions as the public page,
and also a dedicated incomplete or failed section for contributions that need
attention.

That section can include:

- `NEW` contributions
- rejected, cancelled, or expired contributions
- contributions missing order or payment data after initiation

Private rows can expose the app-level `cashInStatus` together with raw Linxo
statuses so the pool creator can understand what happened and contact the
contributor if needed.

## Return flow

When the payer comes back to
`/contributions/[contributionId]/return`, the app fetches the latest running
order from Linxo Payments, updates raw local statuses, derives
`cashInStatus`, and sets `returnedAt` if needed.

If the refresh fails, the app keeps the existing contribution state safe and
shows a neutral message asking the user to check again later.

Order webhooks can also refresh the latest Linxo order state. Polling may be
added later as a fallback.
