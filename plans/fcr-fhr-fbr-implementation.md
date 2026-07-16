# FCR/FHR/FBR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the final Misc page (currently an unbuilt placeholder): the
Faster-Cast-Rate / Faster-Hit-Recovery / Faster-Block-Rate frame-breakpoint tables for
all 10 class/forms, matching d2r.world exactly.

**Architecture:** A single hand-transcribed static TypeScript data file (breakpoint
frame counts come from internal animation data with no plain vendored JSON equivalent —
same situation as Alvl85 Areas) plus a class-selector + table component and page.

**Tech Stack:** Next.js/React, Tailwind CSS 4, Vitest.

## Global Constraints

- Data is hand-transcribed from d2r.world exactly as published there — source cited in
  a code comment.
- Blank cells (no breakpoint at that frame count for that column) must be preserved
  exactly as blank — never interpolated or filled in.
- Column sub-splits (e.g. Sorceress FCR "other spells" vs. "Lightning / Chain
  Lightning") must render distinctly, matching d2r.world; tables with no sub-split show
  a single plain column with no sub-header row.
- No changes to any other page.

---

### Task 1: FCR/FHR/FBR data + page

**Files:**
- Create: `src/lib/grail/fcrFhrFbr.ts`, `src/lib/grail/fcrFhrFbr.test.ts`
- Create: `src/components/items/FcrFhrFbrTable.tsx`, `src/components/items/FcrFhrFbrTable.test.tsx`
- Modify: `src/app/[locale]/character/fcr-fhr-fbr/page.tsx` (currently `ComingSoonPage`)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Produces: `FCR_FHR_FBR_TABLES: FcrFhrFbrTable[]`, exported from
  `src/lib/grail/fcrFhrFbr.ts`, where:
  ```ts
  export interface StatColumn {
    label: string; // '' when this stat has no real sub-split for this class/form
    rows: Record<number, string>; // frame count -> percentage string, e.g. "200%"
  }

  export interface FcrFhrFbrTable {
    id: string;        // e.g. 'sorceress', 'druid-human'
    className: string; // display name, e.g. 'Sorceress', 'Druid Human Form'
    fcr: StatColumn[];
    fhr: StatColumn[];
    fbr: StatColumn[];
  }
  ```

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace:
```json
    "fcrFhrFbrPageTitle": "FCR / FHR / FBR Breakpoints",
    "fcrFhrFbrPageSubtitle": "Faster Cast Rate, Faster Hit Recovery, and Faster Block Rate frame breakpoints per class, in Diablo II: Resurrected.",
    "fcrFhrFbrFramesLabel": "Frames",
    "fcrFhrFbrFcrLabel": "FCR",
    "fcrFhrFbrFhrLabel": "FHR",
    "fcrFhrFbrFbrLabel": "FBR",
    "fcrFhrFbrClass_amazon": "Amazon",
    "fcrFhrFbrClass_assassin": "Assassin",
    "fcrFhrFbrClass_barbarian": "Barbarian",
    "fcrFhrFbrClass_druid-human": "Druid Human Form",
    "fcrFhrFbrClass_druid-bear": "Druid Bear Form",
    "fcrFhrFbrClass_druid-wolf": "Druid Wolf Form",
    "fcrFhrFbrClass_necromancer": "Necromancer/Warlock",
    "fcrFhrFbrClass_necromancer-vampire": "Necromancer Vampire Form",
    "fcrFhrFbrClass_paladin": "Paladin",
    "fcrFhrFbrClass_sorceress": "Sorceress"
```

Add hand-authored zh-TW:
```json
    "fcrFhrFbrPageTitle": "FCR / FHR / FBR 加速斷點",
    "fcrFhrFbrPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中每個職業的施法加速、擊退加速與格擋加速斷點。",
    "fcrFhrFbrFramesLabel": "幀數",
    "fcrFhrFbrFcrLabel": "施法加速",
    "fcrFhrFbrFhrLabel": "擊退加速",
    "fcrFhrFbrFbrLabel": "格擋加速",
    "fcrFhrFbrClass_amazon": "亞馬遜",
    "fcrFhrFbrClass_assassin": "刺客",
    "fcrFhrFbrClass_barbarian": "野蠻人",
    "fcrFhrFbrClass_druid-human": "德魯伊（人形）",
    "fcrFhrFbrClass_druid-bear": "德魯伊（熊形）",
    "fcrFhrFbrClass_druid-wolf": "德魯伊（狼形）",
    "fcrFhrFbrClass_necromancer": "死靈法師",
    "fcrFhrFbrClass_necromancer-vampire": "死靈法師（吸血鬼形態）",
    "fcrFhrFbrClass_paladin": "聖騎士",
    "fcrFhrFbrClass_sorceress": "女巫"
```

Run `node scripts/translate-nav-items-ui-zh-cn.mjs` to derive zh-CN.

- [ ] **Step 2: Write the failing data test**

Create `src/lib/grail/fcrFhrFbr.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FCR_FHR_FBR_TABLES } from './fcrFhrFbr';

describe('FCR_FHR_FBR_TABLES', () => {
  it('has exactly 10 class/form entries, matching d2r.world', () => {
    expect(FCR_FHR_FBR_TABLES.length).toBe(10);
    expect(FCR_FHR_FBR_TABLES.map(t => t.id).sort()).toEqual([
      'amazon', 'assassin', 'barbarian', 'druid-bear', 'druid-human', 'druid-wolf',
      'necromancer', 'necromancer-vampire', 'paladin', 'sorceress',
    ]);
  });

  it('Sorceress FCR has an "other spells" and a "Lightning / Chain Lightning" sub-column with correct values', () => {
    const sor = FCR_FHR_FBR_TABLES.find(t => t.id === 'sorceress')!;
    const other = sor.fcr.find(c => c.label === 'other spells')!;
    const lightning = sor.fcr.find(c => c.label === 'Lightning / Chain Lightning')!;
    expect(other.rows[11]).toBe('20%');
    expect(lightning.rows[11]).toBe('194%');
    expect(other.rows[3]).toBeUndefined();
  });

  it('Amazon FBR sub-columns match d2r.world exactly', () => {
    const ama = FCR_FHR_FBR_TABLES.find(t => t.id === 'amazon')!;
    const oneHand = ama.fbr.find(c => c.label === '1H swinging weapon')!;
    const other = ama.fbr.find(c => c.label === 'Other weapons')!;
    expect(oneHand.rows[5]).toBe('480%');
    expect(other.rows[1]).toBe('600%');
    expect(oneHand.rows[1]).toBeUndefined();
  });

  it('Paladin FBR sub-columns (Normal vs Holy Shield) match d2r.world exactly', () => {
    const pal = FCR_FHR_FBR_TABLES.find(t => t.id === 'paladin')!;
    const normal = pal.fbr.find(c => c.label === 'Normal')!;
    const holyShield = pal.fbr.find(c => c.label === 'Holy Shield')!;
    expect(normal.rows[1]).toBe('600%');
    expect(holyShield.rows[1]).toBe('86%');
    expect(holyShield.rows[2]).toBe('0%');
  });

  it('single-column stats (e.g. Assassin FCR) use one column with an empty label', () => {
    const asn = FCR_FHR_FBR_TABLES.find(t => t.id === 'assassin')!;
    expect(asn.fcr.length).toBe(1);
    expect(asn.fcr[0].label).toBe('');
    expect(asn.fcr[0].rows[9]).toBe('174%');
    expect(asn.fcr[0].rows[16]).toBe('0%');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/fcrFhrFbr.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `fcrFhrFbr.ts`**

Create `src/lib/grail/fcrFhrFbr.ts` with the complete data below (hand-transcribed from
`https://d2r.world/en-US/info/character/fcr-fhr-fbr`, this session, per this project's
established policy for curated content with no reliable raw-data equivalent):

