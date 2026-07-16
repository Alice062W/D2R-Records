# Bar Affix Exclusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the bogus "Barbarian Items" (`bar`) category on the Magic Items page
by excluding the 9 malformed magic-suffix entries that produce it, matching
d2r.world (which shows none of them anywhere).

**Architecture:** A single filtering change in the existing
`scripts/generate-grail-data.mjs` generator (`magicAffixesFrom`), plus removing the
now-dead `bar` i18n keys and regenerating `data/magic-affixes.json`.

**Tech Stack:** Node.js generator script, Vitest.

## Global Constraints

- Exclude by data shape (`mod{n}code === 'charged'` with both `mod{n}min` and
  `mod{n}max` negative), not by class or name allowlist — this also removes the
  equivalent malformed rows for the other 6 affected classes as a side effect, per the
  design's non-goals section.
- Valid `"charged"` entries with positive values (e.g. Daggers' "of Frozen Orb") must
  remain completely unaffected.
- Remove the `"bar"` key from `AffixCategories` in all three message files once no
  affix references it.

---

### Task 1: Exclude malformed `charged` entries + remove dead `bar` category

**Files:**
- Modify: `scripts/generate-grail-data.mjs` (`magicAffixesFrom`, around line 1230)
- Modify: `data/grail-data.test.ts` (add tests to the existing `describe('magic-affixes.json', ...)` block, around line 373)
- Modify: `data/magic-affixes.json` (regenerated output)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json` (remove `AffixCategories.bar`)

**Interfaces:**
- Consumes: `magicPrefixData`, `magicSuffixData` (already-parsed vendored JSON, existing module-level constants in the generator script).
- Modifies: `magicAffixesFrom(data, kind)` — same signature and return shape as before; only which rows survive the `.filter(...)` changes.

- [ ] **Step 1: Write the failing regression tests**

Add these two tests inside the existing `describe('magic-affixes.json', ...)` block in
`data/grail-data.test.ts` (after the `'every entry has at least one item type and one
stat'` test):

```ts
  it('excludes malformed negative-charge "charged" entries (e.g. the 9 broken Barbarian suffixes)', () => {
    const brokenNames = [
      'of Howling', 'of Potion Finding', 'of Taunting', 'of Shouting',
      'of Item Finding', 'of Battle Cry', 'of Battle Orders', 'of War Cry',
      'of Battle Command',
    ];
    for (const name of brokenNames) {
      const matches = magicAffixesData.filter(a => a.name.en === name);
      // Each of these names has a valid sibling entry (a different id) elsewhere in
      // the source data with a real item-type restriction (e.g. "of Howling" id 620,
      // itype1 "phlm") — only the malformed negative-charge id (e.g. 621) should be
      // gone, not every entry sharing that display name.
      expect(matches.every(a => !a.itemTypes.includes('bar'))).toBe(true);
    }
    // No entry anywhere should carry the raw, unmapped "bar" class-code fallback.
    expect(magicAffixesData.every(a => !a.itemTypes.includes('bar'))).toBe(true);
  });

  it('keeps valid "charged" entries with positive values (e.g. Daggers\' "of Frozen Orb")', () => {
    const frozenOrb = magicAffixesData.filter(a => a.name.en === 'of Frozen Orb');
    expect(frozenOrb.length).toBeGreaterThan(0);
    expect(frozenOrb.some(a => a.itemTypes.includes('daggers'))).toBe(true);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run data/grail-data.test.ts -t "magic-affixes.json"`
Expected: FAIL — the first new test fails because `data/magic-affixes.json` (not yet
regenerated) still contains entries with `itemTypes: ["bar"]`.

- [ ] **Step 3: Implement the exclusion in the generator**

In `scripts/generate-grail-data.mjs`, modify `magicAffixesFrom` (the function starting
around line 1230). Add a helper just above it and change the `.filter(...)` chain:

```js
// magicprefix.json/magicsuffix.json's group-44 "charged"-mod entries are meant to
// grant "Level X <Skill> (Y Charges)" — but a subset of these (9 confirmed for the
// Barbarian class, e.g. "of Howling" id 621) have negative mod{n}min/mod{n}max
// values (e.g. -20 to -6), which is nonsensical for a charge count, AND are missing
// any itype restriction entirely (their valid, correctly-itype'd sibling entry, e.g.
// "of Howling" id 620 with itype1 "phlm", is a separate row). Confirmed against
// d2r.world directly: neither the malformed rows nor their valid siblings appear on
// any of its Magic Items category pages, so this whole group-44 negative-charge
// family is dead/non-functional data that d2r.world (and therefore this project)
// excludes entirely, rather than guessing a category for it.
function hasMalformedNegativeCharge(entry) {
  for (let n = 1; n <= 3; n++) {
    if (entry[`mod${n}code`] !== 'charged') continue;
    const min = entry[`mod${n}min`];
    const max = entry[`mod${n}max`];
    if (typeof min === 'number' && typeof max === 'number' && min < 0 && max < 0) {
      return true;
    }
  }
  return false;
}

function magicAffixesFrom(data, kind) {
  return Object.entries(data)
    .filter(([, v]) => (v.frequency ?? 0) > 0)
    .filter(([, v]) => !hasMalformedNegativeCharge(v))
    .map(([id, v]) => {
      const { variable, fixed } = extractMagicAffixStats(v);
      return {
        id: `${kind}-${id}`,
        name: localizedItemName(v.Name ?? `Unnamed Affix ${id}`),
        kind,
        alvl: v.level ?? v.levelreq ?? 0,
        itemTypes: itemTypesForAffix(v),
        rareEligible: v.rare === 1,
        stats: [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, min: f.value, max: f.value }))],
      };
    });
}
```

- [ ] **Step 4: Remove the dead `bar` i18n key**

Remove the `"bar": "Barbarian Items"` entry (and its zh-TW/zh-CN equivalents) from the
`AffixCategories` namespace in `messages/en.json`, `messages/zh-TW.json`,
`messages/zh-CN.json`.

- [ ] **Step 5: Regenerate the data file**

Run: `node scripts/generate-grail-data.mjs`
This regenerates `data/magic-affixes.json` (and the other generated data files, which
should show no diff).

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run data/grail-data.test.ts`
Expected: PASS — all tests in the file, including the two new ones.

- [ ] **Step 7: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/grail-data.test.ts data/magic-affixes.json messages/en.json messages/zh-TW.json messages/zh-CN.json
git commit -m "Exclude malformed negative-charge affixes; remove bogus Barbarian Items category"
```

---

### Task 2: Full verification + d2r.world spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-bar-affix-exclusion-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual + d2r.world spot-check**

Serve the static export locally. Navigate to `/en/items/magic`. Confirm no
"Barbarian Items" tile appears (in any of the three locales), and that
`/en/items/magic/bar` returns a 404 (build should not emit this path at all — check
`generateStaticParams` no longer includes `bar` and the route isn't in the static
export output). Spot-check that a handful of ordinary categories (e.g. Helms, Daggers)
still list their full, correct affix sets — including "of Frozen Orb" still appearing
under Daggers — confirming the exclusion didn't over-match.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
