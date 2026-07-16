# Area Level Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Area Level Misc page (currently an unbuilt placeholder): a per-Act
table of every real game area's Normal/Nightmare/Hell monster level, matching d2r.world.

**Architecture:** Vendor `levels.json`, generate `data/area-levels.json` from its
`MonLvlEx`/`MonLvlEx(N)`/`MonLvlEx(H)` fields (filtering out town/administrative rows
with `MonLvlEx === 0`), build a per-Act tabbed table page reusing the established
`MaxSocketsTable`-style pattern.

**Tech Stack:** Node.js generator script, Next.js/React, Tailwind CSS 4, Vitest.

## Global Constraints

- `data/area-levels.json` excludes the 7 confirmed administrative/town rows (`Rogue
  Encampment`, `Forgotten Tower`, `Lut Gholein`, `Harem Level 1`, `Kurast Docktown`, `The
  Pandemonium Fortress`, `Harrogath` — all have `MonLvlEx === 0`), yielding 130 real
  playable areas.
- Area name localization reuses the existing `localizedItemName`-style
  `chi[englishName] ?? englishName` lookup against the already-vendored
  `localestrings-chi.json` (confirmed to have area-name entries, e.g. `"Dark Wood"`) —
  do not invent a new localization mechanism.
- No change to `src/lib/grail/zones.ts` (a separate, hand-curated, non-exhaustive list
  for the Grail Tracker's log-find dropdowns — unrelated purpose, must stay untouched).

---

### Task 1: Vendor `levels.json` and generate `data/area-levels.json`

**Files:**
- Create: `vendor/d2data/json/levels.json`
- Modify: `vendor/d2data/README.md`, `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:**
- Produces: `data/area-levels.json` — array of `{ id: number, name: LocalizedText, act:
  number, normal: number, nightmare: number, hell: number }`, 130 entries, ordered by
  `Act` then by the source file's own entry order (matching d2r.world's per-Act
  ordering, e.g. Blood Moor before Den of Evil before Cold Plains for Act 1).

- [ ] **Step 1: Vendor the file**

```bash
curl -s "https://raw.githubusercontent.com/blizzhackers/d2data/477bcf63e964f39f4c774e588a79fd598ae472de/json/levels.json" \
  -o vendor/d2data/json/levels.json
```

Verify:
```bash
node -e "
const l = require('./vendor/d2data/json/levels.json');
console.log('entries:', Object.keys(l).length);
"
```
Expected: `entries: 138`.

Add to `vendor/d2data/README.md`:
```markdown

`levels.json` provides every game area's identity (`*StringName`, `Act`) and per-difficulty
monster level (`MonLvlEx`/`MonLvlEx(N)`/`MonLvlEx(H)`), used for the Area Level reference
page.
```

- [ ] **Step 2: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
import areaLevelsData from './area-levels.json';

describe('area-levels.json', () => {
  it('has exactly 130 entries (138 total minus 7 administrative/town rows with MonLvlEx 0)', () => {
    expect(areaLevelsData.length).toBe(130);
  });

  it('excludes known town/administrative areas', () => {
    const names = areaLevelsData.map((a: { name: { en: string } }) => a.name.en);
    for (const town of ['Rogue Encampment', 'Forgotten Tower', 'Lut Gholein', 'Harem Level 1', 'Kurast Docktown', 'The Pandemonium Fortress', 'Harrogath']) {
      expect(names).not.toContain(town);
    }
  });

  it("resolves Dark Wood's levels correctly", () => {
    const darkWood = areaLevelsData.find((a: { name: { en: string } }) => a.name.en === 'Dark Wood')!;
    expect(darkWood).toMatchObject({ act: 0, normal: 5, nightmare: 38, hell: 68 });
    expect(darkWood.name['zh-TW']).not.toBe('');
  });

  it('is ordered by act, ascending', () => {
    const acts = areaLevelsData.map((a: { act: number }) => a.act);
    for (let i = 1; i < acts.length; i++) expect(acts[i]).toBeGreaterThanOrEqual(acts[i - 1]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "area-levels.json"`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement the generator addition**

In `scripts/generate-grail-data.mjs`, add:

```js
const levelsData = JSON.parse(readFileSync(join(VENDOR, 'levels.json'), 'utf8'));

const areaLevelsOut = Object.values(levelsData)
  .filter(v => v.Act !== undefined && v.Act >= 0 && v['*StringName'] && (v.MonLvlEx ?? 0) > 0)
  .sort((a, b) => a.Act - b.Act || a.Id - b.Id)
  .map(v => ({
    id: v.Id,
    name: localizedItemName(v['*StringName']),
    act: v.Act,
    normal: v.MonLvlEx,
    nightmare: v['MonLvlEx(N)'],
    hell: v['MonLvlEx(H)'],
  }));

writeFileSync(join(OUT, 'area-levels.json'), JSON.stringify(areaLevelsOut, null, 2));
console.log(`Wrote ${areaLevelsOut.length} area levels -> data/area-levels.json`);
```

- [ ] **Step 5: Run the generator and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "area-levels.json"
```
Expected: PASS (4 tests).

- [ ] **Step 6: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, including all pre-existing tests still passing.

```bash
git add vendor/d2data/json/levels.json vendor/d2data/README.md scripts/generate-grail-data.mjs data/area-levels.json data/grail-data.test.ts
git commit -m "Vendor levels.json and generate data/area-levels.json"
```

---

### Task 2: Area Level page (per-Act tabbed table)

**Files:**
- Create: `src/components/items/AreaLevelTable.tsx`, `src/components/items/AreaLevelTable.test.tsx`
- Modify: `src/app/[locale]/monster/area-level/page.tsx` (currently `ComingSoonPage`)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Consumes: `data/area-levels.json` (Task 1).

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace (reused across Misc pages, consistent with
existing project convention of one shared `Items` namespace for reference-page copy):
```json
    "areaLevelPageTitle": "Area Level",
    "areaLevelPageSubtitle": "Monster level by area and difficulty in Diablo II: Resurrected.",
    "areaLevelNameLabel": "Level Name",
    "areaLevelNormalLabel": "Normal",
    "areaLevelNightmareLabel": "Nightmare",
    "areaLevelHellLabel": "Hell",
    "areaLevelAct1": "Act 1",
    "areaLevelAct2": "Act 2",
    "areaLevelAct3": "Act 3",
    "areaLevelAct4": "Act 4",
    "areaLevelAct5": "Act 5"
```

Add hand-authored zh-TW:
```json
    "areaLevelPageTitle": "區域等級",
    "areaLevelPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中各區域在不同難度下的怪物等級。",
    "areaLevelNameLabel": "區域名稱",
    "areaLevelNormalLabel": "普通",
    "areaLevelNightmareLabel": "惡夢",
    "areaLevelHellLabel": "地獄",
    "areaLevelAct1": "第一章",
    "areaLevelAct2": "第二章",
    "areaLevelAct3": "第三章",
    "areaLevelAct4": "第四章",
    "areaLevelAct5": "第五章"
```

Run `node scripts/translate-nav-items-ui-zh-cn.mjs` to derive zh-CN.

- [ ] **Step 2: Write the failing test**

Create `src/components/items/AreaLevelTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AreaLevelTable from './AreaLevelTable';
import messages from '../../../messages/en.json';

describe('AreaLevelTable', () => {
  it('renders one row per area with normal/nightmare/hell levels', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AreaLevelTable
          areas={[{ id: 5, name: { en: 'Dark Wood', 'zh-TW': '黑森林', 'zh-CN': '黑森林' }, act: 0, normal: 5, nightmare: 38, hell: 68 }]}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Dark Wood')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText('68')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/items/AreaLevelTable.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `AreaLevelTable`**

Create `src/components/items/AreaLevelTable.tsx`:

```tsx
import { useTranslations, useLocale } from 'next-intl';
import type areaLevelsJson from '../../../data/area-levels.json';

type Area = (typeof areaLevelsJson)[number];

export default function AreaLevelTable({ areas }: { areas: Area[] }) {
  const t = useTranslations('Items');
  const locale = useLocale() as 'en' | 'zh-TW' | 'zh-CN';

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 overflow-x-auto w-full">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2">{t('areaLevelNameLabel')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('areaLevelNormalLabel')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('areaLevelNightmareLabel')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('areaLevelHellLabel')}</th>
          </tr>
        </thead>
        <tbody className="text-zinc-300">
          {areas.map(area => (
            <tr key={area.id}>
              <td className="py-1 text-zinc-100 font-semibold">{area.name[locale]}</td>
              <td className="py-1 px-3">{area.normal}</td>
              <td className="py-1 px-3">{area.nightmare}</td>
              <td className="py-1 px-3">{area.hell}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/items/AreaLevelTable.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Wire the page with per-Act tabs**

Modify `src/app/[locale]/monster/area-level/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import areaLevels from '../../../../../data/area-levels.json';
import AreaLevelTable from '@/components/items/AreaLevelTable';

const ACT_KEYS = ['areaLevelAct1', 'areaLevelAct2', 'areaLevelAct3', 'areaLevelAct4', 'areaLevelAct5'] as const;

export default function AreaLevelPage() {
  const t = useTranslations('Items');
  const [selectedAct, setSelectedAct] = useState(0);
  const areasForAct = areaLevels.filter(a => a.act === selectedAct);

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('areaLevelPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('areaLevelPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {ACT_KEYS.map((key, i) => (
            <button
              key={key}
              onClick={() => setSelectedAct(i)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                selectedAct === i
                  ? 'border-amber-400 text-amber-300 bg-zinc-800'
                  : 'border-zinc-700 text-zinc-300 hover:border-amber-400 hover:text-amber-300'
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
        <AreaLevelTable areas={areasForAct} />
      </div>
    </main>
  );
}
```

(This page changes from a Server Component to a Client Component, needed for the
`useState`-driven Act tab selector — matching the same pattern already established for
`BaseSubCategoryTabs`/`CategoryCardGrid` in prior plans. Since `data/area-levels.json`
is a static JSON import, not fetched from a locale-aware server helper,
`generateStaticParams` is no longer needed on this page — the page itself contains no
locale-specific server logic beyond `useTranslations`, which already works in a client
component via the `NextIntlClientProvider` set up at the layout level; confirm this
builds correctly for all 3 locales during verification.)

- [ ] **Step 7: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm `out/en/monster/area-level/index.html` (and zh-TW/zh-CN
equivalents) exist with real content.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/components/items/AreaLevelTable.tsx src/components/items/AreaLevelTable.test.tsx "src/app/[locale]/monster/area-level/page.tsx"
git commit -m "Add Area Level page"
```

---

### Task 3: Full verification + d2r.world spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-area-level-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual + d2r.world spot-check**

Serve the static export locally. Navigate to `/en/monster/area-level`. Confirm:
- All 5 Act tabs work and switch the displayed table.
- At least 3 areas per act match d2r.world's real values exactly (e.g. Act 1: Dark Wood
  5/38/68; spot-check one area each from Acts 2-5).
- Check in zh-TW and zh-CN locales too — area names render translated, not falling back
  to English (except any genuinely untranslated edge case, which should be noted if
  found).
- Check at both desktop and mobile widths via `resize_window`.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
