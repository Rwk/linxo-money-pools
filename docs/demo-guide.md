# Demo guide

This guide walks through a realistic MVP demo of Linxo Money Pools.

## Before you start

- Sandbox Linxo Payments credentials are required.
- A public HTTPS URL is required for mobile return-flow testing and webhook
  delivery.
- `localhost` is not enough for mobile bank authorization return or Linxo
  webhooks.

Use ngrok or a deployed HTTPS environment.

## Configure environment variables

Create `.env.local` with placeholder names only:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
AUTH_SECRET="replace-with-a-random-secret"
AUTH_GOOGLE_ID="replace-with-google-client-id"
AUTH_GOOGLE_SECRET="replace-with-google-client-secret"
NEXTAUTH_URL="https://your-public-domain.example"
LINXO_PAYMENTS_BASE_URL="https://payments-sandbox.example"
LINXO_PAYMENTS_CLIENT_ID="replace-with-linxo-client-id"
LINXO_PAYMENTS_CLIENT_SECRET="replace-with-linxo-client-secret"
LINXO_PAYMENTS_ENVIRONMENT="sandbox"
LINXO_WEBHOOK_SECRET="replace-with-a-shared-secret"
```

Generate Prisma and start the app:

```bash
npm run db:generate
npm run db:migrate:dev
npm run dev
```

## Expose the app

Example with ngrok:

```bash
ngrok http 3000
```

Use the generated HTTPS URL as:

- `NEXTAUTH_URL`
- the Google OAuth callback base URL
- the Linxo webhook base URL

Restart the app after changing `.env.local`.

## Configure Google OAuth

Add this callback URL in Google Cloud:

```txt
https://your-public-domain.example/api/auth/callback/google
```

## Configure the Linxo webhook

Register the webhook manually in Linxo Payments with:

```txt
https://your-public-domain.example/api/linxo/webhooks/payments?token=<LINXO_WEBHOOK_SECRET>
```

## Demo flow

1. Sign in with a `@linxo.com` Google account.
2. Open the dashboard and confirm the existing pool list loads.
3. Create a new pool.
4. Configure the collector account from the pool management page.
5. Open the public page from its private link.
6. Submit a contribution.
7. Open the payment handoff page.
8. Scan the QR code from a mobile device or continue on the desktop flow.
9. Complete or simulate the bank authorization flow.
10. Verify the contribution return page and public/private statuses.
11. Confirm webhook-based synchronization updates the contribution.
12. If needed, use manual refresh from the dashboard.
13. Close the pool and confirm the public page remains visible but cannot
    accept new contributions.
14. Reopen the pool and confirm contributions are available again when the
    collector account and closing date are valid.

## Manual verification checklist

- Sign-in works
- Dashboard loads
- Pool list loads
- Public pool page loads
- Contribution handoff page works
- Manual refresh works
- Close / reopen works
- No documentation contains local absolute paths
- No documentation contains real secrets
