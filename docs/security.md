# Security checklist

## Secrets and credentials

- Do not commit real secrets.
- Keep `.env.local` untracked.
- Do not expose `LINXO_PAYMENTS_CLIENT_SECRET` in the browser.
- Do not expose `LINXO_WEBHOOK_SECRET` in the browser.
- Rotate credentials immediately if they are exposed accidentally.

## Authentication and authorization

- Google sign-in is restricted to `@linxo.com`.
- Protected dashboard routes require an authenticated session.
- Pool management routes and actions are creator-only.
- Public pool pages are available only through non-guessable slugs.

## Data handling

- Do not store collector IBAN locally.
- Do not store payer bank account details.
- Do not store beneficiary KYC data locally.
- Store only the Linxo collector alias id needed for future payments.

## Database and Supabase

- RLS must stay enabled on application tables in Supabase.
- Do not use the Supabase Data API for direct browser access to application
  tables.
- Database access should stay server-side through Prisma.

## Payments and webhooks

- Linxo client credentials must remain server-only.
- Webhook calls must validate the shared `LINXO_WEBHOOK_SECRET`.
- Returning from Linxo must never be treated as proof of payment success on its
  own.
- Final contribution confirmation depends on synchronized Linxo status data.
