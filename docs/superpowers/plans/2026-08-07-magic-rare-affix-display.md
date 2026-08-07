# Magic/Rare Affix Pages Redesign (Step 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Magic/Rare Items pages' collapse-by-name affix table with a two-column (desktop) prefix/suffix layout, grouped into mutual-exclusivity boxes keyed by the `group` field, using the real formatted stat templates from `data/magic-affixes.json` instead of bare numbers.

**Architecture:** `affixCatalog.ts`'s `Affix` type changes from a flattened single-stat summary to a full per-affix object (`group`, `stats[]`); a new grouping helper buckets affixes by `group` and sorts groups by their highest-alvl member. A new small template-substitution utility (`formatAffixTemplate.ts`) turns a raw template string (e.g. `"%+d Defense"`) plus a min/max into real display text (e.g. `"+3–5 Defense"`). `AffixTable.tsx` is rewritten to render group boxes instead of collapsible same-name rows.

**Tech Stack:** React/Next.js (existing site stack), Vitest + Testing Library for tests, TypeScript.

---

## Confirmed facts (don't re-derive)

- Every affix in `data/magic-affixes.json` has a non-zero `group`.
- `stats[].template` (when resolved) uses exactly 4 placeholder shapes across the whole dataset: `%+d`, `%+d%`, `%d`, `%d%`.
- `stats[].template` can be `null` (fall back to `` `${label}: ${min}–${max}` ``, using the existing `signedRange`/`signedValue` helpers in `src/lib/grail/formatStat.ts` for sign handling).
- Real example used in tests below: prefix "Rugged" family (3 alvl tiers, `ac` stat, template `"%+d Defense"`), and suffixes "of Health" (alvl 7) / "of Protection" (alvl 18) sharing `group: 1`, both a `red-dmg` stat with template `"Damage Reduced by %d"`.

---

## Task 1: `formatAffixTemplate` utility

**Files:**
- Create: `src/lib/grail/formatAffixTemplate.ts`
- Test: `src/lib/grail/formatAffixTemplate.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/grail/formatAffixTemplate.test.ts
import { describe, it, expect } from 'vitest';
import { substituteTemplate, formatAffixStatText } from './formatAffixTemplate';

describe('substituteTemplate', () => {
  it('substitutes a %+d placeholder as a signed single value when min === max', () => {
    expect(substituteTemplate('%+d Defense', 5, 5)).toBe('+5 Defense');
  });

  it('substitutes a %+d placeholder as a signed range when min !== max', () => {
    expect(substituteTemplate('%+d Defense', 3, 5)).toBe('+3–5 Defense');
  });

  it('substitutes a %d placeholder as a plain range (no sign)', () => {
    expect(substituteTemplate('Damage Reduced by %d', 3, 5)).toBe('Damage Reduced by 3–5');
  });

  it('substitutes a %d placeholder as a plain single value when min === max', () => {
    expect(substituteTemplate('Damage Reduced by %d', 10, 10)).toBe('Damage Reduced by 10');
  });

  it('substitutes a %+d%% placeholder as a signed range with a trailing percent sign', () => {
    expect(substituteTemplate('%+d% Enhanced Damage', 20, 40)).toBe('+20–40% Enhanced Damage');
  });

  it('substitutes a %d%% placeholder as a plain range with a trailing percent sign', () => {
    expect(substituteTemplate('%d% Chance to Cast', 5, 5)).toBe('5% Chance to Cast');
  });

  it('returns the template unchanged when it has no recognized placeholder', () => {
    expect(substituteTemplate('Indestructible', 1, 1)).toBe('Indestructible');
  });
});

describe('formatAffixStatText', () => {
  it('uses the template when present', () => {
    const text = formatAffixStatText({ label: 'Defense', template: '%+d Defense', min: 3, max: 5 });
    expect(text).toBe('+3–5 Defense');
  });

  it('falls back to "label: range" when template is null, applying signed if set', () => {
    const text = formatAffixStatText({ label: 'Maximum Damage', template: null, min: 1, max: 2, signed: true });
    expect(text).toBe('Maximum Damage: +1–2');
  });

  it('falls back to "label: value" (no range) when min === max and template is null', () => {
    const text = formatAffixStatText({ label: 'Sockets', template: null, min: 1, max: 1 });
    expect(text).toBe('Sockets: 1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/grail/formatAffixTemplate.test.ts` (from `D2R-Records`)
