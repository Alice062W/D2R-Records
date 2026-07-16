# Set Items Taxonomy Fix — Design

## Goal

Close the two Set Items gaps found comparing against d2r.world: (1) missing the
"browse by full Set name" view entirely (a list of all 34 sets, each showing its pieces
together with the set-level partial and full-set bonuses) — flagged and deferred in an
earlier session; (2) the slot-category browsing splits weapons into 13 separate
categories where d2r.world combines them into one "Weapons" tile.

## Background

d2r.world's Set Items page (`https://d2r.world/en-US/info/item/sets`) shows, in order:
1. A list of all set names (Arctic Gear, Hsarus' Defense, ... Heaven's Brethren), each
   tagged with its associated class where applicable, as the PRIMARY content.
2. A secondary category tab list at the bottom: **Weapons**, Helms, Armors, Shields,
   Belts, Boots, Gloves, Rings, Amulets — 9 categories, with all weapon types (and
   Grimoires) combined into one "Weapons" tile.

This project's current `/items/set` page goes straight to the category grid (28→21
populated slots, 13 of them weapon types) — there is no by-name browsing at all today.

**New data required.** `data/sets.json` (this project's generated file) is currently
built only from `vendor/d2data/json/setitems.json`, which stores each set item's own
*per-piece* partial bonuses (fields `aprop{1-5}{a-d}` — already extracted as each item's
`setBonuses` field, confirmed to differ per piece, e.g. Aldur's Advance's own partial
bonus is `+15 Dexterity` while Aldur's Gauntlet's own is `+15 Strength`). This is NOT the
same as the *set-level* bonuses d2r.world shows on a by-name set page: the real D2
"Sets.txt" equivalent — `vendor/d2data/json/sets.json`, confirmed present at the same
pinned commit, 35 entries — carries `PCode{2,3,4,5}a` (the set-level partial bonus
unlocked at N pieces worn, distinct from any single item's own per-item bonus) and
`FCode1-8` (the full-set bonus, unlocked only when every piece is worn). This file is not
yet vendored into this project and must be added.

## Design

### Data layer

- Vendor `vendor/d2data/json/sets.json` (35 entries) from the same pinned commit as
  every other vendored file.
- Extend `scripts/generate-grail-data.mjs` to produce a new generated file,
  `data/set-groups.json`: one entry per real D2 set (34-35, matching the vendored
  `sets.json`'s `index`/`name` keys), each with:
  - `setName: LocalizedText` (already used as the join key against `data/sets.json`'s
    existing `setName` field on each item — confirmed both sources use the identical
    English set name string, e.g. `"Aldur's Watchtower"`).
  - `pieceIds: string[]` — the `id`s of every item in `data/sets.json` whose `setName`
    matches, in a sensible display order (by `baseName`/slot, not file order).
  - `partialBonuses: { piecesRequired: number; stats: RawGrailStat[] }[]` — derived from
    `PCode{2,3,4,5}a`/`PMin{n}a`/`PMax{n}a`, reusing the same `extractProps`-family
    label/localization machinery already established (skill-ref disambiguation, etc.),
    just with this file's field-naming shape.
  - `fullSetBonuses: RawGrailStat[]` — derived from `FCode1-8`/`FMin{n}`/`FMax{n}`, same
    machinery. The `FCode7: 'state', FParam7: 'fullsetgeneric'` pattern seen on Aldur's
    Watchtower (and likely present on some/all other sets) is a cosmetic "full set
    active" flag rather than a real stat — investigate during implementation whether
    this needs filtering out of the displayed bonus list (showing "State:
    fullsetgeneric = 1" as a bonus line would be meaningless to a reader) or whether it
    already gets silently excluded by the existing extraction machinery's assumptions;
    do not guess, verify against the real distribution of `state`-coded entries across
    all 35 sets before deciding.

### Page layer

- **`/[locale]/items/set`** (currently the category grid) becomes the by-name list:
  each of the 34 sets rendered as a card/row linking to its own detail page, matching
  d2r.world's primary view. A new component (e.g. `SetGroupList`) replaces
  `CategoryCardGrid` as this page's content.
- **`/[locale]/items/set/[setName]`** (new dynamic route, one per real set): shows every
  piece in the set (reusing `ItemStatCard`, since each piece is a normal `GrailItem`),
  the set-level partial bonuses (2/3/4/5-piece tiers), and the full-set bonus —
  matching d2r.world's per-set detail layout.
- **`/[locale]/items/set/category/[category]`** (or similar path, TBD during
  implementation to avoid route collision with `[setName]`): the existing slot-category
  browsing, retained as the secondary view per the agreed design, but with all 13
  current weapon-type categories (`swords`, `daggers`, `axes`, `polearms`, `spears`,
  `clubs`, `maces`, `hammers`, `scepters`, `staves`, `orbs`, `wands`, `katars` — plus
  `grimoires`, which d2r.world also folds into Weapons for Sets specifically, unlike
  Unique/Base Items where Grimoires stays separate) combined into one `weapons`
  category slug. A link/toggle on the by-name page (and vice versa) lets users switch
  between the two views, matching d2r.world's own page structure (both views live on
  logically the same "Set Items" section).

## Non-goals

- No change to Unique Items or Base Items category structure (both confirmed to want
  their current per-weapon-type split, unaffected by this Set-Items-only combination).
- No change to the underlying `data/sets.json` per-item structure (each piece keeps its
  own `setBonuses` field exactly as today) — the new `data/set-groups.json` is an
  additive, separate file for the new by-name view, not a replacement.
- The `bar` Magic/Rare taxonomy gap and the Misc placeholder pages remain separate,
  already-agreed follow-ups.

## Testing plan

- Generator tests: `data/set-groups.json` has exactly 34 entries — one per set with at
  least one spawnable piece in the existing `data/sets.json`. Confirmed during
  design/research: the vendored `sets.json` has 35 total set definitions, but
  "Warlord's Glory" has zero spawnable pieces in `setitems.json` (already excluded from
  today's `data/sets.json` for the same reason every other non-spawnable item is
  excluded project-wide) — this is an expected, documented exclusion, not a bug to
  investigate further; `data/set-groups.json` should only include sets with at least
  one real piece, matching this project's established spawnable-only convention.
  correct piece count, partial-bonus tiers, and full-set bonus (spot-check Aldur's
  Watchtower's full-set bonus against the real vendored values shown above: All
  Resistances 50, Druid Skill Levels 3, Defense 150, Mana Steal 10, Mana 150, Enhanced
  Damage 350).
- Component tests: the by-name list renders all sets with correct links; the set detail
  page renders all pieces + both bonus tiers; the category page correctly combines all
  weapon types into one "Weapons" tile and no longer shows 13 separate weapon
  categories for Sets.
- Manual + d2r.world spot-check: compare the by-name list and at least 2 set detail
  pages (including the exact full-set bonus wording/values) directly against
  d2r.world; confirm the category page's "Weapons" tile shows the combined content.
