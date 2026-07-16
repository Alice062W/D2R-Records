# Bar Affix Exclusion — Verification

## Automated verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (1 pre-existing unrelated warning in `RunewordList.test.tsx`).
- `npm test` — 150/150 tests passing across 30 files.
- `npm run build` — succeeds; static export no longer includes an `/items/magic/bar`
  path in any locale.

## Manual + d2r.world spot-check

Served the static export and loaded `/en/items/magic` and `/zh-TW/items/magic`
in-browser.

- **No "Barbarian Items" / "蠻族物品" tile** appears on the Magic Items category grid in
  either locale — confirmed the full category list (39 tiles) contains no `bar` entry,
  matching d2r.world's real category list.
- **`/en/items/magic/bar` returns HTTP 404** — the route is no longer generated at all.
- **`barbarianHelms` (a real, distinct category) is unaffected** — still present in the
  category grid and its own static page builds correctly; the fix only removed the raw
  `"bar"` fallback code, not the legitimate Barbarian Helms category.
- **Spot-checked Daggers**: negative-charge `"charged"`-mod entries that DO have a
  valid item-type restriction remain correctly listed (`of Frozen Orbs`, `of Bashing`,
  `of Stunning`, `of Concentration`) — confirming the exclusion only removed the 9
  entries that are both negative-charge AND missing every `itype` field, not the whole
  negative-charge family.
- None of the 9 excluded suffix names (`of Howling`, `of Potion Finding`, `of
  Taunting`, `of Shouting`, `of Item Finding`, `of Battle Cry`, `of Battle Orders`, `of
  War Cry`, `of Battle Command`) appear under any category page, matching d2r.world
  (which doesn't list them anywhere either).

## Notes

- During implementation, the plan's originally-proposed filter condition (negative
  charge value alone) was found to be too broad — it's the normal convention for this
  mod across ~200 entries, not unique to the 9 broken rows. The implementer added a
  missing-itype-field guard, verified against the raw vendored data to hit exactly the
  intended 9 rows. See the task's implementation report for full detail.
- `node_modules` was not present in this worktree at the start of Task 2 (unrelated
  environment gap, not caused by this change) — installed via `npm install` before
  running the build/browser verification above.