Expected: FAIL — `Cannot find module './formatAffixTemplate'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/grail/formatAffixTemplate.ts
import { signedRange, signedValue } from './formatStat';

// The only 4 printf-style placeholder shapes present anywhere in
// data/magic-affixes.json's stats[].template field (verified during the
// step-1 data work) -- checked longest/most-specific first so "%+d%"
// isn't matched by the shorter "%+d" check first.
const PLACEHOLDER_ORDER = ['%+d%', '%d%', '%+d', '%d'] as const;

export function substituteTemplate(template: string, min: number, max: number): string {
  for (const token of PLACEHOLDER_ORDER) {
    if (!template.includes(token)) continue;
    const hasPercent = token.endsWith('%');
    const signed = token.startsWith('%+d');
    const numberText = min === max
      ? (signed ? signedValue(min, true) : String(min))
      : (signed ? signedRange(min, max, true) : `${min}–${max}`);
    return template.replace(token, hasPercent ? `${numberText}%` : numberText);
  }
  return template;
}

export interface AffixStatLike {
  label: string;
  template: string | null;
  min: number;
  max: number;
  signed?: boolean;
}

// Real formatted stat text for one affix stat -- the template path when
// available (the common case, verified during step 1), falling back to
// "label: range" for the handful of stats with no resolved template
// (genuinely-unresolved codes, or skill-referencing compound stats which
// intentionally get template: null).
export function formatAffixStatText(stat: AffixStatLike): string {
  if (stat.template) return substituteTemplate(stat.template, stat.min, stat.max);
  const range = stat.min === stat.max
    ? signedValue(stat.min, stat.signed)
    : signedRange(stat.min, stat.max, stat.signed);
  return `${stat.label}: ${range}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/grail/formatAffixTemplate.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
cd D2R-Records
git add src/lib/grail/formatAffixTemplate.ts src/lib/grail/formatAffixTemplate.test.ts
git commit -m "Add formatAffixTemplate utility for real affix stat text

