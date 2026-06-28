# Manual status refresh

Linxo webhooks are the preferred way to keep contribution payment statuses up to
date.

## Why this exists

Manual refresh is a creator-only operational fallback for cases where webhook
delivery is delayed, missed, or hard to observe during local or ngrok testing.

## What it does

- it is available on `/dashboard/pools/[poolId]` for the pool creator only;
- it fetches the latest Linxo order status for non-final contributions only;
- it updates local contribution payment status snapshots;
- it can refresh pending or still-in-progress contributions without creating a
  new contribution.

## What it does not do

- it does not create new Linxo orders;
- it does not retry failed payments;
- it does not mark a payment successful without Linxo status data;
- it does not expose Linxo credentials or bank account details.

## Operational note

Use this action only when a contribution looks stuck. Webhooks should remain the
normal asynchronous update path.
