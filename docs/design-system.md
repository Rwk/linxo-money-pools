# DESIGN-1 — Linxo Cagnottes foundations

DESIGN-1 (including its sign-in/mobile follow-up), DESIGN-2 and DESIGN-3 are
accepted by the developer. DESIGN-4 is implemented locally on 2026-11-13;
**manual acceptance remains pending**. DESIGN-5 and DESIGN-6 remain separate work.

## Existing foundations and direction

The app uses Tailwind CSS v4 via `@import "tailwindcss"` and the PostCSS plugin;
there is no separate Tailwind theme configuration. The starting UI used a single
system font, blue gradient background, large radii/shadows and repeated inline
utility patterns for links/forms/surfaces. Buttons and status badges were shared,
but navigation and account actions lived in individual pages.

Keep the existing stack and system font. The identity now pairs deep ink and
petrol (continuity with the existing Linxo accent) with ivory and warm coral.
A small original SVG gift mark suggests shared events without using an external
logo, illustration dependency or downloaded font. Color should help orient the
user, not turn every status into a call to action.

## Tokens

Tokens live in `src/app/globals.css`. Existing token names remain compatible with
legacy page classes; new geometry/type/surface classes are opt-in.

| Token | Value | Role |
| --- | --- | --- |
| `--background` | `#faf8f3` | Soft ivory page canvas |
| `--surface`, `--surface-strong`, `--background-elevated` | `#ffffff` | Content and header |
| `--surface-subtle` | `#f3f1eb` | Quiet secondary surface |
| `--foreground` | `#19333b` | Deep ink, primary text |
| `--muted` | `#59696d` | Supporting text and placeholders |
| `--accent` / `--accent-hover` | `#086b70` / `#07575b` | Petrol primary action |
| `--accent-foreground` | `#ffffff` | Primary button text |
| `--celebration` / `--celebration-surface` | `#b74a36` / `#ffede5` | Coral event accents; use sparingly |
| `--secondary` / `--secondary-hover` | `#e9f2ef` / `#d9e9e3` | Secondary action |
| `--secondary-foreground` | `#19333b` | Secondary action text |
| `--surface-border` / `--surface-border-strong` | `#dcded8` / `#b9c3c0` | Decorative surface boundaries |
| `--control-border` | `#748784` | Form-control boundary, stronger than decorative borders |
| `--focus-ring` | `#086b70` | Solid 2 px keyboard outline with 3 px offset |
| `--success` / `--success-surface` | `#176749` / `#eaf5ed` | Confirmed/success |
| `--warning` / `--warning-surface` | `#805514` / `#fff5df` | Attention needed |
| `--danger` / `--danger-surface` | `#ad343c` / `#fceef0` | Errors/destructive action |
| `--danger-hover` | `#912b32` | Destructive hover |
| `--info` / `--info-surface` | `#255d91` / `#edf4fc` | Informational state |
| `--neutral` / `--neutral-surface` | `#526368` / `#f0f3f2` | Inactive/static state |

Semantic border tokens remain available for the shared statuses. Text/background
pairs are checked at WCAG AA body-text contrast (at least 4.5:1); new control
borders and focus outlines against white are checked at least 3:1. These checks
cover token combinations, not a full accessibility audit of every legacy page.
Never use pale decorative borders as the sole boundary of new form controls.
Do not communicate status only through color: retain its visible French label.

## Type, spacing and geometry

- One existing family: Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif.
  No web-font request or extra font package.
- Body: inherited 1.5 line height. Shared controls use 14 px; statuses 12/14 px.
- `.ui-page-title`: responsive 28–40 px, weight 700, line height 1.15.
- `.ui-section-title`: 20 px, weight 650, line height 1.3.
- Use ordinary French sentence case. No automatic uppercase/letter-spacing on
  shared buttons or status labels. Old page-specific headings remain for later work.
- Spacing tokens: 4, 8, 12, 16, 24 and 32 px. Prefer compact 12–24 px grouping.
- Control radius: 10 px; standard surface: 16 px; static status: 4 px.
- Shared buttons/links and navigation targets: minimum 44 px height.
- Card shadow: `0 2px 8px rgb(25 51 59 / .05)`; soft shadow:
  `0 1px 3px rgb(25 51 59 / .04)`; button shadow: visually none
  (`0 0 0 transparent` keeps legacy Tailwind shadow composition valid).
