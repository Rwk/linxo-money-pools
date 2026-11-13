# DESIGN-1 — Linxo Cagnottes foundations

Implemented locally on 2026-11-13. **Manual visual acceptance pending.**
This milestone introduces shared foundations and navigation. DESIGN-2 through
DESIGN-6 remain separate work; this is not a complete page redesign.

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

`SiteNavigation` uses wrapping flex rows, with no hamburger menu or extra state
library. The home/brand link is always visible. Authenticated users see
`Mes cagnottes`, `Créer une cagnotte` and the existing sign-out server action,
visually grouped as account actions. Visitors see `Se connecter` to `/sign-in`,
which continues to offer development login when enabled and Google as configured.
The sign-in page does not repeat the header's sign-in link.

Current destinations expose `aria-current="page"`. Pool-detail routes mark the
owner collection current; the creation route marks only creation current.

Home/dashboard duplicate auth/navigation CTAs were removed when moved into the
shell; their content, metrics, cards and lifecycle tabs remain. Sign-in only
adopts the shared surface/title/controls. Contextual page return links and empty
state creation links are retained. FAQ navigation is deliberately deferred to
DESIGN-2: no `/faq` link is shipped before its route/content exists.

The new root header reads the session on public pages too, so their shell is
rendered per request rather than statically cached with another visitor's account
controls. No account data is displayed in the public header.

## Boundaries for DESIGN-2 through DESIGN-6

1. DESIGN-2: homepage and FAQ, then enable the FAQ navigation destination.
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

## Verification and manual acceptance

Automated verification:

- 145 targeted tests pass across 16 files: navigation/session visibility, native
  button semantics, static statuses, contrast tokens, root/home/sign-in rendering,
  development auth, pool pages, privacy/fixed prices and payment/webhook regressions.
- Full Vitest: 588 passed, 3 historical failures, 15 local PostgreSQL opt-in checks
  skipped. The historical failures are July 2026 date fixtures in
  `create-pool-action.test.ts` (one) and `update-pool-action.test.ts` (two).
- ESLint and production build pass. The build uses synthetic payment configuration.
- Standalone TypeScript retains eight historical fixture errors: three Decimal
  stubs in `payment-handoff-presenter.test.ts`, three missing dependency methods
  in `sync-contribution-status.test.ts`, and two incomplete view-model fixtures
  in `pool-detail-sections*.test.ts(x)`. No new application/test type errors.

Browser visual checks were attempted using the already available Chromium binary but could not launch:
`libatk-1.0.so.0` is absent. No system package or browser framework was installed.
Therefore desktop/mobile screenshots, visual overflow and browser keyboard checks
remain pending. Production HTTP checks of `/` and `/sign-in` returned 200, with
one header, the skip target and no anonymous owner links or broken FAQ links.

Manual checklist (desktop, 390 px mobile, and narrow 320 px):

- Visit home, sign-in and a public pool anonymously. Check consistent identity,
  legible type, compact header, no horizontal overflow, no owner actions and no
  FAQ link. Header navigation must wrap without clipping.
- Tab from the document start: the skip link becomes visible and moves focus to
  content. Every interactive element has a visible outline; order follows reading
  order. Verify ordinary and reduced-motion settings and 200% zoom.
- Sign in using development authentication locally. Check one account action
  group, dashboard/creation destinations and active indication. Sign out and
  verify anonymous navigation returns. Verify production Google login in its
  configured environment separately; no provider configuration was changed.
- Check authenticated dashboard, create/management forms, lifecycle/archived
  views and public contribution/handoff screens. Statuses must read as static
  information, buttons as actions. Ensure disabled, hover and focus states are
  clear and existing controls have not clipped after adopting the compact button.
- Check that functional flows remain usable with fictional local Sandbox data:
  fixed amounts, amount privacy, collector reuse, archival confirmation and payment
  handoff/return. Do not initiate real transactions during acceptance.

Record developer acceptance before marking DESIGN-1 manually accepted. No push,
deployment or release tag was created by this task.
