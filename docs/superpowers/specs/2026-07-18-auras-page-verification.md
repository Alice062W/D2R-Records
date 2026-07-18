# Auras Reference Page — Verification

## Automated verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (1 pre-existing unrelated warning in `RunewordList.test.tsx`).
- `npm test` — 178/178 tests passing across 33 files.
- `npm run build` — succeeds; static export includes `/en/character/auras`,
  `/zh-TW/character/auras`, `/zh-CN/character/auras`.

## Manual spot-check (in-browser)

- `/en/character/auras`: all 20 auras render with icon, in-game visual screenshot,
  name, description, and the three clean facts (Required Level, Mana Cost, Radius
  Lv.1/Lv.20) — e.g. Might shows icon + visual + "Increases the melee attack damage
  of the Paladin and nearby allies." + "Required Level: 1 / Mana Cost: 1 / Radius
  (Lv. 1 / Lv. 20): 16 / 54", matching `vendor/d2data/json/skills.json`'s
  `reqlevel`/`Param1`/`Param2`/`minmana` fields exactly.
- Nav drawer: a new "Auras" link appears at the end of the Misc group, correctly
  linking to `/en/character/auras/`.
- `/zh-TW/character/auras`: all aura names, descriptions, and fact labels render in
  Traditional Chinese (e.g. "勇氣" / "提升聖騎士與附近隊友的近戰攻擊傷害。"); numeric
  values unchanged.
- Colors and Cinzel typography from the Summoner-theme restyle apply correctly to
  this new page with no extra work (inherited from the shared layout/theme tokens).

## Notes

- Exact per-level numeric effect values (damage %, resist %, etc.) are intentionally
  excluded — documented non-goal in the design spec, since the underlying
  `aurastatcalc` formula language isn't reliably parseable without guessing.
- Both image sets (`public/skills/icons/`, `public/skills/visuals/`) were self-
  extracted by the user from their own D2R install — no assets were downloaded from
  any third-party site.
