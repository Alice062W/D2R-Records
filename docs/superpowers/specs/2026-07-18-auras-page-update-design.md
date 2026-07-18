# Auras Page Update — Design

## Goal

Two changes to the just-merged Auras page: (1) remove "Paladin"-specific wording,
since auras can be activated by any class via equipment that grants "+X to Aura"
charges, not just by a native Paladin; (2) replace the single Lv.1/Lv.20 radius
line with a full per-level (1–20) radius table for each aura.

## Design

### 1. Remove Paladin wording

- `Items.aurasPageTitle`: `"Paladin Auras"` → `"Auras"`.
- `Items.aurasPageSubtitle`: `"Browse every Paladin aura in Diablo II:
  Resurrected."` → `"Browse every aura in Diablo II: Resurrected."`.
- Every `Items.aura_*_desc` key that references "the Paladin" (14 of the 20, in
  English — confirmed by grep) gets "the Paladin" replaced with "the wearer" (the
  standard neutral D2 term for "whoever is benefiting from the aura, Paladin or
  not"), and "near the Paladin" → "nearby" (Sanctuary's phrasing). The 6 auras
  whose description never names a class (Holy Fire, Thorns, Holy Freeze, Holy
  Shock, Cleansing, Conviction) are already neutral and need no change.
- Same substitution in `zh-TW` (聖騎士 → 使用者, matching the same 14+title+subtitle
  occurrences), then re-derive `zh-CN` via the existing
  `scripts/translate-nav-items-ui-zh-cn.mjs` script.
- No change to the `Nav.misc_auras` label (already just "Auras", never had "Paladin"
  in it) or the route path (`character/auras` stays — still the correct location
  since these remain Paladin-tree skills mechanically, just usable by any class via
  gear).

### 2. Per-level radius table

- `src/lib/grail/auras.ts`: no data-shape change needed — `radiusBase`/
  `radiusPerLevel` already fully determine radius at every level
  (`radiusBase + radiusPerLevel * (level - 1)`); the table is computed in the
  component, not stored.
- `AuraList.tsx`: replace the single `aurasRadiusLabel` line with a compact
  horizontal table (Level 1–20 as column headers, radius value per column below),
  matching this project's existing horizontal-table convention (e.g.
  `FcrFhrFbrTable.tsx`, `AreaLevelTable.tsx`) rather than 20 vertical rows.
  `Required Level` and `Mana Cost` stay as simple single-value lines (unaffected —
  neither varies by level).
- `Items.aurasRadiusLabel` message key repurposed as the table's row label (e.g.
  "Radius" instead of "Radius (Lv. 1 / Lv. 20)"), plus one new key
  `aurasLevelLabel` ("Level") for the header row — added to all three locale files.

## Non-goals

- No change to any other aura fact (required level, mana cost) becoming a table —
  confirmed with the user these don't vary by level in a way worth tabulating here.
- No change to icons, visuals, or the underlying `AURAS` numeric data.

## Testing plan

- Update `AuraList.test.tsx`'s existing assertions: description text no longer
  contains "Paladin"; new test asserts the radius table renders 20 columns with
  correct values (e.g. Might: level 1 → 16, level 20 → 54).
- Re-run the full suite; confirm zh-TW/zh-CN also drop 聖騎士 from the affected keys.
