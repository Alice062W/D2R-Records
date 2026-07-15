# Runes, Cube Recipes, Crafted Items — Design (Batch A)

## Goal

Build real content for three more d2r.world-equivalent sections — Runes, Cube Recipes,
and Crafted Items — replacing their placeholder pages. This is "Batch A" of the
remaining 5 empty Game Items sections; Magic Items and Rare Items ("Batch B") follow
as a separate plan since they share different, more complex underlying data (a new,
more granular category system).

## Background

Direct inspection of d2r.world confirmed each section's real layout:

- **Runes** (`/info/item/runes`): a single page (no category grid) listing all 33 runes
  in order, each showing Level Required, separate Weapon / Armor-Helm-Shield property
  groups, an upgrade Recipe (most runes upgrade from 3× — later 2× — of the previous
  rune, sometimes plus a gem), and a Drop Rate line (monster + difficulty + percentage).
- **Cube Recipes** (`/info/item/recipes`): recipes grouped into 9 categories (Rune & Gem
  Upgrade, Quests, Consumables, Sockets, Item Upgrade, Item Repair, Magic Item Rerolls,
  Magic Item Creation, Crafted Grand Charm), each recipe shown as a plain description.
- **Crafted Items** (`/info/item/crafted`): grouped into 4 craft "families" (Hit Power,
  Blood, Caster, Safety), each with ~9 per-slot recipes (Helm, Boots, Gloves, Belt,
  Shield, Body, Amulet, Ring, Weapon), showing the required inputs and the crafted
  item's guaranteed ("Fixed") magic properties.

Data investigation this session found all three are buildable from the same upstream
MIT-licensed `blizzhackers/d2data` repo (pinned commit
`477bcf63e964f39f4c774e588a79fd598ae472de`), via three files not yet vendored:

- **`gems.json`** (68 entries, 33 of which are runes — identified by `"name"` ending in
  `" Rune"`) has `weaponMod{1-3}Code/Min/Max`, `helmMod{1-3}Code/Min/Max`, and
  `shieldMod{1-3}Code/Min/Max` fields per rune — the same code/min/max shape
  `extractProps` (generalized in the prior plan) already parses, just with three new
  field-name prefixes instead of one.
- **`cubemain.json`** (227 entries) has a ready-made, plain-English `description` field
  for every recipe (e.g. `"3 El Runes -> Eld Rune"`, `"1 Magic Full Helm + 1 Jewel + 1
  Ith Rune + 1 Perfect Sapphire -> Hit Power Helm"`), plus structured `input {n}`/
  `output`/`numinputs` fields, and — for craft recipes specifically — `mod {n}` /
  `mod {n} param` / `mod {n} min` / `mod {n} max` fields (note the space in the key
  names, unlike every other stat-bearing file in this project) giving the crafted
  item's guaranteed properties.
- **Rune upgrade recipes are already `cubemain.json` entries** (e.g. entry 51: `"3 El
  Runes -> Eld Rune"`), so the Runes page's "Recipe" line reuses this same data rather
  than needing a second source or a hardcoded "3× previous rune" rule (which wouldn't
  cover the gem-inclusive recipes for Amn onward, or the 2×-not-3× rule starting at Um).

**Drop rates are the one field with no raw-data source in this project.** They're
computed from a cascading treasure-class probability tree (`treasureclassex.json`,
`tcprecalc.json` — both real, MIT-licensed files this session found and inspected) that
would require implementing D2's actual treasure-class resolution algorithm to compute
correctly — a substantial, error-prone undertaking of its own, out of scope for this
batch. Per explicit user direction this session, the 33 runes' drop-rate facts (monster
name, difficulty, percentage) are hand-transcribed from d2r.world's own published Runes
page as numeric game-mechanic facts (not creative/compiled content — these are
deterministic outputs of Blizzard's own treasure-class tables, the same category of
fact this project already spot-checks against d2r.world throughout), with the source
cited transparently in the generator code. If a real probability calculator is ever
built against the raw treasure-class data, this hand-transcribed table should be
replaced by its computed output.

