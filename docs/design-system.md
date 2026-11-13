# DESIGN-1 — Linxo Cagnottes foundations

DESIGN-1 and its sign-in/mobile follow-up are accepted following the developer's
visual review. DESIGN-2 (homepage and public FAQ) is implemented locally on
2026-11-13; **manual visual acceptance of DESIGN-2 remains pending**.
The shared foundations remain in use. Homepage/FAQ are redesigned in DESIGN-2;
DESIGN-3 through DESIGN-6 remain separate work.

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
controls. No account data is displayed in the public header.

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

### DESIGN-2 visual acceptance checklist — pending

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
  with fictional Sandbox data. DESIGN-3/dashboard work has not started.

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

Visual acceptance by the developer is required before marking DESIGN-2 accepted.

## Boundaries for DESIGN-2 through DESIGN-6

1. DESIGN-2: homepage and FAQ implemented; visual acceptance pending.
2. DESIGN-3: compact dashboard; preserve effective lifecycle classification,
   metrics, owner isolation and navigation routes.
3. DESIGN-4: pool creation/management; migrate form/surface primitives gradually,
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
