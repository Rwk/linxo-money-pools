# Deployment checklist

This document captures the minimum pre-deploy checklist for a Vercel-oriented
deployment of Linxo Money Pools.

## Before deployment

- Confirm the Supabase PostgreSQL database is ready.
- Confirm Prisma migrations have been applied.
- Confirm RLS is enabled on application tables.
- Confirm the Google OAuth app is configured.
- Confirm Linxo sandbox or production credentials are available.
- Confirm a webhook secret has been generated for `LINXO_WEBHOOK_SECRET`.
- Confirm no accidental `localhost`, `127.0.0.1`, or real ngrok URL is hardcoded in application code.
- Confirm `.env.example` and local docs still use placeholders only.

## Vercel setup

1. Create or import the Vercel project from the repository.
2. Add the required environment variables:

   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `NEXTAUTH_URL`
   - `LINXO_PAYMENTS_BASE_URL`
   - `LINXO_PAYMENTS_CLIENT_ID`
   - `LINXO_PAYMENTS_CLIENT_SECRET`
   - `LINXO_PAYMENTS_ENVIRONMENT`
   - `LINXO_WEBHOOK_SECRET`

3. Set `NEXTAUTH_URL` to the final public deployed URL.
4. Keep all secrets server-only. Do not use `NEXT_PUBLIC_` for secrets.
5. Run the production build:

   ```bash
   npm run build
   ```

6. Apply Prisma migrations separately from the serverless runtime unless that
   execution model is intentionally managed elsewhere.

## External configuration after deployment

### Google OAuth

Add the following authorized redirect URI on the deployed domain:

```txt
https://your-public-domain.example/api/auth/callback/google
```

### Linxo webhook

Configure the Linxo webhook callback URL manually with:

```txt
https://your-public-domain.example/api/linxo/webhooks/payments?token=<LINXO_WEBHOOK_SECRET>
```

## Notes about `NEXTAUTH_URL`

- `NEXTAUTH_URL` is used for Auth.js callback handling.
- The app also uses `NEXTAUTH_URL` when building absolute contribution return
  URLs and absolute public pool URLs.
- During local mobile or webhook testing, `NEXTAUTH_URL` may temporarily point
  to an HTTPS ngrok URL instead of `http://localhost:3000`.

## Post-deployment smoke test

1. Sign in with a `@linxo.com` account.
2. Create a pool.
3. Configure the collector account.
4. Open the public page.
5. Create a contribution.
6. Scan the QR code on mobile.
7. Complete the Linxo sandbox flow.
8. Verify the webhook updates the contribution status.
9. Close the pool.
10. Reopen the pool.
