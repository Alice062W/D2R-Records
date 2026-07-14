# Grail item reference: d2r.world spot-check verification

Task 5 of the grail-item-reference plan: compare our generated catalog (`data/uniques.json`,
`data/sets.json`, produced by `scripts/generate-grail-data.mjs` from `vendor/d2data/json/*`)
against d2r.world as an external reference, and run the full verification suite.

## Tooling note

d2r.world (`https://d2r.world`) is a client-side-rendered React Native Web app. The item list
pages (`/en-US/info/item/unique/<slot>`, `/en-US/info/item/sets/<set>`) render stat **labels**
reliably via `get_page_text` / `innerText`, but the numeric min/max values for each stat are
*not* present in the DOM text at all (confirmed via direct `innerText` extraction on multiple
item cards) — the list view appears to omit the actual numbers from the accessible text/markup
entirely, independent of scroll position or virtualization. There is no separate per-item detail
page (the "Link" affordance is a copy-to-clipboard action, not a navigable URL). This means the
comparison below is based on: item presence, base item name, grade, and the *set of stat lines*
shown (their labels/types), cross-checked 1:1 against our own `vendor/d2data/json/uniqueitems.json`
/ `setitems.json` for the actual numeric ranges — the numbers themselves could not be independently
verified against d2r.world's rendered numbers, only against d2data (our source of truth), per the
task's framing that d2r.world is a reference for catching *structural* problems (missing stats,
wrong base item, wrong grade), not a numeric oracle.

## Findings summary

Spot-checking these 10 items surfaced **four real defects in our own data-generation script**
(`scripts/generate-grail-data.mjs`), all confirmed against `vendor/d2data/json/*` (not against
d2r.world's numbers) before fixing. No numeric values sourced from d2data were changed — only
label text and previously-dropped stat lines were corrected. See "Fixes applied" below.

One naming question was raised and resolved by following the task's explicit rule: d2r.world
disagrees with our vendored source on one item's *name* (not a stat), and per the brief we kept
d2data's value.

## Item-by-item comparison

| Item | Fields checked | Result | Notes |
|---|---|---|---|
| Harlequin Crest | base name, grade, stat lines | **Fixed** (was incomplete) | d2data base `Shako`, grade `elite` — matches. d2r.world lists 6 stat lines incl. "+ to Life (Based on Character Level)" and "+ to Mana (Based on Character Level)". Our generator was silently dropping `hp/lvl`/`mana/lvl` (any prop with only a `par` field, no min/max) — Harlequin Crest showed only 7 of 9 real stats. Fixed; see below. |
| Vampiregaze ("Vampire Gaze" on d2r.world) | base name, grade, stat lines | Match | d2data base `Grim Helm`, grade `exceptional` — matches d2r.world. All 7 stat lines present on both sides (Enhanced Defense, Cold Damage, Slower Stamina Drain, Life Steal, Mana Steal, Damage Reduced, Magic Damage Reduced). Name differs cosmetically ("Vampiregaze" one word in d2data vs. "Vampire Gaze" spaced on d2r.world) — not a data error, d2data's own internal string, kept as-is. |
| Herald of Zakarum | base name, grade, stat lines | Match | d2data base `Gilded Shield` (raw d2data `*ItemName` field says internal code name "Aerin Shield", but the resolved display baseName via `items.json` is correctly "Gilded Shield" — matches d2r.world exactly). Grade `exceptional` matches. All 9 stat lines present, including the `block`/`block2` pair (Increased Chance of Blocking / Faster Block Rate) which was previously shown as a raw unlabeled `block2` code — now labeled correctly (confirmed against this item's own d2r.world listing, which shows both as separate lines). |
| The Stone of Jordan | base name, grade, stat lines, ranges | Match | d2data base `Ring`, grade `normal` — matches. All 4 stat groups present (Mana, Increase Max Mana %, Adds Lightning Damage, All Skills). "Adds Lightning Damage" is stored as two separate stat IDs (`ltng-min`=1, `ltng-max`=12) in d2data, unlike most other elements — renders as two lines instead of one combined range. Cosmetic only; numerically complete. Previously these two keys had no label mapping (fell back to raw code) — now labeled "Lightning Damage (Min)" / "(Max)". |
| The Grandfather | base name, grade, stat lines | **Fixed** (was incomplete) | d2data base `Colossus Blade`, grade `elite` — matches. d2r.world lists "+ to Maximum Damage (Based on Character Level)" alongside Enhanced Damage — this was the same `dmg/lvl` (`par`-only) stat silently dropped by the generator for every affected item. Fixed; see below. |
| Titan's Revenge | base name, grade, stat lines | **Fixed** (was incomplete) | d2data base `Ceremonial Javelin`, grade `exceptional` — matches. d2r.world lists 10 stat lines incl. "Replenishes quantity in sec." — our data was missing the `rep-quant` stat (also a `par`-only prop, same root cause). Fixed; now 10/10 lines present. |
| Arreat's Face | base name, grade, stat lines | **Fixed** (label bug) | d2data base `Slayer Guard`, grade `exceptional` — matches. d2r.world shows "+% Faster Hit Recovery" where our generated label said "Faster Block Rate" for the `balance2` stat — mislabeled (Arreat's Face is a helm; Faster Block Rate is shield-only mechanically, which was the tell). Fixed by relabeling `balance1`/`balance2` → "Faster Hit Recovery"; `block2` (the shield-relevant code, confirmed via Herald of Zakarum) now correctly labeled "Faster Block Rate". Underlying numeric value (30) unchanged — this was purely a display-label defect in our script, not a d2data value problem. |
| Tal Rasha's Adjudication / Fire-Spun Cloth / Horadric Crest / Howling Wind / Lidless Eye | base names, grades, stat lines, **set name** | Match, with one noted disagreement | All 5 piece base names/grades match d2r.world (`Amulet`/normal, `Mesh Belt`/exceptional, `Death Mask`/exceptional, `Lacquered Plate`/elite, `Swirling Crystal`/exceptional). Set-level name: d2data (`vendor/d2data/json/setitems.json`, field `set`) calls the set **"Tal Rasha's Wrappings"**, matching our `setName` field and matching the set's own top-level heading on d2r.world (`tal_rashas_wrappings`). **d2r.world names the elite armor piece "Tal Rasha's Guardianship"; d2data's own `index` field for that same item (same base `Lacquered Plate`, same stats) is "Tal Rasha's Howling Wind."** This is a genuine item-name disagreement between the two sources. Per the task's rule, kept d2data's name ("Tal Rasha's Howling Wind") unchanged — not renamed to match d2r.world. This also explains the task brief's item name "Tal Rasha's Guardianship," which is d2r.world's name for this same piece. |
| Aldur's Advance | base name, grade, stat lines | Match | d2data base `Battle Boots`, grade `exceptional` — matches. All 7 stat lines match (Indestructible, Faster Run/Walk, Max Stamina, Damage Taken Goes to Mana, Heal Stamina Plus %/Stamina Regenerated %, Life, Fire Resist %) plus the 3-tier Dexterity set bonus. |
| Windforce | base name, grade, stat lines | **Fixed** (was incomplete) | d2data base `Hydra Bow`, grade `elite` — matches. d2r.world lists "+ to Maximum Damage (Based on Character Level)" — same `dmg/lvl` `par`-only drop as Grandfather/Titan's Revenge. Fixed; now 8/8 lines present. |

## Fixes applied (all in `scripts/generate-grail-data.mjs`, then re-ran `npm run generate:grail`)

All fixes are to the **generation script only** — `vendor/d2data/json/*` (source of truth) was
never modified, and every numeric value now in `data/uniques.json` / `data/sets.json` traces
directly to a `min`/`max`/`par` field already present in the vendored source. No d2data value was
changed to match a d2r.world number.

1. **Dropped stat lines for level-scaling props** (root cause, highest impact). Any source prop
   using only a `par` field (no `min`/`max`) — e.g. `hp/lvl`, `mana/lvl`, `dmg/lvl`, `rep-quant`,
   `sock` when expressed this way — was silently skipped by `extractProps`. This affected 67
   occurrences across uniques + sets (per-level scaling stats are common on elite items). Fixed by
   capturing these as a fixed stat using the `par` value, labeled with a "(Based on Character
   Level)" qualifier derived from the base stat's existing label. Directly affected 3 of the 10
   audited items (Harlequin Crest, The Grandfather, Windforce) plus Titan's Revenge's separate
   `rep-quant` ("Replenishes Quantity") stat.
