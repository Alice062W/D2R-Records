# Area Level Page — Design

## Goal

Build the Area Level Misc page (currently an unbuilt "Coming Soon" placeholder): a table
of every game area's monster level in Normal/Nightmare/Hell difficulty, matching
d2r.world's `https://d2r.world/en-US/info/monster/arealevel` content exactly.

## Background

Confirmed this is fully derivable from already-available vendored data:
`vendor/d2data/json/levels.json` is not yet vendored in this project but is available at
the same pinned commit; each of its 137 area entries (excluding non-level administrative
rows) has `*StringName` (display name), `Act` (0-4, matching Act I-V), and
`MonLvlEx`/`MonLvlEx(N)`/`MonLvlEx(H)` fields giving the exact Normal/Nightmare/Hell
monster level for that area — spot-checked against d2r.world directly: Dark Wood shows
5/38/68 on both d2r.world and in the raw `MonLvlEx` fields for that entry, confirming
this is the correct source field (not `MonLvl`, a different, lower value used for a
different purpose — verify this distinction holds for a few more areas during
implementation before trusting it project-wide).

d2r.world's page groups areas by Act (Act 1-5 tabs) — matching the existing
`ACTS`/`AREAS_BY_ACT` convention already used for the Grail Tracker's log-find dropdowns
in `src/lib/grail/zones.ts`, though that file is a hand-curated, non-exhaustive subset
(11-20 areas per act, "commonly-referenced farming/quest areas only") — NOT suitable for
reuse here, since this page needs every real area (137 total), not a curated subset.

## Design

- Vendor `vendor/d2data/json/levels.json`.
- Extend `scripts/generate-grail-data.mjs` to produce `data/area-levels.json`: array of
  `{ id, name: LocalizedText, act: number, normal: number, nightmare: number, hell:
  number }`, one entry per real level (excluding town/hub entries and any other
  administrative rows that don't represent a real playable area — investigate exactly
  which filter d2r.world itself applies, e.g. does it include town levels like Rogue
  Encampment at all, since towns have no monsters and a MonLvlEx of 0 or an
  unspecified value — verify against the real vendored data and d2r.world's shown row
  count before deciding the exact filter condition, rather than guessing).
- Localized names: confirmed `vendor/d2data/json/localestrings-chi.json` (already
  vendored, used elsewhere in this project for item names) has a direct entry keyed by
  the exact English display name for area names too (verified: a `"Dark Wood"` key
  exists) — reuse the same `chi[...]`/`toZhCn(...)` lookup pattern already established
  for item names in `localizedItemName`, keyed by `*StringName` instead of an item's
  `index`.
- New page `/[locale]/misc/area-level`: replaces the current `ComingSoonPage`
  placeholder, rendering a per-Act tab selector (matching d2r.world's Act1-5 tabs) and a
  table per act (Level Name / Normal / Nightmare / Hell), following this project's
  established table-page pattern (e.g. `MaxSocketsTable`).

## Non-goals

- The other 3 Misc pages (Level Up, Alvl85 Areas, FCR/FHR/FBR) — separate follow-ups.
- Any change to `src/lib/grail/zones.ts` (the Grail Tracker's curated dropdown list stays
  as-is, unrelated purpose).

## Testing plan

- Generator test: `data/area-levels.json` has the correct row count (verify exact count
  against d2r.world's real table during implementation, not assumed), and spot-checks
  Dark Wood's values (5/38/68) plus 2-3 more areas across different Acts.
- Manual + d2r.world spot-check: the built page's per-Act tables match d2r.world's
  real values for a sample of areas per act, in all 3 locales (or documented English-only
  if no localization source exists for area names).
