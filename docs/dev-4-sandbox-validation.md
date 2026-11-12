# DEV-4 — Local Sandbox payment lifecycle

Date: 2026-11-12. **End-to-end acceptance is pending developer confirmation.**
No banking authorization, payment simulation, subscription registration or
authenticated webhook replay was initiated during this review.

## Verified

- Reviewed the current initiation, short URL fallback, return handling, webhook
  authentication, status synchronization, persistence, reconciliation and totals.
  No new implementation defect was demonstrated; no runtime code was changed
  for DEV-4. Existing DEV-3 changes were already present in the working tree.
- `NEXTAUTH_URL` is the public URL setting. The configured HTTPS origin matched
  the existing ngrok agent's advertised tunnel. Next.js at port 3000 and the
  ngrok agent at port 4040 both returned HTTP 200. The public webhook without
  a token returned HTTP 401, establishing tunnel reachability and rejection of
  unauthenticated requests, not successful Linxo delivery.
- Invoked the existing return URL builders with a fictional contribution/token:
  HTTPS origin matched configuration, the path was
  `/contributions/<id>/return`, and `pool_slug` matched the dedicated pool.
  Source review confirms order creation uses these builders. No new live order
  was created to verify its remote stored redirect during DEV-4.
- Read-only inspection of `dev-3-ete-solidaire-sandbox` found the existing
  authorized-account and alias references, two `NEW` orders, no payment statuses,
  and two `PENDING` contributions. Both public and private presenters computed
  **0.00 EUR confirmed / 0.00 EUR in progress**; the public presenter exposed zero
  contributions and the private presenter classified two as incomplete. This
  checks database/presenter output, not rendered browser views after payment.
- Relevant automated tests: **225 passed in 30 files**. Coverage includes webhook
  authentication/responses, repeated route calls, synchronization, handoff/start,
  status API, refresh action, status derivation, visibility and decimal totals.
- ESLint: **passed**. Production build: **passed**, including compilation,
  framework TypeScript check and page generation. Build verification used
  process-only synthetic auth/webhook values, a local database URL, and an
  unreachable placeholder Linxo endpoint/credentials. Production configuration
  and `.env.local` were not changed. The standalone TypeScript/full-suite
  baseline issues reported in DEV-3 were not reclassified or fixed here.

## Implementation behavior

1. Public contribution submission creates a local contribution and calls
   `POST /v1/orders` with the collector alias. It tries
   `POST /v1/orders/{orderId}/shorten` with `ask_for_alias=false`, falling back to
   the order's original authorization URL if shortening fails.
2. The contributor reaches an internal token-protected handoff page. Its QR and
   button use the application's `/start-payment` route, which records link
   opening and redirects to the stored Linxo URL. Opening a link does not mark a
   payment successful.
3. The return page calls `syncContributionStatusForReturn`, uses the database's
   pool slug for its return link and sets `returnedAt` on successful synchronization.
   It does not infer success from the browser returning or the query's pool slug.
4. Linxo sends a **GET** callback to
   `/api/linxo/webhooks/payments?token=<secret>&resource_type=orders&resource_id=<order-id>`.
   Authentication is the existing query secret compared with `timingSafeEqual`;
   there is **no HMAC/body signature** in this implementation. Validation is
   unchanged. Unknown resource types are ignored.
5. The webhook looks up the local contribution by order reference, calls
   `GET /v1/running/orders/{orderId}` with configured credentials, reads the first
   instruction/payment, and updates the existing contribution's status snapshot.
   It does not trust event-supplied payment statuses or increment a stored total.
6. Sequential duplicate callbacks fetch the current order again and update the
   same row. This design avoids additive duplicate counting. Existing route
   tests mock synchronization; they do not prove database replay behavior or
   concurrent exactly-once processing. Live replay remains pending.
7. The return page and owner's **Synchronisation manuelle** action already
   reconcile status with Linxo. The owner action skips terminal contributions
   and revalidates public/private paths. The handoff's three-second polling reads
   only local state; it is not a Linxo reconciliation loop. No background job is
   introduced. Webhook completion does not push new HTML to already-open pool
   pages; reload those views.

