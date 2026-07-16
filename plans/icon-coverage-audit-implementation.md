# Icon Coverage Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the icon gaps found across Base Items, Runes, Runewords, and Set Items
(browse-by-name index), matching d2r.world's icon-per-row presentation everywhere.

**Architecture:** Small, additive changes to `scripts/generate-grail-data.mjs` (add
`invFile`-shaped fields to four generated data files, reusing lookups already computed
in that script), then wire icon rendering into the corresponding list components using
the exact `<img>` + `onError` fallback pattern already established in
`ItemStatCard.tsx`.

**Tech Stack:** Node.js generator script, React/Next.js components, Vitest.

## Global Constraints

- Reuse the exact icon-rendering pattern from `ItemStatCard.tsx`/`CategoryCardGrid.tsx`:
  render `<img src="/items/inv/${invFile}.png" alt="" aria-hidden="true" onError={...}>`
  inside a `useState`-backed "hide on load failure" wrapper — never a broken-image
  glyph, and never render the `<img>` at all when `invFile` is empty.
- Base Items and Set Items icon files already exist in `public/items/inv/` — Tasks 1–2
  need no new icon files and can be fully completed and verified now.
- Runes and Runewords need 33 new icon files (`invrEl.png` … `invrZod.png`) that do not
  exist yet — Tasks 3–4 are blocked on those files being added to
  `public/items/inv/` and cannot be verified end-to-end until then.
- No change to already-working icon rendering (unique/set item detail, category
  tiles).

---

### Task 1: Base Items icons

**Files:**
- Modify: `scripts/generate-grail-data.mjs` (`basesFullOut`, around line 559)
- Modify: `data/bases-full.json` (regenerated output)
- Modify: `data/grail-data.test.ts` (add to existing `describe('bases-full.json', ...)` block, around line 130)
- Modify: `src/lib/grail/basesCatalog.ts` (`BaseLine`, `getBaseLinesForCategory`)
- Modify: `src/components/items/BaseItemTable.tsx`
- Modify: `src/components/items/BaseItemTable.test.tsx`

**Interfaces:**
- Produces: `BaseLine.invFile: string` (empty string if none), consumed by
  `BaseItemTable`.

- [ ] **Step 1: Write the failing data test**

Add to the existing `describe('bases-full.json', ...)` block in
`data/grail-data.test.ts` (after the `'includes katar base items...'` test):

```ts
  it('has a non-empty invFile matching a real file in public/items/inv for every line', () => {
    for (const line of basesFull) {
      expect(line.invFile).not.toBe('');
      expect(existsSync(join(process.cwd(), 'public/items/inv', `${line.invFile}.png`))).toBe(true);
    }
  });
```

Add these imports near the top of `data/grail-data.test.ts` if not already present:
```ts
import { existsSync } from 'fs';
import { join } from 'path';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "invFile matching a real file"`
Expected: FAIL — `data/bases-full.json` has no `invFile` field yet (`undefined` !== `''`).

- [ ] **Step 3: Add invFile to the generator**

In `scripts/generate-grail-data.mjs`, modify the `basesFullOut` map (around line 559)
to add `invFile: v.invfile ?? ''`:

```js
const basesFullOut = Object.entries(items)
  .filter(([code, v]) => v.normcode === code && TYPE_TO_SLOT[v.type])
  .map(([code, v]) => ({
    id: `base-${code}`,
    slotCategory: TYPE_TO_SLOT[v.type],
    subCategory: subCategoryFor(v.type),
    invFile: v.invfile ?? '',
    grades: {
      normal: baseGradeFor(code),
      exceptional: v.ubercode && v.ubercode !== code ? baseGradeFor(v.ubercode) : null,
      elite: v.ultracode && v.ultracode !== code ? baseGradeFor(v.ultracode) : null,
    },
  }));
```

- [ ] **Step 4: Regenerate and run test to verify it passes**

Run: `node scripts/generate-grail-data.mjs && npx vitest run data/grail-data.test.ts -t "invFile matching a real file"`
Expected: PASS.

- [ ] **Step 5: Wire invFile through basesCatalog.ts**

In `src/lib/grail/basesCatalog.ts`, add `invFile: string` to the `BaseLine` interface
and thread it through `getBaseLinesForCategory`:

