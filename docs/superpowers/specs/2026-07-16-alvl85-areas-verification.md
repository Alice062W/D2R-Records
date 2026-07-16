# Alvl85 Areas — Verification

## Automated verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (1 pre-existing unrelated warning in `RunewordList.test.tsx`).
- `npm test` — 142/142 tests passing across 28 files.
- `npm run build` — succeeds; static export includes `/en/monster/alvl85`,
  `/zh-TW/monster/alvl85`, `/zh-CN/monster/alvl85`.

## Manual + d2r.world spot-check

Served the static export and loaded `/en/monster/alvl85` and `/zh-TW/monster/alvl85`
in-browser. Confirmed against `https://d2r.world/en-US/info/monster/alvl85`:

- All 32 areas render, in the same order as d2r.world (Mausoleum through Throne of
  Destruction, plus The Worldstone Chamber with no monster list).
- Spot-checked River of Flame, Abaddon, Pit of Acheron, Worldstone Keep 1-3 — monster
  names, types, and immunity values (including multi-element rows like Burning Dead
  Mage's Fire 130★/Poison 110) match d2r.world exactly.
- "Night Lord" case confirmed correct in both places: Undead / Cold 120★ in Ruined
  Temple, Disused Fane, and Forgotten Reliquary; Animal / Lightning 100 (no star) in
  Infernal Pit.
- The ★ marker appears exactly where d2r.world shows it (Fire/Cold/Lightning ≥117,
  Poison ≥112) throughout.
- zh-TW renders with correct translated column headers (怪物/種類/免疫), monster-type
  labels (不死系/惡魔/動物), and element abbreviations (電/火/毒/冷/物/魔), title, and
  star-threshold note, with monster names left untranslated (matching this project's
  established precedent for monster/item proper nouns).
- The Worldstone Chamber renders with its heading and no monster table, matching
  d2r.world (no monster list shown there).

## Notes

- No change made to `data/area-levels.json` or the Area Level page.
- `vendor/d2data/json/monstats.json` was not vendored — not needed since the data is
  hand-transcribed from d2r.world rather than derived.
