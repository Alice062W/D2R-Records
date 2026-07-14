# Unique/Set Items Category Card Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sidebar-based Unique Items / Set Items pages with d2r.world's real
two-step flow: a card-grid landing page per kind, then a real per-category page with
grade-tab filtering — retiring the components built for the old sidebar layout.

**Architecture:** A new `getCategoriesForKind` catalog helper drives both the landing
page's card grid and each new dynamic route's `generateStaticParams`, so they can never
drift apart. `ItemBrowser`/`ItemCategoryGrid` (sidebar-era components) are deleted;
`CategoryCardGrid` (landing page) and `CategoryItemList` (category page, carrying the
existing grade-tab logic) replace them. `ItemStatCard` is unchanged and reused.

**Tech Stack:** Next.js 16 (App Router, static export, dynamic segments), next-intl 4.x,
Tailwind CSS 4, Vitest + `@testing-library/react`.

## Global Constraints

- Every new page follows the existing pattern: `generateStaticParams` returning every
  valid `{locale, category}` pair, `await params`, `setRequestLocale(locale)`, then
  `getTranslations(...)` — see `src/app/[locale]/grail/page.tsx` for the reference shape.
- Category cards are text-only — no icon assets exist for this project (a documented,
  accepted gap from the earlier Grail Item Reference work). Do not add placeholder icons,
  emoji, or Unicode glyphs.
- Generic item/stat vocabulary (`slot_*`, `grade_*`, `itemStats`, `magicProperties`, etc.)
  continues to be reused from the existing `Grail` message namespace — this was a
  deliberate decision in the prior nav-shell plan and still applies; do not duplicate
  these keys into `Items`.
- zh-CN for any **new** message key is derived from the hand-authored zh-TW value via the
  existing `scripts/translate-nav-items-ui-zh-cn.mjs` script (it already iterates all of
  `zh-TW.json`'s `Items` namespace generically — re-running it after adding a new `Items`
  key picks it up with no script changes needed).
- The Grail Tracker (`src/components/grail/*`, `src/lib/grail/findsApi.ts`,
  `src/lib/grail/bestCopy.ts`, `GrailCategorySidebar.tsx`, `GrailChecklist.tsx`) is not
  modified anywhere in this plan.
