# Runes, Cube Recipes, Crafted Items, Magic Items, Rare Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build real content for the five remaining empty "Game Items" sections —
Runes, Cube Recipes, Crafted Items (Batch A), and Magic Items, Rare Items (Batch B) —
replacing their placeholder pages. After this plan, only the four "Misc" sections
(FCR/FHR/FBR, Alvl85 Areas, Area Level, Level Up) remain unbuilt.

**Architecture:** Batch A extends `scripts/generate-grail-data.mjs` with three new
datasets sourced from newly-vendored `gems.json` (runes) and `cubemain.json` (cube
recipes + crafted items — reusing the generalized `extractProps` from the prior plan
with a `"mod {n}"`-style prefix). Batch B adds a fourth dataset from newly-vendored
`magicprefix.json`/`magicsuffix.json`, reusing the existing `CategoryCardGrid` →
dynamic-route pattern with a new, more granular category list. Runes/Cube
Recipes/Crafted Items are each a single browsable list page (matching d2r.world);
Magic/Rare Items use the card-grid-then-category-page flow (also matching d2r.world).

**Tech Stack:** Next.js 16 (App Router, static export), next-intl 4.x, Tailwind CSS 4,
Vitest + `@testing-library/react`.

## Global Constraints

- Reuse `scripts/generate-grail-data.mjs`'s existing `extractProps` (generalized
  field-prefix version), `localizedLabelFor`, `localizedItemName`, `localizedBaseName`,
  `TYPE_TO_SLOT`, `toZhCn` — do not duplicate this machinery.
- All three new/extended datasets from this plan (`data/runes.json`,
  `data/cube-recipes.json`, `data/crafted-items.json`, `data/magic-affixes.json`) are
  generated output, never hand-edited, regenerated via the existing `generate:grail`
  npm script.
- zh-TW text is hand-authored; zh-CN is derived via `toZhCn()` (generator-time data) or
  the existing `scripts/translate-nav-items-ui-zh-cn.mjs` pattern (message-file keys) —
  never independently translated.
- Every new page follows the existing `generateStaticParams`/`setRequestLocale`/
  `getTranslations` pattern.
- Generic vocabulary already in the `Grail` namespace (`slot_*`, `itemStats`,
  `magicProperties`) is reused where the concept genuinely matches — do not duplicate.
- No icons — text-only presentation.
- The Grail Tracker, Unique/Set/Base Items, and Runewords pages/components from prior
  plans are not modified.
- Rune drop-rate facts (monster, difficulty, percentage) are hand-transcribed from
  d2r.world per explicit user direction this session (deterministic game-mechanic
  numbers, not creative content — see the design spec's Background section for the
  full rationale). Cite the source in a code comment at the data's definition site.
- Magic Items pages show all `frequency > 0` affixes per category; Rare Items pages
  further restrict to `rare === 1`. This filter logic was verified this session via a
  targeted spot-check against d2r.world (not bulk data copying) — see the design spec.

---

### Task 1: Vendor `gems.json` and `cubemain.json`

**Files:**
- Create: `vendor/d2data/json/gems.json`, `vendor/d2data/json/cubemain.json`
- Modify: `vendor/d2data/README.md`

- [ ] **Step 1: Fetch both files at the project's pinned commit**

```bash
curl -s "https://raw.githubusercontent.com/blizzhackers/d2data/477bcf63e964f39f4c774e588a79fd598ae472de/json/gems.json" \
  -o vendor/d2data/json/gems.json
curl -s "https://raw.githubusercontent.com/blizzhackers/d2data/477bcf63e964f39f4c774e588a79fd598ae472de/json/cubemain.json" \
  -o vendor/d2data/json/cubemain.json
```

- [ ] **Step 2: Verify the fetch**

```bash
python3 -c "
import json
g = json.load(open('vendor/d2data/json/gems.json'))
c = json.load(open('vendor/d2data/json/cubemain.json'))
print('gems.json entries:', len(g))
print('cubemain.json entries:', len(c))
print('rune count:', len([v for v in g.values() if 'Rune' in v.get('name','')]))
"
```
Expected: `gems.json entries: 68`, `cubemain.json entries: 227`, `rune count: 33`.

- [ ] **Step 3: Update the vendor README**

Add to `vendor/d2data/README.md`:

```markdown

`gems.json` provides gem/rune definitions (`weaponMod`/`helmMod`/`shieldMod` properties
per socket-type) for the Runes reference page. `cubemain.json` provides every Horadric
Cube recipe (plain-English description, structured inputs/output, and — for craft
recipes — guaranteed `mod {n}` properties in the same shape as `uniqueitems.json`) for
the Cube Recipes and Crafted Items reference pages.
```

- [ ] **Step 4: Commit**

```bash
git add vendor/d2data/json/gems.json vendor/d2data/json/cubemain.json vendor/d2data/README.md
git commit -m "Vendor gems.json and cubemain.json for Runes/Cube Recipes/Crafted Items"
```

---

### Task 2: Generate `data/runes.json`

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:**
- Produces: `data/runes.json` — 33 entries, `{ id, number, name: LocalizedText,
  levelReq, weaponStats: RawGrailStat[], armorHelmStats: RawGrailStat[], shieldStats:
  RawGrailStat[], recipe: { runeName: string; count: number; gemName: string | null } |
  null, dropRate: { monster: string; difficulty: string; percent: number } }`.

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
import runesData from './runes.json';

