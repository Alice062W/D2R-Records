# Grail Category Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the grail checklist's single long scrolling page (28 stacked slot sections + sticky jump bar) with a category-sidebar navigation model: pick a category on the left, see only that category's items — fully expanded, no click needed — on the right.

**Architecture:** Pure presentation-layer change. A new sidebar component drives which single `slotCategory` is "active"; the existing `GrailItemDetail` component loses its modal chrome and becomes the per-item block rendered directly in a list for the active category. No changes to data, auth, or the finds pipeline.

**Tech Stack:** Existing (Next.js 16, next-intl, Tailwind). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-14-grail-category-sidebar-design.md`

## Global Constraints

- No icons in this pass — everything must render correctly with zero icon files, exactly as today (icon extraction is tracked separately, off-session, on the owner's own machine).
- No URL/query-param reflection of the selected category — plain component state (`useState<string | null>`) is sufficient.
- Do not modify the finds pipeline (`findsApi.ts`, `supabase/`), auth (`useGrailAuth.ts`, `AuthGate.tsx`), the comparator (`bestCopy.ts`), the log-find form's fields/submission, the catalog generator, or the appraiser.
- All new user-facing strings get keys in the `Grail` namespace of `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json` (English text duplicated in all three; translation deferred, per established convention).
- Sidebar collapses to a dropdown below the `md` breakpoint (768px); persistent left column at `md` and above.
- Every task ends with `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run build` all clean.

---

### Task 1: Category sidebar component

**Files:**
- Create: `src/components/grail/GrailCategorySidebar.tsx`
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json` (add one key: `Grail.categoriesLabel`)

**Interfaces:**
- Consumes: `SLOT_ORDER` and `GrailItem` from `src/lib/grail/catalog.ts` (already exist), `FindRecord` from `src/lib/grail/findsApi.ts` (already exists).
- Produces:
  ```ts
  function GrailCategorySidebar(props: {
    items: GrailItem[];
    findsById: Map<string, FindRecord[]>;
    activeSlot: string | null;
    onSelect: (slot: string) => void;
  }): JSX.Element
  ```
  This component is not wired into the app yet in this task — it's self-contained and independently typecheckable. Task 2 wires it into `GrailChecklist.tsx`.

- [ ] **Step 1: Add the `categoriesLabel` message key**

