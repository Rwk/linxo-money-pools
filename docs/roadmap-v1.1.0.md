# v1.1.0 product roadmap

## Release objectives

Linxo Money Pools is a production application used by Linxo employees and the
CSE to collect real payments. The isolated local development environment is
accepted and its prerequisite workstream is closed; functional work can resume
in the priority order below.

- **v1.0.0** is the production baseline at commit
  `73495310146ec82d6c4a0de3879a411f6acfc527` (verified against the existing tag).
- **v1.1.0** is the upcoming release covering P0, P1 and P2 below.
- **P3 is excluded** from v1.1.0.
- Create the final `v1.1.0` tag only after validation of the complete release.

This roadmap records future requirements. Existing behavior is described in
[Pool scope](./pools.md), [Pool management](./pool-management.md),
[Contributions](./contributions.md) and
[Contribution statuses](./contribution-statuses.md).

## Implementation status

Snapshot: 2026-11-12. The local environment was reviewed on `master`, initially
at `5d99aa5a88acc49e60b8a0349c44a62e9326a0a0`. The previously uncommitted DEV-3
beneficiary correction and its tests are now committed separately as `63a47fe`
(`fix: sanitize Linxo beneficiary complementary names`). Git history and source
establish implementation status; manual acceptance and deployment statements
below come from the developer's operational reports, not Git alone. Local
acceptance does not establish production deployment of the correction.

| Status      | Meaning                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| Planned     | Agreed work with no verified implementation.                              |
| In progress | Work has started but is incomplete.                                       |
| Implemented | Code exists; acceptance is not implied.                                   |
| Deployed    | Reported as running in production; acceptance is not implied.             |
| Validated   | Relevant automated checks and targeted end-to-end acceptance have passed. |
| Blocked     | An identified dependency prevents progress; name the dependency.          |

No milestone is marked in progress or validated without evidence. DEV-1 through
DEV-4 are accepted on the automated and developer-reported evidence below;
functional product requirements and their priorities remain unchanged.

