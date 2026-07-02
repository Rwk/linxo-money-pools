# Demo guide

This guide walks through a realistic MVP demo of Linxo Money Pools.

## Before you start

- Sandbox Linxo Payments credentials are required.
- The product UI is in French.
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
LINXO_PAYMENTS_BASE_URL="https://payments-api.example"
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
2. Open the redesigned dashboard and confirm the existing pool list loads.
3. Create a new pool.
4. Confirm the pool management cockpit opens and that collector account setup is visible near the top.
5. Configure the collector account from the pool management page.
   For test environments, use the Authorized Account request samples documented
   in [Linxo Payments integration](./linxo-payments.md). The Linxo documentation
   explicitly expects those samples in Sandbox Mode.
6. Copy the public link from the dashboard or management page, then open the public page.
7. Submit a contribution.
8. Open the payment handoff page.
9. Scan the QR code from a mobile device or continue on the desktop flow.
10. Confirm that, once a payment link has been opened, payment actions are hidden until the user explicitly reopens them.
11. Complete or simulate the bank authorization flow.
12. Verify the contribution return page and public/private statuses.
13. Confirm webhook-based synchronization updates the contribution.
14. If needed, use manual refresh from the management action area as a fallback.
15. Close the pool and confirm the public page remains visible but cannot
    accept new contributions.
16. Reopen the pool and confirm contributions are available again when the
    collector account and closing date are valid.

## Manual verification checklist

- Sign-in works
- Dashboard loads
- Pool list loads
- Pool management cockpit loads
- Inline pool editing works
- Copy public link button works
- Public pool page loads
- Contribution handoff page works
- Manual refresh works as a fallback
- Close / reopen works
- Closed pools reject new contributions
- No documentation contains local absolute paths
- No documentation contains real secrets
