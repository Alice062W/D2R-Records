# Base Items, Runewords, Max Sockets — Design

## Goal

Build real content for three more d2r.world-equivalent sections, replacing their
placeholder pages: Base Items, Runewords, and Max Sockets. This is the next batch in an
ongoing effort to mirror all 14 of d2r.world's sections (11 remain placeholders after
this batch — see Non-goals).

## Background

Direct inspection of d2r.world this session confirmed each section's real layout:

- **Base Items** (`/info/item/base`): the same 27-category card grid pattern as
  Unique/Set Items, but each category page shows a **comparison table**, not stat cards
  — one row-group per weapon/armor "line" (e.g. Hand Axe → Hatchet → Tomahawk), with
  Normal/Exceptional/Elite as three side-by-side columns of the same stat rows (damage,
  level req, str/dex req, durability, speed, sockets, qlvl).
- **Runewords** (`/info/item/runewords`): not a card grid at all — a single page with
  item-type and socket-count filters, listing all runewords with their required runes,
  base restrictions, and granted stat bonuses.
- **Max Sockets** (`/info/misc/baseilvlsockets`): a static-looking table, 17 item-type
  rows × 3 item-level-tier columns of max socket counts.

Data investigation (this session) found the upstream MIT-licensed
`blizzhackers/d2data` repo (already vendored for the Grail feature, pinned commit
`477bcf63e964f39f4c774e588a79fd598ae472de`) has everything needed, previously unvendored:

- `items.json` (already vendored, 692 entries) has `normcode`/`ubercode`/`ultracode`
  fields that group each weapon/armor "line" across its three grade tiers — confirmed by
  direct inspection (Hand Axe/Hatchet/Tomahawk all share `normcode: "hax"`).
- `itemtypes.json` (already vendored) has `MaxSockets1/2/3` +
  `MaxSocketsLevelThreshold1/2` fields **per item type**, confirmed to match d2r.world's
  published table exactly for two spot-checked rows (axe: 4/5/6, helm: 2/2/3). This
  means the Max Sockets table is generated from real data, not hand-authored.
- `runes.json` (**not yet vendored** — needs adding) has the actual runeword effect
  stats (`T1Code1..7`/`T1Min1..7`/`T1Max1..7`/`T1Param1..7`), in the same
  code/min/max/par shape our existing `generate-grail-data.mjs` already knows how to
  parse and label (via the same `PROP_LABELS`/`localestrings-chi.json` lookup pattern
  used for uniques/sets).

The existing `data/bases.json` (41 curated items) and `data/thresholds.json` (a
descriptive rules summary) are used by the Appraiser feature and are **not** what this
plan builds — this plan generates a new, separate, complete dataset for these three
reference pages.

## Non-goals

- Magic Items, Rare Items, Runes, Cube Recipes, Crafted Items, Area Level, Alvl85 Areas,
  FCR/FHR/FBR, Level Up — each is a separate future batch. (Data investigation this
  session found `magicprefix.json`/`magicsuffix.json`, `rareprefix.json`/
  `raresuffix.json`, and `cubemain.json`/`cubemod.json` all exist upstream too, so most
  of these are feasible later — just out of scope for this pass.)
- Any change to the existing Appraiser-facing `data/bases.json` or `data/thresholds.json`
  — those stay exactly as they are.
- Any change to the Grail Tracker, or the Unique/Set Items pages built in the prior two
  plans.
- Icons — same accepted gap as before; text-only presentation throughout.

## Data layer

**New vendor file:** `vendor/d2data/json/runes.json` (181 entries), fetched from the
same pinned commit as every other vendored file in this project.

**New generator additions to `scripts/generate-grail-data.mjs`** (extending the existing
script rather than creating a new one, since it already has the exact `PROP_LABELS`/
skill-name/locale-resolution machinery this needs):

