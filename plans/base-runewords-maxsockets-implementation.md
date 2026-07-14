# Base Items, Runewords, Max Sockets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build real content for Base Items, Runewords, and Max Sockets — three more
d2r.world-equivalent sections, replacing their placeholder pages.

**Architecture:** Extend the existing `scripts/generate-grail-data.mjs` (not a new
script) with three new output datasets, reusing its existing locale/label/skill-name
machinery. Base Items reuses the existing `CategoryCardGrid` component as-is (same
category-grid-then-detail-page flow as Unique/Set Items) but needs a new
comparison-table detail component instead of stat cards. Runewords is a single
filterable list page, not a card-grid flow. Max Sockets is a single static table page.

**Tech Stack:** Next.js 16 (App Router, static export), next-intl 4.x, Tailwind CSS 4,
Vitest + `@testing-library/react`, `opencc-js` (already a devDependency).

## Global Constraints

- `data/runewords.json` (consumed by `src/lib/appraise.ts` for the Appraiser feature) is
  **never modified** by this plan. All new data goes into separate, newly-created files:
  `data/bases-full.json`, `data/runewords-full.json`, `data/max-sockets.json`. Likewise
  `data/bases.json` and `data/thresholds.json` (also Appraiser-facing) are untouched.
- All three new datasets are generated output (like `data/uniques.json`/`data/sets.json`)
  — never hand-edited, regenerated via an npm script.
- Reuse `scripts/generate-grail-data.mjs`'s existing `PROP_LABELS_EN`/`PROP_LABELS_ZH_TW`,
  `localizedLabelFor`, `localizedLabelWithSkill`, `localizedItemName`,
  `localizedBaseName`, `TYPE_TO_SLOT`, `SKILL_REF_PROPS`, `CODE_ALIASES`,
  `KEY_ONLY_DISAMBIGUATE_PROPS`, and `toZhCn` — do not duplicate this machinery into a
  new file or reimplement any of it.
- zh-TW text is hand-authored; zh-CN for anything not derived from `localestrings-chi.json`
  is derived via `toZhCn()` (generator-time) or the existing
  `scripts/translate-nav-items-ui-zh-cn.mjs` pattern (message-file keys) — never
  independently translated.
- Every new page follows the existing pattern: `generateStaticParams` returning every
  valid `{locale}` or `{locale, category}` pair, `await params`, `setRequestLocale(locale)`,
  then `getTranslations(...)`.
- Generic item/stat vocabulary already in the `Grail` namespace (`slot_*`, `grade_*`,
  `itemStats`, `magicProperties`, etc.) is reused, not duplicated — same policy as every
  prior plan in this project.
- Dark theme Tailwind classes match the existing palette (`bg-zinc-900`/`border-zinc-700`
  surfaces, `bg-amber-500`/`text-amber-300` accents).
- No icons — text-only presentation, per the accepted project-wide gap.
- The Grail Tracker and the existing Unique/Set Items pages/components are not modified.

---

### Task 1: Vendor `runes.json`

**Files:**
- Create: `vendor/d2data/json/runes.json`
- Modify: `vendor/d2data/README.md`

- [ ] **Step 1: Fetch the file at the project's pinned commit**

```bash
curl -s "https://raw.githubusercontent.com/blizzhackers/d2data/477bcf63e964f39f4c774e588a79fd598ae472de/json/runes.json" \
  -o vendor/d2data/json/runes.json
```

- [ ] **Step 2: Verify the fetch**

```bash
python3 -c "import json; d = json.load(open('vendor/d2data/json/runes.json')); print(len(d)); print(d['Enigma'])"
```

Expected: `181` entries, and Enigma's record shows `"*RunesUsed": "JahIthBer"`,
`"itype1": "tors"`, and `T1Code1`..`T1Code7`/`T1Min`/`T1Max`/`T1Param` fields.

- [ ] **Step 3: Update the vendor README**

Add to `vendor/d2data/README.md` (after the existing paragraph):

```markdown

`runes.json` provides runeword definitions (required runes, base item type
restriction, and granted stat properties in the same `T{n}Code`/`Min`/`Max`/`Param`
shape as `uniqueitems.json`/`setitems.json`) for the Runewords reference page.
```

- [ ] **Step 4: Commit**

```bash
git add vendor/d2data/json/runes.json vendor/d2data/README.md
git commit -m "Vendor runes.json for the Runewords reference page"
```

---

