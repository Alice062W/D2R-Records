# Set Items Taxonomy Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the missing "browse by full Set name" view to Set Items (34 sets, each
showing its pieces plus set-level partial and full-set bonuses), and combine the 13
separate weapon-type categories into one "Weapons" tile for the secondary
category-browsing view — both confirmed gaps against d2r.world's real Set Items page.

**Architecture:** Vendor a new file (`vendor/d2data/json/sets.json`, D2's real
set-level-bonus data, distinct from the already-vendored `setitems.json` which only has
per-item bonuses). Generate `data/set-groups.json` from it. Make the by-name list the
default `/items/set` page; move today's category grid to a secondary route with weapons
combined.

**Tech Stack:** Node.js generator script, Next.js/React, Tailwind CSS 4, Vitest.

## Global Constraints

- `data/set-groups.json` has exactly 34 entries (one per set with at least one
  spawnable piece in `data/sets.json` — "Warlord's Glory" is confirmed to have zero
  spawnable pieces and is correctly excluded, matching this project's established
  spawnable-only convention everywhere else).
- Any `state`-coded full-set-bonus entry (`FCode{n}: 'state'`, a cosmetic
  "full set active" flag, confirmed present on 7 of 35 vendored sets) must be filtered
  out of the displayed bonus list — it is not a real stat.
- `data/sets.json`'s existing per-item structure is untouched — `data/set-groups.json`
  is a new, additive file.
- No change to Unique Items or Base Items category structure (both keep their current
  per-weapon-type split).

---

### Task 1: Vendor `sets.json` and generate `data/set-groups.json`

**Files:**
- Create: `vendor/d2data/json/sets.json`
- Modify: `vendor/d2data/README.md`, `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:**
- Produces: `data/set-groups.json` — array of `{ setName: LocalizedText, pieceIds:
  string[], partialBonuses: { piecesRequired: number; stats: RawGrailStat[] }[],
  fullSetBonuses: RawGrailStat[] }`, 34 entries.

- [ ] **Step 1: Vendor the file**

```bash
curl -s "https://raw.githubusercontent.com/blizzhackers/d2data/477bcf63e964f39f4c774e588a79fd598ae472de/json/sets.json" \
  -o vendor/d2data/json/sets.json
```

Verify:
```bash
node -e "
const s = require('./vendor/d2data/json/sets.json');
console.log('entries:', Object.keys(s).length);
"
```
Expected: `entries: 35`.

Add to `vendor/d2data/README.md`:
```markdown

