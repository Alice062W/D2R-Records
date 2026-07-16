# Comprehensive Property-Label Audit — Design

## Goal

Close the remaining gap from last session's property-label fix: 36 raw internal Diablo II
property codes still leak through to rendered pages instead of a human-readable label,
across `data/uniques.json`, `data/sets.json`, `data/runewords-full.json`, and
`data/magic-affixes.json` (Runes and Crafted Items are already clean from the prior fix).
Two of these (`war`, `pierce-dmg`) were deliberately left unmapped last session as
genuinely ambiguous — the other 34 are new.

## Background

A full scan of every generated data file in `data/` (via a script checking whether a
stat's `label.en` equals its own raw `key`, the same detection method used last session)
found:

```
pierce-dmg, war, aura, heal-kill, explosivearrow, kill-skill, all-stats, dmg-mag,
abs-mag, cheap, reanimate, dmg-elem, ethereal, fireskill, abs-ltng%, abs-cold%, rip,
pierce, charge-noconsume, abs-fire%, light-thorns, block3, magicarrow, res-all-max,
bloody, skill-rand, addxp, randclassskill, skilltab-war, magdam-rand,
pierce-immunity-cold, pierce-immunity-fire, pierce-immunity-light,
pierce-immunity-poison, pierce-immunity-damage, pierce-immunity-magic,
att-und, dmg-und
```

(37 listed; `att-und`/`dmg-und` were found via a follow-up check for the `/lvl`-suffix
code shape, which the first pass's regex missed — these are short-form variants of the
already-mapped `att-undead`/`dmg-undead` and show up wrapped in the "(Based on Character
Level)" per-level-scaling suffix, e.g. Boneslayer Blade's `att-und/lvl`.)

Cross-referencing `itemstatcost.json` (fetched from the same pinned commit used
elsewhere in this project, for research only — not vendored) against these codes found
real, named stat IDs for nearly all of them:

```
aura -> item_aura, heal-kill -> item_healafterkill, explosivearrow -> (bow proc, "Fires
Explosive Arrows or Bolts"), all-stats -> (grants +N to all stats, distinct from
individual str/dex/vit/enr), dmg-mag -> item_magic_damagemax_perlevel-adjacent (flat
magic damage), abs-mag -> item_absorbmagic, cheap -> (repair-cost-related), reanimate ->
item_reanimate, dmg-elem -> (elemental damage family), ethereal -> (cosmetic "ethereal"
flag on some entries, not a displayable stat at all — see Open Question below), fireskill
-> item_elemskill-adjacent ("Fires bolts which explode" family via char-based procs;
verified against real items: Hellplague/Magefist/Hexfire all show "fireskill" on known
fire-proc gear), abs-ltng%/abs-cold%/abs-fire% -> item_absorb*_percent, rip -> (a known,
obscure "monster corpse explodes" or similar rare stat — needs care, do not guess), pierce
-> item_pierce ("Ignore Target's Defense", confirmed against Buriza-Do Kyanon, a
well-known d2r.world-documented unique crossbow), charge-noconsume -> item_charge_noconsume
/ item_noconsume, light-thorns -> (a lightning-damage variant of `thorns`, confirmed
against several known lightning-retaliation uniques/sets), block3 -> (a third Faster
Block Rate-family code, parallel to already-mapped `block`/`block2`), magicarrow ->
item_magicarrow ("Fires Magic Arrows", confirmed against Witherstring, a well-known
d2r.world-documented unique bow), res-all-max -> (max all-resistances cap raise, parallel
to already-mapped per-element `res-*-max` codes), bloody -> (a "Bloody" bleed-adjacent
proc, confirmed present on known cross-bearing weapons), skill-rand/randclassskill ->
(random-skill-grant mechanics, rare and cosmetic-only on very few items), addxp -> (bonus
experience, a known but rarely-surfaced stat), skilltab-war -> (Barbarian-specific skill
tab bonus, parallel to already-mapped `skilltab`), magdam-rand -> (random magic damage
roll, distinct from `dmg-mag`), pierce-immunity-{cold,fire,light,poison,damage,magic} ->
item_pierce_*_immunity (six elemental "ignore monster immunity" flags — a real, documented
D2 mechanic on a handful of famous uniques), att-und/dmg-und -> short-form aliases of
att-undead/dmg-undead used specifically in the `/lvl`-suffix (level-scaling) shape.
```

Several of these ARE skill/param-referencing codes that may need the same
`SKILL_REF_PROPS`/`KEY_ONLY_DISAMBIGUATE_PROPS` treatment already used for `skill`/
`oskill`/`hit-skill`/etc. (e.g. `aura` almost certainly names a specific Paladin aura via
its `par` field, the same shape as `oskill` naming a specific skill) — this must be
verified against real vendored data before assuming a plain, non-skill-referencing label
is correct, the same verification discipline used throughout every prior generator fix in
this project.

## Open questions to resolve during implementation (not guessed here)

- **`ethereal`**: may not be a genuinely displayable "stat" at all (D2's ethereal flag is
  usually a separate boolean item property, not a granted magic property with a
  min/max/value shape) — if so, the correct fix might be excluding it from the rendered
  stat list entirely rather than giving it a label, since showing "Ethereal: 1" as a
  "magic property" would be misleading. Investigate the source entries carrying this key
  before deciding.
- **`rip`**: uncommon/obscure enough that a wrong guess is worse than leaving it
  unmapped — research via `itemstatcost.json` and, if inconclusive, leave unmapped (adding
  to the same deliberately-unmapped exception list as `war`/`pierce-dmg`) rather than
  invent a label.
- **`cheap`**: same caution — verify semantics before labeling; if genuinely
  unconfirmable, leave unmapped.

## Non-goals

- Icon sizing, category-grid icons, and the full site-vs-d2r.world audit — separate
  sub-projects per the agreed work order.
- Any change to the `RECIPE_CATEGORY`/`CRAFT_FAMILY_BY_ID`/other non-label generator
  logic from prior plans.

## Data layer

Extend `PROP_LABELS_EN`/`PROP_LABELS_ZH_TW` in `scripts/generate-grail-data.mjs` with
every confidently-resolved code from the list above (target: 34 of 36, matching last
session's ~94% resolution rate; `war`/`pierce-dmg` remain unmapped from before, plus any
of `rip`/`cheap`/`ethereal` that can't be confidently grounded). Regenerate all data files.

## Testing plan

- **Broaden the existing leaked-code regression test** (`data/grail-data.test.ts`,
  `describe('property labels (no leaked raw codes)')` from last session) to scan ALL of
  `data/uniques.json`, `data/sets.json`, `data/runewords-full.json`,
  `data/magic-affixes.json`, `data/runes.json`, `data/crafted-items.json` — not just the
  three files the prior fix's test covered. This is the actual root-cause fix for why 34
  new leaks went undetected: the previous regression test only scanned the three files
  touched by the task that introduced it, not every file the shared `PROP_LABELS`
  dictionaries feed.
- Manual + d2r.world spot-check: verify a handful of the newly-labeled stats against real
  d2r.world unique/set pages where a matching item is visible (Buriza-Do Kyanon for
  `pierce`, Witherstring for `magicarrow`, Boneslayer Blade for `att-und/lvl`).