- Dark theme Tailwind classes match the existing palette: `bg-zinc-900`/`border-zinc-700`
  card surfaces (matching `ItemStatCard`'s existing card styling), `bg-amber-500`/
  `text-amber-300` accents, `text-zinc-100`/`text-zinc-400`/`text-zinc-500` text.
- Locale-prefixed links use plain `next/link` with a manually-built `/${locale}/...`
  href, consistent with `src/components/Footer.tsx` and `src/components/nav/SiteNavDrawer.tsx`.
- `SLOT_ORDER` (from `src/lib/grail/catalog.ts`) remains the single source of truth for
  category ordering — do not redefine or reorder it.

---

### Task 1: `getCategoriesForKind` catalog helper

**Files:**
- Modify: `src/lib/grail/catalog.ts`
- Test: `data/grail-data.test.ts` (add to the existing file — it already covers
  catalog-shape assertions; no new test file needed for a single small helper)

**Interfaces:**
- Produces: `getCategoriesForKind(kind: 'unique' | 'set'): (typeof SLOT_ORDER)[number][]`
  — consumed by Tasks 3 and 5.

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts` (append a new `describe` block; the file already imports
`getAllGrailItems`, `SLOT_ORDER`, etc. from `@/lib/grail/catalog` — add
`getCategoriesForKind` to that existing import):

```ts
describe('getCategoriesForKind', () => {
  it('returns all 28 SLOT_ORDER categories for uniques', () => {
    expect(getCategoriesForKind('unique')).toEqual([...SLOT_ORDER]);
  });

  it('returns a strict subset for sets, excluding categories with no set items', () => {
    const setCategories = getCategoriesForKind('set');
    expect(setCategories.length).toBeLessThan(SLOT_ORDER.length);
    expect(setCategories).toContain('boots');
    expect(setCategories).not.toContain('charms');
  });

  it('preserves SLOT_ORDER ordering', () => {
    const setCategories = getCategoriesForKind('set');
    const expectedOrder = SLOT_ORDER.filter(s => setCategories.includes(s));
    expect(setCategories).toEqual(expectedOrder);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "getCategoriesForKind"`
Expected: FAIL — `getCategoriesForKind is not a function` (or similar import error).

- [ ] **Step 3: Implement the helper**

In `src/lib/grail/catalog.ts`, add after the existing `sortItemsForDisplay` function:

```ts
export function getCategoriesForKind(kind: 'unique' | 'set'): (typeof SLOT_ORDER)[number][] {
  const items = ALL_ITEMS.filter(i => i.kind === kind);
  return SLOT_ORDER.filter(slot => items.some(i => i.slotCategory === slot));
}
```

(`ALL_ITEMS` is the module-level constant already defined earlier in this file — reuse
it directly rather than calling `getAllGrailItems()`, since this is internal to the same
module.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run data/grail-data.test.ts -t "getCategoriesForKind"`
Expected: PASS (3 tests).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add src/lib/grail/catalog.ts data/grail-data.test.ts
git commit -m "Add getCategoriesForKind catalog helper"
```

---

### Task 2: `backToCategories` message key

**Files:**
- Modify: `messages/en.json`, `messages/zh-TW.json`
- Test: `messages/nav-items-messages.test.ts` (extend the existing `Items` key-parity
  tests — they already iterate `Object.keys(en.Items)` generically, so adding the new key
  to `en.json`/`zh-TW.json` is covered by the existing assertions with no test-file
  changes needed; this step just re-runs that existing suite to confirm)

**Interfaces:**
- Produces: `Items.backToCategories` message key in all 3 locales, consumed by Task 4's
  `CategoryItemList`.

- [ ] **Step 1: Add the key to `messages/en.json`**

In the `Items` namespace (after `setPageSubtitle`):

```json
    "setPageSubtitle": "Browse every set item in Diablo II: Resurrected.",
    "backToCategories": "← Back to categories"
```

- [ ] **Step 2: Add the hand-authored zh-TW value to `messages/zh-TW.json`**

In the same position:

```json
    "setPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的套裝物品。",
    "backToCategories": "← 返回分類"
```

- [ ] **Step 3: Re-run the zh-CN derivation script**

Run: `node scripts/translate-nav-items-ui-zh-cn.mjs`
Expected output: `Converted Nav + Items namespaces to zh-CN.` This overwrites
`messages/zh-CN.json`'s entire `Nav`+`Items` namespaces from the current `zh-TW.json` —
confirm with `git diff messages/zh-CN.json` that only the new `backToCategories` key
changed (added) and no other existing `Nav`/`Items` values differ from before running it
(they shouldn't, since this script is idempotent for unchanged source values).

- [ ] **Step 4: Run the existing message tests to verify they pass**

Run: `npx vitest run messages/nav-items-messages.test.ts`
Expected: PASS (still 4 tests — the existing key-parity assertions now include
`backToCategories` automatically since they iterate `Object.keys` generically).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json
git commit -m "Add Items.backToCategories message key (en/zh-TW hand-authored, zh-CN via OpenCC)"
```

---

### Task 3: `CategoryCardGrid` component

**Files:**
- Create: `src/components/items/CategoryCardGrid.tsx`
- Create: `src/components/items/CategoryCardGrid.test.tsx`

**Interfaces:**
- Consumes: `Grail` namespace (`slot_*` keys) via `useTranslations('Grail')`.
- Produces: `CategoryCardGrid` (props: `categories: string[]`, `basePath: string`) —
  consumed by Task 5's landing pages.

- [ ] **Step 1: Write the failing test**

Create `src/components/items/CategoryCardGrid.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CategoryCardGrid from './CategoryCardGrid';
import messages from '../../../messages/en.json';

function renderGrid(categories: string[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CategoryCardGrid categories={categories} basePath="/en/items/unique" />
    </NextIntlClientProvider>
  );
}

describe('CategoryCardGrid', () => {
  it('renders one card link per category with the correct href', () => {
    renderGrid(['helms', 'axes']);
    expect(screen.getByRole('link', { name: 'Helms' })).toHaveAttribute(
      'href',
      '/en/items/unique/helms'
    );
    expect(screen.getByRole('link', { name: 'Axes' })).toHaveAttribute(
      'href',
      '/en/items/unique/axes'
    );
  });

  it('renders no cards for an empty category list', () => {
    renderGrid([]);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/items/CategoryCardGrid.test.tsx`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Implement `CategoryCardGrid`**

Create `src/components/items/CategoryCardGrid.tsx`:

```tsx
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function CategoryCardGrid({
  categories,
  basePath,
}: {
  categories: string[];
  basePath: string;
}) {
  const t = useTranslations('Grail');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
      {categories.map(category => (
        <Link
          key={category}
          href={`${basePath}/${category}`}
          className="flex items-center justify-center px-4 py-6 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300 transition-colors"
        >
          {t(`slot_${category}`)}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/items/CategoryCardGrid.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add src/components/items/CategoryCardGrid.tsx src/components/items/CategoryCardGrid.test.tsx
git commit -m "Add CategoryCardGrid component for item-kind landing pages"
```

---

### Task 4: `CategoryItemList` component

**Files:**
- Create: `src/components/items/CategoryItemList.tsx`
- Create: `src/components/items/CategoryItemList.test.tsx`

**Interfaces:**
- Consumes: `GrailItem[]` (already filtered to one category — the caller's job, not this
  component's), `Grail` namespace (`grade_*`) via `useTranslations('Grail')`,
  `ItemStatCard` from the existing `src/components/items/ItemStatCard.tsx` (unchanged).
- Produces: `CategoryItemList` (props: `items: GrailItem[]`) — consumed by Task 5's
  category detail pages. This carries `ItemBrowser`'s existing grade-tab-filtering logic,
  minus the category-switching sidebar (the category is now fixed per-page by the route).

- [ ] **Step 1: Write the failing test**

Create `src/components/items/CategoryItemList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CategoryItemList from './CategoryItemList';
import { getAllGrailItems, localizeGrailItem, sortItemsForDisplay } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

function itemsFor(kind: 'unique' | 'set', category: string) {
  return sortItemsForDisplay(
    getAllGrailItems()
      .filter(i => i.kind === kind && i.slotCategory === category)
      .map(i => localizeGrailItem(i, 'en'))
  );
}

function renderList(items: ReturnType<typeof itemsFor>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CategoryItemList items={items} />
    </NextIntlClientProvider>
  );
}

describe('CategoryItemList', () => {
  it('shows grade tabs and filters when a category spans multiple grades', () => {
    renderList(itemsFor('unique', 'axes'));
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exceptional' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elite' })).toBeInTheDocument();

    expect(screen.getByText('The Gnasher')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Elite' }));
    expect(screen.queryByText('The Gnasher')).not.toBeInTheDocument();
  });

  it('hides grade tabs for a single-grade category', () => {
    renderList(itemsFor('unique', 'jewels'));
    expect(screen.queryByRole('button', { name: 'Normal' })).not.toBeInTheDocument();
  });

  it('renders all items for the category with no filtering by default', () => {
    const items = itemsFor('unique', 'rings');
    renderList(items);
    expect(screen.getByText('Nagelring')).toBeInTheDocument();
    expect(screen.getByText('Manald Heal')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/items/CategoryItemList.test.tsx`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Implement `CategoryItemList`**

Create `src/components/items/CategoryItemList.tsx` (the grade-tab-filtering portion of
the retiring `ItemBrowser.tsx`, minus category state — `items` is already scoped to one
category by the caller):

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import ItemStatCard from './ItemStatCard';

const GRADES = ['normal', 'exceptional', 'elite'] as const;

export default function CategoryItemList({ items }: { items: GrailItem[] }) {
  const t = useTranslations('Grail');
  const [activeGrade, setActiveGrade] = useState<GrailItem['grade'] | null>(null);

  const gradesPresent = GRADES.filter(g => items.some(i => i.grade === g));
  const activeItems = activeGrade ? items.filter(i => i.grade === activeGrade) : items;

  return (
    <div className="flex flex-col gap-6 w-full">
      {gradesPresent.length > 1 && (
        <div className="flex gap-2">
          {gradesPresent.map(grade => (
            <button
              key={grade}
              onClick={() => setActiveGrade(g => (g === grade ? null : grade))}
              aria-pressed={activeGrade === grade}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeGrade === grade
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {t(`grade_${grade}`)}
            </button>
          ))}
        </div>
      )}
      {activeItems.map(item => <ItemStatCard key={item.id} item={item} />)}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/items/CategoryItemList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add src/components/items/CategoryItemList.tsx src/components/items/CategoryItemList.test.tsx
git commit -m "Add CategoryItemList component carrying grade-tab filtering for one category"
```

---

### Task 5: New routes, updated landing pages, retire old components, full verification

**Files:**
- Create: `src/app/[locale]/items/unique/[category]/page.tsx`
- Create: `src/app/[locale]/items/set/[category]/page.tsx`
- Modify: `src/app/[locale]/items/unique/page.tsx`
- Modify: `src/app/[locale]/items/set/page.tsx`
- Delete: `src/components/items/ItemBrowser.tsx`, `src/components/items/ItemBrowser.test.tsx`
- Delete: `src/components/items/ItemCategoryGrid.tsx`, `src/components/items/ItemCategoryGrid.test.tsx`
- Create: `docs/superpowers/specs/2026-07-14-unique-set-category-pages-verification.md`

**Interfaces:**
- Consumes: `getCategoriesForKind` (Task 1), `Items.backToCategories` (Task 2),
  `CategoryCardGrid` (Task 3), `CategoryItemList` (Task 4), and the existing
  `getAllGrailItems`/`localizeGrailItem`/`sortItemsForDisplay` from `catalog.ts`.
- Produces: the final, real content this whole plan builds toward.

- [ ] **Step 1: Update the landing pages**

Modify `src/app/[locale]/items/unique/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCategoriesForKind } from '@/lib/grail/catalog';
import CategoryCardGrid from '@/components/items/CategoryCardGrid';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function UniqueItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');
  const categories = getCategoriesForKind('unique');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('uniquePageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('uniquePageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <CategoryCardGrid categories={categories} basePath={`/${locale}/items/unique`} />
      </div>
    </main>
  );
}
```

Modify `src/app/[locale]/items/set/page.tsx` identically, with `kind='set'` /
`setPageTitle`/`setPageSubtitle`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCategoriesForKind } from '@/lib/grail/catalog';
import CategoryCardGrid from '@/components/items/CategoryCardGrid';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function SetItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');
  const categories = getCategoriesForKind('set');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('setPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('setPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <CategoryCardGrid categories={categories} basePath={`/${locale}/items/set`} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create the unique category detail route**

Create `src/app/[locale]/items/unique/[category]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  getAllGrailItems,
  getCategoriesForKind,
  localizeGrailItem,
  sortItemsForDisplay,
} from '@/lib/grail/catalog';
import CategoryItemList from '@/components/items/CategoryItemList';

export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    getCategoriesForKind('unique').map(category => ({ locale, category }))
  );
}

export default async function UniqueCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!getCategoriesForKind('unique').includes(category as ReturnType<typeof getCategoriesForKind>[number])) {
    notFound();
  }

  const t = await getTranslations('Items');
  const tGrail = await getTranslations('Grail');

  const items = sortItemsForDisplay(
    getAllGrailItems()
      .filter(i => i.kind === 'unique' && i.slotCategory === category)
      .map(i => localizeGrailItem(i, locale as 'en' | 'zh-TW' | 'zh-CN'))
  );

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('uniquePageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('uniquePageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">{tGrail(`slot_${category}`)}</h2>
          <Link href={`/${locale}/items/unique`} className="text-sm text-zinc-400 hover:text-amber-300 transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <CategoryItemList items={items} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create the set category detail route**

Create `src/app/[locale]/items/set/[category]/page.tsx`, identical shape with
`kind: 'set'`, `getCategoriesForKind('set')`, `setPageTitle`/`setPageSubtitle`, and the
back link pointing at `/${locale}/items/set`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  getAllGrailItems,
  getCategoriesForKind,
  localizeGrailItem,
  sortItemsForDisplay,
} from '@/lib/grail/catalog';
import CategoryItemList from '@/components/items/CategoryItemList';

export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    getCategoriesForKind('set').map(category => ({ locale, category }))
  );
}

