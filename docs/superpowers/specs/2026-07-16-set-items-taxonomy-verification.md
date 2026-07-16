# Set Items Taxonomy Fix — Verification

## Automated verification

```
npx tsc --noEmit   -> clean
npm run lint       -> 0 errors, 1 pre-existing unrelated warning (RunewordList.test.tsx unused `vi`)
npm test           -> 23 test files, 129 tests, all passing
npm run build      -> succeeded (with .env.local present locally)
```

Static export confirmed to include `out/en/items/set/aldurs-watchtower/index.html` (a
set detail page), `out/en/items/set/category/index.html` (the combined category grid),
and `out/en/items/set/category/weapons/index.html` (the combined Weapons category).

## Real bug found and fixed during this verification pass

Manual spot-checking the combined category grid found only 9 categories were expected
(Weapons, Helms, Armors, Shields, Belts, Boots, Gloves, Rings, Amulets, matching
d2r.world exactly) but the built site showed 10 — **Bows** was still appearing as a
separate top-level tile alongside Weapons. Root cause: the plan's own
`WEAPON_SLOTS_FOR_SET_COMBINATION` set only listed melee weapon categories (swords,
daggers, axes, polearms, spears, clubs, maces, hammers, scepters, staves, orbs, wands,
katars, grimoires) and omitted the ranged weapon categories (bows, crossbows, javelins,
throwings) — a gap in the plan itself, not an implementation error. Fixed directly:
added `bows`, `crossbows`, `javelins`, `throwings` to the combination set, updated the
existing regression test to cover all 18 weapon-type categories, rebuilt, and
re-verified — the category grid now shows exactly the 9 expected tiles.

## Manual browser + d2r.world spot-check

**By-name browsing** (`/en/items/set`): all 34 sets listed by name (Aldur's Watchtower
through Vidala's Rig), each linking to its own detail page. Matches d2r.world's Set
Items page primary content.

**Set detail page** (`/en/items/set/aldurs-watchtower`): all 4 pieces (Aldur's Advance,
Aldur's Deception, Aldur's Gauntlet, Aldur's Stony Gaze) render with full item stats via
the existing `ItemStatCard`, followed by:
- Partial Set Bonus: "2 pieces: Attack Rating % 150", "3 pieces: Magic Find % 50",
  "4 pieces: Life Steal % 10" — matches the vendored `sets.json` exactly.
- Full Set Bonus: All Resistances 50, Druid Skill Levels 3, Defense 150, Mana Steal %
  10, Mana 150, Enhanced Damage % 350 — matches the vendored data exactly, with the
  cosmetic `state`/`fullsetgeneric` flag correctly excluded from the displayed list.

**Combined category view** (`/en/items/set/category`): after the Weapons-combination
fix above, shows exactly 9 categories (Weapons, Helms, Armors, Shields, Belts, Boots,
Gloves, Rings, Amulets), matching d2r.world's Set Items category tab list precisely.

**Unique Items unaffected**: confirmed `/en/items/unique` still shows individual
weapon-type categories (Swords, Axes, Bows, etc. all separate) — the Weapons combination
is scoped to Set Items only, as designed.

## Summary

Both Set Items gaps are closed: the by-name browsing view is live with correct
set-level partial and full-set bonuses (sourced from a newly-vendored `sets.json`), and
the category view now correctly combines all weapon types (melee and ranged) into one
tile, matching d2r.world exactly. One real gap in the plan's own weapon-category list
was found and fixed during this verification pass.