| Linxo state                | Local cash-in state | Expected public/private totals and visibility                                        |
| -------------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `NEW`, no payment          | `PENDING`           | No confirmed/in-progress amount; private incomplete entry only                       |
| `AUTHORIZED` / `SUBMITTED` | `PENDING`           | Visible in progress; amount contributes to in-progress total                         |
| `CLOSED` / `EXECUTED`      | `EXECUTED`          | Visible confirmed; amount contributes once to confirmed total                        |
| `REJECTED` or `FAILED`     | `REJECTED`          | Excluded from public list and confirmed/in-progress totals; private incomplete entry |
| `EXPIRED`                  | `EXPIRED`           | Excluded from public list and confirmed/in-progress totals; private incomplete entry |
| `CLOSED` / `CANCELLED`     | `CANCELLED`         | Excluded from public list and confirmed/in-progress totals; private incomplete entry |

An existing settled/manually-settled local settlement status takes precedence
and maps to `COLLECTED`, also counted as confirmed. This webhook handles orders
only and does not retrieve settlement updates. Ordinary payment execution does
not require a `COLLECTED` result.

## Manual acceptance procedure

Use fictional contributor details and only the confirmed Sandbox client/account.
Do not reconfigure the collector or alter unrelated pools.

1. Follow [local ngrok and webhook setup](./local-development.md#sandbox-callbacks-through-the-existing-ngrok-tunnel-dev-4).
   Set `NEXTAUTH_URL` manually to the current tunnel HTTPS origin and restart
   Next.js. The complete callback URL is that same origin followed by
   `/api/linxo/webhooks/payments?token=<URL-encoded-LINXO_WEBHOOK_SECRET>`.
   Register it for this Sandbox client with `POST /v1/subscribe` using the
   documented manual command (expect HTTP 201), or the existing Linxo-managed
   registration process. No fixed ngrok domain is committed. Confirm registration
   before the banking simulation. Keep the real callback URL private.
2. Sign in as the developer through the HTTPS origin. In the dashboard, open
   **DEV-3 — Été solidaire 🧪💶** and note the private totals. Keep the dashboard
   in a separate tab. Open `/p/dev-3-ete-solidaire-sandbox` through the HTTPS
   origin in a separate contributor/private browsing session. Initially the
   confirmed/in-progress totals should each be 0.00 EUR if no intervening tests
   have changed the baseline.
3. Submit one **new EUR 1.00** contribution with fictional names and a reserved
   example email, leaving anonymity/hidden amount off for easy comparison. On the
   handoff page note the local contribution ID privately. In safe structured logs,
   expect `createOrder` HTTP 201 and `shortenOrderAuthUrl` HTTP 200 (or a working
   original URL fallback). Before authorization, confirmed/in-progress totals
   remain unchanged. Do not use the two existing DEV-3 orders: their redirects
   were fixed at creation and may reference an earlier origin.
4. **Manually** press the payment button or scan the QR. Select a bank on Linxo's
   Sandbox screen. In the simulator choose **EXECUTED** for immediate success,
   or **AUTHORIZED then EXECUTED (with delay)** to inspect the intermediate state
   and the later webhook transition (documented delay approximately two minutes).
   `AUTHORIZED` alone is not final success.
5. Confirm that the browser returns to the current HTTPS origin at
   `/contributions/<the-new-id>/return`, displaying the correct pool. Follow its
   pool link and verify `/p/dev-3-ete-solidaire-sandbox`. Never paste the full
   token-bearing return URL into the report.
6. Independently inspect the existing ngrok request history. Find a genuine
   **GET** to `/api/linxo/webhooks/payments` with `resource_type=orders` for this
   order; check privately that it is the right order. Expect HTTP 204 and a
   successful application `getRunningOrder` event. Record time, method, path
   **without query**, HTTP status and the Linxo outbound request ID. A successful
   return-page refresh or owner reconciliation without this callback does not
   pass webhook acceptance. For a delayed scenario, inspect the final callback
   and database state without triggering a return-page reload or owner refresh
   first, to isolate the webhook's update.
7. Run the read-only query below. For immediate/final execution expect
   `linxoOrderStatus=CLOSED`, `linxoPaymentStatus=EXECUTED`, and
   `cashInStatus=EXECUTED`. For delayed authorization the interim state is
   `AUTHORIZED/SUBMITTED/PENDING`. Confirm the new row is the same contribution,
   not a second row. Inspect only safe metadata.
8. Reload the public pool and private dashboard. After execution, confirmed
   totals increase by exactly **1.00 EUR**, in-progress returns to baseline,
   and the new contribution appears confirmed on both views. The two old `NEW`
   contributions remain private/incomplete. During delayed authorization only,
   the new EUR 1.00 belongs to in-progress, not confirmed.
9. In the existing ngrok inspector, replay the **genuine captured order webhook**
   once, preserving its token and parameters locally. Do not replay the payment
   initiation or banking authorization. Expect another HTTP 204; run the query
   again and reload both views. Contribution count, statuses and confirmed total
   must remain unchanged. Another snapshot write/`updatedAt` change is acceptable;
   another contribution or an extra EUR 1.00 is a failure. If replay is unavailable
   in the existing inspector, leave this check pending rather than claiming it
   passed. [ngrok's dashboard replay](https://ngrok.com/docs/obs/traffic-inspection/http-requests#replay)
   requires captured requests; do not install or change tunnel infrastructure.
10. Record the manual results below. Only then mark end-to-end acceptance passed.

From the repository root, this read-only local query shows statuses and amounts
for the dedicated pool without tokens, payment URLs, names, email or bank data:

```bash
docker compose exec -T postgres psql -U linxo_dev -d linxo_money_pools_dev <<'SQL'
SELECT c.id, c.amount, c."linxoOrderStatus", c."linxoPaymentStatus",
       c."cashInStatus", (c."returnedAt" IS NOT NULL) AS returned
FROM "Contribution" c
JOIN "Pool" p ON p.id = c."poolId"
WHERE p.slug = 'dev-3-ete-solidaire-sandbox'
ORDER BY c."createdAt";
SQL
```

### Optional negative acceptance

Create a separate EUR 1.00 fictional contribution and manually choose
**REJECTED**, **FAILED** or **EXPIRED** in the bank simulator. Verify the matching
local terminal state from the table, an incomplete private entry, no public
entry, and no increase in confirmed/in-progress totals. Browser tab closure
alone does not prove cancellation. Test `CANCELLED` only if an actual Sandbox
action produces that state; no automatic close/cancel API call is part of this
procedure.

## Pending manual verification

| Acceptance step                                           | Result / safe evidence to record                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| Sandbox subscription registered for current tunnel/client | Pending — subscription HTTP status/request ID                      |
| New public contribution and its remote redirect           | Pending — creation status/request ID; origin/path checks only      |
| Bank selection and successful simulation                  | Pending — selected simulator outcome, no bank data                 |
| Return to correct origin and pool                         | Pending — path/pool match, no query tokens                         |
| Genuine webhook received and acknowledged                 | Pending — time, method, path, status and outbound Linxo request ID |
| Final statuses persisted in PostgreSQL                    | Pending — order/payment/cash-in status                             |
| Public and private rendered totals updated once           | Pending — before/after totals and visible/incomplete counts        |
| Genuine webhook replay without duplicate counting         | Pending — second status, unchanged counts/totals                   |
| Optional refusal/expiration scenario                      | Not run                                                            |

## Blocked

No current infrastructure or implementation blocker was demonstrated: the
tunnel and app are reachable, and automated checks/build pass. Final DEV-4
sign-off is gated on the developer's manual bank simulation and genuine webhook
evidence. Sandbox subscription registration has not been inspected or changed;
if it is absent or delivery does not occur, step 6 remains blocked until that
configuration/delivery issue is resolved.

For failures, identify the first failing step before changing code. Use existing
`linxo.api.request` logs: operation, endpoint template, HTTP status, safe error
code and request ID. Webhook 401/400 responses occur before an outbound Linxo
request and may have no Linxo request ID; report it as unavailable. A 204 also
acknowledges unknown local orders, so check for `local_order_not_found`. Keep
ngrok's full URLs, query values, bodies and arbitrary exception text private.

Contract sources: [Linxo Payments reference](https://developers.linxo.com/payments/reference-direct-payment-api/)
(`POST /v1/subscribe`, GET callbacks, running order lookup and Sandbox simulator
outcomes) and the existing implementation. No schema, authentication, webhook
validation or production configuration was changed. No push, deployment or tag
is part of DEV-4.
