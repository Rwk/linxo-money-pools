# Authentication

The application uses Auth.js with Google OAuth and Prisma-backed sessions.

## Access model

- Only users with a valid `@linxo.com` Google account can sign in.
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

- Auth.js sessions are stored in PostgreSQL through Prisma.
- Sign-in denial for non-`@linxo.com` accounts is enforced server-side.
- The public home page and pool pages stay accessible without authentication.
