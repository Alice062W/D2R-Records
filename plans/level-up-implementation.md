# Level Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Level Up Misc page (currently an unbuilt placeholder): a small,
hand-transcribed guide showing which character-level range gains maximum experience in
which Act/difficulty, matching d2r.world.

**Architecture:** A small static TypeScript data file (not generator-derived, since no
raw vendored source exists for this curated content) plus a simple table page reusing
the Area Level page's existing difficulty/act i18n keys.

**Tech Stack:** Next.js/React, Tailwind CSS 4, Vitest.

## Global Constraints

- The 14-row data set is hand-transcribed from d2r.world exactly as published there
  (including the apparent Nightmare-Act-5 gap, which is d2r.world's own real content, not
  a transcription error to "fix") — source cited in a code comment.
- Reuse the existing `Items.areaLevelNormalLabel`/`areaLevelNightmareLabel`/
  `areaLevelHellLabel` and `Items.areaLevelAct1`-`areaLevelAct5` i18n keys (already added
  for the Area Level page) — do not create duplicate keys for the same concepts.
- No change to the Area Level page or its data.

---

### Task 1: Level Up data + page

**Files:**
- Create: `src/lib/grail/levelUpGuide.ts`, `src/lib/grail/levelUpGuide.test.ts`
- Create: `src/components/items/LevelUpTable.tsx`, `src/components/items/LevelUpTable.test.tsx`
- Modify: `src/app/[locale]/character/level-up/page.tsx` (currently `ComingSoonPage`)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Produces: `LEVEL_UP_GUIDE: { clvlMin: number; clvlMax: number; difficulty: 'normal' |
  'nightmare' | 'hell'; act: number }[]`, exported from `src/lib/grail/levelUpGuide.ts`.

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace:
```json
    "levelUpPageTitle": "Level Up",
    "levelUpPageSubtitle": "What level should you be to gain maximum experience in a given area, in Diablo II: Resurrected.",
    "levelUpClvlLabel": "Character Level",
    "levelUpDifficultyLabel": "Difficulty",
    "levelUpActLabel": "Act"
```

Add hand-authored zh-TW:
```json
    "levelUpPageTitle": "升級指南",
    "levelUpPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中在各角色等級下能獲得最大經驗值的區域。",
    "levelUpClvlLabel": "角色等級",
    "levelUpDifficultyLabel": "難度",
    "levelUpActLabel": "章節"
```

Run `node scripts/translate-nav-items-ui-zh-cn.mjs` to derive zh-CN.

- [ ] **Step 2: Write the failing data test**

Create `src/lib/grail/levelUpGuide.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LEVEL_UP_GUIDE } from './levelUpGuide';

describe('LEVEL_UP_GUIDE', () => {
  it('has exactly 14 entries matching d2r.world exactly', () => {
    expect(LEVEL_UP_GUIDE).toEqual([
      { clvlMin: 1, clvlMax: 11, difficulty: 'normal', act: 1 },
      { clvlMin: 12, clvlMax: 18, difficulty: 'normal', act: 2 },
      { clvlMin: 19, clvlMax: 23, difficulty: 'normal', act: 3 },
      { clvlMin: 24, clvlMax: 31, difficulty: 'normal', act: 4 },
      { clvlMin: 32, clvlMax: 36, difficulty: 'normal', act: 5 },
      { clvlMin: 37, clvlMax: 43, difficulty: 'nightmare', act: 1 },
      { clvlMin: 44, clvlMax: 48, difficulty: 'nightmare', act: 2 },
      { clvlMin: 49, clvlMax: 52, difficulty: 'nightmare', act: 3 },
      { clvlMin: 53, clvlMax: 62, difficulty: 'nightmare', act: 4 },
      { clvlMin: 63, clvlMax: 73, difficulty: 'hell', act: 1 },
      { clvlMin: 74, clvlMax: 80, difficulty: 'hell', act: 2 },
      { clvlMin: 81, clvlMax: 83, difficulty: 'hell', act: 3 },
      { clvlMin: 83, clvlMax: 94, difficulty: 'hell', act: 4 },
      { clvlMin: 95, clvlMax: 99, difficulty: 'hell', act: 5 },
    ]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/levelUpGuide.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `levelUpGuide.ts`**

Create `src/lib/grail/levelUpGuide.ts`:

```ts
// Hand-transcribed from d2r.world (https://d2r.world/en-US/info/character/levelup),
// this session, per this project's established policy for curated/deterministic
// game-mechanic content with no equivalent raw vendored-data source (same basis as the
// Runes page's hand-transcribed drop rates). Note: Hell Act 3/4 overlap at clvl 83 and
// there is no separate Nightmare Act 5 row — both are d2r.world's own real content, not
// transcription errors, and should not be "corrected" to look more regular.
export interface LevelUpRow {
  clvlMin: number;
  clvlMax: number;
  difficulty: 'normal' | 'nightmare' | 'hell';
  act: number;
}

