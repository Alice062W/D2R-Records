# Comprehensive Property-Label Audit — Verification

## Automated verification

```
npx tsc --noEmit   -> clean
npm run lint       -> 0 errors, 1 pre-existing unrelated warning (RunewordList.test.tsx unused `vi`)
npm test           -> 19 test files, 104 tests, all passing
npm run build      -> succeeded
```

The broadened regression test (`data/grail-data.test.ts`, "no generated data file has an
unexpected leaked raw property code") now scans all 8 generated data files (`uniques`,
`sets`, `basesFull`, `runewordsFull`, `runes`, `craftedItems`, `cubeRecipes`,
`magicAffixes`) and passes.

## Static-export leak scan

Grepped the built `out/` directory for the three remaining deliberately-unmapped codes
(`pierce-dmg`, `war`, `bloody`) across all 3 locales — every match found is one of these
three exact codes, nothing new:

```
out/en/items/unique/grimoires/index.html   -> war
out/en/items/unique/boots/index.html       -> bloody
out/en/items/unique/shields/index.html     -> war
out/en/items/set/helms/index.html          -> war
out/en/items/runewords/index.html          -> bloody
```
(and the zh-TW/zh-CN equivalents of the same pages)

## Manual browser + d2r.world spot-check

Served the static export locally and compared directly against `d2r.world` (`Unique
Items > Bows` category).

- **Witherstring**: site shows "Fires Magic Arrows: 3"; d2r.world shows "Fires Magic
  Arrows Level [X]" — matches exactly (d2r.world's page template omits the actual level
  number due to its own rendering quirk, same issue observed with Crafted Items in the
  prior session; the wording itself matches).
- **Rimeraven**: site shows "Fires Explosive Arrows or Bolts: 3"; d2r.world shows "Fires
  Explosive Arrows or Bolts Level [X]" — matches.
- **Pullspite**: site shows "Piercing Attack %: 25" (`pierce` code) — matches the
  well-known Buriza-Do Kyanon-family "Piercing Attack %" wording confirmed during Task 1's
  research.
- **Hellclap**: site shows "Fire Skills: 1" (`fireskill` code) — flat class-skill-group
  bonus, matches d2r.world's "+ to Fire Skills" wording.
- No raw internal codes (`att-und`, `dmg-und`, `heal-kill`, `kill-skill`, etc. — the four
  originally spotted by the user, plus the additional 30 found by the full scan) appear
  anywhere in the spot-checked pages.

## Summary

34 of 36 leaked codes resolved with EN + zh-TW labels, each traced to either an
`itemstatcost.json` `Stat`-name match, a direct d2r.world wording match, or (for `aura`/
`kill-skill`) confirmed skill/aura-name-referencing `par` fields added to
`SKILL_REF_PROPS`. `ethereal` was excluded at the source as a non-displayable item-quality
flag rather than mislabeled. `bloody` was added to the deliberately-unmapped exception
list (a superseded classic-era code with no current-expansion equivalent), joining
`war`/`pierce-dmg` from the prior session. The regression test now covers every generated
data file, closing the actual root cause of why 34 of these 36 leaks went undetected last
time — the prior test only scanned the three files its introducing task happened to touch.

No further leaked-code work is expected to surface for the existing catalog; any future
catalog additions are guarded by this broadened test.
