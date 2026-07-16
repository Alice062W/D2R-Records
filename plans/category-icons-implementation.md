# Category-Grid Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a representative item icon on each category tile in `CategoryCardGrid`
(currently plain text), for all 28 canonical `SLOT_ORDER` categories and the 25 matching
Magic/Rare Items category slugs — the 12 generic/class-fallback Magic/Rare slugs
(`armo`, `bar`, `blun`, `h2h`, `mele`, `miss`, `rod`, `shld`, `staff`, `thro`, `weap`,
`amaz`) get no icon in this pass (separate taxonomy fix planned later).

**Architecture:** Generate `data/category-icons.json` (slug → `invFile`) from
`data/bases-full.json` + `vendor/d2data/json/items.json`, with a small explicit map for 5
categories with no graded base entry. `CategoryCardGrid.tsx` looks up this map per tile
and renders an icon when present, falling back to today's text-only tile when absent.

**Tech Stack:** Node.js generator script, Next.js/React, Tailwind CSS 4, Vitest.

## Global Constraints

- `data/category-icons.json` has exactly 28 entries (the `SLOT_ORDER` slugs) — no entry
  for any of the 12 generic Magic/Rare slugs.
- Every `invFile` value in the generated file must have a corresponding PNG in
  `public/items/inv/`, verified at generation time (throw if not).
- `CategoryCardGrid` renders identically to today (text-only) for any category slug not
  present in the map — no new prop, no breaking change to its existing
  `categories`/`basePath` interface.
- Reuse the existing icon-rendering conventions already established in
  `ItemStatCard.tsx`/`GrailItemDetail.tsx` (`object-contain`, `onError` state fallback,
  `alt=""`, `aria-hidden="true"`) — do not invent a new pattern.

---

### Task 1: Generate `data/category-icons.json`

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:**
- Produces: `data/category-icons.json` — `{ [slug: string]: string }`, 28 entries, each
  value an `invFile` (no `.png` extension, matching the existing `invFile` field
  convention on `GrailItem`).

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
import categoryIcons from './category-icons.json';
import { SLOT_ORDER } from '@/lib/grail/catalog';
import { existsSync } from 'fs';
import { join } from 'path';

