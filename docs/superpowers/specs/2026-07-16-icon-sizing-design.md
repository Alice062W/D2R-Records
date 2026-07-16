# Item Icon Sizing/Layout — Design

## Goal

Fix item inventory icons rendering too small on `ItemStatCard.tsx` (Base/Unique/Set Items
browsing) and `GrailItemDetail.tsx` (Grail Tracker), matching d2r.world's presentation
more closely: a prominent left-column icon, not a tiny inline thumbnail squeezed next to
the name.

## Background

Confirmed via direct comparison: d2r.world (e.g.
`https://d2r.world/zh-TW/info/item/sets/weapons` → any individual item, such as Angelic
Mantle) shows the item sprite as a substantial left-column image (roughly 80-100px wide,
taller for armor/weapon sprites, shorter/wider for shields/helms), with the item's name
and stat rows in a column to its right. The current implementation
(`w-10 h-10` = 40×40px, inline immediately before the name text, from the icon-wiring
plan two sessions ago) is much smaller and reads as a small decorative bullet rather than
a real item-visual, which is what the user flagged.

## Design

In both `ItemStatCard.tsx` and `GrailItemDetail.tsx`:

- Increase the icon size from `w-10 h-10` (40px) to `w-20 h-20` (80px).
- Keep `object-contain` (preserves each sprite's real aspect ratio — D2 inventory sprites
  vary widely in shape: a two-handed sword is much taller than a ring or amulet).
- Keep the existing `flex items-start gap-3` row structure (icon + name/stats column) —
  this already places the icon in a left position relative to the name block; increasing
  its size is sufficient to read as a real item visual without a full two-column page
  rebuild. `items-start` (already present) keeps the icon aligned to the top of the name
  block rather than vertically centered against the whole card, which matters more now
  that the icon is large enough to be visually dominant.
- No change to the `onError` fallback behavior, `alt`/`aria-hidden` attributes, or the
  conditional (`item.invFile && !iconFailed`) — only the size class changes.
- No change to `public/items/inv/` assets, the `invFile` data field, or any other
  component.

## Non-goals

- An exact pixel-for-pixel match of d2r.world's bordered/boxed icon container style —
  the user confirmed a closer-but-not-identical sizing/layout fix is sufficient for this
  pass.
- Category-grid landing page icons (separate, already-agreed follow-up sub-project).
- Any change to icon sizing elsewhere (there is no "elsewhere" — these are the only two
  components that render item icons, confirmed in the icon-wiring plan's final review).

## Testing plan

- Update the existing icon-rendering tests in `ItemStatCard.test.tsx` and
  `GrailItemDetail.test.tsx` (added during the icon-wiring plan) to assert the new size
  class (`w-20 h-20`) instead of the old one, if the test currently asserts a specific
  className — check first, since the existing tests may only assert `src`/`alt`, in which
  case no test change is needed beyond a visual/manual check.
- Manual + browser verification: load a Unique/Set Items category page and the Grail
  Tracker, confirm icons render visibly larger and don't look disproportionate or
  distorted against the card layout at both desktop and mobile widths.