Substitutes an affix's min/max range into its real in-game template
string (e.g. \"%+d Defense\" -> \"+3-5 Defense\"), handling the 4
placeholder shapes present in the data, falling back to a plain
\"label: range\" format when no template is available.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `affixCatalog.ts` — full-stat Affix type + exclusivity grouping

**Files:**
- Modify: `src/lib/grail/affixCatalog.ts`
- Modify: `src/lib/grail/affixCatalog.test.ts`

- [ ] **Step 1: Write the failing tests (added to the existing file)**

Add these to the existing `describe('affixCatalog', ...)` block in `src/lib/grail/affixCatalog.test.ts` (keep all 4 existing tests as-is — they still pass unchanged against the new shape, since they only check `.name`/array lengths):

```ts
  it('getAffixesForCategory returns the full stats array and group, not a flattened single stat', () => {
    const { prefixes } = getAffixesForCategory('magic', 'rings', 'en');
    const rugged = prefixes.find(p => p.name === 'Rugged');
    expect(rugged).toBeDefined();
    expect(typeof rugged!.group).toBe('number');
    expect(Array.isArray(rugged!.stats)).toBe(true);
    expect(rugged!.stats.length).toBeGreaterThan(0);
    expect(rugged!.stats[0]).toHaveProperty('template');
    expect(rugged!.stats[0]).toHaveProperty('label');
  });

  it('groupAffixesByExclusivity buckets affixes sharing a group id together', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const health = suffixes.find(s => s.name === 'of Health');
    const protection = suffixes.find(s => s.name === 'of Protection');
    expect(health).toBeDefined();
    expect(protection).toBeDefined();
    expect(health!.group).toBe(protection!.group);

    const groups = groupAffixesByExclusivity(suffixes);
    const sharedGroup = groups.find(g => g.affixes.some(a => a.name === 'of Health'));
    expect(sharedGroup).toBeDefined();
    expect(sharedGroup!.affixes.map(a => a.name)).toEqual(expect.arrayContaining(['of Health', 'of Protection']));
  });

  it('groupAffixesByExclusivity uses the highest-alvl member as the group header', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    const sharedGroup = groups.find(g => g.affixes.some(a => a.name === 'of Health'))!;
    // "of Protection" (alvl 18) outranks "of Health" (alvl 7).
    expect(sharedGroup.headerAffix.name).toBe('of Protection');
    expect(sharedGroup.headerText).toContain('of Protection');
  });

  it('groupAffixesByExclusivity sorts groups by their header alvl descending', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i - 1].headerAffix.alvl).toBeGreaterThanOrEqual(groups[i].headerAffix.alvl);
    }
  });
```

Update the test file's import line to also pull in `groupAffixesByExclusivity`:

```ts
import { getAffixCategories, getAffixesForCategory, groupAffixesByExclusivity } from './affixCatalog';
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run src/lib/grail/affixCatalog.test.ts`
Expected: FAIL — `groupAffixesByExclusivity is not a function`, plus the new-shape assertions failing against the current flattened `Affix` type.

- [ ] **Step 3: Rewrite `affixCatalog.ts`**

Replace the entire file:

```ts
// src/lib/grail/affixCatalog.ts
import magicAffixesFull from '../../../data/magic-affixes.json';
import type { Locale } from './catalog';
import { formatAffixStatText } from './formatAffixTemplate';

export type AffixKind = 'magic' | 'rare';

export interface AffixStat {
  key: string;
  label: string;
  template: string | null;
  min: number;
  max: number;
  isSkillRef: boolean;
  signed?: boolean;
}

export interface Affix {
  name: string;
  alvl: number;
  group: number;
  stats: AffixStat[];
  itemTypes: string[];
}

export interface AffixGroup {
  headerAffix: Affix;
  headerText: string;
  affixes: Affix[];
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
  const toAffix = (a: (typeof magicAffixesFull)[number]): Affix => ({
    name: a.name[locale],
    alvl: a.alvl,
    group: a.group,
    itemTypes: a.itemTypes,
    stats: a.stats.map(s => ({
      key: s.key,
      label: s.label[locale],
      // English-only fallback templates (e.g. dmg%/indestruct) only have
      // an `en` key -- fall back to that rather than losing the template
      // entirely for zh-TW/zh-CN readers.
      template: (s.template as Record<string, string> | null)?.[locale]
        ?? (s.template as Record<string, string> | null)?.en
        ?? null,
      min: s.min,
      max: s.max,
      isSkillRef: s.isSkillRef,
      signed: s.signed,
    })),
  });
  return {
    prefixes: relevant.filter(a => a.kind === 'prefix').map(toAffix),
    suffixes: relevant.filter(a => a.kind === 'suffix').map(toAffix),
  };
}

// Buckets a flat affix list by their shared `group` (mutual-exclusivity)
// field -- affixes sharing a group id can never both roll on the same
// item. Every affix belongs to some group (verified: none are 0 in the
// data), including singleton groups of 1. Each group's `headerAffix` is
// its own highest-alvl member; `headerText` is that affix's name plus its
// first stat's formatted text evaluated at its own max value (a compact
// label, not a full multi-stat list, even for multi-stat header affixes).
// Groups are sorted by header alvl descending (highest-level first).
export function groupAffixesByExclusivity(affixes: Affix[]): AffixGroup[] {
  const byGroup = new Map<number, Affix[]>();
  for (const a of affixes) {
    const list = byGroup.get(a.group);
    if (list) list.push(a);
    else byGroup.set(a.group, [a]);
  }
  const groups: AffixGroup[] = [];
  for (const members of byGroup.values()) {
    const sorted = [...members].sort((a, b) => b.alvl - a.alvl);
    const headerAffix = sorted[0];
    const headerStat = headerAffix.stats[0];
    const headerText = headerStat
      ? `${headerAffix.name} — ${formatAffixStatText({ ...headerStat, min: headerStat.max, max: headerStat.max })}`
      : headerAffix.name;
    groups.push({ headerAffix, headerText, affixes: sorted });
  }
  return groups.sort((a, b) => b.headerAffix.alvl - a.headerAffix.alvl);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/grail/affixCatalog.test.ts`
Expected: PASS (8 tests — 4 existing + 4 new)

- [ ] **Step 5: Commit**

```bash
cd D2R-Records
git add src/lib/grail/affixCatalog.ts src/lib/grail/affixCatalog.test.ts
git commit -m "affixCatalog: return full stats[]/group instead of flattened single stat

getAffixesForCategory previously truncated every affix to its first
stat and dropped label/template/group entirely. Now returns the full
per-affix shape, plus a new groupAffixesByExclusivity() helper that
buckets affixes by their mutual-exclusivity group field, with the
group's own highest-alvl member as its header.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Rewrite `AffixTable.tsx`

**Files:**
- Modify: `src/components/items/AffixTable.tsx`
- Modify: `src/components/items/AffixTable.test.tsx`

- [ ] **Step 1: Write the failing tests (replace the whole file)**

```tsx
// src/components/items/AffixTable.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AffixTable from './AffixTable';
import messages from '../../../messages/en.json';
import type { Affix } from '@/lib/grail/affixCatalog';

function renderTable(props: React.ComponentProps<typeof AffixTable>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AffixTable {...props} />
    </NextIntlClientProvider>
  );
}

