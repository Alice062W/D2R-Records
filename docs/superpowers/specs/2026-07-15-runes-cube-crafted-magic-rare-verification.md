# Runes, Cube Recipes, Crafted Items, Magic Items, Rare Items — Verification

## Automated verification

```
npx tsc --noEmit   -> clean
npm run lint       -> 0 errors, 1 pre-existing unrelated warning (RunewordList.test.tsx unused `vi`)
npm test           -> 18 test files, 99 tests, all passing
npm run build      -> succeeded; all 5 new sections present in the static route listing
```

Static export spot-checked on disk for all 3 locales:
- `out/{en,zh-TW,zh-CN}/items/runes/index.html`
- `out/{en,zh-TW,zh-CN}/items/cube-recipes/index.html`
- `out/{en,zh-TW,zh-CN}/items/crafted/index.html`
- `out/{en,zh-TW,zh-CN}/items/magic/index.html` + 37 category sub-pages each (111 total)
- `out/{en,zh-TW,zh-CN}/items/rare/index.html` + 36 category sub-pages each (108 total) — one
  fewer category than Magic, confirming `generateStaticParams` is data-driven (the `bar`
  Barbarian-class-restricted affix category has zero rare-eligible entries and correctly has
  no `rare/bar/` page).

## Manual browser verification + d2r.world spot-check

Served the static `out/` export locally and compared directly against the live
`d2r.world` pages.

**Runes** (`/items/runes`) vs `https://d2r.world/en-US/info/item/runes`: spot-checked El,
Eld, Tir, Amn (first gem-inclusive recipe), and Hel (the one rune with no level
requirement) — level requirements, weapon/armor-helm/shield stat splits, recipes, and
drop-rate percentages all match d2r.world exactly (e.g. El 4.3%, Eld 2.87%, Amn 16.61%
NIGHTMARE). Hel correctly shows "Level Required: 0" reflecting the real underlying data
(`items.json` `r15.levelreq: 0`) — d2r.world renders this same fact as "Level Required: –"; this
is a cosmetic-only difference (0 vs. dash for "no requirement"), noted but not blocking.

**Cube Recipes** (`/items/cube-recipes`) vs `https://d2r.world/en-US/info/item/recipes`: all 9
category names and their order match d2r.world exactly (Rune & Gem Upgrade, Quests,
Consumables, Sockets, Item Upgrade, Item Repair, Magic Item Rerolls, Magic Item Creation,
Crafted Grand Charm). Recipe description text (e.g. every gem/rune upgrade line, the Secret
Cow Level portal, the Uber essence combines) matches d2r.world's wording exactly, byte for
byte, since both ultimately derive from the same source (`cubemain.json`'s own `description`
field).

**Crafted Items** (`/items/crafted`) vs `https://d2r.world/en-US/info/item/crafted`: all 4
families (Hit Power, Blood, Caster, Safety) present, base-item-input and additional-input
lists match. d2r.world's own page has textual-template glitches around numeric ranges (it
shows literal "+-" instead of resolved min/max numbers), so this project's own generated
numeric fixed/variable split — verified directly against the vendored `cubemain.json` mod
values — is the more reliable numeric source for this page, by design (documented in the
implementation plan and Task 3's review).

**Magic Items / Rare Items** (`/items/magic`, `/items/rare`): spot-checked the Rings category
in both. "Fortuitous" (Alvl 12, min 11/max 15) and "Felicitous" (rare-eligible) render
correctly with the expected values. Rare Items correctly shows a subset of Magic Items'
affixes for the same category (only `rareEligible: true` entries).

## Real bug found and fixed during this verification pass

Manual spot-checking surfaced 24 internal Diablo II property codes (`att-undead`, `ac-hth`,
`howl`, `res-mag`, etc.) leaking through to rendered pages as raw codes instead of
human-readable labels, across Runes, Crafted Items, and Magic/Rare Items — because they were
missing from this project's `PROP_LABELS_EN`/`PROP_LABELS_ZH_TW` dictionaries in
`scripts/generate-grail-data.mjs`. Fixed in a follow-up commit: researched and added EN + zh-TW
labels for 24 of the 26 codes found (cross-referenced against d2r.world, sibling-code naming
conventions already in the dictionary, and the vendored `itemstatcost.json`'s stat semantics),
left 2 genuinely ambiguous codes (`pierce-dmg`, `war`) unmapped rather than guess, and added a
regression test (`data/grail-data.test.ts`) scanning all three new data files for any
unexpected leaked raw code, so this class of bug can't silently reappear. Re-verified in the
browser after the fix (both `en` and `zh-TW`) — no leaked codes remain in the spot-checked pages.

## Open product question (not fixed, flagged for the human)

Task 6's real `data/magic-affixes.json` category set (37 slugs) includes 12 generic/
class-fallback itype codes that don't map to a deliberately-designed d2r.world-style
taxonomy — e.g. a `shld`/`staff` category distinct from the already-present `shields`/
`staves`, and a `bar` catch-all for Barbarian-class-restricted affixes ("of Howling" etc.).
These are artifacts of the underlying itype/class-code fallback in `TYPE_TO_SLOT`, not a
deliberate design choice, and may look odd to end users browsing the category grid (e.g.
"Barbarian Items" sitting next to "Helms"/"Rings"). Recommend a follow-up product/design
pass to decide whether to hide, merge into siblings, or relabel these 12 categories — not
addressed in this plan since it wasn't part of the original design's scope and doesn't block
correctness of any individual page.

## Summary

All 5 planned sections (Runes, Cube Recipes, Crafted Items, Magic Items, Rare Items) are live,
tested, and verified against d2r.world in all 3 locales. One real generator bug (leaked
property codes) was found and fixed during this verification pass, with a regression test
added. One cosmetic-only rendering difference (Hel's "0" vs. d2r.world's "–") and one product
taxonomy question (12 generic Magic/Rare categories) are documented above as non-blocking
follow-ups.
