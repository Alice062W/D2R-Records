# Level Up — Verification

## Automated verification

```
npx tsc --noEmit   -> clean
npm run lint       -> 0 errors, 1 pre-existing unrelated warning (RunewordList.test.tsx unused `vi`)
npm test           -> 26 test files, 137 tests, all passing
npm run build      -> succeeded
```

Static export confirmed to include `out/{en,zh-TW,zh-CN}/character/level-up/index.html`
with real, localized content.

## Manual browser + d2r.world spot-check

Served the static export locally and compared directly against
`https://d2r.world/en-US/info/character/levelup`.

All 14 rows match exactly:

| clvl | Difficulty | Act |
|---|---|---|
| 1-11 | Normal | Act 1 |
| 12-18 | Normal | Act 2 |
| 19-23 | Normal | Act 3 |
| 24-31 | Normal | Act 4 |
| 32-36 | Normal | Act 5 |
| 37-43 | Nightmare | Act 1 |
| 44-48 | Nightmare | Act 2 |
| 49-52 | Nightmare | Act 3 |
| 53-62 | Nightmare | Act 4 |
| 63-73 | Hell | Act 1 |
| 74-80 | Hell | Act 2 |
| 81-83 | Hell | Act 3 |
| 83-94 | Hell | Act 4 |
| 95-99 | Hell | Act 5 |

Including the two apparent irregularities (Hell Act 3/4 overlap at clvl 83, no separate
Nightmare Act 5 row) — both confirmed to be d2r.world's own real content, correctly
preserved rather than "fixed."

## Summary

The Level Up Misc page is live with the exact 14-row guide matching d2r.world, reusing
the existing Area Level difficulty/act i18n labels (no duplicate keys). This is the
third of four Misc pages now complete (Area Level, Level Up done; Alvl85 Areas, FCR/FHR/FBR
remain).