function affix(overrides: Partial<Affix>): Affix {
  return {
    name: 'Rugged',
    alvl: 8,
    group: 1,
    itemTypes: ['boots'],
    stats: [{ key: 'ac', label: 'Defense', template: '%+d Defense', min: 5, max: 10, isSkillRef: false, signed: true }],
    ...overrides,
  };
}

describe('AffixTable', () => {
  it('renders prefix and suffix section headings', () => {
    renderTable({
      prefixes: [affix({ name: 'Rugged' })],
      suffixes: [affix({ name: 'of Protection', group: 2 })],
    });
    expect(screen.getByText('Prefixes')).toBeInTheDocument();
    expect(screen.getByText('Suffixes')).toBeInTheDocument();
  });

  it('shows every tier as its own row, without collapsing same-name tiers', () => {
    renderTable({
      prefixes: [
        affix({ name: 'Rugged', alvl: 1, group: 1, stats: [{ key: 'ac', label: 'Defense', template: '%+d Defense', min: 1, max: 3, isSkillRef: false, signed: true }] }),
        affix({ name: 'Rugged', alvl: 8, group: 1, stats: [{ key: 'ac', label: 'Defense', template: '%+d Defense', min: 5, max: 10, isSkillRef: false, signed: true }] }),
        affix({ name: 'Rugged', alvl: 16, group: 1, stats: [{ key: 'ac', label: 'Defense', template: '%+d Defense', min: 20, max: 20, isSkillRef: false, signed: true }] }),
      ],
      suffixes: [],
    });
    // Every tier's own formatted text is visible at once -- nothing collapsed.
    expect(screen.getByText('+1–3 Defense')).toBeInTheDocument();
    expect(screen.getByText('+5–10 Defense')).toBeInTheDocument();
    expect(screen.getByText('+20 Defense')).toBeInTheDocument();
  });

  it('groups affixes sharing a group id into one box, with the highest-alvl member as the header', () => {
    renderTable({
      prefixes: [],
      suffixes: [
        affix({
          name: 'of Health', alvl: 7, group: 1,
          stats: [{ key: 'red-dmg', label: 'Damage Reduced', template: 'Damage Reduced by %d', min: 3, max: 5, isSkillRef: false }],
        }),
        affix({
          name: 'of Protection', alvl: 18, group: 1,
          stats: [{ key: 'red-dmg', label: 'Damage Reduced', template: 'Damage Reduced by %d', min: 6, max: 10, isSkillRef: false }],
        }),
      ],
    });
    // Header uses the higher-alvl "of Protection", evaluated at its own max (10).
    expect(screen.getByText(/of Protection.*Damage Reduced by 10/)).toBeInTheDocument();
    // Both rows' own text still visible inside the box.
    expect(screen.getByText('Damage Reduced by 3–5')).toBeInTheDocument();
    expect(screen.getByText('Damage Reduced by 6–10')).toBeInTheDocument();
  });

  it('renders multiple stat lines for a multi-stat affix', () => {
    renderTable({
      prefixes: [
        affix({
          name: 'Composite', alvl: 20, group: 5,
          stats: [
            { key: 'str', label: 'Strength', template: '%+d to Strength', min: 10, max: 10, isSkillRef: false, signed: true },
            { key: 'dex', label: 'Dexterity', template: '%+d to Dexterity', min: 5, max: 5, isSkillRef: false, signed: true },
          ],
        }),
      ],
      suffixes: [],
    });
    expect(screen.getByText('+10 to Strength')).toBeInTheDocument();
    expect(screen.getByText('+5 to Dexterity')).toBeInTheDocument();
  });

  it('falls back to "label: range" when a stat has no template', () => {
    renderTable({
      prefixes: [
        affix({
          name: 'Obscure', alvl: 3, group: 9,
          stats: [{ key: 'weird', label: 'Weird Stat', template: null, min: 1, max: 2, isSkillRef: false }],
        }),
      ],
      suffixes: [],
    });
    expect(screen.getByText('Weird Stat: 1–2')).toBeInTheDocument();
  });

  it('lays out prefixes and suffixes as a two-column grid container', () => {
    const { container } = renderTable({
      prefixes: [affix({ name: 'Rugged' })],
      suffixes: [affix({ name: 'of Protection', group: 2 })],
    });
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('lg:grid-cols-2');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/items/AffixTable.test.tsx`
Expected: FAIL — old component doesn't match new `Affix` shape (TypeScript errors) and none of the new text/behavior exists yet.

- [ ] **Step 3: Rewrite `AffixTable.tsx`**

Replace the entire file:

```tsx
// src/components/items/AffixTable.tsx
'use client';

import { useTranslations } from 'next-intl';
import type { Affix, AffixGroup } from '@/lib/grail/affixCatalog';
import { groupAffixesByExclusivity } from '@/lib/grail/affixCatalog';
import { formatAffixStatText } from '@/lib/grail/formatAffixTemplate';

function AffixRow({ affix }: { affix: Affix }) {
  const t = useTranslations('Items');
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm border-b border-panel-border last:border-b-0 gap-3">
      <span className="text-[#cbb87f] font-semibold">{affix.name}</span>
      <span className="text-muted text-xs whitespace-nowrap">{t('affixAlvlLabel')} {affix.alvl}</span>
      <div className="text-[#8080f3] text-right flex flex-col">
        {affix.stats.map((stat, i) => (
          <span key={`${stat.key}-${i}`}>{formatAffixStatText(stat)}</span>
        ))}
      </div>
    </div>
  );
}

function AffixGroupBox({ group }: { group: AffixGroup }) {
  return (
    <div className="bg-panel-alt border border-panel-border rounded-xl overflow-hidden">
      <div className="px-4 py-2 text-sm font-bold text-gold-bright font-cinzel border-b border-panel-border">
        {group.headerText}
      </div>
      <div className="flex flex-col">
        {group.affixes.map((a, i) => (
          <AffixRow key={`${a.name}-${a.alvl}-${i}`} affix={a} />
        ))}
      </div>
    </div>
  );
}

function AffixSection({ title, affixes }: { title: string; affixes: Affix[] }) {
  if (affixes.length === 0) return null;
  const groups = groupAffixesByExclusivity(affixes);
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-parchment-bright">{title}</h3>
      <div className="flex flex-col gap-3">
        {groups.map((g, i) => (
          <AffixGroupBox key={`${g.headerAffix.name}-${g.headerAffix.alvl}-${i}`} group={g} />
        ))}
      </div>
    </div>
  );
}

export default function AffixTable({ prefixes, suffixes }: { prefixes: Affix[]; suffixes: Affix[] }) {
  const t = useTranslations('Items');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
      <AffixSection title={t('affixPrefixesLabel')} affixes={prefixes} />
      <AffixSection title={t('affixSuffixesLabel')} affixes={suffixes} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/items/AffixTable.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd D2R-Records
git add src/components/items/AffixTable.tsx src/components/items/AffixTable.test.tsx
git commit -m "Redesign AffixTable: exclusivity-group boxes, two-column layout

Replaces the old collapse-by-name single-row UI with mutual-exclusivity
group boxes (keyed by the group field from step 1's data work), every
tier shown as its own row, real formatted stat text via
formatAffixStatText instead of bare min-max numbers, and a two-column
desktop layout (prefixes | suffixes).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Verification

**Files:** none (verification only)

- [ ] **Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (The `[locale]/items/magic/[category]/page.tsx` and `rare/[category]/page.tsx` pages already just pass `prefixes`/`suffixes` straight into `<AffixTable>` without touching individual fields, so they need no changes — confirm this by reading both files if the type-check surfaces anything unexpected there.)

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all pass except the one documented pre-existing failure (`CategoryCardGrid.test.tsx` → "renders no icon for a category absent from the icon map").

- [ ] **Step 3: Manual data spot-check**

Run this from `D2R-Records` to confirm a real category renders sensibly end-to-end:

```bash
node -e "
const { getAffixesForCategory, groupAffixesByExclusivity } = require('./src/lib/grail/affixCatalog.ts');
"
```

(This will fail directly via plain `node` since the file is TypeScript — instead, spot-check via the dev server: start it, navigate to `/en/items/magic/rings`, and confirm: (a) prefixes and suffixes appear as two columns on a wide viewport, (b) "of Health"/"of Protection" appear in the same box with "of Protection" as the header, (c) numbers read as real text like "+3–5 Defense" rather than bare ranges.)

- [ ] **Step 4: Final commit if verification turned up fixes**

```bash
cd D2R-Records
git status
# If clean, nothing to do.
```

---

## Out of scope (confirmed in design spec)

- Changing the category-listing pages (`/items/magic`, `/items/rare`).
- Extending skill-referencing compound templates to all 14 languages.
- Any change to `data/magic-affixes.json` itself (step 1 is already complete).
