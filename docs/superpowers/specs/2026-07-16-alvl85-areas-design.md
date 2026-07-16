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
- **Which monsters appear per area, at Hell difficulty**: `vendor/d2data/json/levels.json`
  (already vendored) has `umon1`-`umon4` fields per level giving the Hell-difficulty
  monster codes. Cross-referencing the 32 alvl85 areas found 71 distinct monster codes.
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

- Vendor `vendor/d2data/json/monstats.json`.
- Add a small, explicit, hand-transcribed `MONSTER_TYPES` map (71 entries: monster code →
  `'animal' | 'demon' | 'undead'`) directly in the generator script, sourced from
  d2r.world's own Alvl85 Areas page, with the source cited in a comment — this is
  the ONLY hand-transcribed piece; area assignment, monster presence, and immunities
  are all generator-derived.
- Extend `scripts/generate-grail-data.mjs` to produce `data/alvl85-areas.json`: array of
  `{ areaName: LocalizedText, monsters: { code: string; name: LocalizedText; type:
  'animal' | 'demon' | 'undead'; immunities: { element: 'fire' | 'cold' | 'lightning' |
  'poison'; starred: boolean }[] }[] }`, one entry per alvl85 area (from
  `data/area-levels.json`), each listing its distinct Hell-difficulty monsters
  (deduplicated — the same monster code may appear via multiple `umon{n}` slots or
  across sub-level variants of one named area) with computed immunities.
- New page `/[locale]/monster/alvl85`: replaces the current `ComingSoonPage`
  placeholder, rendering a grouped list (area name as a sub-heading, followed by a
  small table of its monsters/type/immunities with the ★ marker), following this
  project's established list-page conventions.

## Non-goals

- The remaining Misc page (FCR/FHR/FBR) — separate, final follow-up.
- The `bar` Magic/Rare class-restriction taxonomy fix — separate, already-deferred
  follow-up.
- Any change to `data/area-levels.json` or the Area Level page (this plan only reads
  from that existing file).
- Sub-monster variants shown as indented rows on d2r.world (e.g. "└ Rock Worm Egg" under
  "Rock Worm") — investigate during implementation whether these appear in the same
  `umon{n}` fields as their parent or need separate handling; if the distinction can't
  be cleanly derived, list them as flat, undifferentiated monster rows rather than
  guessing at a nesting relationship not present in the raw data.

## Testing plan

- Generator tests: `data/alvl85-areas.json` has 32 entries (matching
  `data/area-levels.json`'s alvl85 filter exactly); a spot-checked area (e.g. Pit Level
  1) lists the correct monster set; a spot-checked monster (`vampire2`, confirmed
  `ResCo(H): 120`, `ResFi(H): 33`, `ResLi(H): 25`, `ResPo(H): 50` during design
  research) shows exactly one immunity — Cold, starred (120 ≥ 100 for the immunity
  threshold, and 120 ≥ 117 for the ★ threshold) — and no other element listed.
- Manual + d2r.world spot-check: the built page's monster/immunity lists match
  d2r.world's real content for a sample of areas, including the ★ marker logic.
