# Contributions

Public visitors can contribute to an open money pool through its private share
link.

## Flow

1. The visitor opens the public pool page.
2. The app validates the contribution form server-side.
3. The app creates a local pending contribution.
4. The app creates a Linxo Payments order.
5. The app shortens the order authorization URL with `ask_for_alias=false`.
6. The visitor is sent to the internal payment handoff page.
7. The visitor continues to Linxo Payments and then to their bank.

## Stored data

The app stores:

- participant first name
- participant last name
- participant email
- contribution amount
- selected payment method
- public display preferences
- Linxo order identifiers and redirect URLs

The app does not store:

- payer IBAN
- beneficiary IBAN locally
- beneficiary KYC data locally

## Notes

- The app uses `short_auth_url` for payer links when available.
- The payer is sent to an internal handoff page before Linxo authorization. See [Payment handoff](./payment-handoff.md).
- Contribution status is not final when the visitor returns from Linxo.
- Verified contributions are sent directly to the collector account.
- Beneficiary setup is alias-based: future orders use the collector `alias_id`.
- Contribution status rules and visibility are documented in [Contribution statuses](./contribution-statuses.md).
