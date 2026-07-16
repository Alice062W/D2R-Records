# Category Taxonomy Fix (Base Items Sub-Tabs + Magic/Rare Granular Split) — Design

## Goal

Close two related but distinct taxonomy gaps found during the full-site d2r.world
comparison:

1. **Base Items**: the Helms and Shields categories are missing d2r.world's in-page
   sub-tabs (Helms → Circlets/Barbarian Helms/Druid Helms; Shields → Paladin
   Shields/Shrunken Heads/Grimoires).
2. **Magic Items / Rare Items**: 12 of the 37 real category slugs in
   `data/magic-affixes.json` are generic/class-fallback codes (`amaz`, `armo`, `bar`,
   `blun`, `h2h`, `mele`, `miss`, `rod`, `shld`, `staff`, `thro`, `weap`) instead of
   d2r.world's real, more granular categories.

## Background

Confirmed against d2r.world directly:

- **Base Items** (`https://d2r.world/en-US/info/item/base`) has 23 flat top-level
  categories (no separate Circlets/Barbarian Helms/Druid Helms/Paladin
  Shields/Shrunken Heads/Grimoires tiles at the top level) — but the individual
  **Helms** page (`.../base/helms`) has in-page tabs "Helms, Circlets, Barbarian Helms,
  Druid Helms", and the **Shields** page (`.../base/shields`) has in-page tabs
  "Shields, Paladin Shields, Shrunken Heads, Grimoires". This is a different UI pattern
  from Unique/Set Items (which stay flat, no sub-tabs, confirmed unchanged) and from
  Magic/Rare Items (below).
- **Magic Items** (`https://d2r.world/en-US/info/item/magic`) has 38 flat top-level
  categories, more granular than our current 37 raw itype-derived slugs: it separates
  Barbarian Helms / Druid Helms / Circlets / Helms as four distinct top-level tiles (we
  currently collapse all of these into either `helms` or the generic `bar` fallback);
  Paladin Shields / Shrunken Heads / Grimoires / Shields as four distinct tiles (we
  collapse into `shields` or the generic `shld` fallback); Amazon Spears / Spears,
  Amazon Bows / Bows, Amazon Javelins (we collapse the Amazon-restricted variants into
  the generic `amaz` fallback); Sorceress Orbs, Necromancer Wands, Assassin Katars (we
  have generic `orb`/`wand`/`h2h` duplicated as both the real slot AND a coincidentally
  identically-named generic fallback — see Data layer); Throwing Axes / Throwing Knives
  (we collapse into the generic `thro` fallback); and Grand Charms / Large Charms /
  Small Charms (we collapse all into one `charms` slug).

Both underlying data sources already carry the information needed:

- `vendor/d2data/json/items.json`: every Helm/Shield base item's `type` field already
  distinguishes `helm`/`pelt`/`phlm`/`circ` (Helms family) and `shie`/`ashd`/`head`
  (Shields family) — confirmed directly (e.g. `cap`→`helm`, `dr1`→`pelt`, `ba1`→`phlm`,
  `ci0`→`circ`; `buc`→`shie`, `pa1`→`ashd`, `ne1`→`head`). `data/bases-full.json`
  currently discards this distinction, storing only the already-collapsed
  `slotCategory: 'helms'`/`'shields'`.
- `vendor/d2data/json/magicprefix.json`/`magicsuffix.json`: affix `itype{n}` restriction
  fields already use the granular codes directly (`phlm`, `pelt`, `circ`, `ashd`, `head`,
  `aspe`, `abow`, `ajav`, `taxe`, `tkni`, `orb`, `wand`, `h2h`, `scha`, `mcha`, `lcha`, all
  confirmed present in the raw data) — `data/magic-affixes.json`'s generation just maps
  all of these (and more) through the same shared, intentionally-coarse `TYPE_TO_SLOT`
  used by uniques/sets/bases, which is why they collapse or fall back to a raw code.

## Design

### Part A — Base Items sub-tabs (Helms, Shields)

- Extend `scripts/generate-grail-data.mjs`'s base-item generation to also emit a
  `subCategory` field on every `helms`/`shields` entry, derived directly from the raw
  `type` (`helm`→`null` — the plain "Helms" tab itself needs no sub-label, `pelt`→`'druid'`,
  `phlm`→`'barbarian'`, `circ`→`'circlet'`; `shie`→`null`, `ashd`→`'paladin'`,
  `head`→`'shrunkenHeads'`; `grim`, already its own top-level `slotCategory`, is
  unaffected — Grimoires is NOT nested under Shields for Base Items despite being nested
  under Shields for the affix-restriction taxonomy investigated for Part B; confirmed by
  direct d2r.world inspection that Base Items' Grimoires stays a top-level category, only
  Circlets/Barbarian Helms/Druid Helms nest under Helms and Paladin Shields/Shrunken
  Heads nest under Shields).
