# Cube Recipes / Crafted Items Icons — Design

## Goal

Add icons to the Cube Recipes and Crafted Items pages, matching d2r.world, using
this project's own already-extracted icon set — not by downloading images from
d2r.world's site.

## Background

The previous Icon Coverage Audit treated these two pages as out of scope, believing
their data was "plain description text with no structured item-code link." Re-investigated
this session at the user's request and found that's only half true: `data/cube-recipes.json`
and `data/crafted-items.json` are generated from `vendor/d2data/json/cubemain.json`, and
while the **displayed** `description`/`name`/input fields are pre-composed text, the
**source** `cubemain.json` entries also carry structured `input 1`..`input 7` and `output`
fields with real item/type codes — e.g. recipe `0`'s `description` is "Staff of Kings +
Amulet of the Viper -> Horadric Staff" and its raw fields are `input 1: "msf"`,
`input 2: "vip"`, `output: "hst"` — all three real `items.json` codes with real
`invfile` values already in `public/items/inv/`.

Enumerated every distinct code appearing across all enabled recipes' `input N`/`output`
fields (185 distinct codes total) and classified them:

- **~140 codes resolve directly** via `items.json`'s own `invfile` (specific items:
  runes, gems, potions, unique/set/base items, quest items like `hst`/`msf`).
