# Pool management

Pool creators can manage their own money pools from the private dashboard page at `/dashboard/pools/[poolId]`.

## Editable fields

Creators can update these fields:

* title
* description
* event type
* closing date

Editing keeps the pool slug, collector account configuration, contributions, Linxo orders, and payment statuses unchanged.

## Closing and reopening

Creators can close or reopen their own pools.

Closing a pool:

* prevents new contributions on the public page
* keeps the public page visible
* keeps existing public-visible contributions visible
* does not cancel existing bank transfers
* does not cancel existing Linxo orders

Reopening a pool:

* sets the pool back to open
* allows contributions again when the collector account is configured
* requires a valid closing date that is today or in the future

If the closing date is already in the past, update it before reopening the pool.

## Out of scope

This management step does not include:

* changing the collector account or alias
* refunds
* contribution retry
* deleting pools
* final transfer management
* image upload
* objective amount or progress gauge

## Related documentation

* [Pool creation and sharing](./pools.md)
* [Contributions](./contributions.md)
* [Linxo payments](./linxo-payments.md)
* [Manual payment status refresh](./manual-status-refresh.md)