```ts
export interface BaseLine {
  id: string;
  slotCategory: string;
  subCategory: string | null;
  invFile: string;
  grades: { normal: BaseGrade | null; exceptional: BaseGrade | null; elite: BaseGrade | null };
}
```

```ts
export function getBaseLinesForCategory(category: string, locale: Locale): BaseLine[] {
  return basesFull
    .filter(l => l.slotCategory === category)
    .map(l => ({
      id: l.id,
      slotCategory: l.slotCategory,
      subCategory: l.subCategory,
      invFile: l.invFile,
      grades: {
        normal: localizeGrade(l.grades.normal, locale),
        exceptional: localizeGrade(l.grades.exceptional, locale),
        elite: localizeGrade(l.grades.elite, locale),
      },
    }));
}
```

- [ ] **Step 5b: Update existing BaseItemTable test fixtures**

`BaseLine` gained a new required `invFile: string` field in Step 5, so the two
existing `BaseLine` literals already in `src/components/items/BaseItemTable.test.tsx`
(one with `id: 'base-hax'`, one with `id: 'base-x'`) will fail to typecheck. Add
`invFile: 'invhax'` to the first and `invFile: ''` to the second (matching this task's
real base-hax data and an explicit empty-icon case respectively) — do not change any
other part of those two existing tests.

- [ ] **Step 6: Write the failing component test**

Add to `src/components/items/BaseItemTable.test.tsx` (alongside the existing tests,
after applying Step 5b's fixture fix):

```tsx
it('renders the icon when invFile is present', () => {
  const line: BaseLine = {
    id: 'base-hax', slotCategory: 'axes', subCategory: null, invFile: 'invhax',
    grades: { normal: { name: 'Hand Axe', oneHandDamage: { min: 3, max: 6 }, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 3 }, exceptional: null, elite: null },
  };
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BaseItemTable line={line} />
    </NextIntlClientProvider>
  );
  const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  expect(img.src).toContain('/items/inv/invhax.png');
});

it('renders no icon when invFile is empty', () => {
  const line: BaseLine = {
    id: 'base-x', slotCategory: 'axes', subCategory: null, invFile: '',
    grades: { normal: { name: 'X', oneHandDamage: null, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: null, sockets: null, qlvl: null }, exceptional: null, elite: null },
  };
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BaseItemTable line={line} />
    </NextIntlClientProvider>
  );
  expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
});
```

Add whatever imports (`render`, `screen`, `NextIntlClientProvider`, `messages`,
`BaseLine` type) match this project's existing test-file conventions (see
`ItemStatCard.test.tsx` for the exact import shape used elsewhere in this codebase).

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/components/items/BaseItemTable.test.tsx`
Expected: FAIL — `BaseItemTable` doesn't render an `<img>` yet.

- [ ] **Step 8: Implement the icon in BaseItemTable**

Modify `src/components/items/BaseItemTable.tsx` — add the icon next to the row header,
reusing the exact fail-safe pattern from `ItemStatCard.tsx`:

```tsx
'use client';

