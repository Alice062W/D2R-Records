# Item Inventory Icons — Design

## Goal

Render real item icons (inventory sprites) on Unique/Set item cards and detail views, now
that a legitimately self-extracted set of 623 `inv*.png` files (from the user's own owned
D2R install, via CascView + `dc6png`) has been pushed to the `add-item-icons` branch.
Previously `public/items/inv/` shipped empty because no redistributable source existed (see
`public/items/inv/README.md`'s prior rationale) — this replaces that empty state.

## Background

- Every `GrailItem` (uniques + sets) already carries an `invFile: string` field
  (`src/lib/grail/catalog.ts:38,71,98`), populated from the vendored D2 data during an
  earlier plan, but nothing currently reads it — no `<img>` tag exists anywhere in the
  codebase referencing it.
- Confirmed: all 213 distinct `invFile` values used across `data/uniques.json`/
  `data/sets.json` are present among the 623 extracted PNGs (100% coverage) — no gaps to
  design a fallback matrix around, but the render-time fallback (below) stays as defense in
  depth in case a future catalog addition introduces an `invFile` this set doesn't cover.
- Exactly two shared components render every unique/set item's name and stats:
  `src/components/items/ItemStatCard.tsx` (used by `CategoryItemList.tsx`, i.e. every
  Base/Unique/Set Items category page) and `src/components/grail/GrailItemDetail.tsx` (used
  by `GrailChecklist.tsx`, i.e. the Grail Tracker). Wiring icons into these two covers every
  place an item is shown site-wide — no other component needs to change.
- Base Items, Runewords, Cube Recipes, Crafted Items, Magic/Rare Items, and the
  category-grid landing pages have no per-item icon concept (base items aren't a single
  sprite in the same way, and category grids show category names, not individual items) —
  out of scope, confirmed with the user.

## Non-goals

- Icons on category-grid landing pages (they show category labels, not items).
- Icons for Base Items / Runewords / Cube Recipes / Crafted Items / Magic / Rare Items
  (none of these have a per-entry sprite in the source data model).
- Any change to the icon *extraction* process (already done, on the `add-item-icons`
  branch) — this plan only consumes the already-extracted files.
- A build-time asset-existence check / CI gate (see Testing plan for why this is deferred).

## Design

**Bring in the assets:** merge `add-item-icons` (623 PNGs already committed to
`public/items/inv/`) into this feature's branch as the first step.

**Rendering:** in both `ItemStatCard.tsx` and `GrailItemDetail.tsx`, add a small `<img>`
(w-10 h-10, `object-contain`) immediately to the left of the item name, inside a flex row
wrapping the existing name/setName block. Rendered only when `item.invFile` is non-empty;
`src="/items/inv/${item.invFile}.png"`. An `onError` handler sets a small piece of local
state to hide the broken-image icon (falls back to today's no-icon layout) rather than
showing the browser's broken-image glyph — this is the "defense in depth" fallback for any
future `invFile` this extracted set doesn't cover. `alt=""` (decorative; the name text
already conveys the same information to screen readers) with the image itself marked
`aria-hidden` for redundancy.

Since this project is a static export (`output: 'export'`) and the existing codebase uses
plain `<img>` tags nowhere yet but also has no `next/image` usage precedent to follow, a
plain `<img>` (not `next/image`) is used — consistent with keeping the export fully static
with no image-optimization server dependency.

**Documentation:** rewrite `public/items/inv/README.md` to record the actual provenance
(self-extracted by the site owner from their own legally-owned D2R install, via CascView +
`dc6png`, per the existing `docs/icon-extraction-instructions.md` guide) in place of the
"ships empty, no source found" narrative, and note the 213/213 coverage confirmed for the
current catalog plus the graceful-fallback behavior for any future gap.

## Testing plan

- Component tests: `ItemStatCard.test.tsx` and `GrailItemDetail.test.tsx` (or equivalent),
  extended to assert (a) an item with a non-empty `invFile` renders an `<img>` with the
  correct `src`; (b) an item with an empty `invFile` renders no `<img>` at all (matching the
  existing empty-`invFile` test fixture already present in `ItemStatCard.test.tsx:35`).
- No new coverage-of-all-213-files test is added at this stage: verifying every one of the
  213 PNGs actually opens as a valid, non-corrupt image is a one-time manual/`file` check
  during Task 1 (merging the branch), not an ongoing generated-artifact concern the way
  `data/*.json` is elsewhere in this project — the icons aren't generated or transformed by
  this project's own code, so there's no logic bug class for a repeated test to guard
  against.
- Manual + browser verification: load a Unique Items category page and the Grail Tracker in
  the browser, confirm icons render for a handful of real items (e.g. "The Gnasher" /
  `invhaxu`), and confirm the empty-`invFile` fallback still degrades to no-icon (not a
  broken-image glyph) by temporarily checking one item whose `invFile` doesn't resolve (or,
  since coverage is 100%, by testing the `onError` path via the existing empty-string test
  fixture instead of hunting for a real gap).