### Task 2: Generate `data/bases-full.json`

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts` (extend the existing file)

**Interfaces:**
- Produces: `data/bases-full.json` — an array of `{ id, slotCategory, grades: { normal,
  exceptional, elite } }` entries (one per weapon/armor "line"), where each non-null
  grade is `{ name: LocalizedText, oneHandDamage, twoHandDamage, levelReq,
  requiredStrength, requiredDexterity, durability, sockets, qlvl }` (damage fields are
  `{ min, max } | null`, everything else is `number | null`). Consumed by Task 5.

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts` (add `bases-full.json`'s import at the top alongside
the existing catalog imports — it's plain JSON, imported the same way as `uniques.json`):

```ts
import basesFull from './bases-full.json';

describe('bases-full.json', () => {
  it('groups Hand Axe / Hatchet / Tomahawk into one axes line with all 3 grades', () => {
    const line = basesFull.find(l => l.grades.normal?.name.en === 'Hand Axe');
    expect(line).toBeTruthy();
    expect(line.slotCategory).toBe('axes');
    expect(line.grades.normal.name.en).toBe('Hand Axe');
    expect(line.grades.exceptional.name.en).toBe('Hatchet');
    expect(line.grades.elite.name.en).toBe('Tomahawk');
    expect(line.grades.elite.levelReq).toBe(40);
    expect(line.grades.elite.requiredStrength).toBe(125);
  });

  it('handles a 1h-only weapon (no twoHandDamage) and records oneHandDamage', () => {
    const line = basesFull.find(l => l.grades.normal?.name.en === 'Hand Axe');
    expect(line.grades.normal.oneHandDamage).toEqual({ min: 3, max: 6 });
    expect(line.grades.normal.twoHandDamage).toBeNull();
  });

  it('handles a 2h-only weapon (no oneHandDamage) and records twoHandDamage', () => {
    const line = basesFull.find(l => l.grades.normal?.name.en === 'Large Axe');
    expect(line.grades.normal.oneHandDamage).toBeNull();
    expect(line.grades.normal.twoHandDamage).toEqual({ min: 6, max: 13 });
  });

  it('every line has a non-null normal grade', () => {
    expect(basesFull.every(l => l.grades.normal !== null)).toBe(true);
  });

  it('zh-TW names are non-empty for every present grade', () => {
    for (const line of basesFull) {
      for (const grade of Object.values(line.grades)) {
        if (grade) expect(grade.name['zh-TW']).not.toBe('');
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "bases-full"`
Expected: FAIL — `Cannot find module './bases-full.json'`.

- [ ] **Step 3: Implement the generator addition**

In `scripts/generate-grail-data.mjs`, add before the final `writeFileSync` block:

```js
function damageFor(entry) {
  const oneHand = entry.mindam != null && entry.maxdam != null
    ? { min: entry.mindam, max: entry.maxdam }
    : null;
  const twoHand = entry['2handmindam'] != null && entry['2handmaxdam'] != null
    ? { min: entry['2handmindam'], max: entry['2handmaxdam'] }
    : null;
  return { oneHandDamage: oneHand, twoHandDamage: twoHand };
}

function baseGradeFor(code) {
  const entry = items[code];
  if (!entry) return null;
  return {
    name: localizedBaseName(code, entry.name ?? code),
    ...damageFor(entry),
    levelReq: entry.levelreq ?? null,
    requiredStrength: entry.reqstr ?? null,
    requiredDexterity: entry.reqdex ?? null,
    durability: entry.durability ?? null,
    sockets: entry.gemsockets ?? null,
    qlvl: entry.level ?? null,
  };
}

const basesFullOut = Object.entries(items)
  .filter(([code, v]) => v.normcode === code && TYPE_TO_SLOT[v.type])
  .map(([code, v]) => ({
    id: `base-${code}`,
    slotCategory: TYPE_TO_SLOT[v.type],
    grades: {
      normal: baseGradeFor(code),
      exceptional: v.ubercode && v.ubercode !== code ? baseGradeFor(v.ubercode) : null,
      elite: v.ultracode && v.ultracode !== code ? baseGradeFor(v.ultracode) : null,
    },
  }));

writeFileSync(join(OUT, 'bases-full.json'), JSON.stringify(basesFullOut, null, 2));
console.log(`Wrote ${basesFullOut.length} base item lines -> data/bases-full.json`);
```

(`TYPE_TO_SLOT` filters out non-equipment codes like potions/scrolls/gems automatically
— those types aren't in the map, so `TYPE_TO_SLOT[v.type]` is `undefined` and the
`.filter(...)` line excludes them. Filtering on `v.normcode === code` selects exactly one
row per line, driven from its normal-tier entry, matching the plan's one-line-per-group
design.)

- [ ] **Step 4: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "bases-full"
```
Expected: PASS (5 tests).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/bases-full.json data/grail-data.test.ts
git commit -m "Generate data/bases-full.json (base item lines, 3-grade comparison data)"
```

---

### Task 3: Generate `data/runewords-full.json`

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts` (extend further)

**Interfaces:**
- Produces: `data/runewords-full.json` — an array of `{ id, name: LocalizedText,
  runes: string[], sockets, itemTypes: string[], levelReq, ladderOnly, stats:
  RawGrailStat[], fixedStats: RawGrailFixedStat[] }` entries (93 total), consumed by
  Task 6. `runes` is the ordered list of rune names as they appear in the runeword (e.g.
  `['Jah', 'Ith', 'Ber']`), not translated (rune names are proper nouns kept as-is,
  matching how the existing `data/runewords.json` already stores them). `itemTypes` is
  the base restriction (e.g. `['Body Armor']` for a `tors`-restricted runeword) as
  human-readable English category names — reuse `TYPE_TO_SLOT`'s value where the
  restriction maps to one of the 27 slot categories, falling back to the raw `itype`
  code otherwise.

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
import runewordsFull from './runewords-full.json';

describe('runewords-full.json', () => {
  it('has 93 entries, matching the existing runewords.json used by the Appraiser', () => {
    expect(runewordsFull.length).toBe(93);
  });

  it('Enigma has the correct runes, sockets, and a non-empty stat list', () => {
    const enigma = runewordsFull.find(r => r.name.en === 'Enigma');
    expect(enigma).toBeTruthy();
    expect(enigma.runes).toEqual(['Jah', 'Ith', 'Ber']);
    expect(enigma.sockets).toBe(3);
    expect(enigma.stats.length + enigma.fixedStats.length).toBeGreaterThan(0);
  });

  it('every entry has a non-empty zh-TW name', () => {
    for (const rw of runewordsFull) {
      expect(rw.name['zh-TW']).not.toBe('');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "runewords-full"`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the generator addition**

In `scripts/generate-grail-data.mjs`, add (this reuses `extractProps`, which already
handles the `T{n}Code`/`Min`/`Max`/`Param` shape — `runes.json`'s fields are literally
`T1Code1` style, i.e. property index `n` runs 1-7 as `T1Code{n}`/`T1Min{n}`/etc., so
`extractProps` needs its field-name prefix parameterized):

```js
// extractProps currently reads `prop{n}`/`par{n}`/`min{n}`/`max{n}` — runes.json uses
// `T1Code{n}`/`T1Param{n}`/`T1Min{n}`/`T1Max{n}` instead. Generalize the four field-name
// prefixes as parameters (defaulting to the existing prop/par/min/max names) so this one
// function still serves uniques/sets/set-bonuses unchanged, and now runewords too.
function extractProps(entry, count, prefixes = { code: 'prop', par: 'par', min: 'min', max: 'max' }) {
  const variable = [];
  const fixed = [];
  for (let n = 1; n <= count; n++) {
    const rawCode = entry[`${prefixes.code}${n}`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`${prefixes.par}${n}`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
    const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
    const key = needsKeySuffix ? `${code}:${par}` : code;
    const min = entry[`${prefixes.min}${n}`];
    const max = entry[`${prefixes.max}${n}`];
    if (min !== undefined && max !== undefined) {
      if (min === max) fixed.push({ key, label, value: min });
      else variable.push({ key, label, min, max });
      continue;
    }
    if (par !== undefined) {
      fixed.push({ key, label, value: par });
    }
  }
  return { variable, fixed };
}
```

Replace the two existing call sites to pass the default prefixes explicitly (no
behavior change, just makes the new call's difference obvious):

```js
const { variable, fixed } = extractProps(v, 10, { code: 'prop', par: 'par', min: 'min', max: 'max' });
```
(in the `uniquesOut` mapper) and the equivalent in the `setsOut` mapper.

Then add the runewords generation:

```js
const runesData = JSON.parse(readFileSync(join(VENDOR, 'runes.json'), 'utf8'));

function itemTypesFor(itype) {
  const slot = TYPE_TO_SLOT[itype];
  return [slot ?? itype];
}

const runewordsCurated = JSON.parse(readFileSync(join(OUT, 'runewords.json'), 'utf8'));

const runewordsFullOut = Object.entries(runesData)
  .filter(([, v]) => v.complete === 1)
  .map(([name, v]) => {
    const runeNames = v['*RunesUsed'].match(/[A-Z][a-z]+/g) ?? [];
    const { variable, fixed } = extractProps(v, 7, { code: 'T1Code', par: 'T1Param', min: 'T1Min', max: 'T1Max' });
    const curated = runewordsCurated.find(r => r.name === name);
    return {
      id: `runeword-${v.Name}`,
      name: localizedItemName(name),
      runes: runeNames,
      sockets: runeNames.length,
      itemTypes: itemTypesFor(v.itype1),
      levelReq: curated?.level ?? 0,
      ladderOnly: curated?.ladderOnly ?? false,
      stats: variable,
      fixedStats: fixed,
    };
  });

writeFileSync(join(OUT, 'runewords-full.json'), JSON.stringify(runewordsFullOut, null, 2));
console.log(`Wrote ${runewordsFullOut.length} runewords -> data/runewords-full.json`);
```

(`runes.json` doesn't carry a direct character-level-requirement or ladder-only flag for
the runeword itself — level req is really the max of its component runes' own drop
levels, and ladder-only status isn't in this file at all. The existing, hand-curated
`data/runewords.json` already has both fields correctly for all 93 entries, so the code
above reads that file directly via `readFileSync`/`JSON.parse` — same pattern as every
other vendored/generated file this script already reads — and looks each runeword up by
name to carry `level`/`ladderOnly` over accurately. This only *reads* `runewords.json`;
per the Global Constraints, it is never written to.)

- [ ] **Step 4: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "runewords-full"
```
Expected: PASS (3 tests).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean. Also re-run the Task 2 tests (`-t "bases-full"`) to confirm the
`extractProps` signature change didn't regress the existing uniques/sets output —
`npx vitest run data/grail-data.test.ts` (full file) should show all tests still passing,
including the original (pre-this-plan) uniques/sets assertions.

```bash
git add scripts/generate-grail-data.mjs data/runewords-full.json data/grail-data.test.ts
git commit -m "Generate data/runewords-full.json with real effect stats from vendored runes.json"
```

---

### Task 4: Generate `data/max-sockets.json`

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts` (extend further)

**Interfaces:**
- Produces: `data/max-sockets.json` — an array of 17 `{ itemType: LocalizedText,
  ilvl1to25, ilvl26to40, ilvl41plus }` entries, consumed by Task 7.

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
import maxSockets from './max-sockets.json';

describe('max-sockets.json', () => {
  it('has exactly 17 rows', () => {
    expect(maxSockets.length).toBe(17);
  });

  it('Axes row matches the known real values (4/5/6)', () => {
    const row = maxSockets.find(r => r.itemType.en === 'Axes');
    expect(row).toEqual({ itemType: row.itemType, ilvl1to25: 4, ilvl26to40: 5, ilvl41plus: 6 });
  });

  it('Armors row is capped by the actual max gemsockets (3/4/4, not the raw 3/4/6 ceiling)', () => {
    const row = maxSockets.find(r => r.itemType.en === 'Armors');
    expect(row).toEqual({ itemType: row.itemType, ilvl1to25: 3, ilvl26to40: 4, ilvl41plus: 4 });
  });

  it('Helms row matches the known real values (2/2/3)', () => {
    const row = maxSockets.find(r => r.itemType.en === 'Helms');
    expect(row).toEqual({ itemType: row.itemType, ilvl1to25: 2, ilvl26to40: 2, ilvl41plus: 3 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "max-sockets"`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the generator addition**

In `scripts/generate-grail-data.mjs`, add:

```js
const itemTypesData = JSON.parse(readFileSync(join(VENDOR, 'itemtypes.json'), 'utf8'));

// d2r.world's 17-row table. Each maps to one itemtypes.json key, EXCEPT "Other Weapons"
// (see below). Individually-named rows are capped by the real max `gemsockets` seen
// across items.json for that type — the raw MaxSockets3 ceiling in itemtypes.json is a
// template value some categories never actually reach (confirmed: type "tors" has a
// ceiling of 6 but no real body armor base exceeds gemsockets: 4 — matches d2r.world's
// published "Armors: 3 4 4", not the raw "3 4 6"). "Other Weapons" is left as the raw
// itemtypes.json ceiling for the "swor" (Sword) key, uncorrected — matching d2r.world's
// own coarse catch-all row, which does not individually correct every remaining weapon
// type either (verified: club/mace individually cap lower than swor's 3/4/6, but
// d2r.world's single "Other Weapons" row still shows 3/4/6).
const MAX_SOCKETS_ROWS = [
  ['Circlets', 'circ'],
  ['Barbarian Helms', 'phlm'],
  ['Druid Helms', 'pelt'],
  ['Helms', 'helm'],
  ['Shrunken Heads', 'head'],
  ['Paladin Shields', 'ashd'],
  ['Shields', 'shie'],
  ['Armors', 'tors'],
  ['Necromancer Wands', 'wand'],
  ['Daggers', 'knif'],
  ['Assassin Katars', 'h2h2'],
  ['Sorceress Orbs', 'orb'],
  ['Amazon Bows', 'abow'],
  ['Scepters', 'scep'],
  ['Axes', 'axe'],
  ['Staves', 'staf'],
  ['Grimoires', 'grim'],
];

function realMaxGemsockets(typeKey) {
  const values = Object.values(items)
    .filter(v => v.type === typeKey)
    .map(v => v.gemsockets ?? 0);
  return values.length ? Math.max(...values) : Infinity;
}

const maxSocketsOut = MAX_SOCKETS_ROWS.map(([label, typeKey]) => {
  const t = itemTypesData[typeKey];
  const cap = realMaxGemsockets(typeKey);
  return {
    itemType: { en: label, 'zh-TW': label, 'zh-CN': label }, // see Step 4 — placeholder, replaced with real translations
    ilvl1to25: Math.min(t.MaxSockets1, cap),
    ilvl26to40: Math.min(t.MaxSockets2, cap),
    ilvl41plus: Math.min(t.MaxSockets3, cap),
  };
});

// "Other Weapons" catch-all: raw ceiling from the generic Sword type, uncorrected.
const swordType = itemTypesData['swor'];
maxSocketsOut.push({
  itemType: { en: 'Other Weapons', 'zh-TW': '其他武器', 'zh-CN': toZhCn('其他武器') },
  ilvl1to25: swordType.MaxSockets1,
  ilvl26to40: swordType.MaxSockets2,
  ilvl41plus: swordType.MaxSockets3,
});

writeFileSync(join(OUT, 'max-sockets.json'), JSON.stringify(maxSocketsOut, null, 2));
console.log(`Wrote ${maxSocketsOut.length} max-sockets rows -> data/max-sockets.json`);
```

- [ ] **Step 4: Hand-author the zh-TW labels for the 16 named rows**

Replace the placeholder `itemType` line inside the `MAX_SOCKETS_ROWS.map(...)` callback
with real translations, using a lookup table added just above it:

```js
const MAX_SOCKETS_LABELS_ZH_TW = {
  'Circlets': '冠飾', 'Barbarian Helms': '蠻族頭盔', 'Druid Helms': '德魯伊頭盔',
  'Helms': '頭盔', 'Shrunken Heads': '縮頭', 'Paladin Shields': '聖騎士盾牌',
  'Shields': '盾牌', 'Armors': '盔甲', 'Necromancer Wands': '死靈法師魔杖',
  'Daggers': '匕首', 'Assassin Katars': '刺客拳刃', 'Sorceress Orbs': '女巫法球',
  'Amazon Bows': '亞馬遜弓', 'Scepters': '權杖', 'Axes': '斧頭', 'Staves': '法杖',
  'Grimoires': '魔法書',
};
```

and change the `itemType` field to:

```js
itemType: {
  en: label,
  'zh-TW': MAX_SOCKETS_LABELS_ZH_TW[label],
  'zh-CN': toZhCn(MAX_SOCKETS_LABELS_ZH_TW[label]),
},
```

- [ ] **Step 5: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "max-sockets"
```
Expected: PASS (4 tests).

- [ ] **Step 6: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/max-sockets.json data/grail-data.test.ts
git commit -m "Generate data/max-sockets.json from real itemtypes.json + items.json data"
```

---

### Task 5: Base Items pages

**Files:**
- Create: `src/lib/grail/basesCatalog.ts`
- Create: `src/lib/grail/basesCatalog.test.ts`
- Create: `src/components/items/BaseItemTable.tsx`
- Create: `src/components/items/BaseItemTable.test.tsx`
- Modify: `src/app/[locale]/items/base/page.tsx` (currently a `ComingSoonPage` placeholder)
- Create: `src/app/[locale]/items/base/[category]/page.tsx`
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json` (new `Items`
  keys + new `BaseItems` namespace for table column headers)

**Interfaces:**
- Consumes: `data/bases-full.json` (Task 2), `CategoryCardGrid` (existing, unchanged).
- Produces: `getBaseCategories(): string[]`, `getBaseLinesForCategory(category: string,
  locale: Locale)` in `src/lib/grail/basesCatalog.ts`; `BaseItemTable` component.

- [ ] **Step 1: Add the message keys**

Add to `messages/en.json`'s `Items` namespace:

```json
    "basePageTitle": "Base Items",
    "basePageSubtitle": "Browse every base item in Diablo II: Resurrected."
```

Add a new top-level `BaseItems` namespace (after `Items`):

```json
  "BaseItems": {
    "grade_normal": "Normal",
    "grade_exceptional": "Exceptional",
    "grade_elite": "Elite",
    "oneHandDamage": "1h Damage",
    "twoHandDamage": "2h Damage",
    "levelReq": "Level Req",
    "strReq": "Str Req",
    "dexReq": "Dex Req",
    "durability": "Durability",
    "sockets": "Sockets",
    "qlvl": "qlvl"
  }
```

Add the matching hand-authored zh-TW to `messages/zh-TW.json`:

```json
    "basePageTitle": "基礎裝備",
    "basePageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的基礎物品。"
```

```json
  "BaseItems": {
    "grade_normal": "普通",
    "grade_exceptional": "傑出",
    "grade_elite": "菁英",
    "oneHandDamage": "單手傷害",
    "twoHandDamage": "雙手傷害",
    "levelReq": "等級需求",
    "strReq": "力量需求",
    "dexReq": "敏捷需求",
    "durability": "耐久度",
    "sockets": "插槽數",
    "qlvl": "物品等級"
  }
```

Then re-run the zh-CN derivation. `scripts/translate-nav-items-ui-zh-cn.mjs` currently
only converts `Nav`+`Items` — extend it to also convert `BaseItems`:

```js
zhCn.BaseItems = Object.fromEntries(
  Object.entries(zhTw.BaseItems).map(([key, value]) => [key, toZhCn(value)])
);
```

(Add this line alongside the existing `zhCn.Nav`/`zhCn.Items` assignments, and update
the script's console.log message to mention all three namespaces.) Then run:

```bash
node scripts/translate-nav-items-ui-zh-cn.mjs
```

- [ ] **Step 2: Write the failing test for `basesCatalog.ts`**

Create `src/lib/grail/basesCatalog.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getBaseCategories, getBaseLinesForCategory } from './basesCatalog';

describe('basesCatalog', () => {
  it('returns categories present in bases-full.json, in SLOT_ORDER', () => {
    const categories = getBaseCategories();
    expect(categories).toContain('axes');
    expect(categories).toContain('helms');
    expect(categories).not.toContain('charms'); // base items have no charm bases
  });

  it('getBaseLinesForCategory returns localized lines for the given category', () => {
    const axesLines = getBaseLinesForCategory('axes', 'en');
    const handAxeLine = axesLines.find(l => l.grades.normal?.name === 'Hand Axe');
    expect(handAxeLine).toBeTruthy();
    expect(handAxeLine!.grades.exceptional?.name).toBe('Hatchet');
    expect(handAxeLine!.grades.elite?.name).toBe('Tomahawk');
  });

  it('localizes names for zh-TW', () => {
    const axesLines = getBaseLinesForCategory('axes', 'zh-TW');
    const handAxeLine = axesLines.find(l => l.grades.normal?.name === '手斧');
    expect(handAxeLine).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/basesCatalog.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `basesCatalog.ts`**

Create `src/lib/grail/basesCatalog.ts`:

```ts
import basesFull from '../../../data/bases-full.json';
import { SLOT_ORDER, type Locale } from './catalog';

export interface BaseGrade {
  name: string;
  oneHandDamage: { min: number; max: number } | null;
  twoHandDamage: { min: number; max: number } | null;
  levelReq: number | null;
  requiredStrength: number | null;
  requiredDexterity: number | null;
  durability: number | null;
  sockets: number | null;
  qlvl: number | null;
}

export interface BaseLine {
  id: string;
  slotCategory: string;
  grades: { normal: BaseGrade | null; exceptional: BaseGrade | null; elite: BaseGrade | null };
}

function localizeGrade(
  grade: (typeof basesFull)[number]['grades']['normal'],
  locale: Locale
): BaseGrade | null {
  if (!grade) return null;
  return { ...grade, name: grade.name[locale] };
}

export function getBaseCategories(): (typeof SLOT_ORDER)[number][] {
  return SLOT_ORDER.filter(slot => basesFull.some(l => l.slotCategory === slot));
}

export function getBaseLinesForCategory(category: string, locale: Locale): BaseLine[] {
  return basesFull
    .filter(l => l.slotCategory === category)
    .map(l => ({
      id: l.id,
      slotCategory: l.slotCategory,
      grades: {
        normal: localizeGrade(l.grades.normal, locale),
        exceptional: localizeGrade(l.grades.exceptional, locale),
        elite: localizeGrade(l.grades.elite, locale),
      },
    }));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/basesCatalog.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Write the failing test for `BaseItemTable`**

Create `src/components/items/BaseItemTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import BaseItemTable from './BaseItemTable';
import type { BaseLine } from '@/lib/grail/basesCatalog';
import messages from '../../../messages/en.json';

function renderTable(line: BaseLine) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BaseItemTable line={line} />
    </NextIntlClientProvider>
  );
}

describe('BaseItemTable', () => {
  it('renders all three grade names and their 1h damage when present', () => {
    const line: BaseLine = {
      id: 'base-hax', slotCategory: 'axes',
      grades: {
        normal: { name: 'Hand Axe', oneHandDamage: { min: 3, max: 6 }, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 3 },
        exceptional: { name: 'Hatchet', oneHandDamage: { min: 10, max: 21 }, twoHandDamage: null, levelReq: 19, requiredStrength: 25, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 31 },
        elite: { name: 'Tomahawk', oneHandDamage: { min: 33, max: 58 }, twoHandDamage: null, levelReq: 40, requiredStrength: 125, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 54 },
      },
    };
    renderTable(line);
    expect(screen.getByText('Hand Axe')).toBeInTheDocument();
    expect(screen.getByText('Hatchet')).toBeInTheDocument();
    expect(screen.getByText('Tomahawk')).toBeInTheDocument();
    expect(screen.getByText('3 - 6')).toBeInTheDocument();
    expect(screen.getByText('33 - 58')).toBeInTheDocument();
  });

  it('renders a dash for a missing grade tier', () => {
    const line: BaseLine = {
      id: 'base-x', slotCategory: 'wands',
      grades: {
        normal: { name: 'Yew Wand', oneHandDamage: null, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: 30, sockets: 1, qlvl: 1 },
        exceptional: null,
        elite: null,
      },
    };
    renderTable(line);
    expect(screen.getByText('Yew Wand')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/components/items/BaseItemTable.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 8: Implement `BaseItemTable`**

Create `src/components/items/BaseItemTable.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type { BaseLine, BaseGrade } from '@/lib/grail/basesCatalog';

const GRADES = ['normal', 'exceptional', 'elite'] as const;

function fmtDamage(d: BaseGrade['oneHandDamage']) {
  return d ? `${d.min} - ${d.max}` : '-';
}
function fmtNum(n: number | null) {
  return n != null ? String(n) : '-';
}

export default function BaseItemTable({ line }: { line: BaseLine }) {
  const t = useTranslations('BaseItems');
  const present = GRADES.filter(g => line.grades[g] !== null);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2"> </th>
            {present.map(g => (
              <th key={g} className="text-left text-amber-300 font-bold pb-2 px-3">
                {line.grades[g]!.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-zinc-300">
          <tr><td className="text-zinc-500">{t('oneHandDamage')}</td>{present.map(g => <td key={g} className="px-3">{fmtDamage(line.grades[g]!.oneHandDamage)}</td>)}</tr>
          <tr><td className="text-zinc-500">{t('twoHandDamage')}</td>{present.map(g => <td key={g} className="px-3">{fmtDamage(line.grades[g]!.twoHandDamage)}</td>)}</tr>
          <tr><td className="text-zinc-500">{t('levelReq')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.levelReq)}</td>)}</tr>
          <tr><td className="text-zinc-500">{t('strReq')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.requiredStrength)}</td>)}</tr>
          <tr><td className="text-zinc-500">{t('dexReq')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.requiredDexterity)}</td>)}</tr>
          <tr><td className="text-zinc-500">{t('durability')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.durability)}</td>)}</tr>
          <tr><td className="text-zinc-500">{t('sockets')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.sockets)}</td>)}</tr>
          <tr><td className="text-zinc-500">{t('qlvl')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.qlvl)}</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run src/components/items/BaseItemTable.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 10: Update the landing page and add the category route**