import { useState } from 'react';
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
  const [iconFailed, setIconFailed] = useState(false);
  const present = GRADES.filter(g => line.grades[g] !== null);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 overflow-x-auto">
      <div className="mb-3 flex items-center gap-3">
        {line.invFile && !iconFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/items/inv/${line.invFile}.png`}
            alt=""
            aria-hidden="true"
            className="w-12 h-12 object-contain shrink-0"
            onError={() => setIconFailed(true)}
          />
        )}
        <span className="text-lg font-bold text-zinc-100">{line.grades.normal!.name}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2"> </th>
            {present.map(g => (
              <th key={g} className="text-left text-zinc-100 font-bold pb-2 px-3">
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

Note the removal of the old plain-text header row for the item name — it's replaced by
the icon+name row above the table, matching d2r.world's icon-next-to-name convention
used elsewhere on this site. Check `BaseCategoryList.tsx`/the page that renders
`BaseItemTable` to confirm nothing else duplicates the base-line name — if it does,
remove the duplicate there instead of showing the name twice.

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run src/components/items/BaseItemTable.test.tsx data/grail-data.test.ts`
Expected: PASS.

- [ ] **Step 10: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/bases-full.json data/grail-data.test.ts src/lib/grail/basesCatalog.ts src/components/items/BaseItemTable.tsx src/components/items/BaseItemTable.test.tsx
git commit -m "Add icons to Base Items table"
```

---

### Task 2: Set Items (browse-by-name index) representative icon

**Files:**
- Modify: `scripts/generate-grail-data.mjs` (`setGroupsOut`, around line 653)
- Modify: `data/set-groups.json` (regenerated output)
- Modify: `data/grail-data.test.ts` (`describe('set-groups.json', ...)` block)
- Modify: `"src/app/[locale]/items/set/page.tsx"` (passes `repInvFile` through to the list)
- Modify: `src/components/items/SetGroupList.tsx`
- Modify: `src/components/items/SetGroupList.test.tsx`

**Interfaces:**
- Produces: `set-groups.json[].repInvFile: string` — the first piece's `invFile`,
  representative of the whole set (same "one representative icon per group tile"
  convention already used by `CategoryCardGrid`/`data/category-icons.json`).
- Consumes (unchanged): `SetGroupDetail` already shows a full icon per piece via
  `ItemStatCard` — confirmed working already (pieces come from `getAllGrailItems()`,
  which already carries `invFile`) — **no change needed there.**

- [ ] **Step 1: Write the failing data test**

Add to the existing `describe('set-groups.json', ...)` block in
`data/grail-data.test.ts`:

```ts
  it('has a non-empty repInvFile matching a real file in public/items/inv for every group', () => {
    for (const group of setGroups) {
      expect(group.repInvFile).not.toBe('');
      expect(existsSync(join(process.cwd(), 'public/items/inv', `${group.repInvFile}.png`))).toBe(true);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "repInvFile"`
Expected: FAIL.

- [ ] **Step 3: Add repInvFile to the generator**

In `scripts/generate-grail-data.mjs`, modify the `setGroupsOut` map (around line 653)
to add `repInvFile`:

```js
    return {
      setName: localizedItemName(v.name),
      pieceIds,
      repInvFile: setsOut.find(s => s.id === pieceIds[0])?.invFile ?? '',
      partialBonuses,
      fullSetBonuses,
    };
```

- [ ] **Step 4: Regenerate and run test to verify it passes**

Run: `node scripts/generate-grail-data.mjs && npx vitest run data/grail-data.test.ts -t "repInvFile"`
Expected: PASS.

- [ ] **Step 5: Write the failing component test**

Add to `src/components/items/SetGroupList.test.tsx`:

```tsx
it('renders the representative icon when repInvFile is present', () => {
  render(<SetGroupList groups={[{ slug: 'aldurs-watchtower', name: "Aldur's Watchtower", repInvFile: 'invskul' }]} basePath="/en/items/set" />);
  const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  expect(img.src).toContain('/items/inv/invskul.png');
});

it('renders no icon when repInvFile is empty', () => {
  render(<SetGroupList groups={[{ slug: 'x', name: 'X', repInvFile: '' }]} basePath="/en/items/set" />);
  expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/items/SetGroupList.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implement the icon in SetGroupList**

Modify `src/components/items/SetGroupList.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

function GroupIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-10 h-10 object-contain shrink-0"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function SetGroupList({
  groups,
  basePath,
}: {
  groups: { slug: string; name: string; repInvFile: string }[];
  basePath: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {groups.map(g => (
        <Link
          key={g.slug}
          href={`${basePath}/${g.slug}`}
          className="flex items-center gap-3 px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-[#22ff55] font-semibold hover:border-amber-400 transition-colors"
        >
          <GroupIcon invFile={g.repInvFile} />
          {g.name}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Update the page passing `groups` to SetGroupList**

Modify `"src/app/[locale]/items/set/page.tsx"` — find where the `groups` array is
built (mapping `setGroups` to `{ slug, name }`) and add `repInvFile: g.repInvFile` to
each entry, matching the new prop shape.

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run src/components/items/SetGroupList.test.tsx data/grail-data.test.ts`
Expected: PASS.

- [ ] **Step 10: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/set-groups.json data/grail-data.test.ts "src/app/[locale]/items/set/page.tsx" src/components/items/SetGroupList.tsx src/components/items/SetGroupList.test.tsx
git commit -m "Add representative icon to Set Items browse-by-name index"
```

---

### Task 3: Rune icons (BLOCKED on 33 new icon files)

**Prerequisite — do this before starting Task 3 or 4:** the 33 real rune icon files
(`invrEl.png`, `invrEld.png`, `invrTir.png`, `invrNef.png`, `invrEth.png`,
`invrIth.png`, `invrTal.png`, `invrRal.png`, `invrOrt.png`, `invrThul.png`,
`invrAmn.png`, `invrSol.png`, `invrShae.png`, `invrDol.png`, `invrHel.png`,
`invrIo.png`, `invrLum.png`, `invrKo.png`, `invrFal.png`, `invrLem.png`,
`invrPul.png`, `invrUm.png`, `invrMal.png`, `invrIst.png`, `invrGul.png`,
`invrVex.png`, `invrOhm.png`, `invrLo.png`, `invrSur.png`, `invrBer.png`,
`invrJo.png`, `invrCham.png`, `invrZod.png`) do not exist anywhere in this repo and
must be extracted from the same D2R install used previously, via
`docs/icon-extraction-instructions.md`'s existing CascView + `dc6png` process — no new
tooling, just pulling these 33 specific already-known filenames out of
`data\global\items\` (the CascView step already extracts everything there; only the
"which converted PNGs to copy into this repo" filter needs to include these 33 names
this time) and adding them to `public/items/inv/`.

**Files:**
- Modify: `scripts/generate-grail-data.mjs` (`runesOut`, around line 958)
- Modify: `data/runes.json` (regenerated output)
- Modify: `data/grail-data.test.ts` (`describe('runes.json', ...)` block — add if none exists, checking the current file for where runes.json is already tested)
- Modify: `src/components/items/RuneList.tsx`
- Modify: `src/components/items/RuneList.test.tsx`
- Add: `public/items/inv/invr*.png` (33 files, per prerequisite above)

**Interfaces:**
- Produces: `runes.json[].invFile: string`, consumed by `RuneList`.

- [ ] **Step 1: Write the failing data test**

Add a new test (in the existing describe block covering `runes.json`, or a new
`describe('runes.json', ...)` block if none exists yet — check
`data/grail-data.test.ts` first):

```ts
  it('has a non-empty invFile matching a real file in public/items/inv for every rune', () => {
    for (const rune of runesData) {
      expect(rune.invFile).not.toBe('');
      expect(existsSync(join(process.cwd(), 'public/items/inv', `${rune.invFile}.png`))).toBe(true);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "invFile matching a real file for every rune"`
Expected: FAIL (both because `invFile` doesn't exist on the data yet, AND because the
files don't exist on disk yet — do not proceed past this step until the prerequisite
files have been added).

- [ ] **Step 3: Add invFile to the generator**

In `scripts/generate-grail-data.mjs`, modify the `runesOut` map (around line 958) to
add `invFile: itemEntry?.invfile ?? ''`:

```js
const runesOut = RUNE_ORDER.map((name, i) => {
  const entry = Object.values(gemsData).find(v => v.name === `${name} Rune`);
  const itemEntry = Object.values(items).find(v => v.code === entry.code);
  return {
    id: `rune-${entry.code}`,
    number: i + 1,
    name: localizedItemName(name),
    levelReq: itemEntry?.levelreq ?? 0,
    invFile: itemEntry?.invfile ?? '',
    weaponStats: runeStatsFor(entry, 'weaponMod'),
    armorHelmStats: runeStatsFor(entry, 'helmMod'),
    shieldStats: runeStatsFor(entry, 'shieldMod'),
    recipe: RUNE_RECIPES[name] ?? null,
    dropRate: RUNE_DROP_RATES[name],
  };
});
```

- [ ] **Step 4: Regenerate and run test to verify it passes**

Run: `node scripts/generate-grail-data.mjs && npx vitest run data/grail-data.test.ts -t "invFile matching a real file for every rune"`
Expected: PASS (once the 33 files exist).

- [ ] **Step 5: Write the failing component test**

Add to `src/components/items/RuneList.test.tsx`:

```tsx
it('renders the icon when the rune has an invFile', () => {
  const rune = { ...baseRuneFixture, invFile: 'invrEl' }; // adapt to this file's existing fixture shape
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RuneList runes={[rune]} locale="en" />
    </NextIntlClientProvider>
  );
  const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  expect(img.src).toContain('/items/inv/invrEl.png');
});
```

Check the file's existing test fixtures first and adapt the new test to reuse them
rather than duplicating a whole rune object inline, matching this project's existing
test-file conventions.

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/items/RuneList.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implement the icon in RuneList**

Modify `src/components/items/RuneList.tsx` — add the icon next to the rune's name/number
header, reusing the same `useState`+`onError` fallback pattern:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type runesJson from '../../../data/runes.json';

type Rune = (typeof runesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

function RuneIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-10 h-10 object-contain shrink-0"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function RuneList({ runes, locale }: { runes: Rune[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-4 w-full">
      {runes.map(rune => (
        <div key={rune.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RuneIcon invFile={rune.invFile} />
              <h3 className="text-lg font-bold text-[#cbb87f]">{rune.name[locale]}</h3>
            </div>
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

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/components/items/RuneList.test.tsx data/grail-data.test.ts`
Expected: PASS.

- [ ] **Step 9: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/runes.json data/grail-data.test.ts src/components/items/RuneList.tsx src/components/items/RuneList.test.tsx public/items/inv/invr*.png
git commit -m "Add rune icons to Runes page"
```

---

### Task 4: Runeword rune-order icons (BLOCKED on Task 3's icon files)

**Files:**
- Modify: `scripts/generate-grail-data.mjs` (add a `RUNE_INVFILE_BY_NAME` lookup and use it in `runewordsFullOut`, around line 734)
- Modify: `data/runewords-full.json` (regenerated output)
- Modify: `data/grail-data.test.ts` (`describe('runewords-full.json', ...)` block, around line 196)
- Modify: `src/components/items/RunewordList.tsx`
- Modify: `src/components/items/RunewordList.test.tsx`

**Interfaces:**
- Produces: `runewords-full.json[].runeInvFiles: string[]` — same length and order as
  the existing `runes: string[]` field.

- [ ] **Step 1: Write the failing data test**

Add to the existing `describe('runewords-full.json', ...)` block in
`data/grail-data.test.ts`:

```ts
  it('has a runeInvFiles entry per rune, in the same order, for every runeword', () => {
    for (const rw of runewordsFull) {
      expect(rw.runeInvFiles.length).toBe(rw.runes.length);
      for (const invFile of rw.runeInvFiles) {
        expect(invFile).not.toBe('');
        expect(existsSync(join(process.cwd(), 'public/items/inv', `${invFile}.png`))).toBe(true);
      }
    }
  });

  it("Enigma's runeInvFiles resolve to the real Jah/Ith/Ber icon files, in order", () => {
    const enigma = runewordsFull.find(r => r.name.en === 'Enigma')!;
    expect(enigma.runeInvFiles).toEqual(['invrJah', 'invrIth', 'invrBer']);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "runeInvFiles"`
Expected: FAIL.

- [ ] **Step 3: Add the rune-name-to-invFile lookup and wire it into runewordsFullOut**

In `scripts/generate-grail-data.mjs`, add this just before the `runewordsFullOut`
definition (around line 734, after `normalizeRunewordName`):

```js
// A rune name (e.g. "Jah") -> its real invFile (e.g. "invrJah"), derived directly
// from items.json's "<Name> Rune" entries — independent of RUNE_ORDER (defined later
// in this file) so this can be computed before runewordsFullOut needs it.
const RUNE_INVFILE_BY_NAME = Object.fromEntries(
  Object.values(items)
    .filter(v => typeof v.name === 'string' && v.name.endsWith(' Rune'))
    .map(v => [v.name.replace(/ Rune$/, ''), v.invfile])
);
```

Then modify the `runewordsFullOut` map to add `runeInvFiles`:

```js
const runewordsFullOut = Object.entries(runesData)
  .filter(([, v]) => v.complete === 1)
  .map(([name, v]) => {
    const runeNames = v['*RunesUsed'].match(/[A-Z][a-z]+/g) ?? [];
    const { variable, fixed } = extractProps(v, 7, { code: 'T1Code', par: 'T1Param', min: 'T1Min', max: 'T1Max' });
    const curated = runewordsCurated.find(r => normalizeRunewordName(r.name) === normalizeRunewordName(name));
    return {
      id: `runeword-${v.Name}`,
      name: localizedItemName(name),
      runes: runeNames,
      runeInvFiles: runeNames.map(rn => RUNE_INVFILE_BY_NAME[rn] ?? ''),
      sockets: runeNames.length,
      itemTypes: itemTypesFor(v.itype1),
      levelReq: curated?.level ?? 0,
      ladderOnly: curated?.ladderOnly ?? false,
      stats: variable,
      fixedStats: fixed,
    };
  });
```

- [ ] **Step 4: Regenerate and run test to verify it passes**

Run: `node scripts/generate-grail-data.mjs && npx vitest run data/grail-data.test.ts -t "runeInvFiles"`
Expected: PASS.

- [ ] **Step 5: Write the failing component test**

Add to `src/components/items/RunewordList.test.tsx`:

```tsx
it('renders one icon per rune in rune order', () => {
  const rw = { ...baseRunewordFixture, runes: ['Ral', 'Ort', 'Tal'], runeInvFiles: ['invrRal', 'invrOrt', 'invrTal'] };
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RunewordList runewords={[rw]} locale="en" />
    </NextIntlClientProvider>
  );
  const imgs = screen.getAllByRole('img', { hidden: true }) as HTMLImageElement[];
  expect(imgs.map(i => i.src)).toEqual(
    expect.arrayContaining([expect.stringContaining('invrRal'), expect.stringContaining('invrOrt'), expect.stringContaining('invrTal')])
  );
});
```

Adapt to this file's existing fixture conventions (check `baseRunewordFixture` or
equivalent already used by this test file).

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/items/RunewordList.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implement rune-order icons in RunewordList**

Modify `src/components/items/RunewordList.tsx` — replace the plain-text rune list with
an inline icon-per-rune row (small icons, matching d2r.world's inline presentation),
keeping the text rune names alongside for accessibility/readability:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type runewordsFullJson from '../../../data/runewords-full.json';

type Runeword = (typeof runewordsFullJson)[number];

function RuneIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-6 h-6 object-contain inline-block"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function RunewordList({ runewords, locale }: { runewords: Runeword[]; locale: 'en' | 'zh-TW' | 'zh-CN' }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-4 w-full">
      {runewords.map(rw => (
        <div key={rw.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#cbb87f]">{rw.name[locale]}</h3>
            {rw.ladderOnly && (
              <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                {t('runewordsLadderOnly')}
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-zinc-300 flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span>{t('runewordsRunesLabel')}:</span>
              {rw.runes.map((rune, i) => (
                <span key={`${rune}-${i}`} className="flex items-center gap-1">
                  <RuneIcon invFile={rw.runeInvFiles[i]} />
                  {rune}
                </span>
              ))}
            </div>
            <div>{t('runewordsSocketsLabel')}: {rw.sockets}</div>
            <div>{t('runewordsBaseTypesLabel')}: {rw.itemTypes.join(', ')}</div>
            {rw.levelReq > 0 && <div>{t('runewordsLevelReqLabel')}: {rw.levelReq}</div>}
          </div>
          {(rw.stats.length > 0 || rw.fixedStats.length > 0) && (
            <div className="mt-4">
              <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
                {rw.stats.map(stat => (
                  <div key={stat.key}>{stat.label[locale]}: {stat.min}–{stat.max}</div>
                ))}
                {rw.fixedStats.map(f => (
                  <div key={f.key}>{f.label[locale]}: {f.value}</div>
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

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/components/items/RunewordList.test.tsx data/grail-data.test.ts`
Expected: PASS.

- [ ] **Step 9: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/runewords-full.json data/grail-data.test.ts src/components/items/RunewordList.tsx src/components/items/RunewordList.test.tsx
git commit -m "Add rune-order icons to Runewords page"
```

---

### Task 5: Full verification + d2r.world spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-icon-coverage-audit-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual spot-check (cheap methods only — file inspection, not repeated browser screenshots)**

Serve the static export locally. Confirm via direct HTML/`curl` inspection (or a single
minimal visual check, not repeated screenshot rounds) that Base Items, Runes,
Runewords, and Set Items (browse-by-name index) all render icons, in all three locales.
Spot-check at least: Hand Axe (Base Items), El and Zod runes (first/last in the Runes
list), Enigma (Runewords, 3 rune icons in order Jah/Ith/Ber), and one Set Items index
tile.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