- Do not create cards just to wrap another card, uniformly round every element
  into a pill, or use large gradients and empty spaces as decoration.

## Shared primitives

- `src/components/ui/button.tsx`: native button; primary (petrol), secondary
  (pale teal), danger (red) and tertiary (text) variants. Native disabled/type,
  event, form and ARIA props are preserved. Disabled buttons retain their base
  background on hover; transitions respect reduced-motion preferences.
  `buttonClassName` shares the same appearance with real navigation links.
  Never represent navigation as a button or an action as an anchor without href.
- `src/components/status-badge.tsx`: static span, small radius, normal case and no
  hover/focus affordance. It is not interactive; never add a click handler to it.
- `src/components/ui/surface.tsx` and `.ui-surface`: single white content container,
  16 px radius, modest border, 24 px padding, no shadow by default. Used on sign-in.
- `.ui-field`: input/select/textarea treatment for subsequent form migrations:
  44 px minimum height, 10 px radius, accessible border, disabled and
  `aria-invalid="true"` states. Keep native labels, required/type attributes,
  descriptions and server validation. Existing forms are not mass-rewritten.
- Global keyboard focus includes anchors, buttons, fields and disclosure summaries.
  Base resets are in Tailwind's base layer so utility text colors/weights on
  shared links/buttons are respected.

## Global shell and navigation

`RootLayout` contains a skip link to the focusable `#main-content` wrapper and one
shared header. Pages retain their existing main landmark. `SiteHeader` derives
navigation visibility from `auth()` using the existing Linxo-domain/session-ID
criteria; it changes no provider, session callback, authentication or authorization
rule. Protected pages/actions still enforce their own server guards.

`SiteNavigation` keeps one horizontal header row. Below 768 px, the brand stays
left and a native `Menu` button stays right; the navigation disclosure opens
beneath the header without increasing the closed header's height. At 768 px and
above, destinations are directly visible and the menu trigger is hidden. Both
views share one navigation DOM tree, including the existing sign-out server
action. No menu library is added.

Authenticated navigation contains `Mes cagnottes`, `Créer une cagnotte` and
`Se déconnecter`. Anonymous mobile navigation contains home and sign-in; on the
sign-in page the extra sign-in link is omitted. The brand/home link remains
visible at every width. FAQ now links to `/faq` in both session modes, with
`aria-current="page"` on the FAQ route; it appears once in the shared desktop/mobile
navigation tree.

The disclosure button exposes `aria-expanded`, `aria-controls` and a French
open/close accessible name. Native button Enter/Space activation and normal Tab
navigation apply. Opening focuses the first destination; Escape closes and returns
focus to the trigger. Selection, submission, outside pointer/focus movement and
route changes close it. Crossing the desktop breakpoint resets the disclosure
and moves focus to a visible control when required. The panel is positioned within
the header's horizontal bounds; the brand can truncate at unusually narrow widths.
Desktop navigation remains available regardless of disclosure state.

### Exclusive authentication option

The sign-in server component uses `hasDevelopmentAuth` exported by the existing
Auth.js configuration. It renders exactly one authentication button:

- Effective local development mode (`NODE_ENV=development`,
  `ENABLE_DEV_AUTH=true`, no managed Vercel environment): `Connexion développeur`,
  local-development badge, heading and explanation. Google credentials are not
  required, and a configured Google provider is not also displayed.
- Development mode disabled/absent, or production: `Se connecter avec Google`
  alone, preserving the Linxo employee restriction and existing missing-credentials
  disabled state. In production the existing server guard excludes the development
  provider even if `ENABLE_DEV_AUTH=true` is accidentally supplied.

No client environment checks, provider/session changes, credential changes or
`.env.local` edits are introduced. Return destinations and Auth.js server actions
are preserved.

Current destinations expose `aria-current="page"`. Pool-detail routes mark the
owner collection current; the creation route marks only creation current.

Home/dashboard duplicate auth/navigation CTAs were removed when moved into the
shell; their content, metrics, cards and lifecycle tabs remain. Sign-in only
adopts the shared surface/title/controls. Contextual page return links and empty
state creation links are retained. DESIGN-2 now provides the public `/faq` route.

