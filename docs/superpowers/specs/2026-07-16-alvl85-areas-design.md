# Alvl85 Areas — Design

## Goal

Build the Alvl85 Areas Misc page (currently an unbuilt "Coming Soon" placeholder): for
every area whose Hell-difficulty monster level is 85 (the highest possible, meaning
"perfect" item drops), list every monster present and its elemental immunities —
matching d2r.world's `https://d2r.world/en-US/info/monster/alvl85` content.

## Background

Confirmed derivable, mostly from data already vendored/generated in this project:

- **Which areas qualify**: `data/area-levels.json` (built in the Area Level plan)
  already identifies every area with `hell === 85` — 32 areas, matching d2r.world's
  area list exactly (Pit Level 1/2, Mausoleum, Stony Tomb 1/2, Ancient Tunnels, Arachnid
  Lair, Swampy Pit 1/2/3, The Chaos Sanctuary, The Worldstone Keep 1/2/3, Throne of
  Destruction, etc.). No re-derivation needed — reuse this file directly.
- **Which monsters appear per area, at Hell difficulty — REVISED, see below**:
  `vendor/d2data/json/levels.json`'s `umon1`-`umon4` fields per level were initially
  assumed sufficient for this, but cross-checking against d2r.world's real content
  found they're **incomplete** for several areas (e.g. River of Flame's raw fields give
  only 4 monster codes, while d2r.world's real list has 9, several with no match in the
  raw fields at all — likely because the real spawn pool also includes boss/superunique
  packs or theme-based extra monster pools not captured by the plain `umon{n}` fields,
  which weren't identified in this vendored data during this session's research). Per
  explicit user direction, the full area→monster→immunity table is instead
  **hand-transcribed from d2r.world** as the source of truth (ground-truth data captured
  this session, embedded in the implementation plan) — the same policy basis as the
  Level Up guide. `monstats.json`'s Hell resistances are still used as an independent
  cross-check for immunity values where a monster's code can be confidently identified,
  but are no longer the sole/primary derivation path.
- **Elemental immunity per monster**: a new file, `vendor/d2data/json/monstats.json`
  (not yet vendored), has each monster's Hell-difficulty elemental resistances
  (`ResFi(H)`, `ResCo(H)`, `ResLi(H)`, `ResPo(H)`) — a monster is immune to an element
  when its resistance is ≥100. d2r.world additionally marks a monster with a ★ when
  Fire/Cold/Lightning resistance is ≥117 or Poison resistance is ≥112 (a stricter
  threshold representing resistance that certain skills/items, like Infinity's -%
  Enemy Resistance or Lower Resist, cannot reduce below the immunity floor) — this
  exact threshold is directly computable from the same resistance fields, not a
  separate data source.
- **Monster display name**: `monstats.json`'s `NameStr` field is an internal reference
  key, not a localized display string, matching this project's established pattern for
  monster/item names — the actual in-game name comes from a string-table lookup.
  Investigate during implementation whether `NameStr` (or a related field) has a direct
  `localestrings-chi.json` entry the same way item/area names do, verifying before
  assuming — if not, this may need the same kind of targeted research the property-label
  and item-name work in this project has repeatedly required.
- **Monster Type (Animal/Demon/Undead)**: NOT reliably derivable from `monstats.json` —
  investigated the `hUndead` flag specifically and found it's inconsistently set (present
  and `1` on some genuinely-undead monsters like `vampire2`, but absent/undefined on
  other obviously-undead monsters like `skeleton1`/`zombie2`/`mummy1`), and no
  Animal/Demon/Undead classification field exists anywhere else in the vendored data.
  Per this project's established policy (same basis as the Level Up guide's hand-transcribed
  content): hand-transcribe the Type column from d2r.world for these 71 specific
  monster codes (a deterministic classification fact with no clean raw-data equivalent),
  not the full 751-monster roster — source cited in a code comment.

## Design

- A single hand-authored static TypeScript data file,
  `src/lib/grail/alvl85Areas.ts`, containing the complete area → monster → type →
  immunity table transcribed from d2r.world (32 areas, ~130 monster rows including
  sub-monster/egg variants shown as flat rows — d2r.world's own indentation is a display
  nicety, not a data relationship this project needs to model). Source cited in a code
  comment, matching the Level Up guide's precedent. This does NOT go through
  `scripts/generate-grail-data.mjs` (no reliable raw vendored source for the full
  roster, confirmed above).
- `vendor/d2data/json/monstats.json` is fetched for RESEARCH ONLY during
  implementation (to spot-check a handful of immunity values against Hell-difficulty
  resistances where a monster's code can be confidently identified) — it is not
  vendored into the repo unless it ends up used as a real build input elsewhere; if
  fetched only for this cross-check, delete it afterward rather than leaving an unused
  vendored file (same convention already established in this project for
  research-only fetches).
- New page `/[locale]/monster/alvl85`: replaces the current `ComingSoonPage`
  placeholder, rendering a grouped list (area name as a sub-heading, followed by a
  small table of its monsters/type/immunities with the ★ marker), following this
  project's established list-page conventions.

## Non-goals

- The remaining Misc page (FCR/FHR/FBR) — separate, final follow-up.
- The `bar` Magic/Rare class-restriction taxonomy fix — separate, already-deferred
  follow-up.
- Any change to `data/area-levels.json` or the Area Level page.
- Modeling sub-monster/egg variants as a nested relationship — they're flat rows in the
  hand-transcribed table, matching what's actually derivable (no clean parent-child
  data relationship was found for these during research).
- Fully re-deriving the area→monster roster from raw vendored data — investigated this
  session and found `levels.json`'s `umon{n}` fields are incomplete for several areas
  (confirmed: River of Flame's raw fields yield only 4 of the 9 real monsters); the true
  mechanism (likely boss/superunique tables or theme-based extra pools) was not
  identified and is out of scope for this pass.

## Testing plan

- Data test: the static table has exactly 32 area entries, and the total monster-row
  count and content matches the hand-transcribed source exactly (spot-checked, not
  exhaustively re-verified line-by-line in the test — the data literal itself is the
  primary correctness artifact, same as the Level Up guide).
- Component test: the page renders area names, monster rows, type, and immunity
  (including the ★ marker) correctly for a sample area.
- Manual + d2r.world spot-check: the built page's monster/immunity lists match
  d2r.world's real content for a sample of areas, including the ★ marker logic and the
  "Night Lord" case (Undead in Ruined Temple/Disused Fane/Forgotten Reliquary vs. Animal
  in Infernal Pit — both are real, distinct d2r.world rows, not a data error to
  reconcile).