describe('runes.json', () => {
  it('has exactly 33 runes in order 1-33', () => {
    expect(runesData.length).toBe(33);
    expect(runesData.map(r => r.number)).toEqual(Array.from({ length: 33 }, (_, i) => i + 1));
    expect(runesData[0].name.en).toBe('El');
    expect(runesData[32].name.en).toBe('Zod');
  });

  it('El has the correct weapon/armor-helm/shield stats and no recipe', () => {
    const el = runesData.find(r => r.name.en === 'El')!;
    expect(el.levelReq).toBe(11);
    expect(el.weaponStats.map(s => s.key)).toEqual(['light', 'att']);
    expect(el.armorHelmStats.map(s => s.key)).toEqual(['light', 'ac']);
    expect(el.recipe).toBeNull();
  });

  it('Eld has a simple 3x-previous-rune recipe (no gem)', () => {
    const eld = runesData.find(r => r.name.en === 'Eld')!;
    expect(eld.recipe).toEqual({ runeName: 'El', count: 3, gemName: null });
  });

  it('Amn has a gem-inclusive recipe (the first one)', () => {
    const amn = runesData.find(r => r.name.en === 'Amn')!;
    expect(amn.recipe).toEqual({ runeName: 'Thul', count: 3, gemName: 'Chipped Topaz' });
  });

  it('Um has a 2x-count recipe (the first 2x tier)', () => {
    const um = runesData.find(r => r.name.en === 'Um')!;
    expect(um.recipe).toEqual({ runeName: 'Pul', count: 2, gemName: 'Flawed Diamond' });
  });

  it('every rune has a dropRate with a monster, difficulty, and percent', () => {
    for (const r of runesData) {
      expect(r.dropRate.monster.length).toBeGreaterThan(0);
      expect(['normal', 'nightmare', 'hell']).toContain(r.dropRate.difficulty);
      expect(r.dropRate.percent).toBeGreaterThan(0);
    }
  });

  it('zh-TW names are non-empty for every rune', () => {
    for (const r of runesData) {
      expect(r.name['zh-TW']).not.toBe('');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "runes.json"`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the generator addition**

In `scripts/generate-grail-data.mjs`, add:

```js
const gemsData = JSON.parse(readFileSync(join(VENDOR, 'gems.json'), 'utf8'));

// Order and level requirements verified directly against vendor/d2data/json/gems.json
// this session (each rune's own `name`/mod fields), not hardcoded from memory.
const RUNE_ORDER = [
  'El', 'Eld', 'Tir', 'Nef', 'Eth', 'Ith', 'Tal', 'Ral', 'Ort', 'Thul',
  'Amn', 'Sol', 'Shael', 'Dol', 'Hel', 'Io', 'Lum', 'Ko', 'Fal', 'Lem',
  'Pul', 'Um', 'Mal', 'Ist', 'Gul', 'Vex', 'Ohm', 'Lo', 'Sur', 'Ber',
  'Jah', 'Cham', 'Zod',
];

// Upgrade recipes read directly from cubemain.json's own description field (entries
// 51-59 and 100-122) rather than assumed from the "always 3x previous" folk rule —
// the count changes to 2x starting at Um (entry 111), and gem-inclusive recipes start
// at Amn (entry 100). See Task 3 for cubemain.json's generic recipe parsing; this
// table is Runes-specific because the Runes page shows the recipe inline per-rune
// rather than as a separate recipe-list entry.
const RUNE_RECIPES = {
  Eld: { runeName: 'El', count: 3, gemName: null },
  Tir: { runeName: 'Eld', count: 3, gemName: null },
  Nef: { runeName: 'Tir', count: 3, gemName: null },
  Eth: { runeName: 'Nef', count: 3, gemName: null },
  Ith: { runeName: 'Eth', count: 3, gemName: null },
  Tal: { runeName: 'Ith', count: 3, gemName: null },
  Ral: { runeName: 'Tal', count: 3, gemName: null },
  Ort: { runeName: 'Ral', count: 3, gemName: null },
  Thul: { runeName: 'Ort', count: 3, gemName: null },
  Amn: { runeName: 'Thul', count: 3, gemName: 'Chipped Topaz' },
  Sol: { runeName: 'Amn', count: 3, gemName: 'Chipped Amethyst' },
  Shael: { runeName: 'Sol', count: 3, gemName: 'Chipped Sapphire' },
  Dol: { runeName: 'Shael', count: 3, gemName: 'Chipped Ruby' },
  Hel: { runeName: 'Dol', count: 3, gemName: 'Chipped Emerald' },
  Io: { runeName: 'Hel', count: 3, gemName: 'Chipped Diamond' },
  Lum: { runeName: 'Io', count: 3, gemName: 'Flawed Topaz' },
  Ko: { runeName: 'Lum', count: 3, gemName: 'Flawed Amethyst' },
  Fal: { runeName: 'Ko', count: 3, gemName: 'Flawed Sapphire' },
  Lem: { runeName: 'Fal', count: 3, gemName: 'Flawed Ruby' },
  Pul: { runeName: 'Lem', count: 3, gemName: 'Flawed Emerald' },
  Um: { runeName: 'Pul', count: 2, gemName: 'Flawed Diamond' },
  Mal: { runeName: 'Um', count: 2, gemName: 'Standard Topaz' },
  Ist: { runeName: 'Mal', count: 2, gemName: 'Standard Amethyst' },
  Gul: { runeName: 'Ist', count: 2, gemName: 'Standard Sapphire' },
  Vex: { runeName: 'Gul', count: 2, gemName: 'Standard Ruby' },
  Ohm: { runeName: 'Vex', count: 2, gemName: 'Standard Emerald' },
  Lo: { runeName: 'Ohm', count: 2, gemName: 'Standard Diamond' },
  Sur: { runeName: 'Lo', count: 2, gemName: 'Flawless Topaz' },
  Ber: { runeName: 'Sur', count: 2, gemName: 'Flawless Amethyst' },
  Jah: { runeName: 'Ber', count: 2, gemName: 'Flawless Sapphire' },
  Cham: { runeName: 'Jah', count: 2, gemName: 'Flawless Ruby' },
  Zod: { runeName: 'Cham', count: 2, gemName: 'Flawless Emerald' },
};

// Drop-rate facts (monster, difficulty, percent) hand-transcribed from d2r.world's
// published Runes page (https://d2r.world/en-US/info/item/runes) per explicit user
// direction this session: these are deterministic outputs of Blizzard's own
// treasure-class tables (game-mechanic facts, not creative content), and computing
// them ourselves would require implementing a full treasure-class probability-cascade
// engine against treasureclassex.json/tcprecalc.json — out of scope for this pass. If
// that calculator is ever built, replace this hand-transcribed table with its output.
const RUNE_DROP_RATES = {
  El: { monster: 'The Countess', difficulty: 'normal', percent: 4.3 },
  Eld: { monster: 'The Countess', difficulty: 'normal', percent: 2.87 },
  Tir: { monster: 'The Countess', difficulty: 'normal', percent: 10.75 },
  Nef: { monster: 'The Countess', difficulty: 'normal', percent: 7.17 },
  Eth: { monster: 'The Countess', difficulty: 'normal', percent: 15.05 },
  Ith: { monster: 'The Countess', difficulty: 'normal', percent: 10.03 },
  Tal: { monster: 'The Countess', difficulty: 'normal', percent: 21.5 },
  Ral: { monster: 'The Countess', difficulty: 'normal', percent: 14.33 },
  Ort: { monster: 'The Countess', difficulty: 'nightmare', percent: 21.5 },
  Thul: { monster: 'The Countess', difficulty: 'nightmare', percent: 14.33 },
  Amn: { monster: 'The Countess', difficulty: 'nightmare', percent: 16.61 },
  Sol: { monster: 'The Countess', difficulty: 'nightmare', percent: 11.08 },
  Shael: { monster: 'The Countess', difficulty: 'nightmare', percent: 9.97 },
  Dol: { monster: 'The Countess', difficulty: 'nightmare', percent: 6.65 },
  Hel: { monster: 'The Countess', difficulty: 'nightmare', percent: 5.54 },
  Io: { monster: 'The Countess', difficulty: 'nightmare', percent: 3.69 },
  Lum: { monster: 'The Countess', difficulty: 'hell', percent: 2.92 },
  Ko: { monster: 'The Countess', difficulty: 'hell', percent: 1.95 },
  Fal: { monster: 'The Countess', difficulty: 'hell', percent: 1.5 },
  Lem: { monster: 'The Countess', difficulty: 'hell', percent: 1.0 },
  Pul: { monster: 'The Countess', difficulty: 'hell', percent: 0.76 },
  Um: { monster: 'The Countess', difficulty: 'hell', percent: 0.51 },
  Mal: { monster: 'The Countess', difficulty: 'hell', percent: 0.52 },
  Ist: { monster: 'The Countess', difficulty: 'hell', percent: 0.35 },
  Gul: { monster: 'Council Member', difficulty: 'hell', percent: 0.0048 },
  Vex: { monster: 'Council Member', difficulty: 'hell', percent: 0.0032 },
  Ohm: { monster: 'Council Member', difficulty: 'hell', percent: 0.0033 },
  Lo: { monster: 'Council Member', difficulty: 'hell', percent: 0.0022 },
  Sur: { monster: 'Council Member', difficulty: 'hell', percent: 0.0025 },
  Ber: { monster: 'Council Member', difficulty: 'hell', percent: 0.0017 },
  Jah: { monster: 'Council Member', difficulty: 'hell', percent: 0.0018 },
  Cham: { monster: 'Council Member', difficulty: 'hell', percent: 0.0012 },
  Zod: { monster: 'Nihlathak', difficulty: 'hell', percent: 0.00047 },
};

function runeStatsFor(entry, prefix) {
  const { variable, fixed } = extractProps(entry, 3, {
    code: `${prefix}Code`, par: `${prefix}Param`, min: `${prefix}Min`, max: `${prefix}Max`,
  });
  return [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, min: f.value, max: f.value }))];
}

const runesOut = RUNE_ORDER.map((name, i) => {
  const entry = Object.values(gemsData).find(v => v.name === `${name} Rune`);
  return {
    id: `rune-${entry.code}`,
    number: i + 1,
    name: localizedItemName(name),
    levelReq: entry.level ?? 0,
    weaponStats: runeStatsFor(entry, 'weaponMod'),
    armorHelmStats: runeStatsFor(entry, 'helmMod'),
    shieldStats: runeStatsFor(entry, 'shieldMod'),
    recipe: RUNE_RECIPES[name] ?? null,
    dropRate: RUNE_DROP_RATES[name],
  };
});

writeFileSync(join(OUT, 'runes.json'), JSON.stringify(runesOut, null, 2));
console.log(`Wrote ${runesOut.length} runes -> data/runes.json`);
```

- [ ] **Step 4: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "runes.json"
```
Expected: PASS (6 tests).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, including all pre-existing tests (uniques/sets/bases-full/
runewords-full/max-sockets) still passing.

```bash
git add scripts/generate-grail-data.mjs data/runes.json data/grail-data.test.ts
git commit -m "Generate data/runes.json (33 runes with stats, recipes, drop rates)"
```

---

### Task 3: Generate `data/cube-recipes.json` and `data/crafted-items.json`

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:**
- Produces: `data/cube-recipes.json` — array of `{ id, description: LocalizedText,
  category: string }` (category is one of the 9 d2r.world category keys:
  `runeGemUpgrade`, `quests`, `consumables`, `sockets`, `itemUpgrade`, `itemRepair`,
  `magicItemRerolls`, `magicItemCreation`, `craftedGrandCharm`).
- Produces: `data/crafted-items.json` — array of `{ id, name: LocalizedText, family:
  string, magicItemInput: LocalizedText, additionalInputs: LocalizedText[],
  fixedProperties: RawGrailFixedStat[] }` (family is one of `hitPower`, `blood`,
  `caster`, `safety`).

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
import cubeRecipesData from './cube-recipes.json';
import craftedItemsData from './crafted-items.json';

describe('cube-recipes.json', () => {
  it('has 174 entries (157 enabled + 17 Crafted Grand Charm entries)', () => {
    expect(cubeRecipesData.length).toBe(174);
  });

  it('does not include the 36 Hit Power/Blood/Caster/Safety craft recipes (those are crafted-items.json only)', () => {
    expect(cubeRecipesData.some(r => r.description.en.includes('Hit Power'))).toBe(false);
  });

  it('classifies a known rune-upgrade recipe correctly', () => {
    const eld = cubeRecipesData.find(r => r.description.en === '3 El Runes -> Eld Rune');
    expect(eld?.category).toBe('runeGemUpgrade');
  });

  it('classifies a known quest recipe correctly', () => {
    const cow = cubeRecipesData.find(r => r.description.en.includes('Secret Cow Level'));
    expect(cow?.category).toBe('quests');
  });

  it('classifies the Crafted Grand Charm entries correctly', () => {
    const charmRecipes = cubeRecipesData.filter(r => r.category === 'craftedGrandCharm');
    expect(charmRecipes.length).toBe(17);
  });
});

describe('crafted-items.json', () => {
  it('has 36 entries, 9 per family', () => {
    expect(craftedItemsData.length).toBe(36);
    for (const family of ['hitPower', 'blood', 'caster', 'safety']) {
      expect(craftedItemsData.filter(c => c.family === family).length).toBe(9);
    }
  });

  it('Hit Power Helm has the correct fixed properties', () => {
    const helm = craftedItemsData.find(c => c.name.en === 'Hit Power Helm')!;
    expect(helm.fixedProperties.length).toBe(3);
    expect(helm.additionalInputs.map(i => i.en)).toEqual(['Jewel', 'Ith Rune', 'Perfect Sapphire']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "cube-recipes.json"`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement the generator additions**

In `scripts/generate-grail-data.mjs`, add:

```js
const cubeMainData = JSON.parse(readFileSync(join(VENDOR, 'cubemain.json'), 'utf8'));

// Hand-classified against d2r.world's 9 Cube Recipes categories (no category field
// exists in the source data — see the design spec's Background section). Keys are
// cubemain.json's own object keys (its numeric string ids).
const RECIPE_CATEGORY = {};
for (const id of [23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,
                   51,52,53,54,55,56,57,58,59,100,101,102,103,104,105,106,107,108,109,110,111,112,113,
                   114,115,116,117,118,119,120,121,122]) {
  RECIPE_CATEGORY[id] = 'runeGemUpgrade';
}
for (const id of [0,1,2,148,149,150,165,177,189,201,213,225,226]) RECIPE_CATEGORY[id] = 'quests';
for (const id of [3,4,5,11,12,20,21,22]) RECIPE_CATEGORY[id] = 'consumables';
for (const id of [15,16,123,124,125,126,141,147]) RECIPE_CATEGORY[id] = 'sockets';
for (const id of [127,128,129,130,131,132,133,134,135,136,151,152,153,154]) RECIPE_CATEGORY[id] = 'itemUpgrade';
for (const id of [137,138,139,140]) RECIPE_CATEGORY[id] = 'itemRepair';
for (const id of [60,61,62,63]) RECIPE_CATEGORY[id] = 'magicItemRerolls';
for (const id of [6,7,8,9,10,13,14,17,18,19]) RECIPE_CATEGORY[id] = 'magicItemCreation';
for (const id of [163,164,174,175,176,186,187,188,198,199,200,210,211,212,222,223,224]) {
  RECIPE_CATEGORY[id] = 'craftedGrandCharm';
}

const CRAFT_RECIPE_IDS = new Set(Array.from({ length: 36 }, (_, i) => 64 + i)); // 64-99

const cubeRecipesOut = Object.entries(cubeMainData)
  .filter(([id, v]) => (v.enabled === 1 || RECIPE_CATEGORY[id] === 'craftedGrandCharm') && !CRAFT_RECIPE_IDS.has(Number(id)))
  .map(([id, v]) => ({
    id: `recipe-${id}`,
    description: localizedItemName(v.description),
    category: RECIPE_CATEGORY[id] ?? (() => { throw new Error(`Unclassified cube recipe id ${id}: "${v.description}"`); })(),
  }));

writeFileSync(join(OUT, 'cube-recipes.json'), JSON.stringify(cubeRecipesOut, null, 2));
console.log(`Wrote ${cubeRecipesOut.length} cube recipes -> data/cube-recipes.json`);

const CRAFT_FAMILY_BY_ID = {
  64: 'hitPower', 65: 'hitPower', 66: 'hitPower', 67: 'hitPower', 68: 'hitPower',
  69: 'hitPower', 70: 'hitPower', 71: 'hitPower', 72: 'hitPower',
  73: 'blood', 74: 'blood', 75: 'blood', 76: 'blood', 77: 'blood',
  78: 'blood', 79: 'blood', 80: 'blood', 81: 'blood',
  82: 'caster', 83: 'caster', 84: 'caster', 85: 'caster', 86: 'caster',
  87: 'caster', 88: 'caster', 89: 'caster', 90: 'caster',
  91: 'safety', 92: 'safety', 93: 'safety', 94: 'safety', 95: 'safety',
  96: 'safety', 97: 'safety', 98: 'safety', 99: 'safety',
};

function craftInputName(code) {
  // input 1 is a compound "basecode,mag,upg"-style string for craft recipes; the
  // description field already spells out the human-readable base name (e.g. "Magic
  // Full Helm"), so this parses that instead of re-deriving it from the raw code.
  return code;
}

const craftedItemsOut = Object.entries(cubeMainData)
  .filter(([id]) => CRAFT_RECIPE_IDS.has(Number(id)))
  .map(([id, v]) => {
    const { fixed } = extractProps(v, 3, { code: 'mod ', par: 'mod  param', min: 'mod  min', max: 'mod  max' });
    // The craft recipe description is "<Magic Item Input> + 1 Jewel + <Rune> + <Gem> -> <Output Name>".
    // Split on " -> " for the output name, and on " + " for the input list.
    const [inputsPart, outputName] = v.description.split(' -> ');
    const inputParts = inputsPart.split(' + ').map(p => p.replace(/^\d+\s*/, ''));
    return {
      id: `craft-${id}`,
      name: localizedItemName(outputName),
      family: CRAFT_FAMILY_BY_ID[id],
      magicItemInput: localizedItemName(inputParts[0]),
      additionalInputs: inputParts.slice(1).map(localizedItemName),
      fixedProperties: fixed,
    };
  });

writeFileSync(join(OUT, 'crafted-items.json'), JSON.stringify(craftedItemsOut, null, 2));
console.log(`Wrote ${craftedItemsOut.length} crafted items -> data/crafted-items.json`);
```

(Note: `extractProps`'s generalized prefix parameters are string-concatenated as
`` `${prefixes.code}${n}` ``, so passing `code: 'mod '` with `n=1` produces the literal
key `"mod 1"` — matching `cubemain.json`'s actual (space-containing) field names
`"mod 1"`/`"mod 1 param"`/`"mod 1 min"`/`"mod 1 max"` exactly, confirmed against the
vendored file this session.)

- [ ] **Step 4: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "cube-recipes.json|crafted-items.json"
```
Expected: PASS (7 tests).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, including all pre-existing tests still passing.

```bash
git add scripts/generate-grail-data.mjs data/cube-recipes.json data/crafted-items.json data/grail-data.test.ts
git commit -m "Generate data/cube-recipes.json and data/crafted-items.json"
```

---

### Task 4: Runes, Cube Recipes, Crafted Items pages

**Files:**
- Create: `src/components/items/RuneList.tsx`, `src/components/items/RuneList.test.tsx`
- Create: `src/components/items/CubeRecipeList.tsx`, `src/components/items/CubeRecipeList.test.tsx`
- Create: `src/components/items/CraftedItemList.tsx`, `src/components/items/CraftedItemList.test.tsx`
- Modify: `src/app/[locale]/items/runes/page.tsx`, `src/app/[locale]/items/cube-recipes/page.tsx`, `src/app/[locale]/items/crafted/page.tsx` (currently `ComingSoonPage` placeholders)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Consumes: `data/runes.json`, `data/cube-recipes.json`, `data/crafted-items.json`
  (Tasks 2-3).

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace:

```json
    "runesPageTitle": "Runes",
    "runesPageSubtitle": "Browse every rune in Diablo II: Resurrected.",
    "runesWeaponLabel": "Weapon",
    "runesArmorHelmLabel": "Armor/Helm",
    "runesShieldLabel": "Shield",
    "runesLevelReqLabel": "Level Required",
    "runesRecipeLabel": "Recipe",
    "runesDropRateLabel": "Drop Rate",
    "cubeRecipesPageTitle": "Cube Recipes",
    "cubeRecipesPageSubtitle": "Browse every Horadric Cube recipe in Diablo II: Resurrected.",
    "cubeRecipesCategory_runeGemUpgrade": "Rune & Gem Upgrade",
    "cubeRecipesCategory_quests": "Quests",
    "cubeRecipesCategory_consumables": "Consumables",
    "cubeRecipesCategory_sockets": "Sockets",
    "cubeRecipesCategory_itemUpgrade": "Item Upgrade",
    "cubeRecipesCategory_itemRepair": "Item Repair",
    "cubeRecipesCategory_magicItemRerolls": "Magic Item Rerolls",
    "cubeRecipesCategory_magicItemCreation": "Magic Item Creation",
    "cubeRecipesCategory_craftedGrandCharm": "Crafted Grand Charm",
    "craftedItemsPageTitle": "Crafted Items",
    "craftedItemsPageSubtitle": "Browse every crafted item recipe in Diablo II: Resurrected.",
    "craftedItemsFamily_hitPower": "Hit Power",
    "craftedItemsFamily_blood": "Blood",
    "craftedItemsFamily_caster": "Caster",
    "craftedItemsFamily_safety": "Safety",
    "craftedItemsInputLabel": "Magic Item Input",
    "craftedItemsAdditionalInputsLabel": "Additional Inputs",
    "craftedItemsFixedPropertiesLabel": "Fixed Magic Properties"
```

Add the hand-authored zh-TW to `messages/zh-TW.json`:

```json
    "runesPageTitle": "符文",
    "runesPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的符文。",
    "runesWeaponLabel": "武器",
    "runesArmorHelmLabel": "盔甲/頭盔",
    "runesShieldLabel": "盾牌",
    "runesLevelReqLabel": "等級需求",
    "runesRecipeLabel": "合成配方",
    "runesDropRateLabel": "掉落率",
    "cubeRecipesPageTitle": "方塊配方",
    "cubeRecipesPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的賀拉迪魔方配方。",
    "cubeRecipesCategory_runeGemUpgrade": "符文與寶石升級",
    "cubeRecipesCategory_quests": "任務",
    "cubeRecipesCategory_consumables": "消耗品",
    "cubeRecipesCategory_sockets": "插槽",
    "cubeRecipesCategory_itemUpgrade": "物品升級",
    "cubeRecipesCategory_itemRepair": "物品修理",
    "cubeRecipesCategory_magicItemRerolls": "魔法物品重鑄",
    "cubeRecipesCategory_magicItemCreation": "魔法物品製作",
    "cubeRecipesCategory_craftedGrandCharm": "手工大型護身符",
    "craftedItemsPageTitle": "手工藝品",
    "craftedItemsPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的手工藝品配方。",
    "craftedItemsFamily_hitPower": "打擊",
    "craftedItemsFamily_blood": "鮮血",
    "craftedItemsFamily_caster": "施法",
    "craftedItemsFamily_safety": "防護",
    "craftedItemsInputLabel": "魔法物品輸入",
    "craftedItemsAdditionalInputsLabel": "額外材料",
    "craftedItemsFixedPropertiesLabel": "固定魔法屬性"
```

Then run: `node scripts/translate-nav-items-ui-zh-cn.mjs`

- [ ] **Step 2: Write the failing tests**

Create `src/components/items/RuneList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import RuneList from './RuneList';
import messages from '../../../messages/en.json';
import runes from '../../../data/runes.json';

describe('RuneList', () => {
  it('renders all 33 runes', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={runes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('El')).toBeInTheDocument();
    expect(screen.getByText('Zod')).toBeInTheDocument();
    expect(screen.getAllByText(/^#\d+$/).length).toBe(33);
  });

  it('shows the recipe for a rune that has one, and none for El', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={runes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Eld x3/)).toBeInTheDocument();
  });
});
```

Create `src/components/items/CubeRecipeList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CubeRecipeList from './CubeRecipeList';
import messages from '../../../messages/en.json';
import recipes from '../../../data/cube-recipes.json';

describe('CubeRecipeList', () => {
  it('renders all populated category sections with their recipes', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={recipes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Rune & Gem Upgrade')).toBeInTheDocument();
    expect(screen.getByText('3 El Runes -> Eld Rune')).toBeInTheDocument();
    expect(screen.getByText('Crafted Grand Charm')).toBeInTheDocument();
  });
});
```

Create `src/components/items/CraftedItemList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CraftedItemList from './CraftedItemList';
import messages from '../../../messages/en.json';
import craftedItems from '../../../data/crafted-items.json';

describe('CraftedItemList', () => {
  it('renders all 4 families with their recipes', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={craftedItems} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Hit Power')).toBeInTheDocument();
    expect(screen.getByText('Hit Power Helm')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/components/items/RuneList.test.tsx src/components/items/CubeRecipeList.test.tsx src/components/items/CraftedItemList.test.tsx`
Expected: FAIL — modules don't exist.

- [ ] **Step 4: Implement the three components**

Create `src/components/items/RuneList.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type runesJson from '../../../data/runes.json';

type Rune = (typeof runesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

export default function RuneList({ runes, locale }: { runes: Rune[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-4 w-full">
      {runes.map(rune => (
        <div key={rune.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#cbb87f]">{rune.name[locale]}</h3>
            <span className="text-xs text-zinc-500">#{rune.number}</span>
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            {t('runesLevelReqLabel')}: {rune.levelReq}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('runesWeaponLabel')}</h4>
              <div className="text-[#8080f3] flex flex-col gap-0.5">
                {rune.weaponStats.map(s => <div key={s.key}>{s.label[locale]}: {s.min}</div>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('runesArmorHelmLabel')}</h4>
              <div className="text-[#8080f3] flex flex-col gap-0.5">
                {rune.armorHelmStats.map(s => <div key={s.key}>{s.label[locale]}: {s.min}</div>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('runesShieldLabel')}</h4>
              <div className="text-[#8080f3] flex flex-col gap-0.5">
                {rune.shieldStats.map(s => <div key={s.key}>{s.label[locale]}: {s.min}</div>)}
              </div>
            </div>
          </div>
          {rune.recipe && (
            <div className="mt-3 text-sm text-zinc-400">
              {t('runesRecipeLabel')}: {rune.recipe.runeName} x{rune.recipe.count}
              {rune.recipe.gemName ? ` + ${rune.recipe.gemName}` : ''}
            </div>
          )}
          <div className="mt-2 text-xs text-zinc-500">
            {t('runesDropRateLabel')}: {rune.dropRate.difficulty.toUpperCase()} {rune.dropRate.monster} {rune.dropRate.percent}%
          </div>
        </div>
      ))}
    </div>
  );
}
```

Create `src/components/items/CubeRecipeList.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type cubeRecipesJson from '../../../data/cube-recipes.json';

type Recipe = (typeof cubeRecipesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

const CATEGORY_ORDER = [
  'runeGemUpgrade', 'quests', 'consumables', 'sockets', 'itemUpgrade',
  'itemRepair', 'magicItemRerolls', 'magicItemCreation', 'craftedGrandCharm',
] as const;

export default function CubeRecipeList({ recipes, locale }: { recipes: Recipe[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-8 w-full">
      {CATEGORY_ORDER.map(category => {
        const items = recipes.filter(r => r.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              {t(`cubeRecipesCategory_${category}`)}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map(r => (
                <div key={r.id} className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300">
                  {r.description[locale]}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

Create `src/components/items/CraftedItemList.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type craftedItemsJson from '../../../data/crafted-items.json';

type CraftedItem = (typeof craftedItemsJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

const FAMILY_ORDER = ['hitPower', 'blood', 'caster', 'safety'] as const;

export default function CraftedItemList({ items, locale }: { items: CraftedItem[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-8 w-full">
      {FAMILY_ORDER.map(family => {
        const familyItems = items.filter(i => i.family === family);
        if (familyItems.length === 0) return null;
        return (
          <div key={family}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              {t(`craftedItemsFamily_${family}`)}
            </h2>
            <div className="flex flex-col gap-3">
              {familyItems.map(item => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-[#cbb87f]">{item.name[locale]}</h3>
                  <div className="mt-2 text-sm text-zinc-300">
                    {t('craftedItemsInputLabel')}: {item.magicItemInput[locale]}
                  </div>
                  <div className="text-sm text-zinc-300">
                    {t('craftedItemsAdditionalInputsLabel')}: {item.additionalInputs.map(i => i[locale]).join(', ')}
                  </div>
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      {t('craftedItemsFixedPropertiesLabel')}
                    </h4>
                    <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
                      {item.fixedProperties.map(f => <div key={f.key}>{f.label[locale]}: {f.value}</div>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/items/RuneList.test.tsx src/components/items/CubeRecipeList.test.tsx src/components/items/CraftedItemList.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Wire the three pages**

Modify `src/app/[locale]/items/runes/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import RuneList from '@/components/items/RuneList';
import runes from '../../../../../data/runes.json';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function RunesPage({
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
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('runesPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('runesPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <RuneList runes={runes} locale={locale as 'en' | 'zh-TW' | 'zh-CN'} />
      </div>
    </main>
  );
}
```

Modify `src/app/[locale]/items/cube-recipes/page.tsx` identically in shape, using
`CubeRecipeList`, `cube-recipes.json`, `cubeRecipesPageTitle`/`Subtitle`.

Modify `src/app/[locale]/items/crafted/page.tsx` identically in shape, using
`CraftedItemList`, `crafted-items.json`, `craftedItemsPageTitle`/`Subtitle`.

- [ ] **Step 7: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm `out/en/items/runes/index.html`,
`out/en/items/cube-recipes/index.html`, `out/en/items/crafted/index.html` (and their
zh-TW/zh-CN equivalents) all exist with real content.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/components/items/RuneList.tsx src/components/items/RuneList.test.tsx src/components/items/CubeRecipeList.tsx src/components/items/CubeRecipeList.test.tsx src/components/items/CraftedItemList.tsx src/components/items/CraftedItemList.test.tsx src/app/\[locale\]/items/runes/page.tsx src/app/\[locale\]/items/cube-recipes/page.tsx src/app/\[locale\]/items/crafted/page.tsx
git commit -m "Add Runes, Cube Recipes, Crafted Items pages"
```

---

### Task 5: Vendor `magicprefix.json`/`magicsuffix.json`; generate `data/magic-affixes.json`

**Files:**
- Create: `vendor/d2data/json/magicprefix.json`, `vendor/d2data/json/magicsuffix.json`
- Modify: `vendor/d2data/README.md`
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:**
- Produces: `data/magic-affixes.json` — array of `{ id, name: LocalizedText, kind:
  'prefix' | 'suffix', alvl: number, itemTypes: string[], rareEligible: boolean, stats:
  RawGrailStat[] }` — every `frequency > 0` entry from both files.

- [ ] **Step 1: Fetch and vendor**

```bash
curl -s "https://raw.githubusercontent.com/blizzhackers/d2data/477bcf63e964f39f4c774e588a79fd598ae472de/json/magicprefix.json" \
  -o vendor/d2data/json/magicprefix.json
curl -s "https://raw.githubusercontent.com/blizzhackers/d2data/477bcf63e964f39f4c774e588a79fd598ae472de/json/magicsuffix.json" \
  -o vendor/d2data/json/magicsuffix.json
```

Verify:
```bash
python3 -c "
import json
p = json.load(open('vendor/d2data/json/magicprefix.json'))
s = json.load(open('vendor/d2data/json/magicsuffix.json'))
print('prefix:', len(p), 'suffix:', len(s))
"
```
Expected: `prefix: 721 suffix: 785`.

Add to `vendor/d2data/README.md`:

```markdown

`magicprefix.json`/`magicsuffix.json` provide magic/rare item affixes (name, level
requirement, item-type restrictions, and granted properties) for the Magic Items and
Rare Items reference pages. Both pages draw from the same `frequency > 0` active-affix
pool; Rare Items further restricts to entries where `rare === 1` (verified this session
via direct comparison against d2r.world: an affix present on the Magic page without a
`rare` flag is absent from the Rare page for the same item type, and vice versa for a
`rare: 1` entry appearing only on the Rare page — this is a real, curated subset
distinction in the game's own item generation, not an artifact of stale/versioned data).
```

- [ ] **Step 2: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
import magicAffixesData from './magic-affixes.json';

describe('magic-affixes.json', () => {
  it('includes both prefixes and suffixes', () => {
    expect(magicAffixesData.some(a => a.kind === 'prefix')).toBe(true);
    expect(magicAffixesData.some(a => a.kind === 'suffix')).toBe(true);
  });

  it('excludes frequency-0 (inactive) entries', () => {
    // "Fortuitous" v0 (group 114) has frequency:0 and should not appear; the active
    // v1 entry (frequency:4, alvl 12, no rare flag) should.
    const fortuitous = magicAffixesData.filter(a => a.name.en === 'Fortuitous');
    expect(fortuitous.length).toBeGreaterThan(0);
    expect(fortuitous.every(a => a.alvl !== 5)).toBe(true); // the dead v0 entry was alvl 5
  });

  it('marks rare-eligible affixes correctly', () => {
    const felicitous = magicAffixesData.find(a => a.name.en === 'Felicitous');
    expect(felicitous?.rareEligible).toBe(true);
  });

  it('every entry has at least one item type and one stat', () => {
    for (const a of magicAffixesData) {
      expect(a.itemTypes.length).toBeGreaterThan(0);
      expect(a.stats.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "magic-affixes.json"`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement the generator addition**

In `scripts/generate-grail-data.mjs`, add:

```js
const magicPrefixData = JSON.parse(readFileSync(join(VENDOR, 'magicprefix.json'), 'utf8'));
const magicSuffixData = JSON.parse(readFileSync(join(VENDOR, 'magicsuffix.json'), 'utf8'));

function itemTypesForAffix(entry) {
  const types = [];
  for (let n = 1; n <= 7; n++) {
    const itype = entry[`itype${n}`];
    if (itype) types.push(TYPE_TO_SLOT[itype] ?? itype);
  }
  return types;
}

function magicAffixesFrom(data, kind) {
  return Object.entries(data)
    .filter(([, v]) => (v.frequency ?? 0) > 0)
    .map(([id, v]) => {
      const { variable, fixed } = extractProps(v, 3, { code: 'mod', par: 'mod', min: 'mod', max: 'mod' }); // placeholder, see note below
      return {
        id: `${kind}-${id}`,
        name: localizedItemName(v.Name),
        kind,
        alvl: v.levelreq ?? v.level ?? 0,
        itemTypes: itemTypesForAffix(v),
        rareEligible: v.rare === 1,
        stats: [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, min: f.value, max: f.value }))],
      };
    });
}
```

**Important correction before running this**: `magicprefix.json`/`magicsuffix.json` use
field names `mod1code`/`mod1param`/`mod1min`/`mod1max` (no space, unlike
`cubemain.json`'s craft entries) — i.e. exactly the SAME shape as `extractProps`'s
default prefixes (`code: 'prop'`... no, check again: the default is
`prop{n}`/`par{n}`/`min{n}`/`max{n}`, but these files use `mod{n}code` — the field-name
*order* differs (`mod1code` vs `prop1`), not just the prefix text). Because
`extractProps` builds keys as `` `${prefixes.code}${n}` `` (prefix text followed by the
number), it cannot directly express `mod1code` (number-then-suffix) — pass the correct
prefixes accounting for this: `code: 'mod', par: 'mod', min: 'mod', max: 'mod'` would
produce `"mod1"` for all four, which is wrong. Instead, write a small dedicated
extraction loop for this one shape rather than forcing `extractProps` to fit:

```js
function extractMagicAffixStats(entry) {
  const variable = [];
  const fixed = [];
  for (let n = 1; n <= 3; n++) {
    const rawCode = entry[`mod${n}code`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`mod${n}param`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
    const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
    const key = needsKeySuffix ? `${code}:${par}` : code;
    const min = entry[`mod${n}min`];
    const max = entry[`mod${n}max`];
    if (min !== undefined && max !== undefined) {
      if (min === max) fixed.push({ key, label, value: min });
      else variable.push({ key, label, min, max });
    }
  }
  return { variable, fixed };
}

function magicAffixesFrom(data, kind) {
  return Object.entries(data)
    .filter(([, v]) => (v.frequency ?? 0) > 0)
    .map(([id, v]) => {
      const { variable, fixed } = extractMagicAffixStats(v);
      return {
        id: `${kind}-${id}`,
        name: localizedItemName(v.Name),
        kind,
        alvl: v.levelreq ?? v.level ?? 0,
        itemTypes: itemTypesForAffix(v),
        rareEligible: v.rare === 1,
        stats: [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, min: f.value, max: f.value }))],
      };
    });
}

const magicAffixesOut = [
  ...magicAffixesFrom(magicPrefixData, 'prefix'),
  ...magicAffixesFrom(magicSuffixData, 'suffix'),
];

writeFileSync(join(OUT, 'magic-affixes.json'), JSON.stringify(magicAffixesOut, null, 2));
console.log(`Wrote ${magicAffixesOut.length} magic/rare affixes -> data/magic-affixes.json`);
```

(Discard the first, incorrect `magicAffixesFrom` draft above it — this corrected
version, using `extractMagicAffixStats`, is the one to actually add to the script.)

- [ ] **Step 5: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "magic-affixes.json"
```
Expected: PASS (4 tests).

- [ ] **Step 6: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, including all pre-existing tests still passing.

```bash
git add vendor/d2data/json/magicprefix.json vendor/d2data/json/magicsuffix.json vendor/d2data/README.md scripts/generate-grail-data.mjs data/magic-affixes.json data/grail-data.test.ts
git commit -m "Vendor magicprefix/magicsuffix.json; generate data/magic-affixes.json"
```

---

### Task 6: Magic Items / Rare Items category system + pages

**Files:**
- Create: `src/lib/grail/affixCatalog.ts`, `src/lib/grail/affixCatalog.test.ts`
- Create: `src/components/items/AffixTable.tsx`, `src/components/items/AffixTable.test.tsx`
- Modify: `src/app/[locale]/items/magic/page.tsx`, `src/app/[locale]/items/rare/page.tsx` (currently placeholders)
- Create: `src/app/[locale]/items/magic/[category]/page.tsx`, `src/app/[locale]/items/rare/[category]/page.tsx`
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Produces: `getAffixCategories(kind: 'magic' | 'rare'): string[]`,
  `getAffixesForCategory(kind, category, locale)` returning `{ prefixes: [...],
  suffixes: [...] }`, both in `src/lib/grail/affixCatalog.ts`.
- Reuses: `CategoryCardGrid` (unchanged, from the prior plan).

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace:

```json
    "magicPageTitle": "Magic Items",
    "magicPageSubtitle": "Browse every magic item affix in Diablo II: Resurrected.",
    "rarePageTitle": "Rare Items",
    "rarePageSubtitle": "Browse every rare item affix in Diablo II: Resurrected.",
    "affixPrefixesLabel": "Prefixes",
    "affixSuffixesLabel": "Suffixes",
    "affixAlvlLabel": "Alvl"
```

Add the hand-authored zh-TW to `messages/zh-TW.json`:

```json
    "magicPageTitle": "魔法裝備",
    "magicPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的魔法物品詞綴。",
    "rarePageTitle": "稀有裝備",
    "rarePageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的稀有物品詞綴。",
    "affixPrefixesLabel": "前綴",
    "affixSuffixesLabel": "後綴",
    "affixAlvlLabel": "物品等級"
```

Add a new `AffixCategories` namespace (after `Items`) to `messages/en.json` with the 27
category labels below (reusing `Grail.slot_*` values where the category is identical to
an existing slot — `helm`→already have `slot_helms`, etc. — so only the genuinely new,
more granular categories need new keys):

```json
  "AffixCategories": {
    "barbarianHelms": "Barbarian Helms",
    "druidHelms": "Druid Helms",
    "circlets": "Circlets",
    "paladinShields": "Paladin Shields",
    "shrunkenHeads": "Shrunken Heads",
    "amazonSpears": "Amazon Spears",
    "sorceressOrbs": "Sorceress Orbs",
    "necromancerWands": "Necromancer Wands",
    "assassinKatars": "Assassin Katars",
    "amazonBows": "Amazon Bows",
    "amazonJavelins": "Amazon Javelins",
    "throwingAxes": "Throwing Axes",
    "throwingKnives": "Throwing Knives"
  }
```

Add the matching hand-authored zh-TW:

```json
  "AffixCategories": {
    "barbarianHelms": "蠻族頭盔",
    "druidHelms": "德魯伊頭盔",
    "circlets": "冠飾",
    "paladinShields": "聖騎士盾牌",
    "shrunkenHeads": "縮頭",
    "amazonSpears": "亞馬遜長矛",
    "sorceressOrbs": "女巫法球",
    "necromancerWands": "死靈法師魔杖",
    "assassinKatars": "刺客拳刃",
    "amazonBows": "亞馬遜弓",
    "amazonJavelins": "亞馬遜標槍",
    "throwingAxes": "投擲斧",
    "throwingKnives": "投擲刀"
  }
```

Extend `scripts/translate-nav-items-ui-zh-cn.mjs` to also convert `AffixCategories`
(same pattern as the existing `BaseItems` addition from the prior plan), then run it.

- [ ] **Step 2: Write the failing test for `affixCatalog.ts`**

Create `src/lib/grail/affixCatalog.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getAffixCategories, getAffixesForCategory } from './affixCatalog';

describe('affixCatalog', () => {
  it('magic categories include the granular class-specific splits', () => {
    const categories = getAffixCategories('magic');
    expect(categories).toContain('barbarianHelms');
    expect(categories).toContain('druidHelms');
    expect(categories).toContain('helms');
  });

  it('rare categories are a subset of (or equal to) magic categories for the same itype set', () => {
    const magicCats = getAffixCategories('magic');
    const rareCats = getAffixCategories('rare');
    for (const cat of rareCats) expect(magicCats).toContain(cat);
  });

  it('getAffixesForCategory returns prefixes and suffixes for rings', () => {
    const { prefixes, suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    expect(prefixes.some(p => p.name === 'Fortuitous')).toBe(true);
    expect(suffixes.length).toBeGreaterThan(0);
  });

  it('rare-kind filtering excludes non-rare-eligible affixes', () => {
    const { prefixes: magicPrefixes } = getAffixesForCategory('magic', 'rings', 'en');
    const { prefixes: rarePrefixes } = getAffixesForCategory('rare', 'rings', 'en');
    expect(rarePrefixes.length).toBeLessThanOrEqual(magicPrefixes.length);
    expect(rarePrefixes.every(p => p.rareEligible)).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/affixCatalog.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `affixCatalog.ts`**

Create `src/lib/grail/affixCatalog.ts`:

```ts
import magicAffixesFull from '../../../data/magic-affixes.json';
import type { Locale } from './catalog';

export type AffixKind = 'magic' | 'rare';

export interface Affix {
  name: string;
  alvl: number;
  min: number;
  max: number;
}

export function getAffixCategories(kind: AffixKind): string[] {
  const relevant = kind === 'rare' ? magicAffixesFull.filter(a => a.rareEligible) : magicAffixesFull;
  const categories = new Set<string>();
  for (const a of relevant) for (const t of a.itemTypes) categories.add(t);
  return Array.from(categories).sort();
}

export function getAffixesForCategory(
  kind: AffixKind,
  category: string,
  locale: Locale
): { prefixes: Affix[]; suffixes: Affix[] } {
  const relevant = magicAffixesFull.filter(
    a => a.itemTypes.includes(category) && (kind === 'magic' || a.rareEligible)
  );
  const toAffix = (a: (typeof magicAffixesFull)[number]): Affix => {
    const stat = a.stats[0];
    return { name: a.name[locale], alvl: a.alvl, min: stat?.min ?? 0, max: stat?.max ?? 0 };
  };
  return {
    prefixes: relevant.filter(a => a.kind === 'prefix').map(toAffix),
    suffixes: relevant.filter(a => a.kind === 'suffix').map(toAffix),
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/affixCatalog.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Write and implement `AffixTable`**

Create `src/components/items/AffixTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AffixTable from './AffixTable';
import messages from '../../../messages/en.json';

describe('AffixTable', () => {
  it('renders prefix and suffix sections with affix rows', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AffixTable
          prefixes={[{ name: 'Rugged', alvl: 8, min: 5, max: 10 }]}
          suffixes={[{ name: 'of Protection', alvl: 18, min: 1, max: 20 }]}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Prefixes')).toBeInTheDocument();
    expect(screen.getByText('Rugged')).toBeInTheDocument();
    expect(screen.getByText('of Protection')).toBeInTheDocument();
  });
});
```

Create `src/components/items/AffixTable.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type { Affix } from '@/lib/grail/affixCatalog';

function AffixSection({ title, affixes }: { title: string; affixes: Affix[] }) {
  const t = useTranslations('Items');
  if (affixes.length === 0) return null;
  return (
    <div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
      <div className="flex flex-col gap-1">
        {affixes.map(a => (
          <div key={a.name} className="flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm">
            <span className="text-[#cbb87f] font-semibold">{a.name}</span>
            <span className="text-zinc-500 text-xs">{t('affixAlvlLabel')} {a.alvl}</span>
            <span className="text-[#8080f3]">{a.min}–{a.max}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AffixTable({ prefixes, suffixes }: { prefixes: Affix[]; suffixes: Affix[] }) {
  const t = useTranslations('Items');
  return (
    <div className="flex flex-col gap-6 w-full">
      <AffixSection title={t('affixPrefixesLabel')} affixes={prefixes} />
      <AffixSection title={t('affixSuffixesLabel')} affixes={suffixes} />
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/components/items/AffixTable.test.tsx`
Expected: PASS.

- [ ] **Step 8: Wire the landing + category pages**

Modify `src/app/[locale]/items/magic/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAffixCategories } from '@/lib/grail/affixCatalog';
import CategoryCardGrid from '@/components/items/CategoryCardGrid';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function MagicItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');
  const categories = getAffixCategories('magic');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('magicPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('magicPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <CategoryCardGrid categories={categories} basePath={`/${locale}/items/magic`} />
      </div>
    </main>
  );
}
```

(`CategoryCardGrid` calls `useTranslations('Grail')` internally for `slot_${category}`
labels — for the new granular categories not in `Grail`'s namespace, this will throw a
missing-message error. Fix: `CategoryCardGrid` needs a way to fall back to
`AffixCategories` for unknown slugs. Update `src/components/items/CategoryCardGrid.tsx`
to try `Grail.slot_${category}` first and fall back to `AffixCategories.${category}` —
add a second `useTranslations('AffixCategories')` call and a small helper:

```tsx
const tGrail = useTranslations('Grail');
const tAffix = useTranslations('AffixCategories');
function labelFor(category: string) {
  const grailKey = `slot_${category}`;
  return tGrail.has(grailKey) ? tGrail(grailKey) : tAffix(category);
}
```

replacing the existing `{t(\`slot_${category}\`)}` call with `{labelFor(category)}`.
This is a small, backward-compatible addition — existing callers passing only
`Grail`-namespace categories are unaffected. Add this change as part of this step, with
a one-line test addition to `CategoryCardGrid.test.tsx` confirming an `AffixCategories`
key like `barbarianHelms` renders correctly.)

Modify `src/app/[locale]/items/rare/page.tsx` identically, with `kind='rare'` and
`rarePageTitle`/`Subtitle`.

Create `src/app/[locale]/items/magic/[category]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAffixCategories, getAffixesForCategory } from '@/lib/grail/affixCatalog';
import AffixTable from '@/components/items/AffixTable';

export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    getAffixCategories('magic').map(category => ({ locale, category }))
  );
}

export default async function MagicCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!getAffixCategories('magic').includes(category)) notFound();

  const t = await getTranslations('Items');
  const { prefixes, suffixes } = getAffixesForCategory('magic', category, locale as 'en' | 'zh-TW' | 'zh-CN');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('magicPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('magicPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <Link href={`/${locale}/items/magic`} className="text-sm text-zinc-400 hover:text-amber-300 transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <AffixTable prefixes={prefixes} suffixes={suffixes} />
      </div>
    </main>
  );
}
```

Create `src/app/[locale]/items/rare/[category]/page.tsx` identically, with `kind='rare'`.

- [ ] **Step 9: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm `out/en/items/magic/index.html`,
`out/en/items/magic/rings/index.html`, `out/en/items/rare/index.html`,
`out/en/items/rare/rings/index.html` all exist with real content, and that
`out/en/items/rare/` has fewer category sub-pages than `out/en/items/magic/` (some
categories may have zero rare-eligible affixes at all — if so,
`getAffixCategories('rare')` naturally excludes them, matching the design's
`generateStaticParams`-driven-by-real-data pattern from every prior plan).

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json scripts/translate-nav-items-ui-zh-cn.mjs src/lib/grail/affixCatalog.ts src/lib/grail/affixCatalog.test.ts src/components/items/AffixTable.tsx src/components/items/AffixTable.test.tsx src/components/items/CategoryCardGrid.tsx src/components/items/CategoryCardGrid.test.tsx src/app/\[locale\]/items/magic src/app/\[locale\]/items/rare
git commit -m "Add Magic Items and Rare Items pages with affix tables"
```

---

### Task 7: Full verification + d2r.world spot-check (both batches)

**Files:**
- Create: `docs/superpowers/specs/2026-07-15-runes-cube-crafted-magic-rare-verification.md`

- [ ] **Step 1: Full automated verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm route listing includes all 5 new sections × 3 locales
(Runes/Cube Recipes/Crafted Items as single pages; Magic/Rare Items as landing +
per-category pages).

- [ ] **Step 2: Manual browser verification + d2r.world spot-check**

Start the dev server **from this feature's actual worktree** (verify with `pwd`/
`git branch --show-current` first). For each of the 5 new sections, in all 3 locales:
confirm real content renders (not placeholder text), spot-check 2-3 entries per
section against d2r.world directly (Runes: El/Amn/Zod; Cube Recipes: a rune-upgrade
entry + a quest entry; Crafted Items: Hit Power Helm; Magic/Rare Items: Rings category).
Confirm the `/items/rare/[some-magic-only-category]` route correctly 404s if a category
has zero rare-eligible affixes.

Write findings to
`docs/superpowers/specs/2026-07-15-runes-cube-crafted-magic-rare-verification.md`,
following the format of prior verification docs in this project.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-15-runes-cube-crafted-magic-rare-verification.md
git commit -m "Full verification + d2r.world spot-check for Batch A + Batch B"
```