The new root header reads the session on public pages too, so their shell is
rendered per request rather than statically cached with another visitor's account
controls. Only the current signed-in user’s own identity labels their account
action: a mobile-menu caption, a sign-out tooltip and a named form for assistive
technology. Anonymous navigation receives no identity.

## DESIGN-2 — Homepage, FAQ and event artwork

Homepage: one compact hero headed “Les belles occasions se partagent.”, a short
occasion-led introduction and a single primary action. Its server-derived session
criteria match the shared header: authorized users go to `/dashboard/pools/new`,
visitors go to `/sign-in`. No provider buttons are duplicated. A short note makes
clear that contribution through a public link requires no account. Three plain
steps and a restrained FAQ link replace the old nested-card workflow/security
sections. Payment notices at the actual contribution/handoff screens are untouched.

`src/components/illustrations/occasion-illustration.tsx` is original, local inline
SVG artwork: birthday cake, farewell paper plane, birth cradle, and people sharing
an occasion around a gift. Keep its flat petrol/coral/ivory palette, restrained
outlines and distinctive silhouettes when adding event artwork later. Its 520×400
viewBox scales without image requests; mobile height is capped at 224 px and
desktop at 400 px. It is decorative (`aria-hidden`, `focusable="false"`), and all
meaningful copy remains HTML. No animation, third-party art, image host, icon/menu
package or web font is introduced. Pool cards and event selectors are unchanged.

The public `/faq` page has five topic anchors and 19 native `<details>/<summary>`
questions: getting started (3), contributions/payments (5), privacy (3), management
(4), security/responsibilities (4). Each answer stays short. A decorative plus/minus
indicates open state while native controls provide keyboard and assistive-technology
semantics. New copy uses French nonbreaking punctuation and centralized `fr.ts`/`t`.

Content was checked against current contribution input/visibility/totals rules,
fixed-price calculations, owner presenters, collector services, lifecycle helpers
and payment documentation. Useful disclosures from the former homepage are retained
in the FAQ: separate name/amount privacy, complete owner visibility, bank return
versus confirmation, direct collection, permanent archive and late payment follow-up.
No fees, refund mechanism, processing deadline, regulatory guarantee, provider
storage/deletion policy or new product capability is promised. Bank/method availability
is worded conservatively; local developer authentication stays environment-specific.

### DESIGN-2 visual acceptance checklist — accepted by developer

- At 320/390 px, tablet and desktop widths, inspect headline, illustration balance,
  early primary action, readable steps and absence of horizontal overflow. Check
  the menu/FAQ link, active destination, focus outline and skip link.
- Visit anonymously and signed in: sign-in versus creation CTA must route correctly;
  no homepage Google/developer buttons or private owner data should appear.
- Open `/faq` anonymously and from both navigation layouts. All five topic anchors
  must work. Tab through summaries and toggle with Enter/Space; opening several
  answers must preserve readable spacing and heading order.
- Review wording for product accuracy, especially amount privacy versus public
  names, complete owner information, payment confirmation and irreversible archive.
- Confirm sign-in remains exclusive, then smoke-test unchanged pool/payment flows
  with fictional Sandbox data. This does not change the dashboard’s business rules.

DESIGN-2 verification (2026-11-13):

- 48 targeted Vitest tests pass across five files (home/FAQ content and routes,
  native accordions, shared desktop/mobile navigation and authentication behavior).
- Full Vitest: 612 passed, 3 historical date-fixture failures, 15 local PostgreSQL
  opt-in checks skipped. Historical failures remain in `create-pool-action.test.ts`
  (one) and `update-pool-action.test.ts` (two), using expired July 2026 dates.
- ESLint and production build pass. Standalone TypeScript retains the same eight
  historical fixture errors: three Decimal stubs in
  `payment-handoff-presenter.test.ts`, three missing dependency methods in
  `sync-contribution-status.test.ts`, and two incomplete detail view-model fixtures
  in `pool-detail-sections*.test.ts(x)`. No new application or test errors.
