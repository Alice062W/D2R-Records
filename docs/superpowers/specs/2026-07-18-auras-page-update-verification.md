# Auras Page Update — Verification

## Automated verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (1 pre-existing unrelated warning in `RunewordList.test.tsx`).
- `npm test` — 180/180 tests passing across 33 files.
- `npm run build` — succeeds; static export includes the updated page in all three
  locales.

## Manual spot-check (in-browser)

- `/en/character/auras`: page title is "Auras" (not "Paladin Auras"); subtitle and
  every description checked contain no mention of "Paladin" (e.g. Might: "Increases
  the melee attack damage of the wearer and nearby allies."). Sanctuary's phrasing
  correctly reads "...prevents corpse explosion nearby." rather than a generic
  "wearer" substitution.
- Each aura's radius table has exactly 20 columns (levels 1–20) with correct values
  — confirmed programmatically for Might: `16, 18, 20, ..., 54` (base 16 + 2 ×
  (level−1)), matching `radiusBase`/`radiusPerLevel` from `vendor/d2data/json/skills.json`.
- Required Level and Mana Cost remain simple single-value lines, unaffected.
- No page-level horizontal scroll introduced by the wide table — confirmed via
  `document.documentElement.scrollWidth === document.documentElement.clientWidth`;
  the table scrolls within its own `overflow-x-auto` container.
- `/zh-TW/character/auras`: title "光環" (not "聖騎士光環"), all descriptions use
  "使用者" (wearer) instead of "聖騎士" (Paladin), Sanctuary reads "...並防止附近的
  屍體爆炸。" — no lingering Paladin references anywhere on the page. Table renders
  identically (numbers are locale-independent).

## Notes

- The 6 auras whose descriptions never mentioned a class (Holy Fire, Thorns, Holy
  Freeze, Holy Shock, Cleansing, Conviction) were correctly left untouched in all
  three locale files.