export const LEVEL_UP_GUIDE: LevelUpRow[] = [
  { clvlMin: 1, clvlMax: 11, difficulty: 'normal', act: 1 },
  { clvlMin: 12, clvlMax: 18, difficulty: 'normal', act: 2 },
  { clvlMin: 19, clvlMax: 23, difficulty: 'normal', act: 3 },
  { clvlMin: 24, clvlMax: 31, difficulty: 'normal', act: 4 },
  { clvlMin: 32, clvlMax: 36, difficulty: 'normal', act: 5 },
  { clvlMin: 37, clvlMax: 43, difficulty: 'nightmare', act: 1 },
  { clvlMin: 44, clvlMax: 48, difficulty: 'nightmare', act: 2 },
  { clvlMin: 49, clvlMax: 52, difficulty: 'nightmare', act: 3 },
  { clvlMin: 53, clvlMax: 62, difficulty: 'nightmare', act: 4 },
  { clvlMin: 63, clvlMax: 73, difficulty: 'hell', act: 1 },
  { clvlMin: 74, clvlMax: 80, difficulty: 'hell', act: 2 },
  { clvlMin: 81, clvlMax: 83, difficulty: 'hell', act: 3 },
  { clvlMin: 83, clvlMax: 94, difficulty: 'hell', act: 4 },
  { clvlMin: 95, clvlMax: 99, difficulty: 'hell', act: 5 },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/levelUpGuide.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Write the failing component test**

Create `src/components/items/LevelUpTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import LevelUpTable from './LevelUpTable';
import messages from '../../../messages/en.json';

describe('LevelUpTable', () => {
  it('renders one row per guide entry with clvl range, difficulty, and act', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LevelUpTable rows={[{ clvlMin: 1, clvlMax: 11, difficulty: 'normal', act: 1 }]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('1 - 11')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Act 1')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/components/items/LevelUpTable.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 8: Implement `LevelUpTable`**

Create `src/components/items/LevelUpTable.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type { LevelUpRow } from '@/lib/grail/levelUpGuide';

const DIFFICULTY_LABEL_KEY = {
  normal: 'areaLevelNormalLabel',
  nightmare: 'areaLevelNightmareLabel',
  hell: 'areaLevelHellLabel',
} as const;

const ACT_LABEL_KEY = ['areaLevelAct1', 'areaLevelAct2', 'areaLevelAct3', 'areaLevelAct4', 'areaLevelAct5'] as const;

export default function LevelUpTable({ rows }: { rows: LevelUpRow[] }) {
  const t = useTranslations('Items');

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 overflow-x-auto w-full">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2">{t('levelUpClvlLabel')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('levelUpDifficultyLabel')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('levelUpActLabel')}</th>
          </tr>
        </thead>
        <tbody className="text-zinc-300">
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="py-1 text-zinc-100 font-semibold">{row.clvlMin} - {row.clvlMax}</td>
              <td className="py-1 px-3">{t(DIFFICULTY_LABEL_KEY[row.difficulty])}</td>
              <td className="py-1 px-3">{t(ACT_LABEL_KEY[row.act - 1])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run src/components/items/LevelUpTable.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 10: Wire the page**

Modify `src/app/[locale]/character/level-up/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LEVEL_UP_GUIDE } from '@/lib/grail/levelUpGuide';
import LevelUpTable from '@/components/items/LevelUpTable';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LevelUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('levelUpPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('levelUpPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <LevelUpTable rows={LEVEL_UP_GUIDE} />
      </div>
    </main>
  );
}
```

- [ ] **Step 11: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm `out/en/character/level-up/index.html` (and zh-TW/zh-CN
equivalents) exist with real content.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/lib/grail/levelUpGuide.ts src/lib/grail/levelUpGuide.test.ts src/components/items/LevelUpTable.tsx src/components/items/LevelUpTable.test.tsx "src/app/[locale]/character/level-up/page.tsx"
git commit -m "Add Level Up page"
```

---

### Task 2: Full verification + d2r.world spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-level-up-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual + d2r.world spot-check**

Serve the static export locally. Navigate to `/en/character/level-up`. Confirm all 14
rows render and match d2r.world's table exactly (clvl ranges, difficulty, act). Check in
zh-TW and zh-CN locales too. Check at both desktop and mobile widths via
`resize_window`.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