- Chromium checks of anonymous `/` and `/faq` at 320, 390, 768, 1024 and 1440 px:
  HTTP 200, no horizontal overflow or runtime JS errors, early hero CTA, one-line
  mobile header, functional menu Enter/Escape/focus and native accordion Enter/Space.
- axe WCAG A/AA/2.1 AA checks at 320 and 1440 px found no violations on either
  page. This is automated evidence, not a complete accessibility certification or
  developer acceptance. Signed-in hero routing is covered by mocked-session tests;
  its browser appearance and actual sign-in remain on the manual checklist.
- Screenshots were inspected for desktop/mobile composition. Existing Playwright/
  Chromium tools were reused with libraries extracted only under `/tmp`; no system
  package installation, project dependency, external image service or payment call.

The developer subsequently confirmed DESIGN-2 acceptance.

## DESIGN-3 — Compact owner dashboard

The owner dashboard uses a plain title and compact, inline confirmed total.
Counts live on `En cours`, `Terminées`, `Archivées` links rather than repeating
as large statistic cards. The existing selected/default tab and `?tab=` navigation
are unchanged. The existing global creation action stays visible on desktop; a
page-header creation action appears on mobile when global navigation is collapsed.
The current account identity remains available through navigation, not a large
separate welcome/email panel.

One white list surface contains separated rows, not cards within cards. Each row
has a 40 px original local SVG motif (birthday, birth, farewell, wedding, generic
gift fallback), title/management link, effective status, UTC closing date formatted
in French, owner confirmed amount and the existing visible-contribution count.
Titles clamp to two lines with their full text accessible and available as a
native tooltip; unusual characters are preserved/escaped. Event text remains
accessible on mobile, where its icon provides the visual cue. Static status spans
remain distinct from native links/buttons.

Only an active pool needing collector setup repeats its payment-readiness warning;
configured active and completed/archived rows avoid redundant readiness labels.
Row actions are always available: visible `Gérer`, `Copier le lien`, and an external
page icon with `Voir la page publique` accessible name/tooltip. No new menu or
lifecycle operation is added. The full public URL is not printed in the row;
the unchanged clipboard handler receives the exact existing `publicUrl`. The
optional compact copy presentation preserves native buttons, live success/error
feedback and default behavior everywhere else.

### Amounts and data boundaries

`dashboard-presenters.ts` reuses `computePoolTotals`, the existing private card
presenter and `getPoolLifecycle`. The summary includes all of the owner’s pools,
including completed/archived pools and hidden confirmed amounts. Each contribution
is included once through its pool. Pending/rejected/new orders do not become
confirmed merely for presentation. French euro formatting uses normalized domain
totals, retaining exact cents without parsing formatted labels or converting large
amounts to floating point. Other public/private detail presenters keep their
existing format and privacy behavior.

The contribution count keeps its existing meaning: publicly visible rows
(confirmed and authorized/submitted in progress), including hidden-amount rows.
It does not claim to count failed or not-yet-authorized records. Full history
remains on the unchanged owner management page. Tab counts use the centralized
effective lifecycle, including expired OPEN pools and archival precedence.

The server session guard and both owner-scoped repository queries are retained;
foreign-owner results are also excluded before presentation/aggregation. No
schema, payment, authentication/ownership rule, fixed-price calculation, lifecycle
transition or collector-reuse logic is changed.

### Responsive presentation and acceptance — DESIGN-3 accepted

Below 640 px, rows stack their identity, amount and actions without using a data
table; all action targets remain at least 44 px. Tablet uses a separate amount
column; wide desktop places actions on the same row. At 320 px the lifecycle tabs
and actions remain on one line in the representative preview. Counts/amounts use
tabular numerals and event colors remain in the DESIGN-1 palette.

- On desktop/tablet/mobile (including 320 px), check early list access, all three
  tabs/counts/default/empty states, long accented/emoji titles and visible actions.
- With a real local owner session, confirm only that owner’s pools appear and
  that confirmed amounts include hidden amounts and archived pools. Compare the
  displayed visible-contribution count to the unchanged management history.
- Use `Gérer`, open a public page and copy its link. Paste it to confirm the full
  original URL; check success/error feedback and keyboard names/focus. Check the
  account identity in mobile navigation and the sign-out tooltip on desktop.