Modify `src/app/[locale]/items/base/page.tsx` (replacing its current `ComingSoonPage`
body — same shape as `items/unique/page.tsx`):

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getBaseCategories } from '@/lib/grail/basesCatalog';
import CategoryCardGrid from '@/components/items/CategoryCardGrid';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function BaseItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');
  const categories = getBaseCategories();

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('basePageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('basePageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <CategoryCardGrid categories={categories} basePath={`/${locale}/items/base`} />
      </div>
    </main>
  );
}
```

Create `src/app/[locale]/items/base/[category]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getBaseCategories, getBaseLinesForCategory } from '@/lib/grail/basesCatalog';
import BaseItemTable from '@/components/items/BaseItemTable';

export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    getBaseCategories().map(category => ({ locale, category }))
  );
}

export default async function BaseCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!getBaseCategories().includes(category as ReturnType<typeof getBaseCategories>[number])) {
    notFound();
  }

  const t = await getTranslations('Items');
  const tGrail = await getTranslations('Grail');
  const lines = getBaseLinesForCategory(category, locale as 'en' | 'zh-TW' | 'zh-CN');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('basePageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('basePageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">{tGrail(`slot_${category}`)}</h2>
          <Link href={`/${locale}/items/base`} className="text-sm text-zinc-400 hover:text-amber-300 transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {lines.map(line => <BaseItemTable key={line.id} line={line} />)}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 11: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm `out/en/items/base/index.html` and
`out/en/items/base/axes/index.html` exist with real content.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json scripts/translate-nav-items-ui-zh-cn.mjs src/lib/grail/basesCatalog.ts src/lib/grail/basesCatalog.test.ts src/components/items/BaseItemTable.tsx src/components/items/BaseItemTable.test.tsx src/app/\[locale\]/items/base
git commit -m "Add Base Items pages (card-grid landing + comparison-table category pages)"
```

---

### Task 6: Runewords page

**Files:**
- Create: `src/components/items/RunewordFilters.tsx`
- Create: `src/components/items/RunewordList.tsx`
- Create: `src/components/items/RunewordList.test.tsx`
- Modify: `src/app/[locale]/items/runewords/page.tsx` (currently a `ComingSoonPage`
  placeholder)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Consumes: `data/runewords-full.json` (Task 3).
- Produces: a single interactive page at `/[locale]/items/runewords` (no category-grid
  step, no dynamic route — this section is a single filterable list per the design).

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace:

```json
    "runewordsPageTitle": "Runewords",
    "runewordsPageSubtitle": "Browse every runeword in Diablo II: Resurrected.",
    "runewordsAllTypes": "All Types",
    "runewordsAllSockets": "All Sockets",
    "runewordsLadderOnly": "Ladder Only",
    "runewordsRunesLabel": "Runes",
    "runewordsSocketsLabel": "Sockets",
    "runewordsBaseTypesLabel": "Base Types",
    "runewordsLevelReqLabel": "Level Req"
```

Add the hand-authored zh-TW to `messages/zh-TW.json`:

```json
    "runewordsPageTitle": "符文之語",
    "runewordsPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的符文之語。",
    "runewordsAllTypes": "全部類型",
    "runewordsAllSockets": "全部插槽數",
    "runewordsLadderOnly": "限定天梯",
    "runewordsRunesLabel": "符文",
    "runewordsSocketsLabel": "插槽數",
    "runewordsBaseTypesLabel": "基礎類型",
    "runewordsLevelReqLabel": "等級需求"
```

Run: `node scripts/translate-nav-items-ui-zh-cn.mjs`

- [ ] **Step 2: Write the failing test**

Create `src/components/items/RunewordList.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import RunewordFilters from './RunewordFilters';
import RunewordList from './RunewordList';
import { useState } from 'react';
import messages from '../../../messages/en.json';
import runewordsFull from '../../../data/runewords-full.json';

function TestPage() {
  const [itemType, setItemType] = useState<string | null>(null);
  const [sockets, setSockets] = useState<number | null>(null);
  const filtered = runewordsFull.filter(rw =>
    (!itemType || rw.itemTypes.includes(itemType)) &&
    (!sockets || rw.sockets === sockets)
  );
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <RunewordFilters
        itemTypes={['shields', 'tors']}
        activeType={itemType}
        onTypeChange={setItemType}
        activeSockets={sockets}
        onSocketsChange={setSockets}
      />
      <RunewordList runewords={filtered} />
    </NextIntlClientProvider>
  );
}