**Cube Recipes categorization is not a field in the data.** d2r.world's 9-category
grouping was reconstructed this session by reading all 157 `enabled: 1` recipe
descriptions and hand-classifying each (see the full classification table in the
implementation plan). Two entries (`11`: "Axe + Dagger -> Throwing Axe", `12`: "Spear +
Arrows -> Javelins") don't cleanly fit any of the 9 categories — d2r.world's own exact
bucket for these two isn't independently confirmed; they're placed under "Consumables"
as the closest fit, noted inline as a best-effort call.

**The "Crafted Grand Charm" category has `enabled: 0` in the vendored data.** 16
charm-crafting recipes (Small/Large/Grand Charm variants across 5 elemental-affix
families) exist in `cubemain.json` but are flagged disabled — yet d2r.world lists
"Crafted Grand Charm" as a live category, suggesting either a version/expansion gate
not reflected by this flag, or these recipes are real but this pinned commit's flag is
stale. Included as a real recipe category regardless of the `enabled` flag, since
d2r.world treats them as current; noted as an open question in case a newer d2data
commit resolves it differently.

## Non-goals

- Magic Items, Rare Items (Batch B — separate plan).
- FCR/FHR/FBR, Alvl85 Areas, Area Level, Level Up (separate future batches).
- A real drop-rate probability calculator (future project if ever wanted).
- Any change to existing pages/components from prior plans.

## Data layer

**New vendor files:** `vendor/d2data/json/gems.json`, `vendor/d2data/json/cubemain.json`
— fetched from the same pinned commit as every other vendored file.

**New generator additions to `scripts/generate-grail-data.mjs`** (extending the same
script, reusing `extractProps`, `localizedLabelFor`, `localizedItemName`, `toZhCn`):

- **`data/runes.json`**: 33 entries, `{ id, number, name: LocalizedText, levelReq,
  weaponStats: RawGrailStat[], armorStats: RawGrailStat[], shieldStats:
  RawGrailStat[] | null, recipe: { rune: string; count: number; gem: string | null }
  | null, dropRate: { monster: LocalizedText; difficulty: 'normal'|'nightmare'|'hell';
  percent: number } }`. `armorStats`/`shieldStats` are `null` when identical to
  `weaponStats`'s Armor/Helm/Shield split isn't actually shared 3-way for that rune (a
  few runes have distinct Armor/Helm vs Shield bonuses — verified per-rune from the
  vendored `gems.json` fields directly, not assumed uniform).
- **`data/cube-recipes.json`**: 157 entries (the `enabled: 1` set, `Crafted Grand
  Charm`'s 16 entries force-included per the design note above = 173 total), each
  `{ id, description: LocalizedText, category: string, inputs: string[], output:
  string }`, `category` assigned via the hand-classification table in the plan.
- **`data/crafted-items.json`**: the 36 craft-family entries (Hit Power/Blood/
  Caster/Safety × 9 slots), each `{ id, name: LocalizedText, family: string, slot:
  string, magicItemInput: LocalizedText, additionalInputs: LocalizedText[],
  fixedProperties: RawGrailStat[] }`.

All three are `.gitignore`d generation output, regenerated via the existing
`generate:grail` npm script — never hand-edited.

## Pages

**`/[locale]/items/runes`** (currently a placeholder): a single page (no category grid,
matching d2r.world), listing all 33 runes in order — new `RuneList` component.

**`/[locale]/items/cube-recipes`** (currently a placeholder): a single page grouped by
the 9 categories (or however many are actually populated) — new `CubeRecipeList`
component, sections rendered in d2r.world's order.

**`/[locale]/items/crafted`** (currently a placeholder): a single page grouped by the 4
craft families — new `CraftedItemList` component.

None of these three need a category-grid landing + dynamic-route flow (unlike Base/
Unique/Set Items) — each is inherently a single browsable list/grouped-list, matching
d2r.world's own single-page structure for all three.

## Testing plan

- Generator unit tests: `runes.json` has exactly 33 entries in rune order 1-33; a known
  rune's weapon/armor stats and recipe are correct (spot-check El, Eld, Amn — the first
  gem-inclusive recipe); `cube-recipes.json` correctly classifies a sample from each of
  the 9 categories; `crafted-items.json` has 36 entries, 9 per family, and a known
  recipe's fixed properties match (spot-check Hit Power Helm).
- Render tests: `RuneList` renders all 33; `CubeRecipeList` renders all populated
  category sections; `CraftedItemList` renders all 4 families.
- Build + manual + d2r.world spot-check, consistent with every prior plan: confirm all
  three pages render correctly in all 3 locales, spot-check a handful of entries per
  page against d2r.world directly.
