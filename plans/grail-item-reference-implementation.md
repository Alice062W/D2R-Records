# Grail Item Reference (d2r.world-style stat sheets) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every grail item a browsable d2r.world-style stat sheet (variable ranges + fixed stats), regroup the grid by equipment slot, render logged copies against possible rolls, and add item icons with graceful fallback.

**Architecture:** Pure display-layer evolution of the shipped grail tracker. The catalog generator (`scripts/generate-grail-data.mjs`) is enriched with fields already derivable from the vendored `blizzhackers/d2data` JSON (verified: zero missing base codes). No changes to Supabase schema, finds API, auth, or the comparator.

**Tech Stack:** Existing (Next.js 16 static export, next-intl, Vitest). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-13-grail-item-reference-design.md`

## Global Constraints

- Catalog data derives only from `vendor/d2data/json/*` (pinned, MIT). Never scrape/copy d2r.world data, text, or images — d2r.world is a visual/completeness reference only.
- All new user-facing strings get keys in the `Grail` namespace of `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json` (English text duplicated in all three; translation deferred).
- Do not modify the finds pipeline (`findsApi.ts`, `supabase/`), auth (`useGrailAuth.ts`, `AuthGate.tsx`), the comparator (`bestCopy.ts`), or the appraiser (`appraise.ts`, `AppraiserForm.tsx`, `data/bases.json`). The appraiser also reads icons from `public/items/{code}.png` — those 41 legacy files must not be moved or renamed.
- Every task ends with `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run build` all clean (build requires `.env.local`, which exists locally).
- Icon files are Blizzard game art used as tolerated fan content (owner accepted this basis 2026-07-13) — the icon directory README must state this. Icons are optional per item: UI must render correctly with zero icon files present.

---

### Task 1: Enrich the catalog generator (additive — keep `category` for now)

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Modify: `data/grail-data.test.ts`
- Modify: `src/lib/grail/catalog.ts`
- Regenerate: `data/uniques.json`, `data/sets.json`

**Interfaces:**
- Produces (added to every catalog entry and to the `GrailItem` interface; existing fields, including `category`, are unchanged in this task):
  ```ts
  baseName: string;                       // e.g. "Grim Helm"
  grade: 'normal' | 'exceptional' | 'elite';
  slotCategory: SlotCategory;             // see SLOT_CATEGORIES below
  defense: { min: number; max: number } | null;
  requiredStrength: number | null;
  durability: number | null;
  invFile: string;                        // icon lookup key, e.g. "invhaxu"
  ```
  Consumed by Tasks 2 (detail view), 3 (grid regroup), 4 (icons).

- [ ] **Step 1: Add the enrichment to the generator**

In `scripts/generate-grail-data.mjs`, add after the existing `categoryFor` function:

```js
// type code (items.json .type) -> slot category. Every code observed across
// spawnable uniques+sets is mapped explicitly; an unmapped code is a hard error
// so a future data refresh can't silently mis-bucket items.
const TYPE_TO_SLOT = {
  helm: 'helms', circ: 'helms', phlm: 'helms', pelt: 'helms',
  tors: 'armors',
  shie: 'shields', ashd: 'shields', head: 'shields',
  belt: 'belts', boot: 'boots', glov: 'gloves',
  ring: 'rings', amul: 'amulets',
  scha: 'charms', mcha: 'charms', lcha: 'charms',
  jewl: 'jewels',
  swor: 'swords', knif: 'daggers', axe: 'axes', pole: 'polearms',
  spea: 'spears', aspe: 'spears',
  club: 'clubs', mace: 'maces', hamm: 'hammers',
  scep: 'scepters', staf: 'staves', orb: 'orbs', wand: 'wands',
  grim: 'grimoires', h2h2: 'katars',
  bow: 'bows', abow: 'bows', xbow: 'crossbows',
  jave: 'javelins', ajav: 'javelins',
  taxe: 'throwings', tkni: 'throwings',
};

function slotFor(code) {
  const type = items[code]?.type;
  const slot = TYPE_TO_SLOT[type];
  if (!slot) throw new Error(`Unmapped item type "${type}" for base code "${code}"`);
  return slot;
}

function gradeFor(code) {
  const base = items[code];
  if (base?.ultracode === code) return 'elite';
  if (base?.ubercode === code) return 'exceptional';
  return 'normal';
}

function baseFieldsFor(code) {
  const base = items[code];
  return {
    baseName: base?.name ?? code,
    grade: gradeFor(code),
    slotCategory: slotFor(code),
    defense: base?.minac != null && base?.maxac != null
      ? { min: base.minac, max: base.maxac }
      : null,
    requiredStrength: base?.reqstr ?? null,
    durability: base?.durability ?? null,
  };
}
```

In the `uniquesOut` map callback, spread the new fields and set `invFile` (a unique's own art wins over the base's):
```js
      ...baseFieldsFor(v.code),
      invFile: v.invfile || items[v.code]?.invfile || '',
```
In the `setsOut` map callback likewise (set items carry `invfile` on the base only):
```js
      ...baseFieldsFor(v.item),
      invFile: v.invfile || items[v.item]?.invfile || '',
```
Keep `category: categoryFor(...)` in both — it is removed in Task 3, not here.

- [ ] **Step 2: Extend the regression tests (write before regenerating, expect fail)**

Add to `data/grail-data.test.ts`:

```ts
const SLOT_CATEGORIES = [
  'helms', 'armors', 'shields', 'belts', 'boots', 'gloves',
  'rings', 'amulets', 'charms', 'jewels',
  'swords', 'daggers', 'axes', 'polearms', 'spears',
  'clubs', 'maces', 'hammers', 'scepters', 'staves',
  'orbs', 'wands', 'grimoires', 'katars',
  'bows', 'crossbows', 'javelins', 'throwings',
];

it('every entry has enrichment fields', () => {
  for (const item of [...uniques, ...sets] as {
    baseName: string; grade: string; slotCategory: string; invFile: string;
  }[]) {
    expect(item.baseName.length).toBeGreaterThan(0);
    expect(['normal', 'exceptional', 'elite']).toContain(item.grade);
    expect(SLOT_CATEGORIES).toContain(item.slotCategory);
    expect(item.invFile.length).toBeGreaterThan(0);
  }
});
```

Run: `npx vitest run data/grail-data.test.ts` — expect the new test to FAIL (fields absent).

- [ ] **Step 3: Regenerate and verify**

Run: `npm run generate:grail` — expect `Wrote 403 unique items` / `Wrote 135 set items` (counts unchanged).
Run: `npx vitest run data/grail-data.test.ts` — all tests pass.

- [ ] **Step 4: Extend the `GrailItem` interface**

In `src/lib/grail/catalog.ts` add to `GrailItem` (keeping `category`):
```ts
  baseName: string;
  grade: 'normal' | 'exceptional' | 'elite';
  slotCategory: string;
  defense: { min: number; max: number } | null;
  requiredStrength: number | null;
  durability: number | null;
  invFile: string;
```

- [ ] **Step 5: Full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean.
```bash
git add scripts/generate-grail-data.mjs data/grail-data.test.ts data/uniques.json data/sets.json src/lib/grail/catalog.ts
git commit -m "Enrich grail catalog with baseName, grade, slot category, base stats, icon key"
```

---

### Task 2: Stat-sheet item detail (every item viewable) + copies-vs-range display

**Files:**
- Rewrite: `src/components/grail/GrailItemDetail.tsx`
- Modify: `src/components/grail/GrailItemCard.tsx` (always clickable)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- `GrailItemDetail` keeps its exact prop signature `{ item: GrailItem; finds: FindRecord[]; onClose: () => void }` — `finds` may now be empty (unfound item). `GrailItemCard` keeps `{ item, finds, onClick }` but the button is never disabled.

- [ ] **Step 1: Add the new message keys**

Add to the `Grail` namespace in all three message files (English text in all three):
```json
"itemStats": "Item Stats",
"magicProperties": "Magic Properties",
"yourCopies": "Your Copies",
"baseLabel": "Base",
"gradeLabel": "Grade",
"grade_normal": "Normal",
"grade_exceptional": "Exceptional",
"grade_elite": "Elite",
"defenseLabel": "Defense",
"requiredLevel": "Required Level",
"requiredStrength": "Required Strength",
"durabilityLabel": "Durability",
"setBonusesLabel": "Partial Set Bonuses",
"notFoundYet": "Not found yet"
```

- [ ] **Step 2: Rewrite `GrailItemDetail.tsx`**

```tsx
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
  onClose,
}: {
  item: GrailItem;
  finds: FindRecord[];
  onClose: () => void;
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
            <p className="text-xs text-zinc-400">{item.baseName}</p>
            {item.setName && <p className="text-xs text-green-500">{item.setName}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>

        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('itemStats')}</h4>
          <div className="text-sm text-zinc-300 flex flex-col gap-0.5">
            {itemStatRows.map(([label, value]) => (
              <div key={label}>{label}: <span className="text-zinc-100">{value}</span></div>
            ))}
          </div>
        </div>

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
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {item.stats.map(stat => (
                      <div key={stat.key} className="text-zinc-300">
                        {stat.label}: <span className="font-semibold">{find.statValues[stat.key] ?? '—'}</span>
                        <span className="text-zinc-600 text-xs"> ({stat.min}–{stat.max})</span>
                      </div>
                    ))}
                  </div>
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
    </div>
  );
}
```

- [ ] **Step 3: Make every card clickable in `GrailItemCard.tsx`**

Remove `disabled={!found}` and the `cursor-default` branch; unfound cards keep dimmed styling but stay interactive:
```tsx
    <button
      onClick={onClick}
      className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
        found
          ? 'border-amber-500/50 bg-zinc-900 hover:border-amber-400'
          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
      }`}
    >
```
(Leave the rest of the card as-is for this task; Task 3 restyles it.)

- [ ] **Step 4: Verify manually and commit**

Run `npm run dev`, sign in, open `/en/grail`: click an **unfound** item → stat sheet shows Item Stats + blue Magic Properties with ranges and "Not found yet"; click a **found** item → same sheet plus Your Copies with `value (min–max)` per stat. Then:
Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean.
```bash
git add src/components/grail/GrailItemDetail.tsx src/components/grail/GrailItemCard.tsx messages
git commit -m "Make every grail item a d2r.world-style stat sheet, found or not"
```

---

### Task 3: Slot-category grid, jump bar, card restyle; remove `category`

**Files:**
- Modify: `src/components/grail/GrailChecklist.tsx`
- Modify: `src/components/grail/GrailItemCard.tsx`
- Modify: `src/components/grail/LogFindForm.tsx`
- Modify: `src/lib/grail/catalog.ts`, `scripts/generate-grail-data.mjs`, `data/grail-data.test.ts` (drop `category`)
- Modify: `messages/*.json` (28 slot keys in; 3 old category keys out)
- Regenerate: `data/uniques.json`, `data/sets.json`

**Interfaces:**
- Produces `SLOT_ORDER: string[]` and `SLOT_LABEL_KEYS: Record<string, string>` exported from `src/lib/grail/catalog.ts`, consumed by both `GrailChecklist` and `LogFindForm`.

- [ ] **Step 1: Message keys**

Add to `Grail` in all three files (`slot_` prefix; English in all three):
```json
"slot_helms": "Helms", "slot_armors": "Armors", "slot_shields": "Shields",
"slot_belts": "Belts", "slot_boots": "Boots", "slot_gloves": "Gloves",
"slot_rings": "Rings", "slot_amulets": "Amulets", "slot_charms": "Charms",
"slot_jewels": "Jewels", "slot_swords": "Swords", "slot_daggers": "Daggers",
"slot_axes": "Axes", "slot_polearms": "Polearms", "slot_spears": "Spears",
"slot_clubs": "Clubs", "slot_maces": "Maces", "slot_hammers": "Hammers",
"slot_scepters": "Scepters", "slot_staves": "Staves", "slot_orbs": "Orbs",
"slot_wands": "Wands", "slot_grimoires": "Grimoires", "slot_katars": "Katars",
"slot_bows": "Bows", "slot_crossbows": "Crossbows", "slot_javelins": "Javelins",
"slot_throwings": "Throwing Weapons"
```
Delete `categoryWeapons`, `categoryArmor`, `categoryOther` from all three files.

- [ ] **Step 2: Export slot ordering from `catalog.ts`**

```ts
// d2r.world's presentation order: armor slots, jewelry, then weapons.
export const SLOT_ORDER = [
  'helms', 'armors', 'shields', 'belts', 'boots', 'gloves',
  'rings', 'amulets', 'charms', 'jewels',
  'swords', 'daggers', 'axes', 'polearms', 'spears',
  'clubs', 'maces', 'hammers', 'scepters', 'staves',
  'orbs', 'wands', 'grimoires', 'katars',
  'bows', 'crossbows', 'javelins', 'throwings',
] as const;

const GRADE_ORDER = { normal: 0, exceptional: 1, elite: 2 } as const;

export function sortItemsForDisplay(items: GrailItem[]): GrailItem[] {
  return [...items].sort(
    (a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.levelReq - b.levelReq
  );
}
```
Remove `category` from the `GrailItem` interface.

- [ ] **Step 3: Regroup `GrailChecklist.tsx`**

Replace the `CATEGORIES`/`CATEGORY_LABEL_KEYS` constants and the section loop with slot-based sections plus a sticky jump bar:

```tsx
import { getAllGrailItems, SLOT_ORDER, sortItemsForDisplay, type GrailItem } from '@/lib/grail/catalog';
```
```tsx
      <nav className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 py-2 -mx-4 px-4 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {SLOT_ORDER.map(slot => (
          <a key={slot} href={`#slot-${slot}`} className="text-zinc-400 hover:text-amber-300 transition-colors">
            {t(`slot_${slot}`)}
          </a>
        ))}
      </nav>
      {SLOT_ORDER.map(slot => {
        const slotItems = sortItemsForDisplay(items.filter(i => i.slotCategory === slot));
        if (slotItems.length === 0) return null;
        const slotFound = slotItems.filter(i => (findsById.get(i.id)?.length ?? 0) > 0).length;
        return (
          <section key={slot} id={`slot-${slot}`} className="scroll-mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              {t(`slot_${slot}`)} ({slotFound}/{slotItems.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {slotItems.map(item => (
                <GrailItemCard
                  key={item.id}
                  item={item}
                  finds={findsById.get(item.id) ?? []}
                  onClick={() => setSelected(item)}
                />
              ))}
            </div>
          </section>
        );
      })}
```

- [ ] **Step 4: Restyle `GrailItemCard.tsx`**

Name colored by kind, base name as muted subtitle, icon slot with graceful fallback (files arrive in Task 4; broken images must hide):

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { bestFind } from '@/lib/grail/bestCopy';

const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-amber-300',
  set: 'text-green-400',
};

export default function GrailItemCard({
  item,
  finds,
  onClick,
}: {
  item: GrailItem;
  finds: FindRecord[];
  onClick: () => void;
}) {
  const t = useTranslations('Grail');
  const [iconOk, setIconOk] = useState(true);
  const found = finds.length > 0;
  const best = found ? bestFind(finds, item.statPriority) : null;
  const topStat = best && item.statPriority[0]
    ? item.stats.find(s => s.key === item.statPriority[0])
    : undefined;
  const topValue = best && topStat ? best.statValues[topStat.key] : undefined;

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border p-3 transition-colors cursor-pointer flex gap-2 items-start ${
        found
          ? 'border-amber-500/50 bg-zinc-900 hover:border-amber-400'
          : 'border-zinc-800 bg-zinc-950 opacity-70 hover:opacity-100 hover:border-zinc-600'
      }`}
    >
      {iconOk && item.invFile && (
        // next/image (not a plain <img>) so the GitHub Pages basePath is applied,
        // same as the appraiser's icons; onError hides missing icons gracefully.
        <Image
          src={`/items/inv/${item.invFile}.png`}
          alt=""
          width={32}
          height={32}
          className="shrink-0 mt-0.5 object-contain"
          onError={() => setIconOk(false)}
        />
      )}
      <span>
        <span className={`block font-semibold text-sm ${found ? NAME_COLOR[item.kind] : 'text-zinc-500'}`}>
          {item.name}
        </span>
        <span className="block text-xs text-zinc-500">{item.baseName}</span>
        {found && (
          <span className="block text-xs text-zinc-400 mt-1">
            {finds.length === 1 ? t('copiesOne') : t('copiesMany', { count: finds.length })}
            {topStat && topValue !== undefined && (
              <> · {t('bestLabel', { stat: topStat.label, value: topValue })}</>
            )}
          </span>
        )}
      </span>
    </button>
  );
}
```

- [ ] **Step 5: Switch `LogFindForm.tsx` optgroups to slots**

Replace the `CATEGORY_LABEL_KEYS` constant and the `(['weapons','armor','other'] as const).map(...)` optgroup loop with:
```tsx
import { getAllGrailItems, SLOT_ORDER, type GrailItem } from '@/lib/grail/catalog';
```
```tsx
            {SLOT_ORDER.map(slot => {
              const slotItems = items
                .filter(i => i.slotCategory === slot)
                .sort((a, b) => a.name.localeCompare(b.name));
              if (slotItems.length === 0) return null;
              return (
                <optgroup key={slot} label={t(`slot_${slot}`)}>
                  {slotItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name}{i.setName ? ` (${i.setName})` : ''}</option>
                  ))}
                </optgroup>
              );
            })}
```

- [ ] **Step 6: Remove `category` from generator + tests, regenerate**

In `scripts/generate-grail-data.mjs`: delete `STORE_PAGE_TO_CATEGORY`, `categoryFor`, and the `category:` lines in both map callbacks. In `data/grail-data.test.ts`: delete the `'every entry has a valid category'` test. Run `npm run generate:grail` (counts unchanged: 403/135), then `npx vitest run data/grail-data.test.ts`.

- [ ] **Step 7: Verify manually and commit**

`npm run dev`: jump bar navigates to each slot section; sections show per-slot counts; cards show colored names + base subtitle; log-find dropdown groups by slot. Then:
Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean.
```bash
git add src scripts data messages
git commit -m "Regroup grail grid by equipment slot with jump bar and restyled cards"
```

---

### Task 4: Item icons — source, fetch script, README

**Files:**
- Create: `scripts/fetch-item-icons.mjs`
- Create: `public/items/inv/README.md`
- Create: `public/items/inv/*.png` (as coverage allows)
- Modify: `package.json` (add `fetch:icons` script)

This task starts with bounded research (the spec's open question). The UI from Task 3 already
renders correctly with zero icons, so this task can partially succeed or explicitly no-op.

- [ ] **Step 1: Research and pin an icon source**

Using WebSearch/WebFetch, evaluate candidate GitHub repos hosting extracted Diablo II inventory
item graphics as individual raw-accessible PNG files. Start with these queries and follow
leads: `github diablo 2 dc6 item inventory png extracted`, `github d2 "invfile" png items
repository`, `diablo 2 item graphics png collection github`. Acceptance criteria for a source:
(a) individual PNG per item graphic, fetchable via raw URLs without auth; (b) filenames mappable
to `invFile` keys (e.g. `invhaxu.png`) or deterministically translatable to them; (c) repo is a
plain asset collection (not a paywalled/private dump). Record the chosen repo + commit SHA.
**If no candidate meets all three criteria, skip to Step 4's no-source path — do not lower the
bar to scraping a fan site's CDN (d2r.world, maxroll, diablo2.io image URLs are off-limits).**

- [ ] **Step 2: Write the fetch script**

`scripts/fetch-item-icons.mjs`: read `data/uniques.json` + `data/sets.json`, collect the distinct
`invFile` values (~450), download `<RAW_BASE_URL>/<invFile>.png` (RAW_BASE_URL = the pinned
source from Step 1) into `public/items/inv/`, skipping files that already exist. Log a summary:
`downloaded N, already present M, missing K` and list missing invFile keys. Missing files are
expected and fine (placeholder fallback ships in Task 3). Add to `package.json` scripts:
`"fetch:icons": "node scripts/fetch-item-icons.mjs"`.

- [ ] **Step 3: Run it and spot-check**

Run `npm run fetch:icons`. Open `/en/grail` in dev and confirm icons render on covered cards and
the fallback (no icon) renders cleanly on uncovered ones. Confirm the appraiser's legacy
`public/items/{code}.png` files are untouched (`git status` shows only `public/items/inv/`).

- [ ] **Step 4: Write the README (both outcomes)**

`public/items/inv/README.md` — if a source was pinned:
```markdown
# Item inventory icons

Source: <repo URL> @ <commit SHA>, fetched via `npm run fetch:icons`.
Coverage: <N>/<total> invFile keys; missing icons fall back to text-only cards.

These images are Diablo II game art © Blizzard Entertainment, used here as
tolerated fan content (the same basis as every D2 fan database). They are NOT
covered by this repository's open-source licensing. If Blizzard objects,
delete this directory — the UI degrades gracefully to text-only cards.
```
If no source met the criteria: same README but documenting the search performed, why each
candidate failed, and that the directory is intentionally empty pending a future source.

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean.
```bash
git add scripts/fetch-item-icons.mjs package.json public/items/inv
git commit -m "Add item icon fetch script and inventory icons"
```

---

### Task 5: d2r.world spot-check + full verification

**Files:**
- Create: `docs/superpowers/specs/2026-07-13-grail-item-reference-verification.md` (findings note)

- [ ] **Step 1: Spot-check 10 items against d2r.world**

In the browser, compare these 10 items (spread across slots/grades/kinds) between our detail
view and d2r.world's listing: Harlequin Crest (Shako), Vampire Gaze, Herald of Zakarum,
Stone of Jordan, The Grandfather, Titan's Revenge, Arreat's Face, Tal Rasha's Guardianship,
Aldur's Advance, Windforce. For each: stat lines present/absent, variable ranges match,
grade + base name match. Record any mismatch with its d2data source value — **a mismatch is
investigated against `vendor/d2data/json/*` (our source of truth), not "fixed" by copying
d2r.world's number**; if d2r.world disagrees with d2data, note it and keep the d2data value.

- [ ] **Step 2: Write findings + full suite**

Write the comparison results to the verification doc (table: item, checked fields, result).
Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean.
Verify all three locale grail pages exist in `out/`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-13-grail-item-reference-verification.md
git commit -m "Add d2r.world spot-check verification for grail item reference"
```