2. **Mislabeled `balance2` as "Faster Block Rate"** — it's actually a Faster Hit Recovery variant
   (confirmed via Arreat's Face, a helm, having no block mechanic, and via Ars Dul'Mephistos on
   d2r.world showing "Faster Hit Recovery" for the same source prop). Relabeled `balance1`/
   `balance2` → "Faster Hit Recovery"; added the previously-unmapped `block2` → "Faster Block
   Rate" (confirmed correct via Herald of Zakarum and multiple other shields on d2r.world that
   show block % and block rate % as distinct lines).
3. **Mislabeled `ease` as "Repair Durability %"** — cross-checking Tal Rasha's Fire-Spun Cloth and
   Howling Wind against d2r.world (both show "Requirements -%" where our data had `ease`) plus the
   full list of items using this prop (all negative except one, consistent with "reduced
   requirements," not a durability mechanic) confirmed it's actually "Requirements %". Relabeled.
4. **~30 previously-unmapped stat codes falling back to raw internal codes** (e.g. `ama`, `pal`,
   `sor`, `bar`, `dru`, `nec`, `ass`, `dmg`, `knock`, `stack`, `mana%`, `hp%`, `stamdrain`,
   `cast3`, `pierce-fire`/`ltng`/`cold`/`pois`/`mag`, `extra-cold`/`fire`/`ltng`/`mag`/`pois`,
   `abs-cold`/`fire`, `ltng-min`/`max`, `fire-min`/`max`, `cold-min`/`max`/`len`, `pois-min`/
   `max`/`len`) now have readable labels, cross-checked against d2r.world's wording where the
   affected item appeared in the 10-item sample (`ama`, `stamdrain`, `pierce-fire`, `pierce-ltng`,
   `extra-cold`, `dmg`, `stack`). This is a display-quality improvement, not a correctness fix —
   the underlying values were already correct, just shown with a raw code as the label.

`npm run generate:grail` was re-run after each change; `data/uniques.json` stays at 403 entries
and `data/sets.json` at 135 entries (counts unchanged, confirming no items were added/dropped —
only label text and previously-missing stat *lines within existing items* changed).

## What could not be verified

- Exact numeric min/max values against d2r.world's own rendering — their list-view UI does not
  expose numbers in accessible text/DOM for any item card tested (see Tooling note above). All
  numeric ranges are verified against `vendor/d2data/json/uniqueitems.json` /
  `vendor/d2data/json/setitems.json` directly instead, which is the authoritative source per the
  project's own data pipeline.
- Whether d2r.world's few remaining un-numbered "()"-suffixed set-bonus lines (their shorthand for
  per-tier partial bonuses) correspond 1:1 in ordering to our `setBonuses` array beyond stat-key
  presence — the partial-bonus *tiers* were confirmed present and equal in count, but tier-by-tier
  numeric progression could not be read from d2r.world's UI for the same reason as above.
