# Authentication

Production uses Auth.js with Google OAuth and Prisma-backed database sessions.
Local development can opt into the development provider described below.

## Access model

- Production sign-in requires a valid `@linxo.com` Google account.
- Contributors do not need an account to open a public pool link and start a
  contribution.
- Protected dashboard routes require a valid employee session.
- Pool management is creator-only.

## Environment variables

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_URL`

These values are server-side secrets or server-side configuration and must not
be exposed to the browser.

`NEXTAUTH_URL` must match the current public base URL used by the app. For
local-only browser testing it can stay on `http://localhost:3000`. For mobile
flows, webhook testing, or deployment, it must point to an HTTPS public domain.

## Google OAuth setup

1. Create a Google OAuth web application.
2. Add the local callback URL:

   ```txt
   http://localhost:3000/api/auth/callback/google
   ```

3. Add the public callback URL for ngrok or the deployed environment:

   ```txt
   https://your-public-domain.example/api/auth/callback/google
   ```

4. Store the client ID and secret in `.env.local`.
5. Keep the Google OAuth callback domain aligned with `NEXTAUTH_URL`.

## Notes

- Production Auth.js sessions are stored in PostgreSQL through Prisma.
- Sign-in denial for non-`@linxo.com` accounts is enforced server-side.
- The public home page and pool pages stay accessible without authentication.

## Local development authentication (DEV-2)

In `.env.local`, set `ENABLE_DEV_AUTH=true` and a local `AUTH_SECRET`. Restart
`npm run dev`, open `/` or `/sign-in` and click **Connexion développeur**. Google
OAuth credentials are unnecessary in this mode and can be omitted. The usual
**Se déconnecter** button signs out through Auth.js.

The Credentials provider is registered only when `NODE_ENV=development`, the flag
is exactly `true`, and the process is not on Vercel. It accepts no identity
fields: the server retrieves or creates `dev@linxo.com` in the local database,
with ID `local-development-user` on first creation. Subsequent sign-ins retrieve
the same user. Existing records for that email retain their ID; no other users
are modified. A loopback database guard runs before any identity write.

Auth.js Credentials uses JWT sessions, so **only the enabled development mode**
switches Auth.js to JWT strategy. The same session callback exposes the persisted
user ID, email and name. Production and disabled development mode retain the
existing Google/database-session configuration. No custom cookies or parallel
session implementation are introduced. Changing the flag changes session
strategy; sign out first, restart and sign in again after a mode change.

Dashboard authorization, creator ownership checks and the existing server-side
Linxo collector `user_reference = user.id` derivation remain unchanged. No alias
listing or reuse is added; the provider grants no access to another user's pools
or collector resources.

Set `ENABLE_DEV_AUTH=false` (or remove it) and restart to disable the provider and
restore the Google sign-in interface. `ENABLE_DEV_AUTH=true` has no effect in
production, test mode or Vercel. `AUTH_SECRET` remains required by Auth.js in every
mode; never expose it to the browser.

**When ngrok is public, this passwordless button grants anyone who can reach the
local app access to the shared local test account.** Use fake local data and
Sandbox payment credentials only. This mode must never use production data or
payment credentials. No additional origin restriction or ngrok setup is required.

See [local configuration](./local-development.md#application-environment).
