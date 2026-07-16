# Icon Coverage Audit — Design

## Goal

Close the icon/image gaps found by auditing every page against d2r.world: Base Items,
Runes, Runewords (rune-order display), and Set Items (browse-by-name) currently render
no icons at all, unlike d2r.world.

## Background

Prior icon work (the Icon-Task and CI-Task sub-projects) only ever scoped icon
extraction and wiring to unique/set items (`ItemStatCard`/`GrailItemDetail`) and
category-tile representative icons (`CategoryCardGrid`). Auditing every remaining list
page against d2r.world (via direct data/file inspection, not repeated browser
screenshots, to keep this investigation cheap) found:

- **Base Items**: `data/bases-full.json` carries no `invFile` field at all — it was
  simply never added. Checked: every one of the 170 needed base-item invFile codes
  (`items[code].invfile`, one per base — normal/exceptional/elite tiers of the same
  base always share one icon, confirmed via `hax`/`9ha`/`7ha` all resolving to
  `invhax`) **already exists** in `public/items/inv/` under its real filename. This is
  pure wiring — no new extraction needed.
- **Runes**: `data/runes.json` has no `invFile` field, and none of the 33 real rune
  icon files (`invrEl.png` … `invrZod.png`) exist in `public/items/inv/` — confirmed
  by checking every code `r01`–`r33`'s `invfile` value against the directory listing.
  These need a new, small extraction pass (33 files) from the same Windows D2R install
  used previously (the CascView step already pulls every file in
  `data\global\items\`; only the "which files to copy into the repo" filter needs
  widening — no new tooling).
  - Side note: `public/items/inv/` already contains ~140 oddly-named files
    (`inv1x1_0_N.png`, `inv2x3_0_N.png`, etc.) that are visually rune/gem-like icons
    with no reliable code mapping — likely an artifact of the original conversion tool
    numbering some multi-frame DC6 sheets instead of naming them per-code. These are
    **not used** by this plan (no reliable ground truth for what maps to what); the 33
    needed rune files will be pulled fresh, by their real `invfile` codes, the same
    reliable way the base-item icons were confirmed above.
- **Runewords**: `data/runewords-full.json`'s `runes` field is a list of English rune
  names (e.g. `["Ral", "Ort", "Tal"]`) — once rune icons exist, these resolve directly
  via a name → `invFile` lookup (no new data needed beyond the runes fix above).
- **Set Items (browse-by-name)**: `data/set-groups.json`'s `pieceIds` reference
  `sets.json` entries, which already carry `invFile` (135 refs) — this is pure wiring,
  the same as Base Items.
- **Not in scope for this pass** (confirmed, not guessed): Cube Recipes and Crafted
  Items store their ingredients/results as plain description strings (e.g. `"Staff of
  Kings + Amulet of the Viper -> Horadric Staff"`), not structured item-code
  references — resolving those back to a specific `invFile` would need a separate
  name-matching/data-model project, out of scope here. Magic/Rare Items category pages
  already have their representative category-tile icon (`CategoryCardGrid`); d2r.world
  doesn't show a per-affix-row icon there either, so no gap exists at that level.

## Design

- **Generator** (`scripts/generate-grail-data.mjs`):
  - Add `invFile: items[code]?.invfile ?? ''` to each `basesFullOut` entry (one icon
    per base row, reusing the normal-tier code's invfile — matches the confirmed
    normal/exceptional/elite sharing behavior).
  - Add `invFile` to each `runes.json` entry, sourced the same way as other
    `items.json` lookups already in this generator (`items[\`r${n}\`]?.invfile`).
  - Add a small `RUNE_NAME_TO_INVFILE` map (derived from the same `runes.json`
    generation step, keyed by English rune name) and use it to resolve
    `runewords-full.json`'s existing `runes: string[]` field into an
    `runeInvFiles: string[]` field of the same length/order.
  - Add `invFile` to each `set-groups.json` piece by looking up the corresponding
    `sets.json` entry's `invFile` per `pieceIds` entry, producing a parallel
    `pieceInvFiles: string[]` (same order as `pieceIds`) — kept as a separate array
    rather than changing `pieceIds`' existing shape, so nothing consuming that field
    needs to change.
- **Icon files**: extract and add exactly the 33 missing `invr*.png` rune files to
  `public/items/inv/`, using the same Windows CascView extraction process already
  documented in `docs/icon-extraction-instructions.md` (no tooling changes — just a
  targeted re-run to pull these 33 specific already-known filenames instead of a full
  re-extraction).
- **Components**: reuse the existing icon-rendering pattern already established in
  `ItemStatCard`/`CategoryCardGrid` (render `<img src="/items/inv/${invFile}.png">`,
  gracefully render nothing on load failure via an `onError` state flag — no broken-
  image glyph):
  - `BaseItemTable.tsx`: render each row's icon next to its name.
  - `RuneList.tsx`: render each rune's icon next to its name/number.
  - `RunewordList.tsx`: render each rune-order rune's icon inline (small, matching
    d2r.world's inline rune-icon-then-comma-separated display).
  - `SetGroupList.tsx` / `SetGroupDetail.tsx`: render each piece's icon next to its
    name.

## Non-goals

- Cube Recipes / Crafted Items icons — no structured item-code data to resolve icons
  from; would need a separate data-model project (parsing/matching description strings
  back to real item codes) to do reliably rather than guessing.
- Investigating the ~140 mystery-numbered icon files further, or trying to map them to
  real codes — no reliable ground truth; the 33 rune files needed here will be
  extracted fresh under their real names instead.
- Any change to already-working icon rendering (unique/set item detail, category
  tiles).
- Any change to Misc/Monster pages (Area Level, Level Up, Alvl85 Areas, FCR/FHR/FBR,
  Max Sockets) — none of these have per-row icons on d2r.world either.

## Testing plan

- Data tests: `data/bases-full.json` every entry has a non-empty `invFile` matching a
  real file in `public/items/inv/`; same for `data/runes.json`'s new `invFile` field
  and `data/set-groups.json`'s new `pieceInvFiles`; `data/runewords-full.json`'s new
  `runeInvFiles` has the same length as `runes` for every entry, and every value
  resolves to a real file.
- Component tests: each modified component renders an `<img>` per row with the
  expected `src`, and doesn't break when a lookup is empty (e.g. gracefully skips
  rather than rendering a broken-image icon).
- Manual + d2r.world spot-check (kept to plain `curl`/file inspection plus a small,
  final visual check — not repeated screenshot-driven browsing per this session's
  token-cost guidance): confirm Base Items, Runes, Runewords, and Set Items pages all
  show icons matching d2r.world's real icon-per-row presentation, in all three
  locales.