- `data/bases-full.json`: one entry per weapon/armor "line" (grouped by `normcode`),
  each with `{ id, slotCategory, grades: { normal, exceptional, elite } }`, where each
  grade is `null` if that tier doesn't exist (some lines only have 1-2 tiers) or an
  object with the localized name and the comparison-table stat fields (damage range,
  level req, str/dex req, durability, speed, sockets, qlvl) — all `LocalizedText` for
  name fields, following the same locale pattern as `uniques.json`/`sets.json`.
- `data/runewords-full.json`: replaces the current hand-authored `data/runewords.json`
  (93 entries, name/sockets/itemTypes/runes/level/ladderOnly only) with a generated
  version that adds the parsed effect stats from `runes.json`, using
  `RawGrailStat`-shaped `{ key, label: LocalizedText, min, max }` entries — reusing the
  exact same stat-label resolution the uniques/sets generator already has, not a new
  labeling scheme.
- `data/max-sockets.json`: one entry per relevant item type from `itemtypes.json`
  (filtered to the 17 categories d2r.world shows — Circlets, Barbarian Helms, Druid
  Helms, Helms, Shrunken Heads, Paladin Shields, Shields, Armors, Necromancer Wands,
  Daggers, Assassin Katars, Sorceress Orbs, Amazon Bows, Scepters, Axes, Staves,
  Grimoires, Other Weapons — to be confirmed exactly against d2r.world during planning),
  each with `{ itemType: LocalizedText, ilvl1to25, ilvl26to40, ilvl41plus }` (plain
  numbers, generated directly from `MaxSockets1/2/3`).

All three new JSON files are `.gitignore`d generation output like `uniques.json`/
`sets.json`, regenerated via an npm script (extending the existing
`generate:grail` script or adding a sibling one — to be decided in planning) rather than
hand-edited.

## Pages

**`/[locale]/items/base`** (currently a placeholder): becomes a landing page with the
same `CategoryCardGrid` component already built for Unique/Set Items, reusing it as-is
— no new grid component needed. Categories computed from `data/bases-full.json`'s
distinct `slotCategory` values, same pattern as `getCategoriesForKind`.

**`/[locale]/items/base/[category]`** (new dynamic route): shows every "line" in that
category as a comparison table (new `BaseItemTable` component — one table per line,
3 columns for the tiers that exist, blank/dashed for tiers that don't, matching
d2r.world's presentation of partial lines).

**`/[locale]/items/runewords`** (currently a placeholder): a single page, not a
card-grid flow. New `RunewordFilters` component (item-type + socket-count filters,
client-side state) + `RunewordList` component rendering each matching runeword's name,
required runes in order, base types, level requirement, ladder-only badge, and effect
stats (reusing `ItemStatCard`'s "Magic Properties" list-rendering pattern for
consistency, not a new stat-rendering scheme).

**`/[locale]/misc/max-sockets`** (currently a placeholder): a single static table
component, `MaxSocketsTable`, rendering `data/max-sockets.json` directly — no filtering,
no client state, a Server Component.

## Testing plan

- Generator unit tests: `bases-full.json` groups lines correctly (spot-check the known
  Hand Axe → Hatchet → Tomahawk grouping), `runewords-full.json` has 93 entries with
  non-empty effect stats for every entry, `max-sockets.json` values match the two
  spot-checked rows above (axe 4/5/6, helm 2/2/3) plus a few more.
- Render tests: `BaseItemTable` handles a 3-tier line and a 1-tier line (some base
  lines never got exceptional/elite versions) without crashing; `RunewordFilters` +
  `RunewordList` filter correctly by item type and socket count; `MaxSocketsTable`
  renders all 17 rows.
- Build + manual + d2r.world spot-check, consistent with every prior plan in this
  project: confirm `/items/base`, `/items/runewords`, `/misc/max-sockets` and their
  sub-routes render correctly in all 3 locales, and spot-check a few base lines,
  runewords, and socket-table rows against d2r.world directly.
