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
| Collector account reuse              | **Planned; no reuse implementation verified**. Current setup creates an authorized account and an alias. A previous specification is reported to exist but was not found in tracked documentation or available history.                                                       | Recover/review that specification and reconcile it with the current API and authorization model.                                                               |
| Remaining P0, P1 and P2 requirements | **Planned**. Existing visibility controls and dashboard redesigns are partial foundations, not evidence that these requirements are complete.                                                                                                                                 | Implement and validate after the local development prerequisite.                                                                                               |
| Safe local development               | **Accepted; workstream closed**. DEV-1 through DEV-4 were implemented and manually accepted by the developer. See the acceptance record below.                                                                                                                                | Delayed authorization-to-execution transition remains an observation with an unconfirmed cause; it does not block acceptance of the environment.               |

## Prioritized milestones

| Priority     | Milestone                                                     | Release gate                                                                                              |
| ------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Prerequisite | Isolated local development                                    | Fake-data development and payment testing without production resources.                                   |
| P0           | Payment label compatibility and complementary name correction | Contract tests plus conclusive sandbox payment acceptance; investigate observed failures.                 |
| P0           | Public/private contribution amounts                           | Privacy holds across public pages, API responses and progress indicators; private totals remain complete. |
| P1           | Collector account reuse                                       | Only the authenticated user's authorized Linxo resources can be selected.                                 |
| P1           | Fixed-price contributions                                     | Server-enforced quantity and integer-cent calculation preserve existing payment behavior.                 |
| P1           | Pool organization and archiving                               | Correct three-tab classification and reversible, owner-only archiving.                                    |
| P2           | Favorite payment providers                                    | Verified BIC configuration with the full bank list still accessible.                                      |
| P2           | Dashboard redesign                                            | Desktop/mobile acceptance, coordinated with the three-tab organization.                                   |

## Product requirements

### P0 — Reliability and privacy

**Payment label compatibility:** preserve original pool titles for display while
producing contract-compliant banking labels at the server boundary. Complete
acceptance of the existing sanitization and address complementary name validation
as a separate contract issue.

**Public/private contribution amounts:**

- The public total includes only publicly visible contribution amounts. Indicate
  that some contributions are hidden when applicable.
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

**Pool organization and archiving:** organize the private dashboard into:

| Tab         | Membership                                          |
| ----------- | --------------------------------------------------- |
| In progress | Not manually closed, not expired, and not archived. |
| Completed   | Manually closed or expired, and not archived.       |
| Archived    | Explicitly archived by the owner.                   |

Archiving must be an explicit, reversible owner action. It must not delete pools
or contributions, modify payment statuses or amounts, or replace the pool's
closure state. A nullable `archivedAt` field is the proposed design. Restricting
archiving to completed pools is a recommendation **pending final product
validation**, not an agreed rule.

### P2 — User experience

**Favorite payment providers:** configure `favorite_providers` on Linxo
authorization URLs through a simple, centralized server-side configuration.
Initial desired bank families are BPCE, Société Générale, Crédit Agricole, N26,
Revolut, LCL and Crédit Mutuel **excluding Arkéa**. Exact BIC values must be
verified before implementation; preserve access to the complete bank list.

**Dashboard redesign:** improve visual hierarchy, primary actions, filter
navigation, status presentation, distinction between informational tags and
interactive controls, and desktop/mobile usability. Coordinate with the
three-tab pool organization. Reuse existing UI components and centralized
French translations; previous dashboard redesigns do not fulfill this new scope
by themselves.

## Technical risks and dependencies

Known technical debt and observations, **not automatically confirmed regressions**:

- Four previously observed date-dependent Vitest failures and eight previously
  observed TypeScript test-fixture errors. These counts are historical reports,
  not results of a fresh check for this documentation change; reassess in the
  isolated environment and distinguish baseline failures from regressions.
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
   manual acceptance. Resolve the archiving recommendation and verify bank BICs
   before their respective implementations.
4. Validate the complete v1.1.0 release before creating its final tag. Pushes and
   deployments require approval.
