# Item Inventory Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render real item inventory icons on every Unique/Set item card and detail view,
using the 623 `inv*.png` files already self-extracted (from the user's own owned D2R
install) and pushed to the `add-item-icons` branch.

**Architecture:** Merge the already-extracted PNGs into this feature's branch first, then
add a small `<img>` element to the two shared components that render every unique/set item
(`ItemStatCard.tsx`, `GrailItemDetail.tsx`), sourced from `item.invFile`, with a
render-time `onError` fallback to today's no-icon layout. No other components change.

**Tech Stack:** Next.js 16 (static export, `output: 'export'`), React, Vitest +
`@testing-library/react`, plain `<img>` (no `next/image`, consistent with the static-export
constraint).

## Global Constraints

- Icons render ONLY on `ItemStatCard.tsx` and `GrailItemDetail.tsx` — no other component
  (category-grid landing pages, Base Items, Runewords, Cube Recipes, Crafted Items,
  Magic/Rare Items) gets icons in this plan.
- An item with an empty `invFile` renders no `<img>` at all (matches today's behavior,
  covered by the existing `ItemStatCard.test.tsx` empty-`invFile` fixture).
- An `<img>` that fails to load (`onError`) must fall back to the same no-icon layout, not
  a broken-image glyph.
- `alt=""` and `aria-hidden` on every icon `<img>` (decorative; the adjacent name text
  already conveys the same information).
