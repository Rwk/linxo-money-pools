# Payment handoff

After creating a Linxo order, the payer is sent to an internal handoff page
instead of being redirected immediately to Linxo Payments.

## Handoff flow

- the handoff page lives at `/contributions/[contributionId]/pay?token=...`;
- the QR code and direct payment button point to the internal redirect route
  `/contributions/[contributionId]/start-payment`;
- the internal redirect route validates the contribution-scoped payment access
  token, records that the payment link was opened, then redirects to Linxo;
- `shortAuthUrl` is preferred for the final redirect and `authUrl` is used only
  as a fallback.

## Tracking and polling

- opening the QR code route stores `paymentLinkOpenedAt` and
  `paymentLinkOpenedSource`;
- the desktop handoff page polls
  `/api/contributions/[contributionId]/payment-status?token=...`;
- polling reads the local database only;
- webhook updates and return-route sync remain responsible for refreshing local
  contribution status from Linxo;
- the desktop page can move between waiting, opened, confirmed, and failed
  states after polling or a page refresh;
- the payer can reveal the QR code again without creating a second order.

## Status note

The contribution is not confirmed when the payer opens Linxo or returns from
Linxo.

It only becomes confirmed after the local contribution status is updated to
`EXECUTED` or `COLLECTED`.

## Local development note

When a mobile device completes bank authorization, returning to a local
development URL can fail. Because of that, webhook-based synchronization
remains the source of truth for final payment state.

## Related routes

- payment handoff: `/contributions/[contributionId]/pay`
- payment redirect tracker: `/contributions/[contributionId]/start-payment`
- payment status API: `/api/contributions/[contributionId]/payment-status`
- payment return: `/contributions/[contributionId]/return`
