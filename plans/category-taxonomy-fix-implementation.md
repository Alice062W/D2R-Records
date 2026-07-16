# Category Taxonomy Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close two taxonomy gaps found comparing every section against d2r.world: (A)
Base Items' Helms/Shields categories are missing d2r.world's in-page sub-tabs
(Circlets/Barbarian Helms/Druid Helms; Paladin Shields/Shrunken Heads); (B) Magic/Rare
Items' 37 category slugs collapse several real, granular d2r.world categories (class-
specific weapon/armor variants, charm sizes) into generic fallback codes, and 9 of those
codes are genuine D2 supertype/class-restriction wrappers that should expand an affix
onto every applicable specific category, not one generic tile.

**Architecture:** (A) extend the base-item generator to preserve each Helm/Shield's raw
D2 item-type as a new `subCategory` field, and add client-side tab filtering to the
existing Base Items category page. (B) build a generic ancestor-closure resolver over
`vendor/d2data/json/itemtypes.json`'s `Equiv1`/`Equiv2` parent links, replace
`itemTypesForAffix`'s flat per-code lookup with this resolver, add i18n labels and
category icons for every newly-introduced granular slug.

**Tech Stack:** Node.js generator script, Next.js/React, Tailwind CSS 4, Vitest.

## Global Constraints

- The shared `TYPE_TO_SLOT` map (used by uniques/sets/bases/base-item slot categorization)
  is NOT modified by Part B — a second, separate resolver is built for magic-affixes
  only. Unique/Set Items' flat category structure is confirmed correct and must not
  change.
- `bar` (Barbarian class-restriction, not reachable via any `itype` field) is explicitly
  OUT OF SCOPE — it keeps today's generic-tile behavior. Do not attempt to expand it.
- Base Items' Grimoires stays a top-level category (not nested under Shields) — only
  Circlets/Barbarian Helms/Druid Helms nest under Helms, and Paladin Shields/Shrunken
  Heads nest under Shields, for Base Items specifically.
- Every new i18n key added to `AffixCategories` needs en + hand-authored zh-TW; zh-CN is
  derived via the existing `scripts/translate-nav-items-ui-zh-cn.mjs` script, never
  independently translated.
- Category icons for newly-introduced granular slugs reuse the existing
  `data/category-icons.json` generation pattern from the prior Category-Grid Icons plan
  — not a new mechanism.

---