- Icon path convention: `/items/inv/${item.invFile}.png`.
- `public/items/inv/README.md` must be rewritten to document the real provenance
  (self-extracted from the user's own D2R install) in place of the prior "ships empty, no
  source found" narrative.

---

### Task 1: Merge extracted icons into this branch

**Files:**
- Create: `public/items/inv/*.png` (623 files, from `origin/add-item-icons`)
- Modify: `public/items/inv/README.md`

**Interfaces:**
- Produces: 623 PNG files at `public/items/inv/<invFile>.png`, matching every `invFile`
  value used by `data/uniques.json`/`data/sets.json`.

- [ ] **Step 1: Merge the `add-item-icons` branch**

```bash
git fetch origin add-item-icons
git merge origin/add-item-icons --no-edit
```

Expected: fast-forward or clean merge adding 623 new `.png` files under
`public/items/inv/` plus the existing `public/items/inv/README.md` (unchanged by the merge
itself — that file predates the icon branch).

- [ ] **Step 2: Verify file count and coverage**

```bash
ls public/items/inv/*.png | wc -l
```
Expected: `623`.

```bash
node -e "
const fs = require('fs');
const uniques = JSON.parse(fs.readFileSync('data/uniques.json'));
const sets = JSON.parse(fs.readFileSync('data/sets.json'));
const need = new Set();
for (const i of [...uniques, ...sets]) if (i.invFile) need.add(i.invFile.toLowerCase());
const have = new Set(
  fs.readdirSync('public/items/inv')
    .filter(f => f.endsWith('.png'))
    .map(f => f.slice(0, -4).toLowerCase())
);
let missing = 0;
for (const n of need) if (!have.has(n)) { console.log('MISSING:', n); missing++; }
console.log('needed:', need.size, 'missing:', missing);
"
```
Expected: `needed: 213 missing: 0`.

- [ ] **Step 3: Rewrite `public/items/inv/README.md`**

Replace its entire contents with:

```markdown
# Item inventory icons

**Status: populated.** 623 PNG icons, self-extracted by the site owner from their own
legally-owned Diablo II: Resurrected install (CascView to pull `.dc6` files from
`data\global\items\`, then `dc6png` to convert them to PNG using the game's own palette —
see `docs/icon-extraction-instructions.md` for the full extraction steps). These are
Diablo II game art © Blizzard Entertainment, used here as personal, non-commercial fan
content, the same basis every D2 fan database's icons ultimately rest on — not covered by
this repository's open-source licensing.

Confirmed 100% coverage: every one of the 213 distinct `invFile` values referenced across
`data/uniques.json`/`data/sets.json` has a matching PNG here.

Filenames match the game's `invFile` key exactly (e.g. `invhaxu.png` for The Gnasher's base
item, Hand Axe). `ItemStatCard.tsx` and `GrailItemDetail.tsx` render these at
`/items/inv/<invFile>.png` and gracefully fall back to no icon (not a broken-image glyph)
if a file is ever missing for a future catalog addition.

## Prior history

This directory previously shipped empty — no redistributable pre-extracted icon source
could be found anywhere on GitHub or elsewhere (bulk-scraping fan sites or another
project's extracted-asset dump was ruled out as equivalent to finding no source at all).
See git history on this file for the full search log if useful context for future
extraction/licensing questions.
```

- [ ] **Step 4: Commit**

```bash
git add public/items/inv/README.md
git commit -m "Document real icon provenance now that 623 PNGs are populated"
```

(The 623 PNG files themselves are already committed via the merge in Step 1 — this commit
only updates the README.)

---

### Task 2: Render icons in `ItemStatCard`

**Files:**
- Modify: `src/components/items/ItemStatCard.tsx`
- Test: `src/components/items/ItemStatCard.test.tsx`

**Interfaces:**
- Consumes: `GrailItem.invFile: string` (already defined in `src/lib/grail/catalog.ts`).

- [ ] **Step 1: Write the failing tests**

Add to `src/components/items/ItemStatCard.test.tsx` (inside the existing `describe`
block, as two new `it`s):

```tsx
  it('renders an icon when invFile is present', () => {
    const item: GrailItem = {
      id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
      levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: 28, invFile: 'invhaxu',
      stats: [], fixedStats: [], setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/items/inv/invhaxu.png');
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('renders no icon when invFile is empty', () => {
    const item: GrailItem = {
      id: 'unique-1', code: 'y', name: 'Bare Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'helms',
      defense: { min: 10, max: 12 }, requiredStrength: 20, durability: 40,
      invFile: '', stats: [], fixedStats: [], setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(document.querySelector('img')).toBeNull();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/items/ItemStatCard.test.tsx`
Expected: FAIL — no `<img>` is rendered currently, so the first new test fails (the second
already passes trivially, since no icon exists yet at all).

- [ ] **Step 3: Implement the icon rendering**

In `src/components/items/ItemStatCard.tsx`, change to a client component (icon needs
`onError` state) and add the image:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';

// Authentic D2 item-rarity text colors (verified against d2r.world's computed styles).
const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-[#cbb87f]',
  set: 'text-[#22ff55]',
};

export default function ItemStatCard({ item }: { item: GrailItem }) {
  const t = useTranslations('Grail');
  const [iconFailed, setIconFailed] = useState(false);

  const itemStatRows: [string, string][] = [
    [t('baseLabel'), item.baseName],
    [t('gradeLabel'), t(`grade_${item.grade}`)],
    ...(item.defense ? [[t('defenseLabel'), `${item.defense.min}–${item.defense.max}`] as [string, string]] : []),
    [t('requiredLevel'), String(item.levelReq)],
    ...(item.requiredStrength != null ? [[t('requiredStrength'), String(item.requiredStrength)] as [string, string]] : []),
    ...(item.durability != null ? [[t('durabilityLabel'), String(item.durability)] as [string, string]] : []),
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
      <div className="mb-1 flex items-start gap-3">
        {item.invFile && !iconFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/items/inv/${item.invFile}.png`}
            alt=""
            aria-hidden="true"
            className="w-10 h-10 object-contain shrink-0"
            onError={() => setIconFailed(true)}
          />
        )}
        <div>
          <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
          {item.setName && <p className="text-xs text-[#22ff55]">{item.setName}</p>}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('itemStats')}</h4>
        <div className="text-sm text-zinc-300 flex flex-col gap-0.5">
          {itemStatRows.map(([label, value]) => (
            <div key={label}>{label}: <span className="text-zinc-100">{value}</span></div>
          ))}
        </div>
      </div>

      {(item.stats.length > 0 || item.fixedStats.length > 0) && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('magicProperties')}</h4>
          <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
            {item.stats.map(stat => (
              <div key={stat.key}>{stat.label}: {stat.min}–{stat.max}</div>
            ))}
            {item.fixedStats.map(f => (
              <div key={f.key}>{f.label}: {f.value}</div>
            ))}
          </div>
        </div>
      )}

      {item.setBonuses.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('setBonusesLabel')}</h4>
          <div className="text-sm text-[#22ff55] flex flex-col gap-0.5">
            {item.setBonuses.map((b, i) => (
              <div key={`${b.key}-${i}`}>{b.label}: {b.min === b.max ? b.min : `${b.min}–${b.max}`}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/items/ItemStatCard.test.tsx`
Expected: PASS (4 tests: 2 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/items/ItemStatCard.tsx src/components/items/ItemStatCard.test.tsx
git commit -m "Render item inventory icons in ItemStatCard"
```

---

### Task 3: Render icons in `GrailItemDetail`

**Files:**
- Modify: `src/components/grail/GrailItemDetail.tsx`
- Create: `src/components/grail/GrailItemDetail.test.tsx` (no test file currently exists
  for this component)

**Interfaces:**
- Consumes: `GrailItem.invFile: string`, same as Task 2.

- [ ] **Step 1: Write the failing test**

Create `src/components/grail/GrailItemDetail.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import GrailItemDetail from './GrailItemDetail';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

const baseItem: GrailItem = {
  id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
  levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
  defense: null, requiredStrength: null, durability: 28, invFile: 'invhaxu',
  stats: [], fixedStats: [], setBonuses: [], statPriority: [],
};

describe('GrailItemDetail', () => {
  it('renders name and stats', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GrailItemDetail item={baseItem} finds={[]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'The Gnasher' })).toBeInTheDocument();
  });

  it('renders an icon when invFile is present', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GrailItemDetail item={baseItem} finds={[]} />
      </NextIntlClientProvider>
    );
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/items/inv/invhaxu.png');
  });

  it('renders no icon when invFile is empty', () => {
    const item: GrailItem = { ...baseItem, invFile: '' };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GrailItemDetail item={item} finds={[]} />
      </NextIntlClientProvider>
    );
    expect(document.querySelector('img')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/grail/GrailItemDetail.test.tsx`
Expected: FAIL — the icon tests fail (no `<img>` rendered yet); the first test may pass
trivially since the heading already renders today.

- [ ] **Step 3: Implement the icon rendering**

In `src/components/grail/GrailItemDetail.tsx`, this file is already `'use client'` — add
the `useState` import and icon rendering:

```tsx
// src/components/grail/GrailItemDetail.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { sortFindsByRank } from '@/lib/grail/bestCopy';

// Authentic D2 item-rarity text colors (verified against d2r.world's computed styles).
const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-[#cbb87f]',
  set: 'text-[#22ff55]',
};

export default function GrailItemDetail({
  item,
  finds,
}: {
  item: GrailItem;
  finds: FindRecord[];
}) {
  const t = useTranslations('Grail');
  const sorted = sortFindsByRank(finds, item.statPriority);
  const [iconFailed, setIconFailed] = useState(false);

  const itemStatRows: [string, string][] = [
    [t('baseLabel'), item.baseName],
    [t('gradeLabel'), t(`grade_${item.grade}`)],
    ...(item.defense ? [[t('defenseLabel'), `${item.defense.min}–${item.defense.max}`] as [string, string]] : []),
    [t('requiredLevel'), String(item.levelReq)],
    ...(item.requiredStrength != null ? [[t('requiredStrength'), String(item.requiredStrength)] as [string, string]] : []),
    ...(item.durability != null ? [[t('durabilityLabel'), String(item.durability)] as [string, string]] : []),
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
      <div className="mb-1 flex items-start gap-3">
        {item.invFile && !iconFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/items/inv/${item.invFile}.png`}
            alt=""
            aria-hidden="true"
            className="w-10 h-10 object-contain shrink-0"
            onError={() => setIconFailed(true)}
          />
        )}
        <div>
          <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
          <p className="text-xs text-zinc-400">{item.baseName}</p>
          {item.setName && <p className="text-xs text-[#22ff55]">{item.setName}</p>}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('itemStats')}</h4>
        <div className="text-sm text-zinc-300 flex flex-col gap-0.5">
          {itemStatRows.map(([label, value]) => (
            <div key={label}>{label}: <span className="text-zinc-100">{value}</span></div>
          ))}
        </div>
      </div>

      {(item.stats.length > 0 || item.fixedStats.length > 0) && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('magicProperties')}</h4>
          <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
            {item.stats.map(stat => (
              <div key={stat.key}>{stat.label}: {stat.min}–{stat.max}</div>
            ))}
            {item.fixedStats.map(f => (
              <div key={f.key}>{f.label}: {f.value}</div>
            ))}
          </div>
        </div>
      )}

      {item.setBonuses.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('setBonusesLabel')}</h4>
          <div className="text-sm text-[#22ff55] flex flex-col gap-0.5">
            {item.setBonuses.map((b, i) => (
              <div key={`${b.key}-${i}`}>{b.label}: {b.min === b.max ? b.min : `${b.min}–${b.max}`}</div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">{t('yourCopies')}</h4>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-600 italic">{t('notFoundYet')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((find, i) => (
              <div key={find.id} className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                  <span>{i === 0 ? t('bestCopy') : t('copyNumber', { number: i + 1 })}</span>
                  <span>{find.foundAt}{find.ethereal ? ` · ${t('ethereal')}` : ''}</span>
                </div>
                {item.stats.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {item.stats.map(stat => (
                      <div key={stat.key} className="text-zinc-300">
                        {stat.label}: <span className="font-semibold">{find.statValues[stat.key] ?? '—'}</span>
                        <span className="text-zinc-600 text-xs"> ({stat.min}–{stat.max})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 italic">{t('noVariableStats')}</p>
                )}
                {(find.foundAct || find.foundArea) && (
                  <p className="text-xs text-zinc-500 mt-2">
                    {[find.foundAct, find.foundArea].filter(Boolean).join(' · ')}
                  </p>
                )}
                {find.notes && <p className="text-xs text-zinc-500 mt-1 italic">{find.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/grail/GrailItemDetail.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/grail/GrailItemDetail.tsx src/components/grail/GrailItemDetail.test.tsx
git commit -m "Render item inventory icons in GrailItemDetail"
```

---

### Task 4: Full verification + browser spot-check

**Files:** none (verification only)

- [ ] **Step 1: Run full automated verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. `npm run lint` may need the `@next/next/no-img-element` rule
suppression added in Tasks 2-3 to actually take effect — confirm 0 errors (the
pre-existing unrelated `RunewordList.test.tsx` warning is fine).

- [ ] **Step 2: Manual browser verification**

Start the dev server, navigate to a Unique Items category page (e.g. `/en/items/unique/axes`)
and confirm "The Gnasher" (or any real item) shows its icon next to its name. Navigate to
the Grail Tracker (`/en/grail`), open an item's detail view, and confirm the same icon
renders there. Confirm no console errors (broken image 404s) for any rendered icon.

- [ ] **Step 3: Commit if any fixes were needed, otherwise done**

If manual verification surfaces no issues, this task requires no commit — Tasks 1-3's
commits already cover the full change.