```ts
export interface StatColumn {
  label: string;
  rows: Record<number, string>;
}

export interface FcrFhrFbrTable {
  id: string;
  className: string;
  fcr: StatColumn[];
  fhr: StatColumn[];
  fbr: StatColumn[];
}

// Hand-transcribed from d2r.world (https://d2r.world/en-US/info/character/fcr-fhr-fbr),
// this session, per this project's established policy for curated/deterministic content
// with no reliable raw-data equivalent (breakpoint frame counts come from each
// skill/action's internal animation-length data, not a plain vendored JSON field — see
// the design spec). Blank cells mean no breakpoint exists at that frame count for that
// column; they are omitted from `rows` rather than filled in.
export const FCR_FHR_FBR_TABLES: FcrFhrFbrTable[] = [
  {
    id: 'amazon',
    className: 'Amazon',
    fcr: [{ label: '', rows: {
      11: '152%', 12: '99%', 13: '68%', 14: '48%', 15: '32%', 16: '22%', 17: '14%', 18: '7%', 19: '0%',
    } }],
    fhr: [{ label: '', rows: {
      3: '600%', 4: '174%', 5: '86%', 6: '52%', 7: '32%', 8: '20%', 9: '13%', 10: '6%', 11: '0%',
    } }],
    fbr: [
      { label: '1H swinging weapon', rows: {
        5: '480%', 6: '200%', 7: '120%', 8: '80%', 9: '56%', 10: '40%', 11: '29%', 12: '23%', 13: '15%', 14: '11%', 15: '6%', 16: '4%', 17: '0%',
      } },
      { label: 'Other weapons', rows: {
        1: '600%', 2: '86%', 3: '32%', 4: '13%', 5: '0%',
      } },
    ],
  },
  {
    id: 'assassin',
    className: 'Assassin',
    fcr: [{ label: '', rows: {
      9: '174%', 10: '102%', 11: '65%', 12: '42%', 13: '27%', 14: '16%', 15: '8%', 16: '0%',
    } }],
    fhr: [{ label: '', rows: {
      3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
    } }],
    fbr: [{ label: '', rows: {
      1: '600%', 2: '86%', 3: '32%', 4: '13%', 5: '0%',
    } }],
  },
  {
    id: 'barbarian',
    className: 'Barbarian',
    fcr: [{ label: '', rows: {
      7: '200%', 8: '105%', 9: '63%', 10: '37%', 11: '20%', 12: '9%', 13: '0%',
    } }],
    fhr: [{ label: '', rows: {
      3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
    } }],
    fbr: [{ label: '', rows: {
      2: '280%', 3: '86%', 4: '42%', 5: '20%', 6: '9%', 7: '0%',
    } }],
  },
  {
    id: 'druid-human',
    className: 'Druid Human Form',
    fcr: [{ label: '', rows: {
      10: '163%', 11: '99%', 12: '68%', 13: '46%', 14: '30%', 15: '19%', 16: '10%', 17: '4%', 18: '0%',
    } }],
    fhr: [
      { label: '1H swinging weapon', rows: {
        4: '456%', 5: '174%', 6: '99%', 7: '63%', 8: '42%', 9: '29%', 10: '19%', 11: '13%', 12: '7%', 13: '3%', 14: '0%',
      } },
      { label: 'Other weapons', rows: {
        4: '377%', 5: '152%', 6: '86%', 7: '56%', 8: '39%', 9: '26%', 10: '16%', 11: '10%', 12: '5%', 13: '0%',
      } },
    ],
    fbr: [{ label: '', rows: {
      3: '600%', 4: '174%', 5: '86%', 6: '52%', 7: '32%', 8: '20%', 9: '13%', 10: '6%', 11: '0%',
    } }],
  },
  {
    id: 'druid-bear',
    className: 'Druid Bear Form',
    fcr: [{ label: '', rows: {
      9: '163%', 10: '99%', 11: '63%', 12: '40%', 13: '26%', 14: '15%', 15: '7%', 16: '0%',
    } }],
    fhr: [{ label: '', rows: {
      4: '360%', 5: '152%', 6: '86%', 7: '54%', 8: '37%', 9: '24%', 10: '16%', 11: '10%', 12: '5%', 13: '0%',
    } }],
    fbr: [{ label: '', rows: {
      4: '223%', 5: '109%', 6: '65%', 7: '40%', 8: '27%', 9: '16%', 10: '10%', 11: '5%', 12: '0%',
    } }],
  },
  {
    id: 'druid-wolf',
    className: 'Druid Wolf Form',
    fcr: [{ label: '', rows: {
      9: '157%', 10: '95%', 11: '60%', 12: '40%', 13: '26%', 14: '14%', 15: '6%', 16: '0%',
    } }],
    fhr: [{ label: '', rows: {
      2: '280%', 3: '86%', 4: '42%', 5: '20%', 6: '9%', 7: '0%',
    } }],
    fbr: [{ label: '', rows: {
      3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
    } }],
  },
  {
    id: 'necromancer',
    className: 'Necromancer/Warlock',
    fcr: [{ label: '', rows: {
      9: '125%', 10: '75%', 11: '48%', 12: '30%', 13: '18%', 14: '9%', 15: '0%',
    } }],
    fhr: [{ label: '', rows: {
      4: '377%', 5: '152%', 6: '86%', 7: '56%', 8: '39%', 9: '26%', 10: '16%', 11: '10%', 12: '5%', 13: '0%',
    } }],
    fbr: [{ label: '', rows: {
      3: '600%', 4: '174%', 5: '86%', 6: '52%', 7: '32%', 8: '20%', 9: '13%', 10: '6%', 11: '0%',
    } }],
  },
  {
    id: 'necromancer-vampire',
    className: 'Necromancer Vampire Form',
    fcr: [{ label: '', rows: {
      13: '180%', 14: '120%', 15: '86%', 16: '65%', 17: '48%', 18: '35%', 19: '24%', 20: '18%', 21: '11%', 22: '6%', 23: '0%',
    } }],
    fhr: [{ label: '', rows: {
      6: '117%', 7: '72%', 8: '48%', 9: '34%', 10: '24%', 11: '16%', 12: '10%', 13: '6%', 14: '2%', 15: '0%',
    } }],
    fbr: [{ label: '', rows: {
      3: '600%', 4: '174%', 5: '86%', 6: '52%', 7: '32%', 8: '20%', 9: '13%', 10: '6%', 11: '0%',
    } }],
  },
  {
    id: 'paladin',
    className: 'Paladin',
    fcr: [
      { label: 'other spells', rows: {
        9: '125%', 10: '75%', 11: '48%', 12: '30%', 13: '18%', 14: '9%', 15: '0%',
      } },
      { label: 'Fist of the Heavens', rows: {
        17: '86%', 18: '39%', 19: '0%',
      } },
    ],
    fhr: [
      { label: 'Spears and staves', rows: {
        4: '280%', 5: '129%', 6: '75%', 7: '48%', 8: '32%', 9: '20%', 10: '13%', 11: '7%', 12: '3%', 13: '0%',
      } },
      { label: 'Other weapons', rows: {
        3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
      } },
    ],
    fbr: [
      { label: 'Normal', rows: {
        1: '600%', 2: '86%', 3: '32%', 4: '13%', 5: '0%',
      } },
      { label: 'Holy Shield', rows: {
        1: '86%', 2: '0%',
      } },
    ],
  },
  {
    id: 'sorceress',
    className: 'Sorceress',
    fcr: [
      { label: 'other spells', rows: {
        7: '200%', 8: '105%', 9: '63%', 10: '37%', 11: '20%', 12: '9%', 13: '0%',
      } },
      { label: 'Lightning / Chain Lightning', rows: {
        11: '194%', 12: '117%', 13: '78%', 14: '52%', 15: '35%', 16: '23%', 17: '15%', 18: '7%', 19: '0%',
      } },
    ],
    fhr: [{ label: '', rows: {
      5: '280%', 6: '142%', 7: '86%', 8: '60%', 9: '42%', 10: '30%', 11: '20%', 12: '14%', 13: '9%', 14: '5%', 15: '0%',
    } }],
    fbr: [{ label: '', rows: {
      3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
    } }],
  },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/fcrFhrFbr.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Write the failing component test**

Create `src/components/items/FcrFhrFbrTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import FcrFhrFbrTable from './FcrFhrFbrTable';
import messages from '../../../messages/en.json';
import type { FcrFhrFbrTable as TableData } from '@/lib/grail/fcrFhrFbr';