Add to the `Grail` namespace in all three message files (English text in all three — this project's established convention for untranslated locales):
```json
"categoriesLabel": "Categories",
```
Insert it anywhere within the existing `"Grail": { ... }` block in each of `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json` — e.g. right after the existing `"logFind"` key, matching where category-related content already lives in that block.

- [ ] **Step 2: Write the sidebar component**

```tsx
// src/components/grail/GrailCategorySidebar.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SLOT_ORDER, type GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';

export default function GrailCategorySidebar({
  items,
  findsById,
  activeSlot,
  onSelect,
}: {
  items: GrailItem[];
  findsById: Map<string, FindRecord[]>;
  activeSlot: string | null;
  onSelect: (slot: string) => void;
}) {
  const t = useTranslations('Grail');
  const [mobileOpen, setMobileOpen] = useState(false);

  const slots = SLOT_ORDER.filter(slot => items.some(i => i.slotCategory === slot));

  function countsFor(slot: string) {
    const slotItems = items.filter(i => i.slotCategory === slot);
    const found = slotItems.filter(i => (findsById.get(i.id)?.length ?? 0) > 0).length;
    return { found, total: slotItems.length };
  }

  function handleSelect(slot: string) {
    onSelect(slot);
    setMobileOpen(false);
  }

  const list = (
    <nav className="flex flex-col gap-0.5">
      {slots.map(slot => {
        const { found, total } = countsFor(slot);
        const active = slot === activeSlot;
        return (
          <button
            key={slot}
            onClick={() => handleSelect(slot)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              active
                ? 'bg-amber-500 text-zinc-950 font-semibold'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span>{t(`slot_${slot}`)}</span>
            <span className={`text-xs ${active ? 'text-zinc-800' : 'text-zinc-500'}`}>
              {found}/{total}
            </span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop: persistent left column */}
      <div className="hidden md:block w-56 shrink-0">{list}</div>

      {/* Mobile: collapsible dropdown */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-200"
        >
          <span>{activeSlot ? t(`slot_${activeSlot}`) : t('categoriesLabel')}</span>
          <span className="text-zinc-500">{mobileOpen ? '▲' : '▼'}</span>
        </button>
        {mobileOpen && (
          <div className="mt-1 border border-zinc-700 rounded-lg bg-zinc-900 p-1 max-h-80 overflow-y-auto">
            {list}
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean (the component isn't imported anywhere yet, so this only confirms it compiles cleanly on its own; `npm run build` succeeding confirms no stray syntax/type errors were introduced).
```bash
git add src/components/grail/GrailCategorySidebar.tsx messages
git commit -m "Add grail category sidebar component"
```

---

### Task 2: Wire the sidebar into the checklist; retire the modal and the card grid

**Files:**
- Modify: `src/components/grail/GrailItemDetail.tsx` (remove modal chrome, becomes a plain block)
- Modify: `src/components/grail/GrailChecklist.tsx` (sidebar integration, empty state, remove jump bar + card grid)
- Delete: `src/components/grail/GrailItemCard.tsx` (no remaining caller once the grid view is replaced)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json` (add one key: `Grail.selectCategoryPrompt`)

**Interfaces:**
- `GrailItemDetail`'s prop signature changes from `{ item: GrailItem; finds: FindRecord[]; onClose: () => void }` to `{ item: GrailItem; finds: FindRecord[] }` — `onClose` is removed since there's no longer anything to close. This is the only signature change in this plan; nothing outside `GrailChecklist.tsx` calls this component.
- Consumes `GrailCategorySidebar` (Task 1) with the exact props defined there.

- [ ] **Step 1: Add the `selectCategoryPrompt` message key**

Add to the `Grail` namespace in all three message files, same convention as Task 1:
```json
"selectCategoryPrompt": "Select a category from the menu to view its items.",
```

- [ ] **Step 2: Strip the modal chrome from `GrailItemDetail.tsx`**

Replace the entire file with:

```tsx
// src/components/grail/GrailItemDetail.tsx
'use client';

import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { sortFindsByRank } from '@/lib/grail/bestCopy';

const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-amber-300',
  set: 'text-green-400',
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
      <div className="mb-1">
        <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
        <p className="text-xs text-zinc-400">{item.baseName}</p>
        {item.setName && <p className="text-xs text-green-500">{item.setName}</p>}
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
          <div className="text-sm text-blue-400 flex flex-col gap-0.5">
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
          <div className="text-sm text-green-500 flex flex-col gap-0.5">
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

(The only changes from the current file: the outer fixed-position/backdrop `<div>` and its `onClick={onClose}` are gone; the inner card `<div>` — same classes minus the now-irrelevant `max-w-lg w-full max-h-[85vh] overflow-y-auto` sizing, which was there to fit a modal — is now the root element; the header's close `<button>` and the `onClose` prop are removed. Every stat/copy rendering line is byte-for-byte identical to today.)

- [ ] **Step 3: Rewrite `GrailChecklist.tsx`**

Replace the entire file with:

```tsx
// src/components/grail/GrailChecklist.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getAllGrailItems, sortItemsForDisplay, type GrailItem } from '@/lib/grail/catalog';
import { listFinds, type FindRecord } from '@/lib/grail/findsApi';
import { getErrorMessage } from '@/lib/grail/errors';
import AuthGate from './AuthGate';
import GrailCategorySidebar from './GrailCategorySidebar';
import GrailItemDetail from './GrailItemDetail';
import LogFindForm from './LogFindForm';

function GrailChecklistInner() {
  const t = useTranslations('Grail');
  const [finds, setFinds] = useState<FindRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const items = getAllGrailItems();

  function refresh() {
    listFinds()
      .then(setFinds)
      .catch(e => setError(getErrorMessage(e)));
  }

  useEffect(() => {
    refresh();
  }, []);

  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!finds) return <p className="text-zinc-500 text-sm">{t('loadingCollection')}</p>;

  const findsById = new Map<string, FindRecord[]>();
  for (const f of finds) {
    const list = findsById.get(f.itemId) ?? [];
    list.push(f);
    findsById.set(f.itemId, list);
  }

  const foundCount = items.filter(i => (findsById.get(i.id)?.length ?? 0) > 0).length;
  const activeItems: GrailItem[] = activeSlot
    ? sortItemsForDisplay(items.filter(i => i.slotCategory === activeSlot))
    : [];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-zinc-400">
          {t('progressCount', { found: foundCount, total: items.length })}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
        >
          {t('logFind')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <GrailCategorySidebar
          items={items}
          findsById={findsById}
          activeSlot={activeSlot}
          onSelect={setActiveSlot}
        />

        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {!activeSlot ? (
            <p className="text-sm text-zinc-500">{t('selectCategoryPrompt')}</p>
          ) : (
            activeItems.map(item => (
              <GrailItemDetail
                key={item.id}
                item={item}
                finds={findsById.get(item.id) ?? []}
              />
            ))
          )}
        </div>
      </div>

      {showForm && (
        <LogFindForm
          onSaved={() => { setShowForm(false); refresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default function GrailChecklist() {
  return (
    <AuthGate>
      <GrailChecklistInner />
    </AuthGate>
  );
}
```

- [ ] **Step 4: Delete the now-unused `GrailItemCard.tsx`**

```bash
git rm src/components/grail/GrailItemCard.tsx
```

- [ ] **Step 5: Verify manually in the browser**

Run `npm run dev`, sign in, open `/en/grail`. Confirm: page loads showing the overall progress line, "Log a find" button, the sidebar (all populated slot categories listed with `found/total` counts), and the "select a category" prompt in the main area — no item list yet. Click a category (e.g. "Rings") — the prompt is replaced by every ring item in that category, each fully expanded (name, base, grade, Item Stats, Magic Properties with ranges, Set Bonuses where applicable, and "Your Copies" inline for anything you've logged — same content the old modal used to show). Click a different category — the list swaps to that category's items; the previous category's items are gone, not still on the page. Confirm "Log a find" still opens its modal and still saves correctly (log a test find, confirm it appears inline under the right item immediately after — same `refresh()` mechanism as before).

Resize the browser (or use `resize_window`) below 768px width: confirm the sidebar collapses into a single dropdown button reading "Categories" (or the active category's name once one is selected), tapping it opens/closes the category list, and selecting a category from it closes the dropdown and updates the item list.

- [ ] **Step 6: Full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean; confirm all three locale `/grail` pages still build (`out/en/grail/index.html`, `out/zh-TW/grail/index.html`, `out/zh-CN/grail/index.html`).
```bash
git add src/components/grail/GrailItemDetail.tsx src/components/grail/GrailChecklist.tsx messages
git commit -m "Wire category sidebar into grail checklist, retire modal and card grid"
```
