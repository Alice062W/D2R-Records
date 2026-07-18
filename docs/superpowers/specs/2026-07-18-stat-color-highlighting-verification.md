# Unique/Set/Runeword Stat Color Highlighting — Verification

## Automated verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (1 pre-existing unrelated warning in
  `RunewordList.test.tsx`, present before this work).
- `npm test` — 185/185 tests passing across 33 files.
- `npm run build` — compiles and typechecks successfully. Static export fails on
  `/en/grail` and `/zh-TW/grail` due to a pre-existing, unrelated environment gap
  (`Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY`) — confirmed
  present on `main` as well, not caused by this work.

## Manual spot-check (in-browser)

Note: the shared `preview_start`/`.claude/launch.json` dev server always launches
from the main repo root (its `runtimeExecutable` has no per-worktree override), so
it silently served the main branch's pre-change source due to Next.js's
workspace-root auto-detection picking up the outer repo's lockfile. Ran
`npm run dev` directly from the worktree on a separate port (3001) to get real
worktree code under test — this discrepancy is worth knowing for any future
worktree-based verification in this repo.

- **Unique** (`/en/items/unique/charms`, Hellfire Torch): "All Attributes: 10–20"
  (variable, not skill-ref) → yellow `rgb(255, 248, 24)`. "Charges (Hydra): 10–30"
  (variable, skill-ref) → pink `rgb(255, 74, 105)`. "Light Radius: 8" (fixed, not
  skill-ref) → blue `rgb(128, 128, 243)`.
- **Runeword** (`/en/items/runewords`, Beast): "Strength: 25–40" (variable) →
  yellow. "Skill Bonus (Shape Shifting): 3" (fixed, skill-ref) → pink. "Faster
  Attack Rate: 40" (fixed) → blue.
- **Set** (`/en/items/set/tal-rashas-wrappings`, Tal Rasha's Lidless Eye):
  "Skill Bonus (Fire Mastery): 1–2" (variable, skill-ref) → pink. "Life: 57"
  (fixed) → blue. Full Set Bonus "Sorceress Skill Levels: 3" → pink; "All
  Resistances: 50" → green (unchanged base color for fixed set bonuses).

## Issue found and fixed during verification

`SetGroupDetail.tsx` — the component rendering a set family's partial/full-set
bonus panel (`/en/items/set/[setSlug]`) — uses a separate code path from
`ItemStatCard.tsx`'s `setBonuses` block and was not touched by Task 3's brief
(which named only `ItemStatCard.tsx` and `RunewordList.tsx`). It still rendered
every partial/full-set bonus in flat green with no `isSkillRef`/variable
distinction. Fixed directly (commit `7f1147b`) by applying the same
`isSkillRef ? pink : min===max ? green : yellow` rule used elsewhere, plus a new
component test asserting the three color cases. Re-verified in-browser after the
fix: "Sorceress Skill Levels: 3" → pink, "All Resistances: 50" → green.

## Notes

- Set/Unique item **name** coloring (`NAME_COLOR` map: tan for unique, green for
  set names) and set-name headers were correctly left untouched — those are a
  separate, unrelated color rule from stat-line coloring.
- Magic Items / Rare Items / Cube Recipes / Crafted Items pages were confirmed
  unchanged — their underlying data files gained the harmless unused `isSkillRef`
  field, but no component reads it there, matching the design's explicit
  non-goal.
