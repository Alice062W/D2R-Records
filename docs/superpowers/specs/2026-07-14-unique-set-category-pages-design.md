# Unique/Set Items: d2r.world-Style Category Card Pages

## Goal

Replace the current sidebar-based Unique Items / Set Items pages with d2r.world's actual
two-step flow: a landing page of clickable category cards, then a real per-category page
listing that category's items with grade-tab filtering. This corrects a gap from the
prior nav-shell plan, which built a persistent-sidebar layout (borrowed from the existing
Grail Tracker) instead of matching d2r.world's real card-grid-then-list structure.

## Background

Direct inspection of d2r.world (this session and the prior nav-shell design) confirmed:
`/items/unique` shows a grid of category cards (Helms, Armors, Shields, ... with icons);
clicking one navigates to `/items/unique/axes` (a real, separate page) showing
Normal/Exceptional/Elite grade tabs and the item stat cards for that category alone.

The current implementation (`src/components/items/ItemBrowser.tsx`,
`src/components/items/ItemCategoryGrid.tsx`) instead renders a persistent left sidebar
(mirroring the sign-in-gated Grail Tracker's own category sidebar) with client-side
category switching on a single page. This is not what d2r.world does and not what was
asked for this pass.

## Non-goals

- Category card icons — no icon assets exist for this project (documented gap from the
  earlier Grail Item Reference work); cards are text-only.
- Any change to the Grail Tracker's own category sidebar (`GrailCategorySidebar.tsx`,
  `GrailChecklist.tsx`) — untouched, separate component tree.
- Any change to the other 13 placeholder routes from the nav-shell plan.
- Real content for any of the remaining d2r.world sections (Base/Magic/Rare Items, Runes,
  Runewords, Cube Recipes, Crafted Items, FCR/FHR/FBR, Alvl85 Areas, Area Level, Level Up,
  Max Sockets) — each is its own future plan.

## Routing

- `/[locale]/items/unique` and `/[locale]/items/set` (existing routes) become landing
  pages: unchanged page title/subtitle, plus a grid of category cards for every slot
  category that has at least one item of that kind in the real catalog data (computed,
  not hardcoded — set items don't span all 28 `SLOT_ORDER` categories; uniques do).
- New dynamic routes: `/[locale]/items/unique/[category]/page.tsx` and
  `/[locale]/items/set/[category]/page.tsx`. Each statically generates one page per valid
  `{locale, category}` combination via `generateStaticParams`, following this project's
  standard `setRequestLocale`/`getTranslations` pattern. Each page shows: a "back to
  categories" link, the category's translated name as a subheading, grade tabs
  (Normal/Exceptional/Elite, shown only when the category spans more than one grade —
  unchanged behavior from today), and the stat-card list for the selected grade.
- Invalid `{locale, category}` combinations (e.g. `/items/set/charms`, since no set charms
  exist) 404 via Next's standard `notFound()` for params outside `generateStaticParams`'s
  returned set.

## Data layer

New helper in `src/lib/grail/catalog.ts`:

```ts
export function getCategoriesForKind(kind: 'unique' | 'set'): typeof SLOT_ORDER[number][] {
  const items = getAllGrailItems().filter(i => i.kind === kind);
  return SLOT_ORDER.filter(slot => items.some(i => i.slotCategory === slot));
}
```

Used by both the landing pages (to render the card grid) and both dynamic routes'
`generateStaticParams` (to enumerate valid category segments), so the two can never drift
out of sync with each other or with the underlying catalog data.

## Components

- **New `CategoryCardGrid`** (`src/components/items/CategoryCardGrid.tsx`): takes
  `categories: string[]` and a `basePath: string` (e.g. `/en/items/unique`), renders each
  as a `next/link` styled as a card/tile (text-only, no icon), matching this project's
  existing dark-theme card conventions (`bg-zinc-900 border border-zinc-700 rounded-xl`,
  consistent with `ItemStatCard`'s own card styling). Simple server-renderable component
  (no client state needed — it's just links).
- **New `CategoryItemList`** (`src/components/items/CategoryItemList.tsx`, client
  component): takes `items: GrailItem[]` (already filtered to one category) and renders
  the grade-tab-filtering + `ItemStatCard` list — this is `ItemBrowser`'s existing
  grade-tab logic, minus the category-switching sidebar, since the category is now fixed
  per-page by the route itself.
- **`ItemStatCard`**: unchanged, reused as-is.
- **Retired:** `ItemCategoryGrid.tsx` (+ its test) and `ItemBrowser.tsx` (+ its test) are
  deleted — nothing will consume them after this change, and this project's convention
  (established in the category-sidebar plan) is to retire superseded components rather
  than leave dead code.

## Testing plan

- Unit test for `getCategoriesForKind`: uniques returns all 28 categories; sets returns a
  strict subset (assert a known-absent category like `charms` is excluded, and a
  known-present one like `boots` is included).
- Render test for `CategoryCardGrid`: given a category list, renders one link per
  category with the correct `href`.
- Render test for `CategoryItemList`: reuses the existing grade-tab test cases from the
  retired `ItemBrowser.test.tsx` (grade tabs shown/hidden correctly, filtering works),
  adapted to the new single-category-input shape.
- Build verification: confirm `generateStaticParams` produces the expected page count
  (28 unique categories + however many set categories, × 3 locales) and spot-check a
  couple of pages' rendered content per locale, consistent with every prior verification
  pass in this project.
- Manual + d2r.world spot-check: browse a few category pages per kind/locale, confirm
  grade-tab filtering still works, confirm 404 behavior for an invalid combination (e.g.
  `/items/set/charms`).