describe('category-icons.json', () => {
  it('has exactly one entry per SLOT_ORDER category', () => {
    expect(Object.keys(categoryIcons).sort()).toEqual([...SLOT_ORDER].sort());
  });

  it('every invFile has a matching PNG in public/items/inv/', () => {
    for (const [category, invFile] of Object.entries(categoryIcons)) {
      const path = join(process.cwd(), 'public', 'items', 'inv', `${invFile}.png`);
      expect(existsSync(path), `missing icon for category "${category}": ${invFile}.png`).toBe(true);
    }
  });

  it('resolves the expected representative icon for a sample of categories', () => {
    expect(categoryIcons.axes).toBe('invhax');
    expect(categoryIcons.rings).toBe('invrin');
    expect(categoryIcons.amulets).toBe('invamu');
    expect(categoryIcons.charms).toBe('invchm');
    expect(categoryIcons.katars).toBe('invktr');
    expect(categoryIcons.jewels).toBe('invgswe');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "category-icons.json"`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the generator addition**

In `scripts/generate-grail-data.mjs`, add (after the `bases-full.json` write, since it
depends on `basesFullOut`):

```js
// A small number of SLOT_ORDER categories have no graded (normal/exceptional/elite)
// entry in bases-full.json at all (rings/amulets/charms/jewels aren't tiered gear), and
// katars need a different lookup (their D2 item *type* code is "h2h", which collides
// with Assassin claims' generic type used elsewhere) — resolved via this explicit map
// of { slotCategory: representative item code } instead of the bases-full.json lookup
// used for every other category.
const CATEGORY_ICON_CODE_OVERRIDES = {
  rings: 'rin',
  amulets: 'amu',
  charms: 'cm1', // Small Charm — representative of the charms category
  jewels: 'jew',
  katars: 'ktr',
};

const categoryIconsOut = {};
for (const category of SLOT_ORDER) {
  let code = CATEGORY_ICON_CODE_OVERRIDES[category];
  if (!code) {
    const rep = basesFullOut.find(b => b.slotCategory === category);
    if (!rep) throw new Error(`No representative base item found for category "${category}"`);
    code = rep.id.replace('base-', '');
  }
  const item = items[code];
  if (!item || !item.invfile) throw new Error(`No invfile found for category "${category}" (code "${code}")`);
  const iconPath = join(__dirname, '..', 'public', 'items', 'inv', `${item.invfile}.png`);
  if (!existsSync(iconPath)) throw new Error(`Icon file missing for category "${category}": ${item.invfile}.png`);
  categoryIconsOut[category] = item.invfile;
}

writeFileSync(join(OUT, 'category-icons.json'), JSON.stringify(categoryIconsOut, null, 2));
console.log(`Wrote ${Object.keys(categoryIconsOut).length} category icons -> data/category-icons.json`);
```

This generator is a plain `.mjs` script and cannot import the TypeScript `SLOT_ORDER`
export directly — declare a local copy matching it exactly (this mirrors how the script
already duplicates other catalog-adjacent constants like `TYPE_TO_SLOT` rather than
importing them from `src/`):

```js
const SLOT_ORDER = [
  'helms', 'armors', 'shields', 'belts', 'boots', 'gloves',
  'rings', 'amulets', 'charms', 'jewels',
  'swords', 'daggers', 'axes', 'polearms', 'spears',
  'clubs', 'maces', 'hammers', 'scepters', 'staves',
  'orbs', 'wands', 'grimoires', 'katars',
  'bows', 'crossbows', 'javelins', 'throwings',
];
```

Also add `existsSync` to the existing `import { readFileSync, writeFileSync } from
'node:fs';` line at the top of the script (change to `import { readFileSync,
writeFileSync, existsSync } from 'node:fs';`) — it is not currently imported.

- [ ] **Step 4: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "category-icons.json"
```
Expected: PASS (3 tests).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, including all pre-existing tests still passing.

```bash
git add scripts/generate-grail-data.mjs data/category-icons.json data/grail-data.test.ts
git commit -m "Generate data/category-icons.json (representative icon per SLOT_ORDER category)"
```

---

### Task 2: Render icons in `CategoryCardGrid`

**Files:**
- Modify: `src/components/items/CategoryCardGrid.tsx`
- Test: `src/components/items/CategoryCardGrid.test.tsx`

**Interfaces:**
- Consumes: `data/category-icons.json` (Task 1).

- [ ] **Step 1: Write the failing tests**

Add to `src/components/items/CategoryCardGrid.test.tsx` (inside the existing `describe`
block):

```tsx
  it('renders an icon for a category present in the icon map', () => {
    renderGrid(['helms']);
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('renders no icon for a category absent from the icon map', () => {
    renderGrid(['bar']);
    expect(document.querySelector('img')).toBeNull();
  });
```

- [ ] **Step 2: Run tests to verify the first one fails**

Run: `npx vitest run src/components/items/CategoryCardGrid.test.tsx`
Expected: FAIL on the first new test (no `<img>` rendered today); second new test passes
trivially (matches the "renders no icon" case already, since `bar` genuinely has no
mapping).

- [ ] **Step 3: Implement the icon rendering**

Change `src/components/items/CategoryCardGrid.tsx` to a client component (needs
`useState` for the `onError` fallback, matching the existing icon-component pattern):

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import categoryIcons from '../../../data/category-icons.json';

function CategoryIcon({ category }: { category: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  const invFile = (categoryIcons as Record<string, string>)[category];
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-12 h-12 object-contain shrink-0"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function CategoryCardGrid({
  categories,
  basePath,
}: {
  categories: string[];
  basePath: string;
}) {
  const tGrail = useTranslations('Grail');
  const tAffix = useTranslations('AffixCategories');

  function labelFor(category: string) {
    const grailKey = `slot_${category}`;
    return tGrail.has(grailKey) ? tGrail(grailKey) : tAffix(category);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
      {categories.map(category => (
        <Link
          key={category}
          href={`${basePath}/${category}`}
          className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300 transition-colors"
        >
          <CategoryIcon category={category} />
          {labelFor(category)}
        </Link>
      ))}
    </div>
  );
}
```

(Note the layout changes from `flex items-center` (horizontal) to `flex flex-col
items-center` (vertical, icon-above-label) to accommodate the icon — this is a
presentational change within the same component, not a new prop or interface change.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/items/CategoryCardGrid.test.tsx`
Expected: PASS (5 tests: 3 existing + 2 new).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add src/components/items/CategoryCardGrid.tsx src/components/items/CategoryCardGrid.test.tsx
git commit -m "Render category icons in CategoryCardGrid"
```

---

### Task 3: Browser verification

**Files:** none (verification only)

- [ ] **Step 1: Build and manually verify**

Run: `npm run build`, serve the static export locally. Check:
- `/en/items/unique` (or `/items/base`, `/items/set`) — all 28 category tiles show an
  icon.
- `/en/items/magic` — the 25 matching tiles show an icon; the 12 generic tiles (e.g.
  navigate to confirm `bar`, `armo`, `shld` specifically) show no icon, matching today's
  text-only appearance.
- Check at both desktop (~1280px) and mobile (~375px) widths via `resize_window` — icons
  should not look disproportionate or break the grid layout.

- [ ] **Step 2: No commit needed if verification is clean**

If manual verification surfaces no issues, this task requires no further commit — Tasks
1-2's commits already cover the full change.
