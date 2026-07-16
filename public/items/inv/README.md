# Item inventory icons

**Status: populated.** 623 PNG icons, self-extracted by the site owner from their own
legally-owned Diablo II: Resurrected install (CascView to pull `.dc6` files from
`data\global\items\`, then `dc6png` to convert them to PNG using the game's own palette —
see `docs/icon-extraction-instructions.md` for the full extraction steps). These are
Diablo II game art © Blizzard Entertainment, used here as personal, non-commercial fan
content, the same basis every D2 fan database's icons ultimately rest on — not covered by
this repository's open-source licensing.

Confirmed 100% coverage: every one of the 213 distinct `invFile` values referenced across
`data/uniques.json`/`data/sets.json` has a matching PNG here.

Filenames match the game's `invFile` key exactly (e.g. `invhaxu.png` for The Gnasher's base
item, Hand Axe). `ItemStatCard.tsx` and `GrailItemDetail.tsx` render these at
`/items/inv/<invFile>.png` and gracefully fall back to no icon (not a broken-image glyph)
if a file is ever missing for a future catalog addition.

## Prior history

This directory previously shipped empty — no redistributable pre-extracted icon source
could be found anywhere on GitHub or elsewhere (bulk-scraping fan sites or another
project's extracted-asset dump was ruled out as equivalent to finding no source at all).
See git history on this file for the full search log if useful context for future
extraction/licensing questions.
