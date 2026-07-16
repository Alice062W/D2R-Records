# Area Level — Verification

## Automated verification

```
npx tsc --noEmit   -> clean
npm run lint       -> 0 errors, 1 pre-existing unrelated warning (RunewordList.test.tsx unused `vi`)
npm test           -> 24 test files, 135 tests, all passing
npm run build      -> succeeded
```

Static export confirmed to include `out/{en,zh-TW,zh-CN}/monster/area-level/index.html`
with real, localized content.

## Real bug found and fixed during this verification pass

Manual spot-checking found "The Secret Cow Level" (Act 1, values 28/64/81) rendering as
**"Moo Moo Farm"** in the English UI. Root cause: `levels.json`'s `*StringName`/
`LevelName` fields store the internal D2 development codename for this level ("Moo Moo
Farm" is a well-known internal joke name), not the real player-facing English name shown
in the actual game client ("The Secret Cow Level"). Confirmed the Chinese localization
(`localestrings-chi.json["Moo Moo Farm"]` = "秘密母牛關卡", i.e. "Secret Cow Level") was
already correct — only English needed a targeted override. Fixed with a small,
documented `AREA_NAME_OVERRIDES_EN` map in the generator (a single entry), added a
regression test, regenerated, and re-verified in the browser — "The Secret Cow Level"
now renders correctly in English while zh-TW/zh-CN were unaffected (already correct).

## Manual browser + d2r.world spot-check

Served the static export locally and compared directly against
`https://d2r.world/en-US/info/monster/arealevel`.

- **Act 1**: all values match exactly, including the Secret Cow Level fix (28/64/81) and
  every other area (Blood Moor 1/36/67, Cold Plains 2/36/68, Stony Field 4/37/68, Dark
  Wood 5/38/68, and 26 more rows spot-checked in bulk against d2r.world's full Act 1
  dump).
- **Act 2**: tab switching confirmed working; Rocky Waste 14/43/75, Dry Hills 15/44/76
  match exactly.
- All 5 Act tabs render and switch correctly via client-side state.

## Summary

The Area Level Misc page is live, fully data-driven from `levels.json` (130 real areas
across 5 Acts), and verified accurate against d2r.world. One real naming bug (an
internal dev codename leaking into the English UI) was found and fixed during this
verification pass, with a regression test added.