export default async function SetCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!getCategoriesForKind('set').includes(category as ReturnType<typeof getCategoriesForKind>[number])) {
    notFound();
  }

  const t = await getTranslations('Items');
  const tGrail = await getTranslations('Grail');

  const items = sortItemsForDisplay(
    getAllGrailItems()
      .filter(i => i.kind === 'set' && i.slotCategory === category)
      .map(i => localizeGrailItem(i, locale as 'en' | 'zh-TW' | 'zh-CN'))
  );

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('setPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('setPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">{tGrail(`slot_${category}`)}</h2>
          <Link href={`/${locale}/items/set`} className="text-sm text-zinc-400 hover:text-amber-300 transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <CategoryItemList items={items} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Delete the retired components**

```bash
git rm src/components/items/ItemBrowser.tsx src/components/items/ItemBrowser.test.tsx
git rm src/components/items/ItemCategoryGrid.tsx src/components/items/ItemCategoryGrid.test.tsx
```

- [ ] **Step 5: Full automated verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm the build's route listing shows
`/[locale]/items/unique/[category]` and `/[locale]/items/set/[category]` each generating
`28 locales × categories` (uniques: 28 categories × 3 locales = 84 pages; sets: however
many `getCategoriesForKind('set')` returns × 3 locales).

Directly inspect built content for a couple of pages (not just existence), consistent
with this project's established verification practice:

```bash
grep -o '<h2[^<]*</h2>' out/en/items/unique/axes/index.html
grep -o '<h2[^<]*</h2>' out/zh-TW/items/set/boots/index.html
```

Expected: `<h2>Axes</h2>` and the correct zh-TW translation for "Boots".

- [ ] **Step 6: Manual browser verification + d2r.world spot-check**

Start the dev server **from this feature's actual worktree** (verify with `pwd` first,
per the lesson from prior plans in this project where testing against the wrong
checkout produced a false alarm). Navigate to `/en/items/unique`, click a category card,
confirm it navigates to `/en/items/unique/<category>` and shows the item list with
working grade tabs and a working "back to categories" link. Repeat for `/en/items/set`.
Check `/zh-TW/items/unique` and `/zh-CN/items/unique` render correctly. Confirm
`/en/items/set/charms` 404s (no set charms exist). Spot-check 2-3 categories per kind
against d2r.world's own category pages.

Write findings to
`docs/superpowers/specs/2026-07-14-unique-set-category-pages-verification.md`, following
the format of `docs/superpowers/specs/2026-07-14-d2rworld-nav-verification.md`.

- [ ] **Step 7: Commit**

```bash
git add src/app/\[locale\]/items/unique src/app/\[locale\]/items/set docs/superpowers/specs/2026-07-14-unique-set-category-pages-verification.md
git commit -m "Add unique/set category detail routes, update landing pages, retire sidebar components"
```
