# D2R.world-Style Navigation Shell + Unique/Set Items Design

## Goal

Restructure the site's navigation to mirror d2r.world's hierarchical menu, and build the
first content section (Unique Items + Set Items) as public, no-sign-in reference pages.
This is Phase 1 of a larger effort — the remaining 11 d2r.world-equivalent sections get
placeholder pages now and real content in later, separate plans.

## Background

d2r.world (confirmed by direct inspection this session) uses a hamburger-triggered
slide-out drawer listing site sections, grouped:

- **Game Items**: Base Items, Magic Items, Rare Items, Set Items, Unique Items, Runes,
  Runewords, Cube Recipes, Crafted Items
- **Misc**: FCR/FHR/FBR, Alvl85 Areas, Area Level, Level Up, Max Sockets
- Footer-style links: About Us, Contact Us

Selecting an item-type section (e.g. Unique Items) shows a category grid (28 slot
categories: Helms, Armors, Shields, Belts, Boots, Gloves, Rings, Amulets, Charms, Jewels,
Swords, Daggers, Axes, Polearms, Spears, Clubs, Maces, Hammers, Scepters, Staves, Orbs,
Wands, Katars, Bows, Crossbows, Javelins, Throwings). Selecting a category shows a list of
item stat cards (Item Stats column + Magic Properties column, QLvl/TC footer), with
Normal/Exceptional/Elite grade tabs at the top when the section has graded base tiers.

This site (D2R Institute) currently has two features: the Appraiser tool (home page) and
the sign-in-gated Grail Tracker (`/grail`), both reachable only via the Footer. Neither is
one of d2r.world's 14 sections.

## Non-goals

- Real content for the 11 placeholder sections (Base/Magic/Rare Items, Runes, Runewords,
  Cube Recipes, Crafted Items, FCR/FHR/FBR, Alvl85 Areas, Area Level, Level Up, Max
  Sockets) — each becomes its own future plan.
- Real "About Us" copy — placeholder only this phase.
- Site search (no search index exists; d2r.world's search bar is not replicated).
- Any change to the existing Grail Tracker's sign-in gate, found/not-found tracking, or
  data model — it is reused for reference data only, untouched otherwise.
- "Contact Us" link — not requested by the user; only "About Us" is in scope.

## Navigation shell

**New component: `SiteNavDrawer`** (client component)

- Replaces the current bare `[locale]/layout.tsx` header area with a slim top bar
  containing a hamburger button (left) and the site title.
- Clicking the hamburger opens a slide-out overlay drawer (fixed position, dismissible via
  backdrop click, close button, or route navigation) listing:
  - **Game Items** group: links to `/[locale]/items/base`, `/items/magic`, `/items/rare`,
    `/items/set`, `/items/unique`, `/items/runes`, `/items/runewords`,
    `/items/cube-recipes`, `/items/crafted`
  - **Misc** group: links to `/[locale]/character/fcr-fhr-fbr`, `/monster/alvl85`,
    `/monster/area-level`, `/character/level-up`, `/misc/max-sockets`
  - **Our Tools** group: links to `/[locale]` (Appraiser) and `/[locale]/grail` (Grail
    Tracker) — existing pages, unchanged.
  - Standalone link: `/[locale]/about` (About Us)
- All labels sourced from a new `Nav` message namespace, translated into en/zh-TW/zh-CN
  (zh-CN via the existing OpenCC pipeline for anything not hand-authored, matching the
  project's established localization pattern).
- Locale switcher and Ko-fi button remain in the existing `Footer` component, unchanged.
- Drawer state (open/closed) is local component state; no persistence needed.

**Placeholder page component: `ComingSoonPage`**

- Simple shared component: renders the section's translated title and a translated
  "coming soon" message. Used by all 11 not-yet-built routes plus `/about`.

## Unique Items / Set Items pages

**Routes:** `/[locale]/items/unique`, `/[locale]/items/set` (Server Components, following
the same `generateStaticParams`/`setRequestLocale` pattern as every other page on this
site).

**Data:** Reuses `getAllGrailItems()` and `localizeGrailItem(item, locale)` from
`src/lib/grail/catalog.ts` — no new data generation. Each page filters the catalog to
`kind: 'unique'` or `kind: 'set'` respectively (the existing catalog already distinguishes
these; exact discriminant to be confirmed against `catalog.ts` during planning).

**Components:**

- `ItemCategoryGrid` — new, extracted/adapted from the existing
  `GrailCategorySidebar`'s category list (the 28 `SLOT_ORDER` categories), but as a plain
  navigable grid/sidebar with no found-count badges (those are Grail-Tracker-specific
  progress data this page doesn't have, since there's no sign-in).
- `ItemStatCard` — new, adapted from the existing Grail item-detail stat-sheet rendering
  (Item Stats + Magic Properties columns, QLvl/TC line), but rendering the item's *full
  stat ranges* (not "your copies vs. best roll" — there are no logged copies here) and
  with no "log a find" affordance.
- Grade tabs (Normal/Exceptional/Elite): filter the category's item list by the existing
  `grade` field. Shown only when the selected category has items across multiple grades.

**Explicitly not reused as-is:** `AuthGate`, `LogFindForm`, the found/not-found progress
counters, and anything reading from Supabase — this page tree has zero auth dependency.

## Testing plan

- Unit tests: verify the unique/set item filters (`kind === 'unique'` /
  `kind === 'set'`) produce the expected counts (403 uniques, 135 sets, matching existing
  known totals).
- Render tests: `ItemCategoryGrid` renders all 28 categories; `ItemStatCard` renders a
  known item's stats correctly in each locale (reusing the existing locale-aware test
  pattern from `grail-data.test.ts`).
- Manual verification: build + browse `/en/items/unique`, `/zh-TW/items/unique`,
  `/zh-CN/items/unique` (and `/set` equivalents) in the browser preview; spot-check 2-3
  items per page against d2r.world, consistent with the verification approach used for
  every prior feature in this project.
- Placeholder pages: confirm all 12 placeholder routes (11 sections + About Us) render
  without error in all 3 locales.

## Open questions

- Exact `catalog.ts` discriminant for filtering unique vs. set items — to be confirmed
  against the current source during plan-writing (not a design ambiguity, just an
  implementation detail to look up).
