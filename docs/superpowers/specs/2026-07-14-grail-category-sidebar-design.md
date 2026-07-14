# Grail Category Sidebar Navigation — Design Spec

_Follow-up to the 2026-07-13 grail item reference work. Replaces the single long
scrolling page (28 stacked slot sections + sticky jump bar) with a category-sidebar
navigation model matching d2r.world's actual UX: pick a category on the left, see
only that category's items — fully expanded — on the right._

## Problem

The current `/grail` page renders all 28 slot-category sections on one page. Even with
the sticky jump bar from the prior work, this is "very hard to navigate" per direct
user feedback — every category's full item list is always present in the DOM and the
page, just scrolled past, not actually separated.

## Goals

1. Only the selected category's items are shown at a time.
2. Every item in the selected category is fully expanded — same content the current
   modal shows (Item Stats, Magic Properties with ranges, Set Bonuses, Your Copies) —
   with no additional click needed to see stats.
3. Default (no category selected) state shows an overall progress summary, not an
   item list — matching d2r.world's own landing behavior (confirmed by loading their
   unique-items page directly: it shows a category tile grid, not a list, until a
   category is picked).
4. Sidebar collapses to a dropdown/menu button on narrow screens.

## Non-goals

- No icons in this pass. [Task 4 of the item reference plan](../../../public/items/inv/README.md)
  found no legitimate open icon source; icon extraction from the owner's own D2R
  install (a separate machine) is tracked as an independent, manual, off-session
  effort (see the companion extraction guide). This layout must render correctly
  with zero icon files, exactly as today.
- No URL/query-param reflection of the selected category (e.g. `?category=helms`).
  Not requested; client-side component state is sufficient. Can be added later
  without disrupting this design if deep-linking is ever wanted.
- No changes to the finds pipeline, auth, comparator, log-find form, or the
  item-picker dropdown (still grouped by slot, unaffected by this work).
- No changes to `data/uniques.json`/`data/sets.json` generation — this is presentation
  layer only, consuming the catalog fields already produced by prior work
  (`slotCategory`, `grade`, `baseName`, `stats`, `fixedStats`, `setBonuses`, `invFile`).

## Layout

### Sidebar (left, persistent on desktop)
- Lists all `SLOT_ORDER` categories (from `src/lib/grail/catalog.ts`) that have at
  least one item, in the existing armor→jewelry→weapons order.
- Each entry shows the category label (`t('slot_' + slot)`) and a `found/total` count
  for that category, matching what section headers show today.
- Clicking an entry sets it as the active category; the active entry is visually
  highlighted (existing amber accent color, matching the rest of the site's active/
  selected-state convention).
- Below the `md` breakpoint (768px — the same threshold the item grid already used
  for its column-count responsiveness in the prior task), the sidebar collapses into
  a button that opens a dropdown/menu of the same category list; selecting a category
  closes the dropdown. At `md` and above, the sidebar is a persistent left column.

### Right panel
- **No category selected** (initial page load): shows the overall progress line
  ("X / 538 items found", same text/format as today's top-of-page summary) and a
  prompt to select a category from the sidebar. No item content rendered.
- **Category selected**: renders every item in that category, in the existing
  `sortItemsForDisplay` order (grade, then required level). Each item renders fully
  expanded — this is today's `GrailItemDetail` modal content, stripped of its modal
  chrome (no backdrop, no close button, no fixed positioning) and rendered as a plain
  block in a vertical list. If the owner has logged finds for that item, "Your
  Copies" renders inline directly below Magic Properties/Set Bonuses, same
  best-first, `value (min–max)` comparison format as today.
- The "Log a find" button stays visible in the right panel (or page header) regardless
  of category selection state, unchanged in behavior.

## Component changes

- **New `src/components/grail/GrailCategorySidebar.tsx`**: renders the category list
  from `SLOT_ORDER`, receives `activeSlot`/`onSelect` props, computes per-category
  found counts from the same `findsById` map `GrailChecklist` already builds, handles
  its own mobile collapse/dropdown state internally.
- **`src/components/grail/GrailItemDetail.tsx`**: modal chrome (backdrop `onClick`,
  fixed/z-50 positioning, close button) removed; becomes a plain block component
  rendering the same Item Stats / Magic Properties / Set Bonuses / Your Copies
  content. Prop signature simplifies to `{ item: GrailItem; finds: FindRecord[] }`
  (no `onClose`, since there's nothing to close).
- **`src/components/grail/GrailItemCard.tsx`**: removed. Its compact-card
  representation (icon + name + copies summary) has no remaining caller once the
  grid-of-cards view is replaced by the always-expanded list.
- **`src/components/grail/GrailChecklist.tsx`**: becomes the layout shell — holds
  `activeSlot` state (`string | null`, starts `null`), renders
  `GrailCategorySidebar` alongside either the empty-state summary or the mapped list
  of `GrailItemDetail` blocks for the active category's items. The sticky jump-bar
  `<nav>` from the prior task is removed (superseded by the sidebar).
- **`src/lib/grail/catalog.ts`, `src/lib/grail/bestCopy.ts`, `src/lib/grail/findsApi.ts`,
  `src/components/grail/LogFindForm.tsx`, `src/components/grail/AuthGate.tsx`**:
  unchanged. `SLOT_ORDER`/`sortItemsForDisplay` are reused as-is.

## i18n

New strings needed: an empty-state prompt (e.g. "Select a category to view items").
Existing `slot_*`, `progressCount`, and all `GrailItemDetail`-sourced keys are reused
unchanged. New keys follow the established convention: added to the `Grail` namespace
in all three message files, English text duplicated (translation remains deferred).

## Testing

Manual verification, consistent with how this project verifies UI (no new automated
tests planned, matching the precedent set by the prior grail UI work):
- Sidebar renders all categories with correct counts; empty state shows on load.
- Selecting each of a representative sample of categories shows the right items,
  fully expanded, matching what the old modal used to show for the same items.
- Logged finds render inline under the correct item.
- Mobile viewport: sidebar collapses to a dropdown; selecting a category from it
  updates the right panel and closes the dropdown.
- Full verification chain (`npx tsc --noEmit && npm run lint && npm test && npm run
  build`) clean; all three locale `/grail` pages still build.

## Open questions / deferred

- Icon extraction from the owner's own D2R install — separate, manual, off-session
  effort; not blocking this layout work (see companion extraction guide document).
- URL/deep-linking to a specific category — not requested, deferred.