`sets.json` provides set-LEVEL bonus data (distinct from `setitems.json`, which only has
each individual item's own per-piece partial bonus): the set-wide partial bonuses
unlocked at 2/3/4/5 pieces worn (`PCode{n}a`/`PMin{n}a`/`PMax{n}a`) and the full-set
bonus unlocked when every piece is worn (`FCode1-8`/`FMin{n}`/`FMax{n}`), keyed by set
name. Used for the Set Items "browse by full Set name" reference page.
```

- [ ] **Step 2: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
import setGroupsData from './set-groups.json';

describe('set-groups.json', () => {
  it('has exactly 34 entries (Warlord\'s Glory has zero spawnable pieces, correctly excluded)', () => {
    expect(setGroupsData.length).toBe(34);
    expect(setGroupsData.some((g: { setName: { en: string } }) => g.setName.en === "Warlord's Glory")).toBe(false);
  });

  it('every entry has at least one piece id that exists in sets.json', () => {
    const setIds = new Set(sets.map((s: { id: string }) => s.id));
    for (const group of setGroupsData) {
      expect(group.pieceIds.length).toBeGreaterThan(0);
      for (const id of group.pieceIds) expect(setIds.has(id)).toBe(true);
    }
  });

  it("resolves Aldur's Watchtower's full-set bonus correctly", () => {
    const aldur = setGroupsData.find((g: { setName: { en: string } }) => g.setName.en === "Aldur's Watchtower")!;
    const byKey = Object.fromEntries(aldur.fullSetBonuses.map((b: { key: string; min: number; max: number }) => [b.key, b]));
    expect(byKey['res-all']).toMatchObject({ min: 50, max: 50 });
    expect(byKey['dru']).toMatchObject({ min: 3, max: 3 });
    expect(byKey['ac']).toMatchObject({ min: 150, max: 150 });
    expect(byKey['manasteal']).toMatchObject({ min: 10, max: 10 });
    expect(byKey['mana']).toMatchObject({ min: 150, max: 150 });
    expect(byKey['dmg%']).toMatchObject({ min: 350, max: 350 });
    // The "state"/"fullsetgeneric" cosmetic flag must not leak into the bonus list.
    expect(aldur.fullSetBonuses.some((b: { key: string }) => b.key === 'state')).toBe(false);
  });

  it("resolves Aldur's Watchtower's partial bonuses (2/3/4-piece tiers)", () => {
    const aldur = setGroupsData.find((g: { setName: { en: string } }) => g.setName.en === "Aldur's Watchtower")!;
    expect(aldur.partialBonuses.map((p: { piecesRequired: number }) => p.piecesRequired)).toEqual([2, 3, 4]);
    expect(aldur.partialBonuses[0].stats[0]).toMatchObject({ key: 'att%', min: 150, max: 150 });
    expect(aldur.partialBonuses[1].stats[0]).toMatchObject({ key: 'mag%', min: 50, max: 50 });
    expect(aldur.partialBonuses[2].stats[0]).toMatchObject({ key: 'lifesteal', min: 10, max: 10 });
  });
});
```

- [ ] **Step 2b: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "set-groups.json"`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the generator addition**

In `scripts/generate-grail-data.mjs`, add (after the existing `setsOut` generation, since
it depends on `setsOut` for `pieceIds`):

```js
const setsFullData = JSON.parse(readFileSync(join(VENDOR, 'sets.json'), 'utf8'));

// The set-level partial-bonus fields are PCode{n}a/PMin{n}a/PMax{n}a where {n} IS the
// piece-count tier itself (2,3,4,5), not a sequential 1..N counter — so this doesn't fit
// the usual extractProps-style `{prefix}{n}` loop pattern and gets a direct per-tier
// extraction instead.
const setGroupsOut = Object.values(setsFullData)
  .map(v => {
    const pieceIds = setsOut.filter(s => s.setName.en === v.name).map(s => s.id);
    if (pieceIds.length === 0) return null; // e.g. Warlord's Glory: zero spawnable pieces

    const partialBonuses = [2, 3, 4, 5].flatMap(n => {
      const rawCode = v[`PCode${n}a`];
      if (!rawCode) return [];
      const code = CODE_ALIASES[rawCode] ?? rawCode;
      const par = v[`PParam${n}a`];
      const isSkillRef = SKILL_REF_PROPS.has(code);
      const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
      const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
      const key = needsKeySuffix ? `${code}:${par}` : code;
      const min = v[`PMin${n}a`];
      const max = v[`PMax${n}a`];
      if (min === undefined || max === undefined) return [];
      return [{ piecesRequired: n, stats: [{ key, label, min, max }] }];
    });

    const fullSetBonuses = [];
    for (let n = 1; n <= 8; n++) {
      const rawCode = v[`FCode${n}`];
      if (!rawCode || rawCode === 'state') continue;
      const code = CODE_ALIASES[rawCode] ?? rawCode;
      const par = v[`FParam${n}`];
      const isSkillRef = SKILL_REF_PROPS.has(code);
      const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
      const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
      const key = needsKeySuffix ? `${code}:${par}` : code;
      const min = v[`FMin${n}`];
      const max = v[`FMax${n}`];
      if (min === undefined || max === undefined) continue;
      fullSetBonuses.push({ key, label, min, max });
    }

    return {
      setName: localizedItemName(v.name),
      pieceIds,
      partialBonuses,
      fullSetBonuses,
    };
  })
  .filter(Boolean);

writeFileSync(join(OUT, 'set-groups.json'), JSON.stringify(setGroupsOut, null, 2));
console.log(`Wrote ${setGroupsOut.length} set groups -> data/set-groups.json`);
```

- [ ] **Step 4: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "set-groups.json"
```
Expected: PASS (4 tests).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, including all pre-existing tests still passing.

```bash
git add vendor/d2data/json/sets.json vendor/d2data/README.md scripts/generate-grail-data.mjs data/set-groups.json data/grail-data.test.ts
git commit -m "Vendor sets.json and generate data/set-groups.json"
```

---

### Task 2: Set Items browse-by-name pages

**Files:**
- Create: `src/components/items/SetGroupList.tsx`, `src/components/items/SetGroupList.test.tsx`
- Create: `src/components/items/SetGroupDetail.tsx`, `src/components/items/SetGroupDetail.test.tsx`
- Modify: `src/app/[locale]/items/set/page.tsx` (currently the category grid)
- Create: `src/app/[locale]/items/set/[setSlug]/page.tsx`
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Consumes: `data/set-groups.json` (Task 1), `getAllGrailItems`/`localizeGrailItem` from
  `src/lib/grail/catalog.ts` (existing, used to resolve each `pieceId` to a full,
  localized `GrailItem` for rendering with the existing `ItemStatCard`).
- Produces: a URL-safe slug per set (e.g. slugify `setName.en`) used for the dynamic
  route — since `data/set-groups.json` doesn't have an explicit slug field, derive one
  consistently in both the list page and the detail page (e.g. lowercase, replace
  non-alphanumeric runs with `-`) — implement this as a small shared helper (e.g.
  `slugifySetName` in `src/lib/grail/catalog.ts` or a new small util file) rather than
  duplicating the logic in two places.

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace:
```json
    "setGroupsPageTitle": "Set Items",
    "setGroupsPageSubtitle": "Browse every set in Diablo II: Resurrected.",
    "setPartialBonusLabel": "Partial Set Bonus",
    "setFullBonusLabel": "Full Set Bonus",
    "setPiecesRequiredLabel": "pieces",
    "browseByCategory": "Browse by category instead"
```

Add hand-authored zh-TW:
```json
    "setGroupsPageTitle": "套裝物品",
    "setGroupsPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的套裝。",
    "setPartialBonusLabel": "部分套裝加成",
    "setFullBonusLabel": "全套裝加成",
    "setPiecesRequiredLabel": "件",
    "browseByCategory": "改用分類瀏覽"
```

Run `node scripts/translate-nav-items-ui-zh-cn.mjs` to derive zh-CN.

- [ ] **Step 2: Write the failing tests**

Create `src/components/items/SetGroupList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SetGroupList from './SetGroupList';
import messages from '../../../messages/en.json';

describe('SetGroupList', () => {
  it('renders one link per set group with the correct href', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupList
          groups={[{ slug: 'aldurs-watchtower', name: "Aldur's Watchtower" }]}
          basePath="/en/items/set"
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('link', { name: "Aldur's Watchtower" })).toHaveAttribute(
      'href',
      '/en/items/set/aldurs-watchtower'
    );
  });
});
```

Create `src/components/items/SetGroupDetail.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SetGroupDetail from './SetGroupDetail';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

describe('SetGroupDetail', () => {
  it('renders every piece plus partial and full-set bonuses', () => {
    const piece: GrailItem = {
      id: 'set-1', code: 'xxx', name: "Aldur's Advance", kind: 'set', setName: "Aldur's Watchtower",
      levelReq: 45, baseName: 'Battle Boots', grade: 'exceptional', slotCategory: 'boots',
      defense: null, requiredStrength: 95, durability: 18, invFile: '',
      stats: [], fixedStats: [], setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupDetail
          setName="Aldur's Watchtower"
          pieces={[piece]}
          partialBonuses={[{ piecesRequired: 2, stats: [{ key: 'att%', label: 'Attack Rating %', min: 150, max: 150 }] }]}
          fullSetBonuses={[{ key: 'res-all', label: 'All Resistances', min: 50, max: 50 }]}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: "Aldur's Advance" })).toBeInTheDocument();
    expect(screen.getByText(/Attack Rating %: 150/)).toBeInTheDocument();
    expect(screen.getByText(/All Resistances: 50/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/components/items/SetGroupList.test.tsx src/components/items/SetGroupDetail.test.tsx`
Expected: FAIL — modules don't exist.

- [ ] **Step 4: Implement `slugifySetName`**

In `src/lib/grail/catalog.ts`, add:

```ts
export function slugifySetName(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 5: Implement `SetGroupList`**

Create `src/components/items/SetGroupList.tsx`:

```tsx
import Link from 'next/link';

export default function SetGroupList({
  groups,
  basePath,
}: {
  groups: { slug: string; name: string }[];
  basePath: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {groups.map(g => (
        <Link
          key={g.slug}
          href={`${basePath}/${g.slug}`}
          className="flex items-center px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-[#22ff55] font-semibold hover:border-amber-400 transition-colors"
        >
          {g.name}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Implement `SetGroupDetail`**

Create `src/components/items/SetGroupDetail.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import ItemStatCard from './ItemStatCard';
import type { GrailItem, RawGrailStat } from '@/lib/grail/catalog';

export default function SetGroupDetail({
  setName,
  pieces,
  partialBonuses,
  fullSetBonuses,
}: {
  setName: string;
  pieces: GrailItem[];
  partialBonuses: { piecesRequired: number; stats: RawGrailStat[] }[];
  fullSetBonuses: RawGrailStat[];
}) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-2xl font-bold text-[#22ff55]">{setName}</h2>

      <div className="flex flex-col gap-4">
        {pieces.map(piece => <ItemStatCard key={piece.id} item={piece} />)}
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-3">{t('setPartialBonusLabel')}</h3>
        <div className="flex flex-col gap-2">
          {partialBonuses.map(p => (
            <div key={p.piecesRequired} className="text-sm">
              <span className="text-zinc-500">{p.piecesRequired} {t('setPiecesRequiredLabel')}: </span>
              <span className="text-[#22ff55]">
                {p.stats.map(s => `${s.label}: ${s.min === s.max ? s.min : `${s.min}–${s.max}`}`).join(', ')}
              </span>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mt-5 mb-3">{t('setFullBonusLabel')}</h3>
        <div className="flex flex-col gap-1 text-sm text-[#22ff55]">
          {fullSetBonuses.map(s => (
            <div key={s.key}>{s.label}: {s.min === s.max ? s.min : `${s.min}–${s.max}`}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/components/items/SetGroupList.test.tsx src/components/items/SetGroupDetail.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 8: Wire the pages**

Modify `src/app/[locale]/items/set/page.tsx` to render `SetGroupList` (replacing
`CategoryCardGrid`) with a link to the category-browsing view (Task 3's new route):

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import setGroups from '../../../../../data/set-groups.json';
import { slugifySetName } from '@/lib/grail/catalog';
import SetGroupList from '@/components/items/SetGroupList';

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
  const groups = setGroups.map(g => ({ slug: slugifySetName(g.setName.en), name: g.setName[locale as 'en' | 'zh-TW' | 'zh-CN'] }));

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('setGroupsPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('setGroupsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-end">
          <Link href={`/${locale}/items/set/category`} className="text-sm text-zinc-400 hover:text-amber-300 transition-colors">
            {t('browseByCategory')}
          </Link>
        </div>
        <SetGroupList groups={groups} basePath={`/${locale}/items/set`} />
      </div>
    </main>
  );
}
```

Create `src/app/[locale]/items/set/[setSlug]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import setGroups from '../../../../../../data/set-groups.json';
import { getAllGrailItems, localizeGrailItem, slugifySetName } from '@/lib/grail/catalog';
import SetGroupDetail from '@/components/items/SetGroupDetail';

export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    setGroups.map(g => ({ locale, setSlug: slugifySetName(g.setName.en) }))
  );
}

export default async function SetGroupPage({
  params,
}: {
  params: Promise<{ locale: string; setSlug: string }>;
}) {
  const { locale, setSlug } = await params;
  setRequestLocale(locale);

  const group = setGroups.find(g => slugifySetName(g.setName.en) === setSlug);
  if (!group) notFound();

  const t = await getTranslations('Items');
  const loc = locale as 'en' | 'zh-TW' | 'zh-CN';
  const pieces = getAllGrailItems()
    .filter(i => group.pieceIds.includes(i.id))
    .map(i => localizeGrailItem(i, loc));
  const partialBonuses = group.partialBonuses.map(p => ({
    piecesRequired: p.piecesRequired,
    stats: p.stats.map(s => ({ key: s.key, label: s.label[loc], min: s.min, max: s.max })),
  }));
  const fullSetBonuses = group.fullSetBonuses.map(s => ({ key: s.key, label: s.label[loc], min: s.min, max: s.max }));

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <Link href={`/${locale}/items/set`} className="text-sm text-zinc-400 hover:text-amber-300 transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <SetGroupDetail
          setName={group.setName[loc]}
          pieces={pieces}
          partialBonuses={partialBonuses}
          fullSetBonuses={fullSetBonuses}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 9: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/lib/grail/catalog.ts src/components/items/SetGroupList.tsx src/components/items/SetGroupList.test.tsx src/components/items/SetGroupDetail.tsx src/components/items/SetGroupDetail.test.tsx "src/app/[locale]/items/set/page.tsx" "src/app/[locale]/items/set/[setSlug]/page.tsx"
git commit -m "Add Set Items browse-by-name pages"
```

---

### Task 3: Combine weapon categories into one "Weapons" tile (secondary category view)

**Files:**
- Modify: `src/lib/grail/catalog.ts` (`getCategoriesForKind`)
- Create: `src/app/[locale]/items/set/category/page.tsx` (moved from `src/app/[locale]/items/set/page.tsx`, now the secondary view)
- Create: `src/app/[locale]/items/set/category/[category]/page.tsx` (moved from `src/app/[locale]/items/set/[category]/page.tsx` — note the route path changed since `[setSlug]` now owns the old `/set/[category]` path)
- Delete: `src/app/[locale]/items/set/[category]/page.tsx` (superseded by the new nested route)
- Test: `src/lib/grail/catalog.test.ts` (create if it doesn't already exist — check first)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Modifies: `getCategoriesForKind('set')` now returns `'weapons'` in place of the 13
  individual weapon-type slugs (and `'grimoires'`, per the design's note that d2r.world
  folds Grimoires into Weapons for Sets specifically) whenever any Set item exists in
  one of those categories. `getCategoriesForKind('unique')` is UNCHANGED (still returns
  the individual weapon-type slugs).

- [ ] **Step 1: Write the failing test**

Check whether `src/lib/grail/catalog.test.ts` already exists; if not, create it. Add:

```ts
import { describe, it, expect } from 'vitest';
import { getCategoriesForKind } from './catalog';

describe('getCategoriesForKind', () => {
  it("combines all weapon-type categories (plus grimoires) into 'weapons' for sets only", () => {
    const setCats = getCategoriesForKind('set');
    expect(setCats).toContain('weapons');
    for (const weaponCat of ['swords', 'daggers', 'axes', 'polearms', 'spears', 'clubs', 'maces', 'hammers', 'scepters', 'staves', 'orbs', 'wands', 'katars', 'grimoires']) {
      expect(setCats).not.toContain(weaponCat);
    }
  });

  it('keeps individual weapon-type categories for uniques (unchanged)', () => {
    const uniqueCats = getCategoriesForKind('unique');
    expect(uniqueCats).toContain('swords');
    expect(uniqueCats).toContain('axes');
    expect(uniqueCats).not.toContain('weapons');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/catalog.test.ts`
Expected: FAIL — `set` categories still contains individual weapon slugs, not `weapons`.

- [ ] **Step 3: Implement the change**

In `src/lib/grail/catalog.ts`, modify `getCategoriesForKind`:

```ts
const WEAPON_SLOTS_FOR_SET_COMBINATION = new Set([
  'swords', 'daggers', 'axes', 'polearms', 'spears',
  'clubs', 'maces', 'hammers', 'scepters', 'staves',
  'orbs', 'wands', 'katars', 'grimoires',
]);

export function getCategoriesForKind(kind: 'unique' | 'set'): string[] {
  const items = ALL_ITEMS.filter(i => i.kind === kind);
  const populated = SLOT_ORDER.filter(slot => items.some(i => i.slotCategory === slot));
  if (kind !== 'set') return populated;

  const hasWeapon = populated.some(slot => WEAPON_SLOTS_FOR_SET_COMBINATION.has(slot));
  const nonWeapon = populated.filter(slot => !WEAPON_SLOTS_FOR_SET_COMBINATION.has(slot));
  return hasWeapon ? ['weapons', ...nonWeapon] : nonWeapon;
}

export function getItemsForSetWeaponsCategory(): typeof ALL_ITEMS {
  return ALL_ITEMS.filter(i => i.kind === 'set' && WEAPON_SLOTS_FOR_SET_COMBINATION.has(i.slotCategory));
}
```

(The return type change from `(typeof SLOT_ORDER)[number][]` to `string[]` is necessary
since `'weapons'` isn't a member of `SLOT_ORDER` — check every existing caller of
`getCategoriesForKind` across the codebase, e.g. `CategoryCardGrid` usages and the
`generateStaticParams` functions in the base/unique/set pages, and update any type
annotation that assumed the old return type, e.g. `category as
ReturnType<typeof getCategoriesForKind>[number]` patterns already used in existing page
files — these should still work with the widened `string[]` return type but verify with
`tsc` rather than assuming.)

Add `Grail.slot_weapons` translation key to `messages/en.json` (and hand-authored
zh-TW, zh-CN derived):
```json
    "slot_weapons": "Weapons"
```
zh-TW:
```json
    "slot_weapons": "武器"
```

- [ ] **Step 4: Move the category pages to the new nested route**

Move `src/app/[locale]/items/set/page.tsx`'s CURRENT content (the category grid, before
Task 2 replaced it) is already gone — instead, create
`src/app/[locale]/items/set/category/page.tsx` with the same category-grid content Task
2's modified `set/page.tsx` replaced, i.e.:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCategoriesForKind } from '@/lib/grail/catalog';
import CategoryCardGrid from '@/components/items/CategoryCardGrid';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function SetCategoryLandingPage({
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
        <CategoryCardGrid categories={categories} basePath={`/${locale}/items/set/category`} />
      </div>
    </main>
  );
}
```

Move `src/app/[locale]/items/set/[category]/page.tsx`'s content to
`src/app/[locale]/items/set/category/[category]/page.tsx`, updating its item-filtering
logic to special-case `'weapons'`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  getAllGrailItems,
  getCategoriesForKind,
  getItemsForSetWeaponsCategory,
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

  if (!getCategoriesForKind('set').includes(category)) {
    notFound();
  }

  const t = await getTranslations('Items');
  const tGrail = await getTranslations('Grail');
  const loc = locale as 'en' | 'zh-TW' | 'zh-CN';

  const rawItems = category === 'weapons'
    ? getItemsForSetWeaponsCategory()
    : getAllGrailItems().filter(i => i.kind === 'set' && i.slotCategory === category);
  const items = sortItemsForDisplay(rawItems.map(i => localizeGrailItem(i, loc)));

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('setPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('setPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">{tGrail(`slot_${category}`)}</h2>
          <Link href={`/${locale}/items/set/category`} className="text-sm text-zinc-400 hover:text-amber-300 transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <CategoryItemList items={items} />
      </div>
    </main>
  );
}
```

Delete the old `src/app/[locale]/items/set/[category]/page.tsx` file entirely (its
content has moved to the new nested path above).

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/lib/grail/catalog.ts src/lib/grail/catalog.test.ts "src/app/[locale]/items/set/category" "src/app/[locale]/items/set/[category]"
git commit -m "Combine weapon categories into one Weapons tile for Set Items category view"
```

---

### Task 4: Full verification + d2r.world spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-set-items-taxonomy-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean. Confirm the static export includes
`out/en/items/set/index.html` (by-name list), `out/en/items/set/aldurs-watchtower/index.html`
(a set detail page), `out/en/items/set/category/index.html` (the category grid), and
`out/en/items/set/category/weapons/index.html` (the combined weapons category).

- [ ] **Step 2: Manual + d2r.world spot-check**

Serve the static export locally. Check:
- `/en/items/set` shows all 34 sets by name, each linking to its detail page.
- A set detail page (e.g. Aldur's Watchtower) shows all 4 pieces plus the correct
  2/3/4-piece partial bonuses and the full-set bonus, matching d2r.world's real values
  for this set exactly.
- `/en/items/set/category` shows the combined 9-category grid (Weapons, Helms, Armors,
  Shields, Belts, Boots, Gloves, Rings, Amulets) instead of the old 21-category list.
- `/en/items/set/category/weapons` shows every weapon-type Set item together.
- Confirm Unique Items' category grid is unaffected (still shows individual weapon-type
  categories).
- Check at both desktop and mobile widths via `resize_window`.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