| Work                                 | Known status and evidence                                                                                                                                                                                                                                                     | Remaining work                                                                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment label sanitization           | **Implemented, deployed**: `d37253b`. Contract tests pass; the developer confirmed Sandbox orders for pool titles containing accents/emojis and successful browser payment simulation.                                                                                        | Local Sandbox acceptance is recorded in DEV-3/DEV-4. Historical production failures remain unattributed; local acceptance does not establish their resolution. |
| Linxo API observability              | **Implemented, deployed**: `0f295cd`. Structured, privacy-conscious logging supports `LINXO_API_LOG_LEVEL=off\|error\|info`; disabled by default on Vercel.                                                                                                                   | Use safe diagnostics during investigation; deployment alone does not validate payments. See [API observability](./linxo-payments.md#api-observability).        |
| Beneficiary complementary name       | **Implemented, locally validated**: `63a47fe`. The order builder normalizes this field to the documented character set and 140-character limit, with a nonempty fallback. DEV-3 checked serialized JSON and successful Sandbox order creation; focused regression tests pass. | Production deployment is unverified. Do not infer that this correction caused or resolved historical production failures.                                      |
| Collector account reuse              | **Manually accepted in the DESIGN-6 request.** New pools can select an owner-scoped, provenance-bound alias/account pair or use the existing new-collector path. See [collector reuse](./collector-account-reuse.md).                                                    | Legacy references without provenance/entity type remain excluded. No production deployment is implied.                |
| Pool lifecycle P1-A | **Implemented locally**, including permanent archive, atomic contribution acceptance and PostgreSQL concurrency tests. See [lifecycle verification](./pool-lifecycle.md). | P1-A/P1-B manually accepted in the DESIGN-6 request; no production deployment is implied. |
| Favorite payment providers P2 | **Manually accepted in the DESIGN-6 request.** Approved historical-usage BIC list is applied to authorization preferences and shortening. | Acceptance is developer-reported; see [payment preferences](./linxo-payments.md#favorite-payment-providers). |
| DESIGN-1 — Visual identity and shared UI | **Accepted by the developer**, including exclusive sign-in and compact mobile navigation. Central tokens, shared controls/statuses and session-aware global navigation; see [design reference](./design-system.md). | DESIGN-2 through DESIGN-5 accepted; DESIGN-6 implemented, final acceptance pending. |
| DESIGN-2 — Homepage and public FAQ | **Accepted by the developer.** Session-aware hero, original SVG occasion artwork and 19 questions across five FAQ themes. | Acceptance reported by the developer; see [design reference](./design-system.md#design-2--homepage-faq-and-event-artwork). |
| DESIGN-3 — Compact owner dashboard | **Accepted by the developer.** Dense rows, event motifs, owner amounts in French euros, compact tabs/counts and exact public-link copying. | Acceptance reported in the DESIGN-4 request; see [dashboard conventions](./design-system.md#design-3--compact-owner-dashboard). |
| DESIGN-4 — Pool creation and owner management | **Accepted by the developer**, including `4e313bc` consolidated actions. Optional descriptions, compact primary/lifecycle actions, full-width missing collector setup and preserved owner totals/history. | Acceptance reported in the DESIGN-5 request; see [owner conventions](./design-system.md#design-4--pool-creation-and-owner-management). |
| DESIGN-5 — Public pool and contribution UX | **Manually accepted by the developer** in the DESIGN-6 request. Public event header, compact form/history, natural payment CTA and clearer status feedback. | See [public conventions](./design-system.md#design-5--public-pool-and-contribution-experience). No production deployment is implied. |
| v1.1.0 functional improvements | **Implemented and manually accepted**, as confirmed in the DESIGN-6 request: amount privacy, collector reuse, fixed contributions/price editing, lifecycle/archive and favorite providers. | Release preparation is a separate task; production state is not verified by this UI pass. |
| DESIGN-6 — Final interface polish | **Manually accepted in the RELEASE-1 request.** Long owner content wraps, amount/status columns remain readable, owner/sign-in errors are announced, pending copy is simpler. | Acceptance is developer-reported; see [RELEASE-1 procedure](./release-v1.1.0-deployment.md). No v1.1.0 release/tag/deployment or production migration has been performed. |
| Safe local development               | **Accepted; workstream closed**. DEV-1 through DEV-4 were implemented and manually accepted by the developer. See the acceptance record below.                                                                                                                                | Delayed authorization-to-execution transition remains an observation with an unconfirmed cause; it does not block acceptance of the environment.               |

## Prioritized milestones

| Priority     | Milestone                                                     | Release gate                                                                                              |
| ------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Prerequisite | Isolated local development                                    | Fake-data development and payment testing without production resources.                                   |
| P0           | Payment label compatibility and complementary name correction | Contract tests plus conclusive sandbox payment acceptance; investigate observed failures.                 |
| P0           | Public/private contribution amounts                           | Privacy holds across public pages, API responses and progress indicators; private totals remain complete. |
| P1           | Collector account reuse                                       | Only the authenticated user's authorized Linxo resources can be selected.                                 |
| P1           | Fixed-price contributions                                     | Server-enforced quantity and integer-cent calculation preserve existing payment behavior.                 |
| P1           | Pool organization and archiving                               | Permanent owner-only archiving (P1-A) and three-tab owner UI (P1-B), manually accepted in the DESIGN-6 request.                                    |
| P2           | Favorite payment providers                                    | Approved historical-usage BIC configuration; full bank list remains accessible; manually accepted in the DESIGN-6 request.                                      |
| P2           | Dashboard redesign                                            | Desktop/mobile acceptance, coordinated with the three-tab organization.                                   |

## Product requirements

### P0 — Reliability and privacy

**Payment label compatibility:** preserve original pool titles for display while
producing contract-compliant banking labels at the server boundary. Complete
acceptance of the existing sanitization and address complementary name validation
as a separate contract issue.

**Public/private contribution amounts:**

- The public confirmed total includes only confirmed contributions whose amounts
  are public. Public in-progress amounts also exclude hidden amounts. A generic
  French notice explains that hidden amounts are excluded when applicable.
- Business decision: this is amount privacy, not contribution anonymity. Keep
  the existing public rows, contributor-name visibility rules and "Montant masqué"
  labels. The earlier requirement to conceal the number of hidden contributions
  is withdrawn; their rows remain countable. Do not expose their monetary sum.
- Public pages, all public API responses and progress indicators must never
  disclose hidden amounts or data allowing their reconstruction, including
  through aggregate totals or differences between exposed values.
- The private management page displays the full confirmed total. The owner sees
  every contribution, its recorded contributor identity and its amount,
  regardless of public visibility settings.
- Preserve existing payment status and confirmed amount rules: confirmed totals
  include `EXECUTED` and `COLLECTED`, as described in
  [Contribution statuses](./contribution-statuses.md). Visibility changes must
  not alter payment state or make incomplete payments count as confirmed.

The public/private calculation and regression coverage are implemented locally;
see [amount privacy and manual acceptance](./contribution-amount-privacy.md).
Production deployment and manual acceptance of this P0 change remain unverified.

### P1 — Functional improvements

**Collector account reuse:** let the creator select an existing collector account
or configure a new one.

- Restrict alias retrieval to the authenticated user's Linxo `user_reference`,
  derived server-side. Never trust a client-provided user reference or alias ID
  without authorization checks; never expose another user's accounts.
- Investigate the distinction between Linxo aliases and authorized accounts and
  verify resource accessibility under the effective Linxo credentials.
- Reuse existing Linxo resources where possible. Keep IBANs and collector KYC
  data out of local storage. Build on the
  [current integration](./linxo-payments.md#collector-account-setup).

**Fixed-price contributions:** provide two mutually exclusive modes: free amount
(existing behavior) or a creator-configured fixed unit price.

- In fixed-price mode, the public contributor selects quantity **1–10**, default
  **1**. Total amount equals unit price multiplied by quantity; the contributor
  cannot override the calculated amount.
- Calculate and validate quantities and amounts server-side using integer cents.
  Preserve existing contribution and payment compatibility, including conversion
  at persistence/API boundaries: current
  [database conventions](./database.md#data-handling-constraints) store decimal
  amounts. This requirement does not imply a destructive storage migration.

The original fixed-price contribution flow is **manually accepted in Sandbox**.
The owner detail/price-edit follow-up is **implemented locally; manual acceptance
pending**. FREE remains the historical/default mode. Mode is immutable; a FIXED
unit price can be edited only before any contribution of any status exists.
Price changes and contribution insertion share a PostgreSQL row lock, and stale
public price displays are rejected before payment initiation. See [fixed contributions](./fixed-contributions.md)
for server enforcement, privacy, validation and acceptance. Its additive Prisma
migration must be applied to Supabase Production during the future v1.1.0
deployment before the new application code serves traffic; no production
migration or deployment has been performed.

**Pool organization and archiving:** organize the private dashboard into:

| Tab         | Membership                                          |
| ----------- | --------------------------------------------------- |
| In progress | Not manually closed, not expired, and not archived. |
| Completed   | Manually closed or expired, and not archived.       |
| Archived    | Explicitly archived by the owner.                   |

**P1-A implemented and manually accepted in the DESIGN-6 request:** archiving is an explicit, permanent owner action,
allowed only for completed pools. Archived pools cannot be unarchived, reopened,
edited or accept new contributions; their history remains readable to the owner.
Reopening an expired pool (including one still persisted as `OPEN`) requires an
explicit valid future closing date. A manually closed pool with an unexpired date
may retain it. Effective state priority is `ARCHIVED > COMPLETED > ACTIVE`.

Atomic PostgreSQL contribution acceptance while effectively ACTIVE is the payment
cutoff. An already accepted contribution may finish Linxo order initialization
after closure or archive. Existing orders, late webhooks and reconciliation remain
operational. No database lock spans a Linxo request. See [lifecycle rules and
verification](./pool-lifecycle.md).

**P1-B implemented and manually accepted in the DESIGN-6 request:** dashboard tabs
`En cours`, `Terminées`, `Archivées` use effective lifecycle classification. Cards
and detail pages share consistent status labels. Owner controls expose close,
reopen (with an explicit new date after expiry), and irreversible archive with
confirmation. Archived details/history stay readable; mutation controls are hidden
and payment reconciliation remains available. See the [UI acceptance
checklist](./pool-lifecycle.md#manual-sandbox-acceptance-checklist--pending).
This does not implement the P2 dashboard redesign.
The additive `archivedAt` migration must ship with previous pending migrations
at the future v1.1.0 production release; no production migration was applied.

### P2 — User experience

**Favorite payment providers — implemented and manually accepted in the DESIGN-6 request:**
the product-approved ten BICs, in their approved order, were selected from an
analysis of historical money pool payment orders. This decision supersedes the
former provisional bank-family shortlist. The list is centralized in
`src/infrastructure/linxo/linxo-authorization-url.ts`. Per the Linxo Payments
contract, `favorite_providers` is passed through the shortening request's
`query_params`, and added to the original authorization URL used as fallback.
It is a display preference, not a whitelist; other supported banks remain
accessible through Linxo's complete bank list. See [the selected BICs, contract,
verification and manual Sandbox checklist](./linxo-payments.md#favorite-payment-providers).
No payment payload, return route, beneficiary, amount or status was changed.

**Dashboard redesign:** improve visual hierarchy, primary actions, filter
navigation, status presentation, distinction between informational tags and
interactive controls, and desktop/mobile usability. Coordinate with the
three-tab pool organization. Reuse existing UI components and centralized
French translations; previous dashboard redesigns do not fulfill this new scope
by themselves.

## Visual redesign sequence

The developer reports the functional v1.1.0 work manually validated in the local
Sandbox environment. The visual redesign proceeds separately, without changing
payment, authentication, privacy or lifecycle contracts:

| Milestone | Scope | Status |
| --- | --- | --- |
| DESIGN-1 | Identity, tokens, shared controls and global navigation | Accepted by the developer, including the sign-in/mobile follow-up. |
| DESIGN-2 | Homepage and FAQ | Accepted by the developer. Public `/faq` linked in desktop/mobile navigation for all visitors. |
| DESIGN-3 | Compact dashboard | Accepted by the developer in the DESIGN-4 request. |
| DESIGN-4 | Pool creation and management | Accepted by the developer, including consolidated owner actions (`4e313bc`). |
| DESIGN-5 | Public pool and contribution experience | Manually accepted by the developer, including `e28a806`. |
| DESIGN-6 | Mobile, accessibility and final consistency | Manually accepted in RELEASE-1, including `27dd519`. See [deployment readiness](./release-v1.1.0-deployment.md). |

DESIGN-1 keeps the existing page layouts, except removing duplicate global
navigation/account CTAs and using a shared sign-in surface. It introduces no
component framework, external font, schema migration or production change.
See [tokens, compatibility limits and acceptance checklist](./design-system.md).

## Technical risks and dependencies

Known technical debt and observations, **not automatically confirmed regressions**:

- Four previously observed date-dependent Vitest failures and eight previously
  observed TypeScript test-fixture errors. These counts are historical reports,
  not results of a fresh check for this documentation change; reassess in the
  isolated environment and distinguish baseline failures from regressions.
  DESIGN-4 rerun: 658 tests pass, 15 opt-in PostgreSQL checks skipped; the three
  remaining expired-date fixtures were updated in the creation/edit tests.
  The eight historical TypeScript fixture errors remain; ESLint/build pass.
- Collector aliases may be stored without verifying accessibility under the
  effective Linxo credentials.
- Local development has historically used shared production resources.
  The accepted local setup now uses isolated PostgreSQL and confirmed Sandbox
  credentials; this historical risk is not a statement about current local use.
- Production payment failures require further investigation in an isolated test
  environment. Label compatibility, complementary name validation and resource
  accessibility are investigation areas, not proven causes.

### Immediate prerequisite — Safe local development

**Accepted and closed on 2026-11-12.** The environment is operational for local
development and Sandbox testing. Its acceptance scope was:

- Separate local PostgreSQL database and Linxo Payments Sandbox credentials.
- Local development authentication with a test identity and fake data only.
- No dependency on production PostgreSQL or production Linxo credentials.
- Preserve existing Auth.js and authorization behavior in production.
- Clear environment configuration and setup instructions, plus automated
  safeguards against unsafe environment combinations.
- Prefer a lightweight setup; avoid unnecessary deployment infrastructure.

| Milestone                                     | Acceptance evidence                                                                                                                                                                                       | Status                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| DEV-1 — Local PostgreSQL/Prisma               | PostgreSQL 17 through Docker Compose, applied migrations and developer-confirmed persistence                                                                                                              | **Accepted**                            |
| DEV-2 — Development authentication            | Stable test identity; developer confirmed login, logout and login again with persistence                                                                                                                  | **Accepted**                            |
| DEV-3 — Linxo Sandbox integration             | Authorized-account/alias creation, accessible alias, orders visible in Linxo dashboard, successful orders with accents/emojis, and beneficiary serialization correction                                   | **Accepted**                            |
| DEV-4 — Browser, tunnel and webhook lifecycle | Developer completed browser Sandbox simulations: immediate execution PASS, immediate rejection PASS, authorization followed by rejection PASS with webhook-driven state update visible after page refresh | **Accepted with the observation below** |

For authorization followed by execution, the expected status transition was not
observed after several minutes. Its cause remains unconfirmed; this is **not a
confirmed Linxo defect**. The developer explicitly accepted the environment as
operational despite this limitation. No speculative implementation change is
justified by that observation alone.

See [local development](./local-development.md), [DEV-3 validation](./dev-3-sandbox-validation.md)
and [DEV-4 results and evidence limits](./dev-4-sandbox-validation.md). The DEV-4
review recorded 225 relevant tests, ESLint and a production build passing; the
closure check reran the 35 label/contribution service tests and targeted ESLint
successfully. Live webhook replay and detailed per-view total measurements were
not separately reported. This acceptance does not authorize changes to
production resources or certify all v1.1.0 product requirements.

### Engineering principles

- KISS, SOLID and maintainability; small, reviewable commits.
- No destructive database migrations or payment regressions.
- Strict authorization and user data isolation.
- No local storage of IBANs, payer banking details or collector KYC data; no
  exposed Linxo secrets. Follow the [security constraints](./security.md).
- Centralized French UI translations; English code, comments, documentation and
  commit messages. Use relative, GitHub-compatible documentation links.
- Automated tests and targeted manual acceptance, including privacy boundaries,
  authorization and payment lifecycle checks appropriate to each change.
- No automatic push or deployment without approval.

## Deferred backlog

### P3 — CSE-specific Linxo Payments project (excluded from v1.1.0)

The CSE has its own Linxo Payments project. Future functionality must restrict
CSE pool creation to authorized CSE members and use that project's credentials
and collector resources. Select the payment project server-side and associate
each pool and order with its original project. Route subsequent status checks,
webhooks and refunds to the correct project, preserving historical payment
behavior and data isolation. A simple credential switch is insufficient without
covering this complete payment lifecycle. **Planned for a future release.**

### Restricted-access pools

Potentially restrict contributions to an authorized participant list.
Authentication and identity verification requirements remain undecided.
**Low priority; no implementation planned.**

## Next steps

1. The isolated local development prerequisite is accepted; resume functional
   work in the existing priority order.
2. Reassess historical test/type errors, recover the collector-reuse
   specification, and investigate payment failures with sandbox data and safe
   diagnostics. The complementary name correction is implemented and locally
   validated; production deployment remains unverified. Retain the delayed
   authorization-to-execution observation without assigning an unconfirmed cause.
3. Resume P0, then P1 and P2 in small changes with automated checks and targeted
   manual acceptance. Follow the permanent-archiving decision and complete Sandbox acceptance of
   the approved favorite-provider list.
4. Validate the complete v1.1.0 release before creating its final tag. Pushes and
   deployments require approval.

## DESIGN-6 release-readiness snapshot

DESIGN-1 through DESIGN-5 are manually accepted. DESIGN-6 is manually accepted
by the developer in the RELEASE-1 request. Final checks: 137 targeted tests and 689
full-suite tests pass, zero test failures, 15 opt-in PostgreSQL checks skipped;
ESLint/build pass. Standalone TypeScript retains eight historical fixture errors,
with no new error. Browser fixtures cover 36 views at four widths, followed by
focused checks through six widths; no overflow or axe violation remains in those
checks. See [final evidence/limitations](./design-system.md#design-6--final-consistency-and-accessibility-pass).

The [release inventory](./release-v1.1.0-inventory.md) records the branch, audit
HEAD, all commits and the three new migrations since `v1.0.0`, configuration
considerations and remaining test debt. This records readiness information only;
it does not start the production release process or confirm production state.

## RELEASE-1 — Production readiness

DESIGN-6 is manually accepted. Reviewed application candidate: `27dd519`; active
Production source confirmed by the operator: `0f295cd` (22 commits behind the
candidate). The three additive migrations were rehearsed successfully on a
separate disposable PostgreSQL database with fictional historical data; both
client schemas and all 15 optional database/concurrency tests pass.

**BLOCKED — ACTION REQUIRED:** a usable Supabase backup/restore point is not yet
confirmed; trusted Git write access in this workspace must be restored before
RELEASE-2. Environment presence is operator-confirmed, not independently inspected.
The eight historical TypeScript fixture errors remain; all Vitest checks, lint
and build pass. See [exact refs, procedure, rollback limits and smoke checks](./release-v1.1.0-deployment.md).
This is readiness documentation only: v1.1.0 is not marked deployed; no production
database connection, migration, environment change, push, deployment or tag occurred.