const singleColumnTable: TableData = {
  id: 'assassin',
  className: 'Assassin',
  fcr: [{ label: '', rows: { 9: '174%', 16: '0%' } }],
  fhr: [{ label: '', rows: { 3: '200%' } }],
  fbr: [{ label: '', rows: { 1: '600%' } }],
};

const subSplitTable: TableData = {
  id: 'sorceress',
  className: 'Sorceress',
  fcr: [
    { label: 'other spells', rows: { 7: '200%' } },
    { label: 'Lightning / Chain Lightning', rows: { 11: '194%' } },
  ],
  fhr: [{ label: '', rows: { 5: '280%' } }],
  fbr: [{ label: '', rows: { 3: '200%' } }],
};

describe('FcrFhrFbrTable', () => {
  it('renders the class selector and the first table by default', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FcrFhrFbrTable tables={[singleColumnTable, subSplitTable]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Assassin')).toBeInTheDocument();
    expect(screen.getByText('Sorceress')).toBeInTheDocument();
    expect(screen.getByText('174%')).toBeInTheDocument();
  });

  it('switches to another class table on click, without a sub-header row for single-column stats', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FcrFhrFbrTable tables={[singleColumnTable, subSplitTable]} />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sorceress' }));
    expect(screen.getByText('other spells')).toBeInTheDocument();
    expect(screen.getByText('Lightning / Chain Lightning')).toBeInTheDocument();
    expect(screen.getByText('200%')).toBeInTheDocument();
    expect(screen.getByText('194%')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/components/items/FcrFhrFbrTable.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 8: Implement `FcrFhrFbrTable`**

Create `src/components/items/FcrFhrFbrTable.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FcrFhrFbrTable as TableData } from '@/lib/grail/fcrFhrFbr';

function frameNumbers(columns: { rows: Record<number, string> }[]): number[] {
  const set = new Set<number>();
  for (const col of columns) {
    for (const frame of Object.keys(col.rows)) set.add(Number(frame));
  }
  return Array.from(set).sort((a, b) => a - b);
}

export default function FcrFhrFbrTable({ tables }: { tables: TableData[] }) {
  const t = useTranslations('Items');
  const [selectedId, setSelectedId] = useState(tables[0].id);
  const table = tables.find(tbl => tbl.id === selectedId) ?? tables[0];

  const hasSubheaders = table.fcr.length > 1 || table.fhr.length > 1 || table.fbr.length > 1;
  const frames = frameNumbers([...table.fcr, ...table.fhr, ...table.fbr]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap gap-2">
        {tables.map(tbl => (
          <button
            key={tbl.id}
            type="button"
            aria-current={tbl.id === selectedId ? 'true' : undefined}
            onClick={() => setSelectedId(tbl.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tbl.id === selectedId
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-zinc-800 text-zinc-300 hover:text-amber-300'
            }`}
          >
            {t(`fcrFhrFbrClass_${tbl.id}`)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-zinc-900 border border-zinc-700 rounded-xl p-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th rowSpan={hasSubheaders ? 2 : 1} className="text-left text-xs uppercase text-zinc-500 pb-2 pr-3">
                {t('fcrFhrFbrFramesLabel')}
              </th>
              <th colSpan={table.fcr.length} className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">
                {t('fcrFhrFbrFcrLabel')}
              </th>
              <th colSpan={table.fhr.length} className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">
                {t('fcrFhrFbrFhrLabel')}
              </th>
              <th colSpan={table.fbr.length} className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">
                {t('fcrFhrFbrFbrLabel')}
              </th>
            </tr>
            {hasSubheaders && (
              <tr>
                {[...table.fcr, ...table.fhr, ...table.fbr].map((col, i) => (
                  <th key={i} className="text-left text-xs text-zinc-500 pb-2 px-3 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="text-zinc-300">
            {frames.map(frame => (
              <tr key={frame}>
                <td className="py-1 pr-3 text-zinc-100 font-semibold">{frame}</td>
                {[...table.fcr, ...table.fhr, ...table.fbr].map((col, i) => (
                  <td key={i} className="py-1 px-3">{col.rows[frame] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run src/components/items/FcrFhrFbrTable.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 10: Wire the page**

Modify `src/app/[locale]/character/fcr-fhr-fbr/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FCR_FHR_FBR_TABLES } from '@/lib/grail/fcrFhrFbr';
import FcrFhrFbrTable from '@/components/items/FcrFhrFbrTable';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function FcrFhrFbrPage({
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
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('fcrFhrFbrPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('fcrFhrFbrPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <FcrFhrFbrTable tables={FCR_FHR_FBR_TABLES} />
      </div>
    </main>
  );
}
```

Note: this page no longer needs `Nav`'s `misc_fcrFhrFbr` translation for its own
heading (it now uses `Items.fcrFhrFbrPageTitle`), but that `Nav` key stays in place
unchanged since it's still used by the nav-menu label pointing at this route.

- [ ] **Step 11: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm `out/en/character/fcr-fhr-fbr/index.html` (and zh-TW/zh-CN
equivalents) exist with real content.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/lib/grail/fcrFhrFbr.ts src/lib/grail/fcrFhrFbr.test.ts src/components/items/FcrFhrFbrTable.tsx src/components/items/FcrFhrFbrTable.test.tsx "src/app/[locale]/character/fcr-fhr-fbr/page.tsx"
git commit -m "Add FCR/FHR/FBR breakpoint page"
```

---

### Task 2: Full verification + d2r.world spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-fcr-fhr-fbr-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual + d2r.world spot-check**

Serve the static export locally. Navigate to `/en/character/fcr-fhr-fbr`. Confirm at
least 5 of the 10 class/form tables match d2r.world's real content exactly, including
sub-column headers where they exist (Sorceress FCR, Amazon FBR, Druid Human Form FHR,
Paladin FCR/FHR/FBR) and blank cells where d2r.world shows none. Check the class
selector switches tables correctly. Check in zh-TW and zh-CN locales (class names and
labels translated; percentages/frame numbers unchanged). Check at both desktop and
mobile widths via `resize_window` (the table has horizontal scroll for the widest
tables, e.g. Paladin).

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