- Verify public totals still exclude hidden confirmed amounts, and smoke-test
  unchanged lifecycle/payment flows with fictional Sandbox data as appropriate.

DESIGN-3 verification (2026-11-13):

- 150 targeted tests pass across 12 files, including private/hidden totals,
  counts, dates, exact URL copying, owner isolation, long titles, event fallback,
  lifecycle transitions, payment initiation and webhook regression checks.
- Full Vitest: 632 passed, 3 historical date-fixture failures, 15 opt-in PostgreSQL
  checks skipped. Historical failures remain in `create-pool-action.test.ts` (one)
  and `update-pool-action.test.ts` (two), with expired July 2026 dates.
- ESLint and production build pass. Standalone TypeScript retains the eight
  historical fixture errors already listed above; no new type error.
- Browser previews cover all three tabs at 320, 390, 768, 1024 and 1440 px, with no
  page overflow or overlapping row actions detected. A representative 1440×900
  preview reaches the list at 286 px and shows six rows in its first viewport;
  ordinary wide-desktop rows measure about 85 px high. Narrow-mobile actions and
  tabs fit one row in the representative fixture. Long titles remain bounded.
- axe WCAG A/AA/2.1 AA checks at 320 and 1440 px found no violations across the
  three tab previews. This does not constitute a full accessibility certification
  or developer visual acceptance.

Browser visual previews use actual dashboard/row/navigation components and compiled CSS with
fictional read-only repository/session fixtures. They do not authenticate a real
user, write database data, create payments or validate real clipboard/browser
routing. Clipboard and ownership contracts are covered by targeted tests; real
session interaction and developer visual acceptance were pending at that check.
The developer subsequently confirmed DESIGN-3 acceptance in the DESIGN-4 request. Headless
system-font emoji coverage may differ from the developer’s browser.

## DESIGN-4 — Pool creation and owner management

Implemented locally on 2026-11-13. **Developer visual acceptance pending.**
DESIGN-1, DESIGN-2 and DESIGN-3 are accepted according to the developer's
DESIGN-4 request. DESIGN-5 and DESIGN-6 remain outside this change.

### Creation and descriptions

Creation uses one form with three semantic fieldsets: `Votre événement`
(title, event type/date in a responsive row, optional description),
`Les contributions` (FREE/FIXED and conditional required price), and
`Compte collecteur` (owner-scoped reuse or the existing new-collector path).
Section dividers, shared `ui-field` controls and the shared submit button replace
nested panels. The banking-label preview stays available in a native disclosure,
including the unchanged normalization explanation. New collector identity and
banking details remain in the existing post-creation setup flow.

Description is optional in create/edit UI and both server validators. FormData
without a description becomes `""`; trimming normalizes whitespace-only input to
`""` before persistence. Existing populated descriptions retain their content and
line breaks after the existing trim behavior. The 2,000-character limit and
required title remain. The current non-null Prisma string stores an empty string;
no migration is needed. Public overview and owner details omit the description
paragraph/container when blank, including historical whitespace-only strings.
This is the only public-pool display change in DESIGN-4.

### Owner management

The actual pool title is the only page H1. Its effective lifecycle, closing date
and primary actions sit together: `Modifier`, `Copier le lien`,
`Voir la page publique`. Copy receives the exact existing public URL, once.
Edit stays on this page: opening it focuses the title field; cancellation or a
successful save returns focus to the edit trigger. `aria-expanded` and
`aria-controls` describe the edit state. The existing successful-save guard is
retained so editing can be reopened after saving.

A native keyboard-operable `Cycle de vie` disclosure near the heading groups
close/reopen/archive controls. The existing required future date for expired
pools and explicit required archive-confirmation checkbox remain. Archived pools
have no edit, collector setup, close, reopen or archive mutation control.
Reconciliation remains available, including after closure/archive, because
already accepted payments and late webhooks still need to finish.

Content order: heading/actions; missing collector form or compact configured
summary; complete owner totals/contribution counts; details/edit; visible and
incomplete payment history; manual reconciliation. A missing collector uses one
existing form directly in the main full-width column, above totals. Its natural
person/company fields and server validation/API behavior are retained, with
responsive related-field grids. There is no narrow sidebar or link-only warning.
The configured summary shows readiness and collector display name, without
banking details. History preserves recorded names/emails, amounts and payment
statuses. Owner confirmed totals still include amounts hidden publicly; public
privacy rules and totals are unchanged.

