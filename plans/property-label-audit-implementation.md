# Comprehensive Property-Label Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining 36 leaked raw property codes across `data/uniques.json`,
`data/sets.json`, `data/runewords-full.json`, and `data/magic-affixes.json`, and broaden
the leaked-code regression test to scan every generated data file (not just the three the
prior fix's test covered), so this bug class can't resurface anywhere in the catalog.

**Architecture:** Extend `PROP_LABELS_EN`/`PROP_LABELS_ZH_TW` in
`scripts/generate-grail-data.mjs` (same dictionaries the prior fix extended), regenerate
all data, and widen the existing regression test's file list.

**Tech Stack:** Node.js generator script, Vitest.

## Global Constraints

- Every code added must be independently verified against real vendored data
  (`vendor/d2data/json/itemstatcost.json`, fetched for research only — do not vendor it
  permanently unless it ends up a real build input) or d2r.world, not guessed.
- Codes whose semantics can't be confidently grounded (candidates from the design spec:
  `rip`, `cheap`, possibly `ethereal`) are left unmapped rather than given an invented
  label, added to the same `DELIBERATELY_UNMAPPED` exception set as `war`/`pierce-dmg`.
- `ethereal` specifically: investigate whether it's a genuinely displayable stat at all
  (D2's ethereal flag is usually a boolean item property, not a granted magic property) —
  if it isn't, exclude it from the rendered stat list at its source entries rather than
  giving it a misleading numeric label.
- Any code whose `par` field references a specific skill/aura (the same shape as the
  existing `SKILL_REF_PROPS` set) must be verified and, if so, added to
  `SKILL_REF_PROPS`/`CODE_ALIASES` as appropriate rather than given a flat, skill-blind
  label — do not assume a code is skill-referencing OR non-referencing without checking.
- No changes to `RECIPE_CATEGORY`, `CRAFT_FAMILY_BY_ID`, or any non-label generator logic.

---

### Task 1: Research and add missing property labels

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:**
- Extends: `PROP_LABELS_EN`, `PROP_LABELS_ZH_TW` (existing dictionaries,
  `scripts/generate-grail-data.mjs:27-122`).
- Reuses: `SKILL_REF_PROPS`, `CODE_ALIASES`, `KEY_ONLY_DISAMBIGUATE_PROPS` (existing sets,
  same file, ~lines 164-179) — extend these too if research shows a new code needs them.

- [ ] **Step 1: Confirm the current leaked-code baseline**

Run:
```bash
node -e "
const fs = require('fs');
const files = ['uniques.json','sets.json','runewords-full.json','magic-affixes.json'];
const leaked = new Map();
function walk(node, file) {
  if (Array.isArray(node)) { for (const n of node) walk(n, file); return; }
  if (node && typeof node === 'object') {
    const label = node.label;
    if (typeof node.key === 'string' && label && typeof label.en === 'string') {
      const code = node.key.split(':')[0];
      if (label.en === code && /^[a-z0-9]+(-[a-z0-9%]+)+\$/.test(code)) {
        if (!leaked.has(code)) leaked.set(code, new Set());
        leaked.get(code).add(file);
      }
    }
    for (const v of Object.values(node)) walk(v, file);
  }
}
for (const f of files) {
  const data = JSON.parse(fs.readFileSync('data/'+f));
  walk(data, f);
}
for (const [code, files] of leaked) console.log(code, '->', [...files].join(','));
console.log('TOTAL:', leaked.size);
"
```
Expected: 36 codes listed (35 hyphenated + the `att-und`/`dmg-und` pair, which this exact
regex catches too since they match the same shape), matching the design spec's list.

- [ ] **Step 2: Fetch `itemstatcost.json` for research**

```bash
curl -s "https://raw.githubusercontent.com/blizzhackers/d2data/477bcf63e964f39f4c774e588a79fd598ae472de/json/itemstatcost.json" -o /tmp/itemstatcost.json
```

Cross-reference each leaked code against this file's `Stat` field names (the design
spec's Background section already lists strong candidate `Stat` matches for most codes —
verify each one directly, e.g.:
```bash
node -e "
const isc = JSON.parse(require('fs').readFileSync('/tmp/itemstatcost.json'));
const arr = Object.values(isc);
console.log(arr.find(v => v.Stat === 'item_pierce'));
"
```
For codes with no obvious `itemstatcost.json` match by exact name (the design spec flags
`rip`, `cheap` as uncertain), do a broader `grep -i` search against the file for
plausible substrings before concluding a code is unresolvable.

- [ ] **Step 3: Cross-check against d2r.world for real items where visible**

For codes present on well-known, currently-obtainable uniques (per the design spec: e.g.
`pierce` on Buriza-Do Kyanon, `magicarrow` on Witherstring, `explosivearrow` on
Rimeraven), open the corresponding d2r.world unique-item page and confirm the exact
in-game wording used for that stat line, to ground the English label's exact phrasing
(this project's established practice: d2r.world wording is the reference for exact
phrasing, per the site's whole "match d2r.world" goal).

- [ ] **Step 4: For each code with a skill/aura-referencing `par` field, verify before labeling**

Specifically check `aura` (a Paladin-aura-granting stat) — read a few real entries in
`data/uniques.json`/`data/sets.json` carrying this key and check whether their `par`
value looks like a skill/aura reference (a numeric id or literal name), the same shape
`SKILL_REF_PROPS` already handles for `oskill`/`skill`/etc. If so, add `'aura'` to the
`SKILL_REF_PROPS` set (`scripts/generate-grail-data.mjs` near line 164) so the specific
aura name renders instead of a generic "Aura Level" label for every item — regenerate and
confirm this actually resolves specific aura names (e.g. "Level X Defiance Aura When
Equipped" style output), not just that it doesn't crash.

- [ ] **Step 5: Add every confidently-resolved code to both dictionaries**

Add each resolved code to `PROP_LABELS_EN` (grouped near related existing entries, e.g.
`pierce`/`pierce-immunity-*` near the existing `pierce-fire`/`pierce-cold` family;
`att-und`/`dmg-und` near `att-undead`/`dmg-undead`; `abs-ltng%`/`abs-cold%`/`abs-fire%`
near `abs-cold`/`abs-fire`; `res-all-max` near `res-all`; `block3` near `block`/`block2`;
`skilltab-war` near `skilltab`) and the matching hand-authored `PROP_LABELS_ZH_TW` entry,
following both dictionaries' existing formatting conventions exactly.

For any code left unresolved after Steps 2-4 (candidates: `rip`, `cheap`, possibly
`ethereal` if it turns out not to be a displayable stat at all), do NOT add it to either
dictionary — instead add it to the `DELIBERATELY_UNMAPPED` set in Task 2's regression
test with a comment explaining why (matching the existing `war`/`pierce-dmg` comment
style at `data/grail-data.test.ts:366-374`).

If `ethereal` turns out to not be a genuine per-item magic property (investigate its
actual source field/shape in the vendored data before deciding), exclude it at its
source in the generator (wherever it's currently being picked up into a stats array)
rather than labeling it — document this as a code comment at the exclusion site.

- [ ] **Step 6: Regenerate all data**

```bash
npm run generate:grail
```

- [ ] **Step 7: Commit**

```bash
git add scripts/generate-grail-data.mjs data/*.json
git commit -m "Add missing property labels for uniques/sets/runewords/magic-affixes"
```

---

### Task 2: Broaden the regression test to cover every data file

**Files:**
- Modify: `data/grail-data.test.ts`

**Interfaces:**
- Consumes: `findLeakedRawCodes` (existing helper function, `data/grail-data.test.ts:381`)
  — reuse as-is, do not duplicate.

- [ ] **Step 1: Widen the test's file list**

In `data/grail-data.test.ts`, change the existing test at line 402 from:

```ts
  it('runes.json, crafted-items.json, and magic-affixes.json have no leaked raw property codes', () => {
    const leaked = new Set<string>();
    for (const data of [runesData, craftedItemsData, magicAffixesData]) {
      for (const code of findLeakedRawCodes(data)) leaked.add(code);
    }
    for (const code of leaked) {
      expect(DELIBERATELY_UNMAPPED.has(code)).toBe(true);
    }
  });
```

to:

```ts
  it('no generated data file has an unexpected leaked raw property code', () => {
    const leaked = new Set<string>();
    for (const data of [uniques, sets, basesFull, runewordsFull, runesData, craftedItemsData, cubeRecipesData, magicAffixesData]) {
      for (const code of findLeakedRawCodes(data)) leaked.add(code);
    }
    for (const code of leaked) {
      expect(DELIBERATELY_UNMAPPED.has(code)).toBe(true);
    }
  });
```

(`uniques`, `sets`, `basesFull`, `runewordsFull` are already imported at the top of this
file per lines 2-5; `cubeRecipesData` is already imported at line 6 — this change adds no
new imports, just widens the existing test's data-file list to match every import already
present in the file.)

Update the `DELIBERATELY_UNMAPPED` comment block (lines 366-374) to include an entry for
every code Task 1 deliberately left unmapped (in addition to the pre-existing
`pierce-dmg`/`war` entries), with the same "why" explanation style.

- [ ] **Step 2: Run the test and verify it passes**

Run: `npx vitest run data/grail-data.test.ts -t "leaked"`
Expected: PASS — zero unexpected leaked codes across all 8 data files.

- [ ] **Step 3: Run full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean (the pre-existing unrelated `RunewordList.test.tsx` `vi`-unused
warning is fine).

- [ ] **Step 4: Commit**

```bash
git add data/grail-data.test.ts
git commit -m "Broaden leaked-property-code regression test to cover every data file"
```

---

### Task 3: d2r.world spot-check + verification doc

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-property-label-audit-verification.md`

- [ ] **Step 1: Manual browser spot-check**

Build (`npm run build`) and serve the static export locally. Spot-check at least 5 of the
newly-labeled stats directly against d2r.world's corresponding unique/set item pages
(e.g. Buriza-Do Kyanon for `pierce`/"Ignore Target's Defense", Witherstring for
`magicarrow`, Boneslayer Blade for the `att-und/lvl`/`dmg-und/lvl` level-scaling labels,
one `pierce-immunity-*` example, and one `light-thorns` example) — confirm the rendered
English wording matches d2r.world's own text for that stat line.

- [ ] **Step 2: Confirm zero leaks remain in the built site**

Grep the static export output for any remaining hyphenated raw-code-looking text that
isn't one of the deliberately-unmapped exceptions:
```bash
grep -rlE '>(rip|cheap|ethereal)<' out/en/items/ 2>/dev/null || echo "none found outside allowed exceptions"
```
(Adjust the pattern to whatever codes Task 1 actually left unmapped.)

- [ ] **Step 3: Write the verification doc and commit**

Write `docs/superpowers/specs/2026-07-16-property-label-audit-verification.md` following
the format of prior verification docs in this project (see
`docs/superpowers/specs/2026-07-15-runes-cube-crafted-magic-rare-verification.md` for the
established structure: automated verification output, manual/d2r.world spot-check
findings, any remaining open items). Commit it.
