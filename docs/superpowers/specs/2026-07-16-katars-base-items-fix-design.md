# Base Items Katars Fix — Design

## Goal

Fix a real generator bug: Katars are entirely missing from the Base Items page. Confirmed
against d2r.world (`https://d2r.world/en-US/info/item/base` lists Katars as a top-level
category, between Wands and Bows), while `data/bases-full.json` has zero entries with
`slotCategory: 'katars'`.

## Root cause

`scripts/generate-grail-data.mjs`'s `TYPE_TO_SLOT` map (line 361-377) has:
```js
grim: 'grimoires', h2h2: 'katars',
```
but real Katar base items in `vendor/d2data/json/items.json` (e.g. `ktr` "Katar", `wrb`
"Wrist Blade", `axf` "Hatchet Hands", `ces` "Cestus", `clw` "Claws") all have
`"type": "h2h"`, not `"h2h2"`. The Base Items generation filter
(`v.normcode === code && TYPE_TO_SLOT[v.type]`) silently excludes every katar entry
because `TYPE_TO_SLOT['h2h']` is `undefined` — the map only has a key for the
never-matching `h2h2`.

Confirmed `h2h` isn't already claimed by a different, correct mapping elsewhere in
`TYPE_TO_SLOT` — it isn't present at all currently.

## Design

Fix: add `h2h: 'katars'` to `TYPE_TO_SLOT` (keep the existing, currently-dead `h2h2:
'katars'` entry too, in case it's used by some other vendored data path — check whether
anything else in the file depends on `h2h2` specifically before deciding whether to keep
or remove it; if nothing does, removing the dead entry is fine, but adding `h2h` is the
actual fix). Regenerate `data/bases-full.json`.

## Non-goals

- The "Shields → Paladin Shields/Shrunken Heads/Grimoires sub-tabs" structural gap —
  bundled into the separate, larger taxonomy project already agreed with the user
  (covers this same sub-category pattern across Base Items and Magic/Rare Items
  together).
- Any change to Unique/Set Items' katars handling — already verified both
  `data/uniques.json` and `data/sets.json` have real `slotCategory: 'katars'` entries
  today (their unique/set item generation path reads `itype1`/`itype2` restriction
  fields via a different lookup than the plain base-item filter, so it isn't affected by
  this bug).

## Testing plan

- Generator test: `data/bases-full.json` has at least one entry with `slotCategory:
  'katars'` after the fix (currently zero).
- Manual + d2r.world spot-check: confirm the Base Items page's Katars category renders
  real base item comparison rows (Katar/Wrist Blade/Hatchet Hands/etc. across
  normal/exceptional/elite), matching d2r.world's Katars tab content.