### Task 1: Add `subCategory` to Base Items Helms/Shields entries

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:**
- Produces: every `data/bases-full.json` entry with `slotCategory: 'helms'` or
  `'shields'` gains a new field `subCategory: string | null` — `null` for the plain
  base type (`helm`, `shie`), otherwise one of `'circlet'`, `'barbarian'`, `'druid'`
  (Helms family) or `'paladin'`, `'shrunkenHeads'` (Shields family). Every other
  `slotCategory` gets `subCategory: null` unconditionally (no change in shape for
  categories outside Helms/Shields).

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
describe('bases-full.json subCategory (Helms/Shields sub-tabs)', () => {
  it('tags each Helms-family item with the correct subCategory', () => {
    const byId = Object.fromEntries(basesFull.map((b: { id: string; subCategory: string | null }) => [b.id, b.subCategory]));
    expect(byId['base-cap']).toBeNull(); // Cap -> plain Helm
    expect(byId['base-ci0']).toBe('circlet'); // Circlet
    expect(byId['base-ba1']).toBe('barbarian'); // Jawbone Cap -> Barbarian Helm
    expect(byId['base-dr1']).toBe('druid'); // Wolf Head -> Druid Pelt
  });

  it('tags each Shields-family item with the correct subCategory', () => {
    const byId = Object.fromEntries(basesFull.map((b: { id: string; subCategory: string | null }) => [b.id, b.subCategory]));
    expect(byId['base-buc']).toBeNull(); // Buckler -> plain Shield
    expect(byId['base-pa1']).toBe('paladin'); // Targe -> Paladin Shield
    expect(byId['base-ne1']).toBe('shrunkenHeads'); // Preserved Head -> Shrunken Head
  });

  it('every non-Helms/Shields entry has subCategory null', () => {
    const others = basesFull.filter((b: { slotCategory: string }) => b.slotCategory !== 'helms' && b.slotCategory !== 'shields');
    expect(others.every((b: { subCategory: string | null }) => b.subCategory === null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "subCategory"`
Expected: FAIL — `subCategory` field doesn't exist yet (all `undefined`).

- [ ] **Step 3: Implement the generator addition**

Find the base-item generation code in `scripts/generate-grail-data.mjs` (search for
`basesFullOut` — the array-building step that currently sets `slotCategory:
TYPE_TO_SLOT[v.type]`). Add a helper and use it when building each base line:

```js
const HELM_SUB_CATEGORY = { helm: null, circ: 'circlet', phlm: 'barbarian', pelt: 'druid' };
const SHIELD_SUB_CATEGORY = { shie: null, ashd: 'paladin', head: 'shrunkenHeads' };

function subCategoryFor(rawType) {
  if (rawType in HELM_SUB_CATEGORY) return HELM_SUB_CATEGORY[rawType];
  if (rawType in SHIELD_SUB_CATEGORY) return SHIELD_SUB_CATEGORY[rawType];
  return null;
}
```

Then, wherever each `basesFullOut` entry is constructed (it currently includes `id`,
`slotCategory`, `grades`), add `subCategory: subCategoryFor(v.type)` alongside the
existing fields — `v` here is the raw `items.json` entry already being read to determine
`type`/`slotCategory`, so `v.type` is already in scope at that point; if the existing
code destructures differently, use whatever local variable already holds the raw
`items.json` entry for that base code.

- [ ] **Step 4: Update the `BaseLine` TypeScript interface**

In `src/lib/grail/basesCatalog.ts`, add `subCategory: string | null` to the `BaseLine`
interface, and pass it through in `getBaseLinesForCategory`'s mapping (currently returns
`{ id, slotCategory, grades }` — add `subCategory: l.subCategory`).

- [ ] **Step 5: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "subCategory"
```
Expected: PASS (3 tests).

- [ ] **Step 6: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, including all pre-existing tests still passing.

```bash
git add scripts/generate-grail-data.mjs src/lib/grail/basesCatalog.ts data/bases-full.json data/grail-data.test.ts
git commit -m "Add subCategory field to Base Items Helms/Shields entries"
```

---

### Task 2: Base Items Helms/Shields sub-tab UI

**Files:**
- Modify: `src/app/[locale]/items/base/[category]/page.tsx`
- Create: `src/components/items/BaseSubCategoryTabs.tsx`
- Test: `src/components/items/BaseSubCategoryTabs.test.tsx`
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Consumes: `BaseLine.subCategory` (Task 1).
- Produces: `BaseSubCategoryTabs({ lines, onFilterChange }): JSX` — a small tab-bar
  component; `[category]/page.tsx` passes the full `lines` array to it and only renders
  `BaseItemTable`s for the currently-selected sub-category when the category is
  `helms` or `shields`, exactly as it does today (no filtering, all lines shown) for
  every other category.

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace:
```json
    "baseSubTab_all": "All",
    "baseSubTab_circlet": "Circlets",
    "baseSubTab_barbarian": "Barbarian Helms",
    "baseSubTab_druid": "Druid Helms",
    "baseSubTab_paladin": "Paladin Shields",
    "baseSubTab_shrunkenHeads": "Shrunken Heads"
```

Add the hand-authored zh-TW to `messages/zh-TW.json`:
```json
    "baseSubTab_all": "全部",
    "baseSubTab_circlet": "冠飾",
    "baseSubTab_barbarian": "蠻族頭盔",
    "baseSubTab_druid": "德魯伊頭盔",
    "baseSubTab_paladin": "聖騎士盾牌",
    "baseSubTab_shrunkenHeads": "縮頭"
```

Run `node scripts/translate-nav-items-ui-zh-cn.mjs` to derive `messages/zh-CN.json`.

- [ ] **Step 2: Write the failing test**

Create `src/components/items/BaseSubCategoryTabs.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import BaseSubCategoryTabs from './BaseSubCategoryTabs';
import messages from '../../../messages/en.json';

describe('BaseSubCategoryTabs', () => {
  it('renders All plus one tab per distinct non-null subCategory present', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BaseSubCategoryTabs subCategories={['circlet', 'barbarian', 'druid']} selected={null} onSelect={() => {}} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Circlets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Barbarian Helms' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Druid Helms' })).toBeInTheDocument();
  });

  it('calls onSelect with the clicked subCategory', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BaseSubCategoryTabs subCategories={['paladin', 'shrunkenHeads']} selected={null} onSelect={onSelect} />
      </NextIntlClientProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Paladin Shields' }));
    expect(onSelect).toHaveBeenCalledWith('paladin');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/items/BaseSubCategoryTabs.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `BaseSubCategoryTabs`**

Create `src/components/items/BaseSubCategoryTabs.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function BaseSubCategoryTabs({
  subCategories,
  selected,
  onSelect,
}: {
  subCategories: string[];
  selected: string | null;
  onSelect: (subCategory: string | null) => void;
}) {
  const t = useTranslations('Items');
  const options = [null, ...subCategories];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt ?? 'all'}
          onClick={() => onSelect(opt)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            selected === opt
              ? 'border-amber-400 text-amber-300 bg-zinc-800'
              : 'border-zinc-700 text-zinc-300 hover:border-amber-400 hover:text-amber-300'
          }`}
        >
          {t(`baseSubTab_${opt ?? 'all'}`)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/items/BaseSubCategoryTabs.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Wire into the Base Items category page**

`src/app/[locale]/items/base/[category]/page.tsx` is currently a Server Component. To
add client-side tab filtering for `helms`/`shields` only, extract the list-rendering
part into a small client wrapper. Create `src/components/items/BaseCategoryList.tsx`:

```tsx
'use client';

import { useState, useMemo } from 'react';
import BaseItemTable from './BaseItemTable';
import BaseSubCategoryTabs from './BaseSubCategoryTabs';
import type { BaseLine } from '@/lib/grail/basesCatalog';

export default function BaseCategoryList({ lines }: { lines: BaseLine[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const subCategories = useMemo(
    () => Array.from(new Set(lines.map(l => l.subCategory).filter((s): s is string => s !== null))),
    [lines]
  );
  const visible = selected === null ? lines : lines.filter(l => l.subCategory === selected);

  return (
    <div className="flex flex-col gap-4">
      {subCategories.length > 0 && (
        <BaseSubCategoryTabs subCategories={subCategories} selected={selected} onSelect={setSelected} />
      )}
      <div className="flex flex-col gap-4">
        {visible.map(line => <BaseItemTable key={line.id} line={line} />)}
      </div>
    </div>
  );
}
```

In `src/app/[locale]/items/base/[category]/page.tsx`, replace the existing:
```tsx
        <div className="flex flex-col gap-4">
          {lines.map(line => <BaseItemTable key={line.id} line={line} />)}
        </div>
```
with:
```tsx
        <BaseCategoryList lines={lines} />
```
and update the import line from `import BaseItemTable from '@/components/items/BaseItemTable';`
to `import BaseCategoryList from '@/components/items/BaseCategoryList';` (drop the now-unused
`BaseItemTable` import from this file — it's still used inside `BaseCategoryList` itself).

For categories other than `helms`/`shields`, `subCategories` will be empty (every line's
`subCategory` is `null`), so the tab bar doesn't render at all and `visible` is always the
full `lines` array — behavior is unchanged from today for every other category.

- [ ] **Step 7: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/components/items/BaseSubCategoryTabs.tsx src/components/items/BaseSubCategoryTabs.test.tsx src/components/items/BaseCategoryList.tsx "src/app/[locale]/items/base/[category]/page.tsx"
git commit -m "Add Helms/Shields sub-tabs to Base Items category pages"
```

---

### Task 3: Ancestor-closure resolver for Magic/Rare category expansion

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:**
- Produces: `data/magic-affixes.json`'s `itemTypes` field per affix now contains every
  real leaf category slug the affix's restriction(s) expand to (via ancestor closure),
  instead of a flat 1:1 code mapping.

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
describe('magic-affixes.json ancestor-closure category expansion', () => {
  it('expands a weapon-supertype-restricted affix onto every leaf weapon category', () => {
    // Any affix whose only restriction is the bare "weap" supertype code should appear
    // on every leaf weapon slug (swords, axes, bows, etc.) after expansion.
    const weapRestricted = magicAffixesData.filter((a: { itemTypes: string[] }) =>
      a.itemTypes.includes('swords') && a.itemTypes.includes('bows') && a.itemTypes.includes('axes')
    );
    expect(weapRestricted.length).toBeGreaterThan(0);
  });

  it('expands an Amazon-class-only restriction onto exactly the three Amazon weapon categories', () => {
    // NOTE: "of Slow Missiles" is not a unique name — magicsuffix.json id 476 has
    // itype1: 'amaz' (the one this test targets) and a SEPARATE id 477 also named
    // "of Slow Missiles" has itype1: 'glov' (Gloves) instead. Both become distinct
    // entries in magic-affixes.json (this project doesn't dedupe by name), so find the
    // specific one with 3 itemTypes, not just the first name match.
    const amazVariant = magicAffixesData.find(
      (a: { name: { en: string }; itemTypes: string[] }) =>
        a.name.en === 'of Slow Missiles' && a.itemTypes.length === 3
    );
    expect(amazVariant).toBeDefined();
    expect(amazVariant!.itemTypes.sort()).toEqual(['amazonBows', 'amazonJavelins', 'amazonSpears'].sort());
  });

  it('keeps class-specific weapon variants distinct from their base type', () => {
    const auricShieldOnly = magicAffixesData.filter((a: { itemTypes: string[] }) =>
      a.itemTypes.includes('paladinShields') && !a.itemTypes.includes('shields')
    );
    // A Paladin-Shield-only restriction should NOT also claim the generic "shields" slug
    // unless the affix separately also restricts to the base shie code.
    expect(auricShieldOnly.length).toBeGreaterThan(0);
  });

  it('resolves charm sizes into three distinct slugs', () => {
    const categories = new Set(magicAffixesData.flatMap((a: { itemTypes: string[] }) => a.itemTypes));
    expect(categories.has('smallCharms')).toBe(true);
    expect(categories.has('largeCharms')).toBe(true);
    expect(categories.has('grandCharms')).toBe(true);
    expect(categories.has('charms')).toBe(false);
  });

  it('leaves bar as the only unresolved generic code', () => {
    const categories = new Set(magicAffixesData.flatMap((a: { itemTypes: string[] }) => a.itemTypes));
    const stillGeneric = ['amaz', 'armo', 'blun', 'h2h', 'mele', 'miss', 'rod', 'shld', 'staff', 'thro', 'weap']
      .filter(code => categories.has(code));
    expect(stillGeneric).toEqual([]);
    expect(categories.has('bar')).toBe(true);
  });
});
```

(The "of Slow Missiles" test case has already been independently verified against
`vendor/d2data/json/magicsuffix.json` — it's suffix id 476, `itype1: 'amaz'`, `frequency:
1` — confirmed directly during plan-writing, not a placeholder assumption.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "ancestor-closure"`
Expected: FAIL — current `itemTypesForAffix` doesn't expand anything.

- [ ] **Step 3: Implement the ancestor-closure resolver**

In `scripts/generate-grail-data.mjs`, load `itemtypes.json` near the other vendor loads:

```js
const itemTypesData = JSON.parse(readFileSync(join(VENDOR, 'itemtypes.json'), 'utf8'));
```

Add the resolver and the leaf-slug map:

```js
// The real, final Magic/Rare category slugs this project shows, and the raw D2 item-type
// code each one is rooted at. Distinct from TYPE_TO_SLOT (used by uniques/sets/bases,
// which intentionally stays coarser) — this map is granular on purpose, splitting
// class-specific and size-specific variants that TYPE_TO_SLOT collapses.
const MAGIC_LEAF_SLUGS = {
  helm: 'helms', circ: 'circlets', phlm: 'barbarianHelms', pelt: 'druidHelms',
  tors: 'armors',
  shie: 'shields', ashd: 'paladinShields', head: 'shrunkenHeads',
  belt: 'belts', boot: 'boots', glov: 'gloves',
  ring: 'rings', amul: 'amulets',
  scha: 'smallCharms', mcha: 'largeCharms', lcha: 'grandCharms',
  jewl: 'jewels',
  swor: 'swords', knif: 'daggers', axe: 'axes', pole: 'polearms',
  spea: 'spears', aspe: 'amazonSpears',
  club: 'clubs', mace: 'maces', hamm: 'hammers',
  scep: 'scepters', staf: 'staves', orb: 'orbs', wand: 'wands',
  grim: 'grimoires', h2h: 'assassinKatars',
  bow: 'bows', abow: 'amazonBows', xbow: 'crossbows',
  jave: 'javelins', ajav: 'amazonJavelins',
  taxe: 'throwingAxes', tkni: 'throwingKnives',
};

// Ancestor closure: for each leaf raw code above, walk itemtypes.json's Equiv1/Equiv2
// parent-links upward until no further parent exists, collecting every code reached
// along the way (including the leaf's own code). An affix restricted to any one of
// these ancestor codes (leaf-specific OR an abstract supertype like "weap"/"armo") is
// considered to apply to that leaf category — this is how a bare "weap"-restricted
// affix ends up expanded onto every real weapon category, matching d2r.world's actual
// per-category affix listings instead of one generic "Weapons" bucket.
function ancestorsOf(rawCode) {
  const seen = new Set([rawCode]);
  let frontier = [rawCode];
  while (frontier.length > 0) {
    const next = [];
    for (const code of frontier) {
      const entry = itemTypesData[code];
      for (const parent of [entry?.Equiv1, entry?.Equiv2]) {
        if (parent && !seen.has(parent)) {
          seen.add(parent);
          next.push(parent);
        }
      }
    }
    frontier = next;
  }
  return seen;
}

const LEAF_ANCESTORS = Object.fromEntries(
  Object.entries(MAGIC_LEAF_SLUGS).map(([rawCode, slug]) => [slug, ancestorsOf(rawCode)])
);

function expandItypeToSlugs(rawItype) {
  const slugs = [];
  for (const [slug, ancestors] of Object.entries(LEAF_ANCESTORS)) {
    if (ancestors.has(rawItype)) slugs.push(slug);
  }
  return slugs;
}
```

Replace `itemTypesForAffix`'s body (currently `TYPE_TO_SLOT[itype] ?? itype` per raw
`itype{n}` field) with the expansion:

```js
function itemTypesForAffix(entry) {
  const slugs = new Set();
  for (let n = 1; n <= 7; n++) {
    const itype = entry[`itype${n}`];
    if (!itype) continue;
    const expanded = expandItypeToSlugs(itype);
    if (expanded.length > 0) {
      for (const s of expanded) slugs.add(s);
    } else {
      // No leaf category's ancestor set reaches this code (e.g. "bar", a bare class
      // restriction never expressed via itype at all in practice, or any other
      // genuinely unmapped code) — fall back to the raw code itself, matching this
      // project's established "don't guess, surface the gap" convention.
      slugs.add(itype);
    }
  }
  return Array.from(slugs);
}
```

(This is a drop-in replacement for the existing function of the same name — do not
duplicate, replace it entirely. The existing class-based fallback for `bar`
class-only-restricted affixes, added in an earlier plan, stays as-is elsewhere in this
same function or its caller — locate it via `entry.class` in the current code and keep it
unchanged, per this plan's explicit non-goal.)

- [ ] **Step 4: Regenerate and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "ancestor-closure"
```
Expected: PASS (5 tests). If the "of Slow Missiles" name/file assertion needed correcting
in Step 1 after checking the real vendored data, use the corrected value here.

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/magic-affixes.json data/grail-data.test.ts
git commit -m "Replace flat Magic/Rare category mapping with itemtypes.json ancestor-closure expansion"
```

---

### Task 4: i18n labels + category icons for new granular slugs

**Files:**
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`
- Modify: `scripts/generate-grail-data.mjs` (category-icons section)
- Test: `data/grail-data.test.ts`, `src/components/items/CategoryCardGrid.test.tsx`

**Interfaces:**
- Extends: `data/category-icons.json` with entries for the newly-introduced slugs where
  a natural representative base item exists.

- [ ] **Step 1: Determine which new slugs need new `AffixCategories` keys**

The newly-introduced slugs from Task 3 are: `circlets`, `barbarianHelms`, `druidHelms`,
`paladinShields`, `shrunkenHeads`, `smallCharms`, `largeCharms`, `grandCharms`,
`amazonSpears`, `amazonBows`, `amazonJavelins`, `assassinKatars`, `throwingAxes`,
`throwingKnives`. Of these, check `messages/en.json`'s existing `Grail` namespace for a
`slot_*` key already covering some (e.g. `slot_katars` likely already exists from the
Unique/Set Items work — `CategoryCardGrid`'s `labelFor` tries `Grail.slot_${category}`
first) — only add an `AffixCategories` key for slugs that don't already resolve via the
`Grail` namespace fallback. Run the site's existing `labelFor` logic mentally (or check
`messages/en.json` directly) for each of the 14 before deciding which need new keys.

- [ ] **Step 2: Remove now-dead `AffixCategories` keys, add new ones**

In `messages/en.json`'s `AffixCategories` namespace, remove the keys for codes that no
longer appear in any affix's `itemTypes` after Task 3 (per that task's "leaves bar as the
only unresolved generic code" test — everything except `bar` should be removable:
`amaz`, `armo`, `blun`, `h2h`, `mele`, `miss`, `rod`, `shld`, `staff`, `thro`, `weap`).
Add new keys for whichever slugs Step 1 determined need one, e.g.:

```json
    "circlets": "Circlets",
    "barbarianHelms": "Barbarian Helms",
    "druidHelms": "Druid Helms",
    "paladinShields": "Paladin Shields",
    "shrunkenHeads": "Shrunken Heads",
    "smallCharms": "Small Charms",
    "largeCharms": "Large Charms",
    "grandCharms": "Grand Charms",
    "amazonSpears": "Amazon Spears",
    "amazonBows": "Amazon Bows",
    "amazonJavelins": "Amazon Javelins",
    "throwingAxes": "Throwing Axes",
    "throwingKnives": "Throwing Knives"
```

(Omit any key from this list that Step 1 found already resolves via the `Grail`
namespace's `slot_*` keys — do not create a duplicate key for something already covered.)

Add matching hand-authored zh-TW entries to `messages/zh-TW.json`'s `AffixCategories`
namespace, then run `node scripts/translate-nav-items-ui-zh-cn.mjs` to derive
`messages/zh-CN.json`.

- [ ] **Step 3: Extend `data/category-icons.json` generation for the new slugs**

In `scripts/generate-grail-data.mjs`'s category-icons section (from the prior
Category-Grid Icons plan), the existing loop iterates `SLOT_ORDER` (28 entries) — add a
second small loop for the new Magic/Rare-only slugs, using the same
representative-base-item-lookup pattern:

```js
// Every code below independently verified against vendor/d2data/json/items.json during
// plan-writing (type, name, invfile, and on-disk PNG presence all confirmed) — not
// guessed. Note amazonSpears/amazonBows/amazonJavelins reuse item codes am3/am1/am5
// (Maiden Spear/Stag Bow/Maiden Javelin) rather than the raw type codes themselves
// (aspe/abow/ajav are D2 item TYPES, not individual item codes with their own invfile).
const MAGIC_ONLY_CATEGORY_ICON_CODES = {
  circlets: 'ci0', barbarianHelms: 'ba1', druidHelms: 'dr1',
  paladinShields: 'pa1', shrunkenHeads: 'ne1',
  smallCharms: 'cm1', largeCharms: 'cm2', grandCharms: 'cm3',
  amazonSpears: 'am3', amazonBows: 'am1', amazonJavelins: 'am5',
  throwingAxes: 'tax', throwingKnives: 'tkf', assassinKatars: 'ktr',
};

for (const [slug, code] of Object.entries(MAGIC_ONLY_CATEGORY_ICON_CODES)) {
  const item = items[code];
  if (!item || !item.invfile) throw new Error(`No invfile found for magic-only category "${slug}" (code "${code}")`);
  const iconPath = join(__dirname, '..', 'public', 'items', 'inv', `${item.invfile}.png`);
  if (!existsSync(iconPath)) throw new Error(`Icon file missing for magic-only category "${slug}": ${item.invfile}.png`);
  categoryIconsOut[slug] = item.invfile;
}
```

All item codes above were independently verified against `vendor/d2data/json/items.json`
during plan-writing (correct `type`, real `invfile`, PNG present on disk) — no further
research needed for this step.

- [ ] **Step 4: Add tests, regenerate, verify, and commit**

Add a test to `data/grail-data.test.ts` confirming each new slug used in
`data/magic-affixes.json` has a corresponding entry in `data/category-icons.json` (or is
one of the pre-existing 28 `SLOT_ORDER` slugs already covered).

```bash
npm run generate:grail
npx tsc --noEmit && npm run lint && npm test
```
Expected: all clean.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json scripts/generate-grail-data.mjs data/category-icons.json data/grail-data.test.ts
git commit -m "Add i18n labels and category icons for new granular Magic/Rare categories"
```

---

### Task 5: Full verification + d2r.world spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-category-taxonomy-fix-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual + d2r.world spot-check**

Serve the static export locally. Check:
- `/en/items/base/helms` and `/en/items/base/shields` — confirm the sub-tabs render
  (All, Circlets, Barbarian Helms, Druid Helms for Helms; All, Paladin Shields, Shrunken
  Heads for Shields) and filtering works, matching d2r.world's tab labels and filtered
  content for at least one item per tab.
- `/en/items/magic` — confirm the new granular tiles appear (Barbarian Helms, Druid
  Helms, Circlets, Paladin Shields, Shrunken Heads, Amazon Spears/Bows/Javelins,
  Assassin Katars, Throwing Axes/Knives, Grand/Large/Small Charms) and that `bar`
  (Barbarian Items) is the only remaining generic tile.
- Click into a couple of the new tiles (e.g. Amazon Spears) and confirm the affix list
  matches d2r.world's real content for that category, including both class-specific
  affixes and any expanded supertype-restricted ones (a "weap"-restricted affix should
  appear here too — already confirmed during plan-writing that `spea`'s real ancestor
  chain is `spea → sppl → mele → weap`, so any affix restricted to `weap`, `mele`, or
  `sppl` correctly reaches `amazonSpears` via `aspe`'s own chain `aspe → spea → sppl →
  mele → weap` plus the separate `aspe → amaz` branch).
- Check at both desktop and mobile widths via `resize_window`.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project (see
`docs/superpowers/specs/2026-07-15-runes-cube-crafted-magic-rare-verification.md` for the
established structure). Commit it.