- The Base Items category detail page/component (`BaseItemTable`/its container — read the
  actual current component before implementing to confirm the exact file(s) and
  props) gets a small in-page tab selector for exactly these two categories (`helms`,
  `shields`), filtering the displayed rows by `subCategory`. Every other category
  renders exactly as it does today (no sub-tabs).

### Part B — Magic/Rare Items granular category split

- Add a SECOND, more granular type-to-slug map used ONLY by the `magic-affixes.json`
  generation step (`data/magic-affixes.json`'s `itemTypesForAffix` function), separate
  from the shared `TYPE_TO_SLOT` (which stays as-is for uniques/sets/bases — those are
  confirmed to want the coarser grouping). This new map resolves:
  - `phlm`→`barbarianHelms`, `pelt`→`druidHelms`, `circ`→`circlets` (in addition to,
    not replacing, the existing flat `helm`→`helms`)
  - `ashd`→`paladinShields`, `head`→`shrunkenHeads` (in addition to `shie`→`shields`)
  - `aspe`→`amazonSpears`, `abow`→`amazonBows`, `ajav`→`amazonJavelins` (in addition to
    the base `spea`→`spears`, `bow`→`bows` — the plain, non-class-restricted variants of
    these weapon types still resolve to their existing flat slug)
  - `taxe`→`throwingAxes`, `tkni`→`throwingKnives` (replacing the generic `thro`
    fallback entirely, since every throwing-weapon affix restriction in the vendored
    data uses one of these two specific codes, not a generic "any throwing weapon" code
    — verify this claim against the real data during implementation before removing the
    `thro` fallback path)
  - `scha`→`smallCharms`, `mcha`→`largeCharms`, `lcha`→`grandCharms` (replacing the
    single `charms` slug for Magic/Rare Items specifically — Unique/Set Items keep the
    single `charms` slug, confirmed unaffected)
  - **Supertype expansion (the remaining 8-9 generic codes: `weap`, `armo`, `shld`,
    `mele`, `miss`, `blun`, `rod`, `thro`, `amaz`)**: these are confirmed to be genuine
    abstract supertype/class-restriction codes in `vendor/d2data/json/itemtypes.json`
    (e.g. `weap`="Weapon", `armo`="Any Armor", `shld`="Any Shield" — itself a subtype of
    `armo` — `mele`/`miss` are weapon subtypes of `weap`, `blun` is a subtype of `mele`,
    `rod` a subtype of `blun`, `thro` a subtype of `weap`, `amaz` is an
    Amazon-class-restriction wrapper). `itemtypes.json` encodes the real type hierarchy
    via each type's `Equiv1`/`Equiv2` parent-link fields (e.g. `aspe` — Amazon Spear —
    has `Equiv1: 'spea'` and `Equiv2: 'amaz'`, meaning it IS-A Spear AND IS-A Amazon
    Item simultaneously). This means a supertype-restricted affix (e.g. one with
    `itype1: 'weap'` and nothing else) genuinely applies to every leaf weapon category —
    matching d2r.world's real behavior of showing that affix on every applicable specific
    category page, not one generic catch-all tile. Fix: replace the flat
    per-itype-code lookup with an ancestor-closure expansion — for each of the ~38 real
    leaf category slugs (every specific code: `helm`, `pelt`, `phlm`, `circ`, `shie`,
    `ashd`, `head`, `belt`, `boot`, `glov`, `ring`, `amul`, `scha`, `mcha`, `lcha`, `jewl`,
    `swor`, `knif`, `axe`, `pole`, `spea`, `aspe`, `club`, `mace`, `hamm`, `scep`, `staf`,
    `orb`, `wand`, `grim`, `h2h`, `bow`, `abow`, `xbow`, `jave`, `ajav`, `taxe`, `tkni`),
    compute its full ancestor set by walking `Equiv1`/`Equiv2` links up
    `itemtypes.json` until no further parent exists. An affix restricted to raw code `X`
    (leaf or supertype) belongs to every leaf slug whose ancestor set contains `X` (a
    leaf code trivially contains itself). This single mechanism handles ALL restriction
    codes uniformly — no separate special-casing needed for "generic" vs "specific"
    codes, and no residual generic-fallback list remains once this is in place.
  - `bar` deserves a special note: unlike the codes above, it is NOT reached via
    `itype{n}` at all in the real data (confirmed: zero `itype`-field occurrences across
    all active affixes) and is NOT present in `itemtypes.json` at all — it's purely a
    value of the affix's separate `class` field (a Barbarian-class restriction, handled
    today by the existing class-based fallback added during the original Magic/Rare
    build). Confirmed this is a genuinely different mechanism from the `itype`-based
    ancestor tree (`amaz`'s equivalence-tree membership is a coincidence of how
    Amazon-specific weapon types happen to be modeled as `itype` subtypes — Barbarian
    restrictions aren't modeled the same way anywhere in the vendored data). Expanding
    `class`-restricted affixes onto every category a given class can equip would need a
    hand-authored "class → equippable categories" table (a materially different,
    additional mechanism, not a reuse of the `itype` ancestor closure) — this is
    explicitly OUT OF SCOPE for this pass; `bar` (and any other class-only restriction
    code, if present) keeps today's generic-tile behavior. Documented here so it isn't
    silently forgotten, but not implemented in this plan.
- `messages/en.json`/`zh-TW.json`/`zh-CN.json`'s `AffixCategories` namespace gets new keys
  for every newly-introduced slug (`barbarianHelms`, `druidHelms`, `circlets`,
  `paladinShields`, `shrunkenHeads`, `amazonSpears`, `amazonBows`, `amazonJavelins`,
  `throwingAxes`, `throwingKnives`, `smallCharms`, `largeCharms`, `grandCharms`) —
  matching d2r.world's exact English wording for each, with hand-authored zh-TW and
  OpenCC-derived zh-CN, per this project's established i18n convention.
- Category icons (`data/category-icons.json`, from the prior Category-Grid Icons
  project) get new entries for each newly-introduced slug where a natural representative
  base item exists (e.g. `barbarianHelms`→ a `phlm`-type base item's `invFile`,
  `smallCharms`→`cm1`'s `invFile`, etc.) — reusing the same generation pattern already
  established, not a new mechanism.

## Non-goals

- Class-restriction fallback expansion (`bar` and any other bare `class`-field
  restriction with no `itype` presence) — needs a separate hand-authored
  "class → equippable categories" mechanism, not a reuse of the `itype` ancestor
  closure; stays as today's generic-tile behavior, flagged for a future pass.
- Set Items' "combine all weapon categories into one Weapons tile" + "browse by full Set
  name" gaps — separate, already-agreed follow-up project.
- The 4 unbuilt Misc pages (FCR/FHR/FBR, Alvl85 Areas, Area Level, Level Up) — separate,
  already-agreed follow-up.
- Any change to Unique/Set Items' flat category structure (confirmed correct, unchanged).
- Any change to the shared `TYPE_TO_SLOT` map used by uniques/sets/bases (Part B adds a
  second, separate map for magic-affixes only — it does not modify the existing one,
  since Base/Unique/Set Items are confirmed to want the coarser grouping at the
  category-grid level, even though Base Items additionally wants sub-tabs within Helms/
  Shields specifically, per Part A).

## Testing plan

- Generator tests: `data/bases-full.json` entries in `helms`/`shields` have a correct
  `subCategory` matching their real D2 item family (spot-check at least one item per
  sub-category: a Circlet, a Barbarian Helm, a Druid Pelt, a Paladin Shield, a Shrunken
  Head). `data/magic-affixes.json`'s `itemTypes` include the new granular slugs where
  expected; a dedicated test for the ancestor-closure function confirms a supertype
  code (e.g. `weap`) expands to every real leaf weapon slug, and a class+type combo
  (e.g. `amaz` alone) expands to exactly `amazonSpears`/`amazonBows`/`amazonJavelins`. A
  regression test confirms `bar` (and only `bar`, per the documented non-goal) remains
  the sole unresolved generic code in the final output.
- Component tests: the Base Items Helms/Shields pages render sub-tab filters and filter
  correctly; Magic/Rare category pages render the new granular tiles with working icons
  and labels in all 3 locales.
- Manual + d2r.world spot-check: Base Items Helms/Shields sub-tabs match d2r.world's tab
  labels and filtered contents; Magic/Rare Items' new granular tiles match d2r.world's
  category list and show the correct restricted affix pool per tile (e.g. Barbarian
  Helms shows only `phlm`-restricted affixes, not the full Helms pool).