### Verification and remaining limitations

- 81 targeted tests pass across 11 files: optional description creation/editing,
  FREE/FIXED controls, reuse/new collector paths, collector entity choices,
  owner hierarchy/history/totals, edit focus, lifecycle/read-only behavior,
  reopening date, archive confirmation and owner-access/privacy guards.
- Full Vitest: 658 passed, 15 opt-in PostgreSQL checks skipped (72 files passed,
  two skipped). No test initiated a payment. The three previously failing
  expired July 2026 fixtures in create/update action tests now use future dates;
  their ownership, redirect and persistence assertions are exercised again.
- ESLint and production build pass. Standalone TypeScript still reports eight
  historical fixture errors: three Decimal stubs in
  `payment-handoff-presenter.test.ts`, three missing dependency fields in
  `sync-contribution-status.test.ts`, and two incomplete detail view-model
  fixtures (`pool-detail-sections.test.ts` and the private `.test.tsx` fixture).
  No new application type error. No database, auth, Linxo, locking or lifecycle
  service/repository code was changed.
- Chromium previews cover 320, 390, 768, 1024 and 1440 px in seven states:
  creation/new collector, creation/reuse, configured, missing collector,
  completed, expired and archived. No page overflow in 35 combinations.
  Native lifecycle disclosure opens with keyboard Enter. axe WCAG A/AA/2.1 AA
  found no violations in the 14 checks at 320 and 1440 px.
- Browser previews use actual components and compiled production CSS with
  fictional read-only fixtures and mocked server actions. They do not validate
  real owner authentication, submissions, clipboard or Sandbox payments. React
  tests cover edit/focus/entity/mode interactions; actual local browser use and
  visual acceptance remain the developer's next step. Headless emoji/font and
  native date-input rendering can differ from the developer's browser.

### Manual acceptance checklist — pending

Use local fictional/Sandbox data and the existing development login:

1. At 320 px and desktop, create FREE and FIXED pools, with and without a
   description. Check required title/date/price and inline errors, banking-label
   preview, clear sections and visible submit. Try both collector reuse and new.
2. On a pool missing its collector, check the single main-content setup form
   above totals, both entity types and validation. Finish only with an authorized
   Sandbox account. Confirm the compact ready summary afterwards.
3. Edit an existing pool, clear its description and save; verify no empty
   description area on owner/public views. Save a populated multiline description
   again. Check other fields and the existing fixed-price locking rules.
4. Check long accented/emoji titles, wrapping, touch targets and keyboard focus.
   Open/close editing repeatedly; copy/paste the link and open the public page.
5. Test active close, completed reopen, expired reopen with an explicit future
   date, and archive with its required irreversible confirmation. Archived pools
   must stay read-only. Use disposable local pools for permanent archive checks.
6. Compare complete owner confirmed totals (including hidden amounts), public
   totals excluding them, names and full payment history. Confirm reconciliation
   is still available after closure/archive and another owner cannot manage the
   pool. Do not claim new end-to-end Sandbox acceptance from automated checks.

## Boundaries for DESIGN-2 through DESIGN-6

1. DESIGN-2: homepage and FAQ accepted by the developer.
2. DESIGN-3: compact dashboard accepted by the developer in the DESIGN-4 request.
3. DESIGN-4: pool creation/management implemented locally, manual acceptance pending;
   retaining fixed prices, reuse, permanent archival confirmation and history.
4. DESIGN-5: public/contribution flows; preserve hidden-amount privacy, the full
   bank list, payment links, return routes and late webhook processing.
5. DESIGN-6: mobile, keyboard/screen-reader audit and final cross-page consistency.

No database migration, Auth.js logic change, lifecycle/payment code change or
unrelated dashboard redesign is included here. Legacy pages still use their own
large-radius containers, utility spacing and some decorative gradients. Token
colors, shadows and shared controls update globally; geometry is not overridden
through blanket CSS selectors. This transitional mixture is deliberate until the
corresponding page milestone. No visual acceptance is implied by automated tests.