- **~12 codes are abstract item-TYPE codes** (e.g. `axe`, `swor`, `ring`, `amul`,
  `helm`, `belt`, `knif`, `pole`, `spea`, `staf`/`rod`, `shld`) that already map to a
  real category tile via the existing `TYPE_TO_SLOT` + `data/category-icons.json`
  machinery built for Magic/Rare Items — two small, verified aliases are needed
  (`shld`→`shie`, `rod`→`staf`; both confirmed via `itemtypes.json`'s own `ItemType`
  label text, e.g. `shld`'s label is literally "Any Shield").
- **~7 codes are genuinely too abstract for one non-arbitrary icon** and have no
  matching category page on this site at all: `armo`/`weap`/`blun` (broad
  weapon/armor supertypes spanning many category tiles), `gem0`-`gem4` (any gem type
  at a given quality tier — 7 gem types × the tier, no single representative), `hpot`/
  `mpot` (Healing/Mana Potion at unspecified tier — Potions have no category page on
  this site). These stay icon-less — a documented, principled gap, not a guess.
- **~13 codes are quest/portal display names or the dynamic keyword `usetype`/`useitem`/
  `any`** (`"Cow Portal"`, `"Red Portal"`, `"Crafted Black Cleft"`, etc., plus the 36
  craft recipes' `usetype` output meaning "same base type as the magic item input").
  Quest/portal names stay icon-less (no item code exists for them at all — same as
  today). The `usetype` output is a special case handled below, not left unresolved.

**Crucial exception — Crafted Items' `usetype` output**: for all 36 craft recipes (ids
64-99), the `output` field is `"usetype,crf"` — meaning "the result is the same base
item as the magic item input, just re-enchanted." This isn't a guess: it's the actual
game rule (confirmed by reading every craft recipe's `output` field — all 36 use
`usetype`). So the Crafted Item's result icon is provably identical to its
`magicItemInput`'s resolved icon — no separate `outputIcon` field is needed; the
component reuses the input's icon for display.

**Positional alignment risk, handled differently per file**: the 36 craft recipes use a
rigid, uniform description format ("`<Magic Item Input> + 1 Jewel + <Rune> + <Gem> ->
<Name>`"), already relied on by the existing generator code (`inputParts =
inputsPart.split(' + ')`) to build `additionalInputs` — so deriving
`additionalInputIcons` in that same index order is safe. The other ~140 general cube
recipes do **not** have this guarantee — found a real counterexample ("6 Perfect Gems
(1 of each type) + 1 Magic Amulet -> Prismatic Amulet" has 2 human-readable
description segments but `numinputs: 7`, one raw input slot per individual gem). So for
`cube-recipes.json`, icons are NOT matched positionally to description text segments;
instead each recipe gets a deduplicated, order-preserving list of every resolvable
ingredient icon plus one output icon, rendered as a small icon row alongside (not
interleaved into) the existing full-text description.

## Design

- **Generator** (`scripts/generate-grail-data.mjs`): add a shared resolver function,
  e.g. `resolveIconFor(rawField)`, that:
  1. Strips surrounding quotes and takes the first comma-separated token (the base
     code), e.g. `"rin,mag,pre=372"` → `rin`.
  2. Returns `items[code]?.invfile` if the code is a real item code.
  3. Else applies a tiny, fully-verified `CUBE_TYPE_ALIASES = { shld: 'shie', rod: 'staf' }`
     map, then resolves via the existing `TYPE_TO_SLOT` + `category-icons.json`
     machinery if the (possibly aliased) code is a real item-type with a category tile.
  4. Else returns `null` (the documented, principled gap — never a guess).
- **`data/cube-recipes.json`**: each entry gains `ingredientIcons: string[]` (resolved,
  deduplicated, order-preserving, nulls dropped, built from `input 1..N`) and
  `outputIcon: string | null` (from `output`, skipped/`null` when the output is
  `usetype`/`useitem`/a quest-portal name).
- **`data/crafted-items.json`**: each entry gains `magicItemInputIcon: string | null`
  (from `input 1`) and `additionalInputIcons: (string | null)[]` (from `input 2..N`,
  same order as the existing `additionalInputs`, safe per the alignment analysis
  above). No separate output-icon field — the component reuses
  `magicItemInputIcon` for the result, per the `usetype` semantics explained above.
- **Components**: reuse the established fail-safe icon pattern (`useState`-backed
  `iconFailed`, `onError`, `alt=""` + `aria-hidden="true"`, never a broken-image
  glyph, never rendered when the resolved icon is `null`/empty):
  - `CubeRecipeList.tsx`: render a small icon row (ingredient icons, then a small
    arrow/separator, then the output icon) above or alongside each recipe's existing
    full-text description line — the text line is unchanged and remains the
    authoritative, always-present content; icons are a visual supplement.
  - `CraftedItemList.tsx`: render the magic-item-input's icon next to the crafted
    item's name (reusing it as the de-facto "result" icon per the `usetype` rule), and
    small icons inline next to each additional input (Jewel/Rune/Gem), matching the
    existing text list's order.

## Non-goals

- Any icon for the ~7 genuinely-too-abstract type codes (`armo`, `weap`, `blun`,
  `gem0`-`gem4`, `hpot`, `mpot`) or the ~13 quest/portal/dynamic-keyword codes that
  aren't `usetype` in a craft-item context — these stay icon-less, a real and
  documented gap, not guessed content.
- Downloading, hotlinking, or otherwise embedding any image asset from d2r.world's
  site — this design resolves everything through this project's own
  already-self-extracted `public/items/inv/` icon set (sourced from the user's own
  legally-owned game install), per this project's established icon-sourcing policy.
- Any change to the existing `description`/`name` text fields, categorization logic,
  or any other page.

## Testing plan

- Data tests: for a handful of known recipes (e.g. recipe-0 "Staff of Kings + Amulet
  of the Viper -> Horadric Staff"), assert the exact expected `ingredientIcons` and
  `outputIcon` values; for the "Prismatic Amulet" recipe (the confirmed
  segment/numinputs mismatch case), assert `ingredientIcons` has 7 deduplicated
  entries (not 2); for a recipe whose output is a quest-portal name, assert
  `outputIcon` is `null`.
- Data tests for `crafted-items.json`: assert `craft-64` ("Hit Power Helm")'s
  `magicItemInputIcon` and `additionalInputIcons` resolve to the exact expected
  `invhlm`/`invjew`/`invrIth`/`invgsbe`-style values (verified against the real
  vendored codes), and that every resolved icon string corresponds to a real file in
  `public/items/inv/`.
- Component tests: icons render for resolvable entries, gracefully omit for `null`/
  unresolvable ones, and the existing full-text description/name/input-list rendering
  is unchanged.
- Manual spot-check (cheap `curl`-against-served-static-export, not repeated browser
  screenshots): confirm a sample of Cube Recipes and Crafted Items rows show icons
  matching d2r.world, and that the documented gaps (potions, generic gem tiers, quest
  portals) correctly show no icon rather than a wrong or broken one.
