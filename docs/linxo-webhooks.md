# Linxo Payments webhooks

The application does not register Linxo webhooks dynamically.

Webhook registration must be done manually in Linxo Payments with a callback URL
that includes the shared secret token:

```txt
https://your-public-app-domain.example/api/linxo/webhooks/payments?token=<LINXO_WEBHOOK_SECRET>
```

## Incoming callback shape

Linxo calls the callback URL with query parameters such as:

- `resource_type`
- `resource_id`

For this MVP step, the app only handles `resource_type=orders`.

## Processing model

The webhook callback does not directly contain final payment details.

When the app receives an order update webhook:

1. it validates the `token` query parameter against `LINXO_WEBHOOK_SECRET`;
2. it finds the local contribution by `linxoOrderId`;
3. it fetches the latest running order from Linxo Payments;
4. it updates local raw order and payment statuses;
5. it derives the app-level `cashInStatus`.

This keeps webhook synchronization aligned with the return-page synchronization.

## Configuration

- `LINXO_WEBHOOK_SECRET` must be configured as a server-side environment variable.
- Do not expose it with a `NEXT_PUBLIC_` prefix.
- Do not commit the real secret.

## Deployment note

Localhost cannot receive Linxo webhooks directly. Use a public HTTPS deployment
or a tunnel such as ngrok when testing webhook delivery.

## Scope notes

- Settlement webhooks are intentionally out of scope for now.
- Polling may be added later as a fallback.
- Dynamic webhook subscribe and unsubscribe flows are intentionally out of scope.