describe('RunewordFilters + RunewordList', () => {
  it('shows all 93 runewords with no filter active', () => {
    render(<TestPage />);
    expect(screen.getByText('Enigma')).toBeInTheDocument();
    expect(screen.getAllByText(/Ral|Ort|Tal|Jah|Ith|Ber/).length).toBeGreaterThan(0);
  });

  it('filters by item type', () => {
    render(<TestPage />);
    fireEvent.click(screen.getByRole('button', { name: 'shields' }));
    expect(screen.queryByText('Enigma')).not.toBeInTheDocument(); // Enigma requires tors (body armor)
  });

  it('filters by socket count', () => {
    render(<TestPage />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByText('Enigma')).toBeInTheDocument(); // Enigma is 3 sockets
    const fourSocketRuneword = runewordsFull.find(r => r.sockets === 4);
    if (fourSocketRuneword) {
      expect(screen.queryByText(fourSocketRuneword.name.en)).not.toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/items/RunewordList.test.tsx`
Expected: FAIL — modules don't exist.

- [ ] **Step 4: Implement `RunewordFilters`**

Create `src/components/items/RunewordFilters.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function RunewordFilters({
  itemTypes,
  activeType,
  onTypeChange,
  activeSockets,
  onSocketsChange,
}: {
  itemTypes: string[];
  activeType: string | null;
  onTypeChange: (type: string | null) => void;
  activeSockets: number | null;
  onSocketsChange: (sockets: number | null) => void;
}) {
  const t = useTranslations('Items');
  const socketOptions = [2, 3, 4, 5, 6];

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-amber-500 text-zinc-950 font-semibold'
        : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
    }`;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onTypeChange(null)} className={pill(activeType === null)}>
          {t('runewordsAllTypes')}
        </button>
        {itemTypes.map(type => (
          <button key={type} onClick={() => onTypeChange(type)} className={pill(activeType === type)}>
            {type}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onSocketsChange(null)} className={pill(activeSockets === null)}>
          {t('runewordsAllSockets')}
        </button>
        {socketOptions.map(n => (
          <button key={n} onClick={() => onSocketsChange(n)} className={pill(activeSockets === n)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement `RunewordList`**

Create `src/components/items/RunewordList.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type runewordsFullJson from '../../../data/runewords-full.json';

type Runeword = (typeof runewordsFullJson)[number];

export default function RunewordList({ runewords }: { runewords: Runeword[] }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-4 w-full">
      {runewords.map(rw => (
        <div key={rw.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-amber-300">{rw.name.en}</h3>
            {rw.ladderOnly && (
              <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                {t('runewordsLadderOnly')}
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-zinc-300 flex flex-col gap-0.5">
            <div>{t('runewordsRunesLabel')}: {rw.runes.join(' + ')}</div>
            <div>{t('runewordsSocketsLabel')}: {rw.sockets}</div>
            <div>{t('runewordsBaseTypesLabel')}: {rw.itemTypes.join(', ')}</div>
            <div>{t('runewordsLevelReqLabel')}: {rw.levelReq}</div>
          </div>
          {(rw.stats.length > 0 || rw.fixedStats.length > 0) && (
            <div className="mt-4">
              <div className="text-sm text-blue-400 flex flex-col gap-0.5">
                {rw.stats.map(stat => (
                  <div key={stat.key}>{stat.label.en}: {stat.min}–{stat.max}</div>
                ))}
                {rw.fixedStats.map(f => (
                  <div key={f.key}>{f.label.en}: {f.value}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/items/RunewordList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 7: Wire the page together**

Modify `src/app/[locale]/items/runewords/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import runewordsFull from '../../../../../data/runewords-full.json';
import RunewordFilters from '@/components/items/RunewordFilters';
import RunewordList from '@/components/items/RunewordList';

const ALL_ITEM_TYPES = Array.from(new Set(runewordsFull.flatMap(rw => rw.itemTypes))).sort();

export default function RunewordsPage() {
  const t = useTranslations('Items');
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeSockets, setActiveSockets] = useState<number | null>(null);

  const filtered = runewordsFull.filter(rw =>
    (!activeType || rw.itemTypes.includes(activeType)) &&
    (!activeSockets || rw.sockets === activeSockets)
  );

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('runewordsPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('runewordsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <RunewordFilters
          itemTypes={ALL_ITEM_TYPES}
          activeType={activeType}
          onTypeChange={setActiveType}
          activeSockets={activeSockets}
          onSocketsChange={setActiveSockets}
        />
        <RunewordList runewords={filtered} />
      </div>
    </main>
  );
}
```

This page has no server-side translated content beyond the static title/subtitle keys
(the runeword names/stats are rendered in English only for this pass — see Open
Questions in the design spec for full per-locale runeword content as a possible
follow-up), so it's a full Client Component rather than following the
`generateStaticParams`/`setRequestLocale` server pattern — there's no per-locale static
generation needed since there's no dynamic segment, and `next-intl`'s client-side
`useTranslations` picks up the locale from the existing `NextIntlClientProvider` in the
shared layout, same as every other client component on this site.

- [ ] **Step 8: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/components/items/RunewordFilters.tsx src/components/items/RunewordList.tsx src/components/items/RunewordList.test.tsx src/app/\[locale\]/items/runewords/page.tsx
git commit -m "Add Runewords filterable list page with real effect stats"
```

---

### Task 7: Max Sockets page + full verification

**Files:**
- Create: `src/components/items/MaxSocketsTable.tsx`
- Create: `src/components/items/MaxSocketsTable.test.tsx`
- Modify: `src/app/[locale]/misc/max-sockets/page.tsx` (currently a `ComingSoonPage`
  placeholder)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`
- Create: `docs/superpowers/specs/2026-07-14-base-runewords-maxsockets-verification.md`

**Interfaces:**
- Consumes: `data/max-sockets.json` (Task 4).
- Produces: the final page this plan builds toward.

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace:

```json
    "maxSocketsPageTitle": "Max Sockets",
    "maxSocketsPageSubtitle": "Maximum number of sockets by item level (base items only).",
    "maxSocketsItemTypeLabel": "Item Type",
    "maxSocketsIlvl1to25": "ilvl 1-25",
    "maxSocketsIlvl26to40": "ilvl 26-40",
    "maxSocketsIlvl41plus": "ilvl 41+"
```

Add the hand-authored zh-TW to `messages/zh-TW.json`:

```json
    "maxSocketsPageTitle": "最大孔數",
    "maxSocketsPageSubtitle": "依物品等級劃分的最大插槽數（僅限基礎物品）。",
    "maxSocketsItemTypeLabel": "物品類型",
    "maxSocketsIlvl1to25": "物品等級 1-25",
    "maxSocketsIlvl26to40": "物品等級 26-40",
    "maxSocketsIlvl41plus": "物品等級 41+"
```

Run: `node scripts/translate-nav-items-ui-zh-cn.mjs`

- [ ] **Step 2: Write the failing test**

Create `src/components/items/MaxSocketsTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import MaxSocketsTable from './MaxSocketsTable';
import messages from '../../../messages/en.json';
import maxSockets from '../../../data/max-sockets.json';

describe('MaxSocketsTable', () => {
  it('renders all 17 rows with their three ilvl-tier values', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <MaxSocketsTable rows={maxSockets} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Axes')).toBeInTheDocument();
    expect(screen.getByText('Armors')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(18); // 17 data rows + 1 header row
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/items/MaxSocketsTable.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `MaxSocketsTable`**

Create `src/components/items/MaxSocketsTable.tsx`:

```tsx
import { useTranslations, useLocale } from 'next-intl';
import type maxSocketsJson from '../../../data/max-sockets.json';

type Row = (typeof maxSocketsJson)[number];

export default function MaxSocketsTable({ rows }: { rows: Row[] }) {
  const t = useTranslations('Items');
  const locale = useLocale() as 'en' | 'zh-TW' | 'zh-CN';

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 overflow-x-auto w-full">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2">{t('maxSocketsItemTypeLabel')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('maxSocketsIlvl1to25')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('maxSocketsIlvl26to40')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('maxSocketsIlvl41plus')}</th>
          </tr>
        </thead>
        <tbody className="text-zinc-300">
          {rows.map(row => (
            <tr key={row.itemType.en}>
              <td className="py-1 text-zinc-100 font-semibold">{row.itemType[locale]}</td>
              <td className="py-1 px-3">{row.ilvl1to25}</td>
              <td className="py-1 px-3">{row.ilvl26to40}</td>
              <td className="py-1 px-3">{row.ilvl41plus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/items/MaxSocketsTable.test.tsx`
Expected: PASS.

- [ ] **Step 6: Wire the page**

Modify `src/app/[locale]/misc/max-sockets/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import MaxSocketsTable from '@/components/items/MaxSocketsTable';
import maxSockets from '../../../../../data/max-sockets.json';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function MaxSocketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('maxSocketsPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('maxSocketsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-2xl">
        <MaxSocketsTable rows={maxSockets} />
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Full automated verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm route listing includes `/items/base` + 27 category
sub-routes, `/items/runewords` (single page, no sub-routes), `/misc/max-sockets`, each
× 3 locales.

Directly inspect built content:

```bash
grep -o '<h2[^<]*</h2>' out/en/items/base/axes/index.html
grep -o 'Enigma' out/en/items/runewords/index.html
grep -o '<td[^<]*>Axes</td>' out/en/misc/max-sockets/index.html
```

- [ ] **Step 8: Manual browser verification + d2r.world spot-check**

Start the dev server **from this feature's actual worktree** (verify with `pwd`/
`git branch --show-current` first). Navigate to `/en/items/base`, click into 2-3
categories, confirm the comparison tables render correctly (including a line with fewer
than 3 grades). Navigate to `/en/items/runewords`, test both filters. Navigate to
`/en/misc/max-sockets`, confirm all 17 rows. Check `/zh-TW/` and `/zh-CN/` variants of
all three sections. Spot-check 2-3 base item lines, 2-3 runewords, and the full max
sockets table against d2r.world directly.

Write findings to
`docs/superpowers/specs/2026-07-14-base-runewords-maxsockets-verification.md`, following
the format of prior verification docs in this project.

- [ ] **Step 9: Commit**

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/components/items/MaxSocketsTable.tsx src/components/items/MaxSocketsTable.test.tsx src/app/\[locale\]/misc/max-sockets/page.tsx docs/superpowers/specs/2026-07-14-base-runewords-maxsockets-verification.md
git commit -m "Add Max Sockets page; full verification"
```
