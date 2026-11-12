# Contribution amount privacy

## Rules and implementation

The stored `Contribution.hideAmount` flag controls amount visibility;
`displayAsAnonymous` independently controls the existing public name display.
No data, flags, payment amounts or payment processing are changed by this work.

Confirmed means `cashInStatus=EXECUTED` or `COLLECTED`, as before. The domain
`computePoolAmountVisibility` separates public totals from complete private
totals and indicates whether hidden confirmed contributions exist. Money is
summed in integer cents and formatted with two decimal places, using the existing
decimal conversion at the boundary. Persistence remains Prisma Decimal.

- Public confirmed amounts include only confirmed contributions with
  `hideAmount=false`. Public in-progress amounts likewise exclude hidden amounts.
  Pending/new and rejected contributions never become confirmed amounts.
- Owner dashboard cards and management views include all confirmed amounts,
  including hidden amounts; all owner rows retain their recorded names and amounts.
- Public lists retain the existing confirmed/in-progress rows. Hidden amounts
  display **Montant masqué**, with names still controlled by the existing
  anonymity preference. The requirement to conceal the count of hidden rows was
  explicitly withdrawn. A generic French notice accompanies the public totals
  when hidden confirmed contributions exist.

Previously the shared public/private presenter summed hidden amounts into both
public confirmed and in-progress totals. Subtracting public rows could disclose
hidden amounts. Public presenters now select only public aggregates and safe
row labels; no complete total or hidden monetary sum is serialized there.

## Response and access boundaries

- `/p/[slug]` renders a public view model. The contribution form receives only
  the pool slug and collector display name, not database contribution records.
- Token-protected `/contributions/[id]/pay` passes a sanitized handoff view model
  to its client component. The payment-status API also masks hidden amounts and
  uses the existing name rules; no/mismatched access token returns 404.
- The return page keeps the synchronization result server-side and renders
  status copy and pool links without monetary details.
- Dashboard queries use the authenticated user's identity. The owner detail page
  requires a session and checks pool ownership before rendering private data.
- No pool goal, percentage, remaining-to-goal or monetary progress bar currently
  exists. Public monetary summaries now use only visible amounts. Future derived
  indicators must use the same public aggregates.

Private amounts remain in the owner response, local database and payment-provider
requests as required for payment processing. Contributors also know the values
they submit. These are intentional authorized uses. User-authored descriptions
or names could themselves contain amounts; automatic redaction of free text is
outside this scope. No other automatic public monetary disclosure was found in
the reviewed routes, presenters and client props. Countable hidden rows remain
intentional under the clarified rule.

## Regression verification

Coverage exercises empty/public-only/hidden-only/mixed confirmed totals, pending
and rejected states, integer-cent arithmetic, masked rows and unchanged name
rules, complete owner details, anonymous/non-owner refusal, rendered public
responses, client handoff and payment-status JSON. Changing hidden amounts while
keeping all other fields constant must leave the entire public view model
unchanged. Automated tests use fictional fixtures and create no Linxo orders.

Verification on 2026-11-12:

- Focused domain totals, public/owner response boundaries and status API:
  **27 tests passed**.
- Full Vitest suite: **334 passed, 4 failed, 1 skipped**. The four failures are
  the pre-existing July 2026 date-dependent pool create/update/reopen action
  tests. They are outside the amount-privacy change.
- ESLint and production build: **passed**. The build used process-only synthetic
  secrets and a nonfunctional Linxo endpoint, without changing `.env.local`.
- `tsc --noEmit --incremental false`: the **eight known fixture errors** remain:
  three Decimal stubs in payment-handoff presenter tests, three missing lookup
  dependencies in status synchronization tests, and two incomplete pool detail
  view models. No errors were reported in this change's implementation or tests.

## Manual acceptance in local Sandbox

Not performed by the agent. Use the accepted local setup and a dedicated Sandbox
pool/collector; only the developer performs banking simulations.

1. Note the public and owner baselines. Open the public pool signed out and the
   owner dashboard signed in, including at a mobile viewport.
2. Manually create a fictional public EUR 2.10 contribution and complete Sandbox
   execution. After synchronization, both confirmed totals increase by EUR 2.10.
3. Create and execute a fictional EUR 7.35 contribution with **Montant masqué**
   selected. Keep name anonymity off. The public row retains its recorded name
   and masked amount; public monetary totals stay unchanged. The owner total
   increases by EUR 7.35 and its row shows the amount and recorded name.
4. Repeat with the existing anonymous-name preference enabled: the public name
   is anonymous as before; the owner still sees the recorded name and amount.
5. For a hidden authorized/submitted contribution, public in-progress money must
   remain unchanged; the owner sees its complete in-progress amount. A separate
   rejected hidden contribution must not increase any confirmed total and remains
   private/incomplete under the existing status visibility rules.
6. In browser page source/RSC responses and handoff/status JSON, verify the hidden
   amounts, their sum and the complete owner total are absent. Do not copy actual
   tokens or payment URLs into reports. Check the generic notice, public monetary
   headings and owner complete-total heading on mobile and desktop.
7. Signed-out dashboard access must require sign-in; another user must not obtain
   this pool's owner details. Recheck the owner total and recorded names after
   reload. No webhook, provider, schema or authentication changes are needed.
