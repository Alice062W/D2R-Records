# Grail Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal, cross-device unique/set item collection tracker ("grail checklist") for the site owner, backed by a static item catalog and a Supabase-hosted personal-finds table.

**Architecture:** The item catalog (all spawnable unique + set items, generated from `blizzhackers/d2data`) is static JSON bundled into the Next.js app at build time, same pattern as `data/runewords.json`/`data/bases.json`. Personal find records live in Supabase (Postgres + Auth), queried directly from the browser after Google sign-in; Row Level Security scopes every row to the signed-in user. Hosting stays on GitHub Pages — nothing here needs a Node server.

**Tech Stack:** Next.js 16 (existing), `@supabase/supabase-js` (new dependency), Supabase (Postgres + Auth + Google OAuth provider), Vitest (existing).

## Global Constraints

- Single-user feature: only the site owner's Google account may read/write `finds` rows (enforced via Postgres RLS on `auth.uid() = user_id`, not obscurity — the Supabase anon key is necessarily public in a static site).
- No public read access to `finds` under any circumstance.
- Catalog data sourced only from `blizzhackers/d2data` (MIT license) — never scraped or copied from d2r.world or any other fan site. d2r.world may only be used to manually spot-check completeness/accuracy of the generated catalog.
- Duplicate finds are never overwritten or merged — every logged copy is its own row, kept forever.
- "Best copy" is decided by a per-item, priority-ordered stat list, compared lexicographically (highest-priority stat wins; ties fall to the next stat down; a copy missing a stat entirely ranks below one that has it). No composite/average scoring.
- All new user-facing strings must have keys in `messages/en.json`, `messages/zh-TW.json`, and `messages/zh-CN.json` — next-intl fails static generation for a locale if a key used during prerender is missing. Translated text for zh-TW/zh-CN is not required for this plan (English text duplicated as a placeholder value is acceptable); translation is an explicit fast-follow, not part of this plan's scope.
- New routes must stay under the `[locale]` route group and call `generateStaticParams`, matching the existing Home page pattern (`src/app/[locale]/page.tsx`).
- This feature is independent of the existing appraiser — do not modify `src/lib/appraise.ts` or `AppraiserForm.tsx` except to add a nav link to the new page.

---

### Task 1: Vendor `d2data` catalog source + generate `data/uniques.json` / `data/sets.json`

**Files:**
- Create: `vendor/d2data/json/uniqueitems.json`
- Create: `vendor/d2data/json/setitems.json`
- Create: `vendor/d2data/json/items.json`
- Create: `vendor/d2data/json/itemtypes.json`
- Create: `vendor/d2data/LICENSE`
- Create: `vendor/d2data/README.md`
- Create: `scripts/generate-grail-data.mjs`
- Create: `data/uniques.json` (generated output, committed)
- Create: `data/sets.json` (generated output, committed)
- Test: `data/grail-data.test.ts`
- Modify: `package.json` (add `generate:grail` script)

**Interfaces:**
- Produces: `data/uniques.json` and `data/sets.json`, each an array of objects matching:
  ```ts
  interface GrailItem {
    id: string;              // e.g. "unique-0" or "set-69" — stable, unique across both files
    code: string;            // base item code, e.g. "hax"
    name: string;            // display name, e.g. "The Gnasher" — NOT guaranteed unique (e.g. 8 "Rainbow Facet" variants)
    kind: 'unique' | 'set';
    setName: string | null;  // set name if kind === 'set', else null
    levelReq: number;
    category: 'weapons' | 'armor' | 'other';
    stats: { key: string; label: string; min: number; max: number }[];       // variable (rollable) props, min !== max
    fixedStats: { key: string; label: string; value: number }[];             // deterministic props, min === max
    setBonuses: { key: string; label: string; min: number; max: number }[];  // set-only bonus props (aprop*), informational, not logged per-find
    statPriority: string[]; // ordered list of `stats[].key`; default = catalog order, hand-editable later
  }
  ```
  This exact shape is consumed by Task 2 (`catalog.ts` loader), Task 6 (grail checklist), Task 7 (item detail), and Task 8 (log-find form).

- [ ] **Step 1: Vendor the four source JSON files at a pinned commit**

```bash
mkdir -p vendor/d2data/json
PIN=477bcf63e964f39f4c774e588a79fd598ae472de
for f in uniqueitems.json setitems.json items.json itemtypes.json; do
  curl -sL -o "vendor/d2data/json/$f" "https://raw.githubusercontent.com/blizzhackers/d2data/$PIN/json/$f"
done
curl -sL -o vendor/d2data/LICENSE "https://raw.githubusercontent.com/blizzhackers/d2data/$PIN/LICENSE"
```

Expected: `vendor/d2data/json/` contains 4 files (`uniqueitems.json` ~260K, `setitems.json` ~80K, `items.json` ~1.1M, `itemtypes.json` ~56K); `vendor/d2data/LICENSE` starts with `MIT License`.

- [ ] **Step 2: Write the vendor attribution README**

```markdown
# vendor/d2data

Source: https://github.com/blizzhackers/d2data (MIT License, see LICENSE in this directory)
Pinned commit: 477bcf63e964f39f4c774e588a79fd598ae472de

These JSON files are the raw upstream data used to generate `data/uniques.json` and
`data/sets.json` via `scripts/generate-grail-data.mjs`. Do not hand-edit these files —
re-run the generation script against a newer pinned commit instead, and re-verify the
generated output's item counts/names against https://d2r.world/en-US for completeness.
```

Save as `vendor/d2data/README.md`.

- [ ] **Step 3: Write the generation script**

```js
#!/usr/bin/env node
// scripts/generate-grail-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(__dirname, '..', 'vendor', 'd2data', 'json');
const OUT = join(__dirname, '..', 'data');

const uniqueItems = JSON.parse(readFileSync(join(VENDOR, 'uniqueitems.json'), 'utf8'));
const setItemsRaw = JSON.parse(readFileSync(join(VENDOR, 'setitems.json'), 'utf8'));
const items = JSON.parse(readFileSync(join(VENDOR, 'items.json'), 'utf8'));
const itemTypes = JSON.parse(readFileSync(join(VENDOR, 'itemtypes.json'), 'utf8'));

const STORE_PAGE_TO_CATEGORY = { weap: 'weapons', armo: 'armor' };

function categoryFor(code) {
  const type = items[code]?.type;
  const storePage = type ? itemTypes[type]?.StorePage : undefined;
  return STORE_PAGE_TO_CATEGORY[storePage] ?? 'other';
}

// Hand-curated labels for the most common stat codes (ranked by frequency across
// uniqueitems.json + setitems.json). Anything missing falls back to the raw code —
// functional, just less pretty. Extend as needed; cross-check wording against
// https://d2r.world/en-US when in doubt (reference only, do not copy their data).
const PROP_LABELS = {
  str: 'Strength', dex: 'Dexterity', vit: 'Vitality', enr: 'Energy',
  hp: 'Life', mana: 'Mana', stam: 'Stamina',
  ac: 'Defense', 'ac%': 'Enhanced Defense %', 'ac-miss': 'Defense vs. Missile',
  'ac/lvl': 'Defense per Level', 'ignore-ac': 'Ignore Target Defense',
  'dmg%': 'Enhanced Damage %', 'dmg-min': 'Minimum Damage', 'dmg-max': 'Maximum Damage',
  'dmg-norm': 'Damage', 'dmg-fire': 'Fire Damage', 'dmg-cold': 'Cold Damage',
  'dmg-ltng': 'Lightning Damage', 'dmg-pois': 'Poison Damage', 'dmg-undead': 'Damage to Undead',
  att: 'Attack Rating', 'att%': 'Attack Rating %', 'att-skill': 'Attack Rating (skill)',
  crush: 'Crushing Blow %', deadly: 'Deadly Strike %', openwounds: 'Open Wounds %',
  thorns: 'Attacker Takes Damage', ease: 'Repair Durability %',
  'res-fire': 'Fire Resist %', 'res-cold': 'Cold Resist %', 'res-ltng': 'Lightning Resist %',
  'res-pois': 'Poison Resist %', 'res-all': 'All Resistances',
  'red-dmg': 'Damage Reduced', 'red-dmg%': 'Damage Reduced %', 'red-mag': 'Magic Damage Reduced',
  lifesteal: 'Life Steal %', manasteal: 'Mana Steal %',
  regen: 'Life Regenerated %', 'regen-mana': 'Mana Regenerated %', 'regen-stam': 'Stamina Regenerated %',
  block: 'Increased Chance of Blocking %', balance2: 'Faster Block Rate',
  swing2: 'Faster Attack Rate', swing3: 'Faster Attack Rate',
  cast2: 'Faster Cast Rate', move2: 'Faster Run/Walk %', move3: 'Faster Run/Walk %',
  light: 'Light Radius', 'half-freeze': 'Half Freeze Duration',
  slow: 'Slower Target %', sock: 'Sockets', dur: 'Indestructible', indestruct: 'Indestructible',
  skill: 'Skill Bonus', skilltab: 'Skill Tab Bonus', allskills: 'All Skills',
  'hit-skill': 'Chance to Cast on Striking', 'gethit-skill': 'Chance to Cast When Struck',
  charged: 'Charges', 'mag%': 'Magic Find %', 'gold%': 'Gold Find %',
  'dmg-to-mana': 'Damage Taken Goes to Mana',
};

function labelFor(code) {
  return PROP_LABELS[code] ?? code;
}

function extractProps(entry, count) {
  const variable = [];
  const fixed = [];
  for (let n = 1; n <= count; n++) {
    const key = entry[`prop${n}`];
    const min = entry[`min${n}`];
    const max = entry[`max${n}`];
    if (!key || min === undefined || max === undefined) continue;
    if (min === max) fixed.push({ key, label: labelFor(key), value: min });
    else variable.push({ key, label: labelFor(key), min, max });
  }
  return { variable, fixed };
}

// Set-only bonus props unlocked by wearing multiple pieces of the set. Suffix letters
// (a, b, c, d) correspond to successive partial-bonus tiers; kept flat/informational
// here since they're display-only context, not something a find is logged against.
function extractSetBonuses(entry) {
  const bonuses = [];
  for (const suffix of ['a', 'b', 'c', 'd']) {
    for (let n = 1; n <= 5; n++) {
      const key = entry[`aprop${n}${suffix}`];
      const min = entry[`amin${n}${suffix}`];
      const max = entry[`amax${n}${suffix}`];
      if (!key || min === undefined || max === undefined) continue;
      bonuses.push({ key, label: labelFor(key), min, max });
    }
  }
  return bonuses;
}

const uniquesOut = Object.entries(uniqueItems)
  .filter(([, v]) => v.spawnable === 1)
  .map(([id, v]) => {
    const { variable, fixed } = extractProps(v, 10);
    return {
      id: `unique-${id}`,
      code: v.code,
      name: v.index,
      kind: 'unique',
      setName: null,
      levelReq: v['lvl req'] ?? 0,
      category: categoryFor(v.code),
      stats: variable,
      fixedStats: fixed,
      setBonuses: [],
      statPriority: variable.map(s => s.key),
    };
  });

const setsOut = Object.entries(setItemsRaw)
  .filter(([, v]) => v.spawnable === 1)
  .map(([id, v]) => {
    const { variable, fixed } = extractProps(v, 7);
    return {
      id: `set-${id}`,
      code: v.item,
      name: v.index,
      kind: 'set',
      setName: v.set,
      levelReq: v['lvl req'] ?? 0,
      category: categoryFor(v.item),
      stats: variable,
      fixedStats: fixed,
      setBonuses: extractSetBonuses(v),
      statPriority: variable.map(s => s.key),
    };
  });

writeFileSync(join(OUT, 'uniques.json'), JSON.stringify(uniquesOut, null, 2));
writeFileSync(join(OUT, 'sets.json'), JSON.stringify(setsOut, null, 2));

console.log(`Wrote ${uniquesOut.length} unique items -> data/uniques.json`);
console.log(`Wrote ${setsOut.length} set items -> data/sets.json`);
```

- [ ] **Step 4: Add the npm script and run the generator**

In `package.json`, add to `"scripts"`:
```json
"generate:grail": "node scripts/generate-grail-data.mjs"
```

Run:
```bash
npm run generate:grail
```

Expected output:
```
Wrote 403 unique items -> data/uniques.json
Wrote 135 set items -> data/sets.json
```

- [ ] **Step 5: Write the shape/count regression test**

```ts
// data/grail-data.test.ts
import { describe, it, expect } from 'vitest';
import uniques from './uniques.json';
import sets from './sets.json';

describe('generated grail catalog', () => {
  it('has the expected item counts', () => {
    expect(uniques.length).toBe(403);
    expect(sets.length).toBe(135);
  });

  it('every entry has a unique id', () => {
    const ids = [...uniques, ...sets].map((i: { id: string }) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has a valid category', () => {
    for (const item of [...uniques, ...sets] as { category: string }[]) {
      expect(['weapons', 'armor', 'other']).toContain(item.category);
    }
  });

  it('variable stats have min !== max, fixed stats have min === max collapsed to value', () => {
    for (const item of [...uniques, ...sets] as {
      stats: { min: number; max: number }[];
      fixedStats: { value: number }[];
    }[]) {
      for (const s of item.stats) expect(s.min).not.toBe(s.max);
      for (const f of item.fixedStats) expect(typeof f.value).toBe('number');
    }
  });

  it('statPriority only references keys present in stats', () => {
    for (const item of [...uniques, ...sets] as {
      stats: { key: string }[];
      statPriority: string[];
    }[]) {
      const keys = new Set(item.stats.map(s => s.key));
      for (const p of item.statPriority) expect(keys.has(p)).toBe(true);
    }
  });
});
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run data/grail-data.test.ts`
Expected: 5 tests pass. If the count assertions fail, re-check Step 4's script output before adjusting the test — the counts must match what the generator actually produced against the pinned commit.

- [ ] **Step 7: Commit**

```bash
git add vendor/d2data package.json data/uniques.json data/sets.json data/grail-data.test.ts scripts/generate-grail-data.mjs
git commit -m "Generate unique/set item catalog from blizzhackers/d2data"
```

---

### Task 2: Priority-ranked "best copy" comparator

**Files:**
- Create: `src/lib/grail/bestCopy.ts`
- Test: `src/lib/grail/bestCopy.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks (pure logic, no dependency on catalog shape beyond `statValues: Record<string, number>`).
- Produces:
  ```ts
  interface FindLike { statValues: Record<string, number> }
  function compareFinds(a: FindLike, b: FindLike, statPriority: string[]): number;
  function bestFind<T extends FindLike>(finds: T[], statPriority: string[]): T | null;
  function sortFindsByRank<T extends FindLike>(finds: T[], statPriority: string[]): T[];
  ```
  Consumed by Task 6 (grail checklist "best copy per item") and Task 7 (item detail, sorted best-first).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/grail/bestCopy.test.ts
import { describe, it, expect } from 'vitest';
import { compareFinds, bestFind, sortFindsByRank } from './bestCopy';

describe('compareFinds', () => {
  it('ranks the higher value of the top-priority stat first', () => {
    const a = { statValues: { str: 10 } };
    const b = { statValues: { str: 8 } };
    expect(compareFinds(a, b, ['str'])).toBeLessThan(0);
    expect(compareFinds(b, a, ['str'])).toBeGreaterThan(0);
  });

  it('falls back to the next-priority stat on a tie', () => {
    const a = { statValues: { str: 8, dex: 10 } };
    const b = { statValues: { str: 8, dex: 5 } };
    expect(compareFinds(a, b, ['str', 'dex'])).toBeLessThan(0);
  });

  it('ranks a copy missing the priority stat below one that has it', () => {
    const withStat = { statValues: { str: 5 } };
    const withoutStat = { statValues: {} };
    expect(compareFinds(withStat, withoutStat, ['str'])).toBeLessThan(0);
    expect(compareFinds(withoutStat, withStat, ['str'])).toBeGreaterThan(0);
  });

  it('returns 0 when both are missing every priority stat', () => {
    const a = { statValues: {} };
    const b = { statValues: {} };
    expect(compareFinds(a, b, ['str', 'dex'])).toBe(0);
  });
});

describe('bestFind', () => {
  it('returns null for an empty list', () => {
    expect(bestFind([], ['str'])).toBeNull();
  });

  it('returns the highest-ranked find', () => {
    const finds = [
      { statValues: { str: 5 } },
      { statValues: { str: 9 } },
      { statValues: { str: 7 } },
    ];
    expect(bestFind(finds, ['str'])?.statValues.str).toBe(9);
  });
});

describe('sortFindsByRank', () => {
  it('orders all copies best-first', () => {
    const finds = [
      { statValues: { str: 5 } },
      { statValues: { str: 9 } },
      { statValues: { str: 7 } },
    ];
    const sorted = sortFindsByRank(finds, ['str']);
    expect(sorted.map(f => f.statValues.str)).toEqual([9, 7, 5]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/grail/bestCopy.test.ts`
Expected: FAIL — `Cannot find module './bestCopy'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/grail/bestCopy.ts
export interface FindLike {
  statValues: Record<string, number>;
}

/**
 * Compares two finds by a priority-ordered list of stat keys. Negative means
 * `a` ranks better, positive means `b` ranks better, 0 means tied on every
 * listed stat. A find missing a given stat ranks below one that has it.
 */
export function compareFinds(a: FindLike, b: FindLike, statPriority: string[]): number {
  for (const stat of statPriority) {
    const aHas = stat in a.statValues;
    const bHas = stat in b.statValues;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    if (!aHas && !bHas) continue;
    const diff = b.statValues[stat] - a.statValues[stat];
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

export function bestFind<T extends FindLike>(finds: T[], statPriority: string[]): T | null {
  if (finds.length === 0) return null;
  return sortFindsByRank(finds, statPriority)[0];
}

export function sortFindsByRank<T extends FindLike>(finds: T[], statPriority: string[]): T[] {
  return [...finds].sort((a, b) => compareFinds(a, b, statPriority));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/grail/bestCopy.test.ts`
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/grail/bestCopy.ts src/lib/grail/bestCopy.test.ts
git commit -m "Add priority-ranked best-copy comparator for grail finds"
```

---

### External setup (you do this — not an automated task)

Before Task 3, the site owner must:

1. Create a free Supabase project at https://supabase.com.
2. In Supabase Dashboard → Authentication → Providers, enable **Google** and follow Supabase's
   linked instructions to create a Google OAuth Client ID/Secret in Google Cloud Console, then
   paste them into the Supabase provider config.
3. In Supabase Dashboard → Authentication → URL Configuration, add
   `https://alice062w.github.io/D2R-Records/en` (and `/zh-TW`, `/zh-CN`) as allowed redirect URLs,
   plus `http://localhost:3000/en` etc. for local dev.
4. Copy the Project URL and `anon` public key from Dashboard → Settings → API.
5. Create `.env.local` in the project root (already gitignored via the existing `.env*` rule):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
   ```
6. Add the same two values as GitHub Actions repository secrets (Settings → Secrets and
   variables → Actions → New repository secret) named `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, so the Pages build can inline them.

The anon key is meant to be public (Supabase's client-side model relies on RLS, not key secrecy),
so it's fine that it ends up in the built static JS. Do **not** put the Supabase *service role* key
anywhere in this project — it bypasses RLS and is never needed for this feature.

---

### Task 3: Supabase client, finds API, and RLS schema

**Files:**
- Create: `supabase/migrations/0001_finds.sql`
- Create: `src/lib/grail/supabaseClient.ts`
- Create: `src/lib/grail/findsApi.ts`
- Modify: `package.json` (add `@supabase/supabase-js` dependency)
- Modify: `.github/workflows/deploy.yml` (pass Supabase env vars into the build step)

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars (external setup above).
- Produces:
  ```ts
  export const supabase: SupabaseClient; // from supabaseClient.ts

  // from findsApi.ts
  interface FindRecord {
    id: string;
    itemCode: string;
    itemKind: 'unique' | 'set';
    statValues: Record<string, number>;
    ethereal: boolean;
    foundAct: string | null;
    foundArea: string | null;
    foundAt: string;   // ISO date string
    notes: string | null;
    createdAt: string; // ISO timestamp
  }
  function listFinds(): Promise<FindRecord[]>;
  function insertFind(input: {
    itemCode: string;
    itemKind: 'unique' | 'set';
    statValues: Record<string, number>;
    ethereal: boolean;
    foundAct: string;
    foundArea: string;
    foundAt: string;
    notes: string;
  }): Promise<void>;
  ```
  Consumed by Task 5 (auth), Task 6 (checklist reads via `listFinds`), Task 8 (form writes via `insertFind`).

- [ ] **Step 1: Install the dependency**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Write the RLS schema migration**

```sql
-- supabase/migrations/0001_finds.sql
-- Run this in the Supabase Dashboard SQL Editor (Project -> SQL Editor -> New query).
create table if not exists public.finds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  item_code text not null,
  item_kind text not null check (item_kind in ('unique', 'set')),
  stat_values jsonb not null default '{}'::jsonb,
  ethereal boolean not null default false,
  found_act text,
  found_area text,
  found_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.finds enable row level security;

create policy "select_own_finds" on public.finds
  for select using (auth.uid() = user_id);

create policy "insert_own_finds" on public.finds
  for insert with check (auth.uid() = user_id);

create policy "update_own_finds" on public.finds
  for update using (auth.uid() = user_id);

create policy "delete_own_finds" on public.finds
  for delete using (auth.uid() = user_id);
```

Apply it: paste the contents into the Supabase Dashboard's SQL Editor and run it (this file is
version-controlled documentation of the schema; Supabase's dashboard is the source of truth for
what's actually applied, since this project has no CI database migration runner).

- [ ] **Step 3: Write the Supabase client wrapper**

```ts
// src/lib/grail/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. See plans/grail-tracker-implementation.md "External setup".'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Write the finds API**

```ts
// src/lib/grail/findsApi.ts
import { supabase } from './supabaseClient';

export interface FindRecord {
  id: string;
  itemCode: string;
  itemKind: 'unique' | 'set';
  statValues: Record<string, number>;
  ethereal: boolean;
  foundAct: string | null;
  foundArea: string | null;
  foundAt: string;
  notes: string | null;
  createdAt: string;
}

interface FindRow {
  id: string;
  item_code: string;
  item_kind: 'unique' | 'set';
  stat_values: Record<string, number>;
  ethereal: boolean;
  found_act: string | null;
  found_area: string | null;
  found_at: string;
  notes: string | null;
  created_at: string;
}

function rowToRecord(row: FindRow): FindRecord {
  return {
    id: row.id,
    itemCode: row.item_code,
    itemKind: row.item_kind,
    statValues: row.stat_values ?? {},
    ethereal: row.ethereal,
    foundAct: row.found_act,
    foundArea: row.found_area,
    foundAt: row.found_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function listFinds(): Promise<FindRecord[]> {
  const { data, error } = await supabase
    .from('finds')
    .select('id, item_code, item_kind, stat_values, ethereal, found_act, found_area, found_at, notes, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FindRow[]).map(rowToRecord);
}

export async function insertFind(input: {
  itemCode: string;
  itemKind: 'unique' | 'set';
  statValues: Record<string, number>;
  ethereal: boolean;
  foundAct: string;
  foundArea: string;
  foundAt: string;
  notes: string;
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not signed in');
  const { error } = await supabase.from('finds').insert({
    user_id: userId,
    item_code: input.itemCode,
    item_kind: input.itemKind,
    stat_values: input.statValues,
    ethereal: input.ethereal,
    found_act: input.foundAct,
    found_area: input.foundArea,
    found_at: input.foundAt,
    notes: input.notes,
  });
  if (error) throw error;
}
```

- [ ] **Step 5: Wire Supabase env vars into the CI build**

In `.github/workflows/deploy.yml`, change the build step from:
```yaml
      - run: npm run build
```
to:
```yaml
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

- [ ] **Step 6: Verify the build picks up local env vars**

Run: `npm run build`
Expected: build succeeds (uses `.env.local` from the External Setup section locally; Next.js
loads `.env.local` automatically). If it fails with the "Missing NEXT_PUBLIC_SUPABASE_URL" error
thrown in Step 3, confirm `.env.local` exists and restart the build (env files are read at
process start).

- [ ] **Step 7: Commit**

```bash
git add supabase package.json package-lock.json src/lib/grail/supabaseClient.ts src/lib/grail/findsApi.ts .github/workflows/deploy.yml
git commit -m "Add Supabase client, finds API, and RLS schema for grail tracker"
```

---

### Task 4: Google sign-in auth hook

**Files:**
- Create: `src/lib/grail/useGrailAuth.ts`
- Create: `src/components/grail/AuthGate.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/grail/supabaseClient.ts` (Task 3).
- Produces:
  ```ts
  function useGrailAuth(): { userId: string | null; loading: boolean };
  function signInWithGoogle(): Promise<void>;
  function signOut(): Promise<void>;
  ```
  and a component `<AuthGate>{children}</AuthGate>` that renders a sign-in prompt when signed out
  and `children` when signed in. Consumed by Task 6 (`GrailChecklist` wraps its content in `AuthGate`).

- [ ] **Step 1: Write the auth hook**

```ts
// src/lib/grail/useGrailAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useGrailAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return { userId, loading };
}

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({ provider: 'google' });
}

export async function signOut() {
  await supabase.auth.signOut();
}
```

- [ ] **Step 2: Write the AuthGate component**

```tsx
// src/components/grail/AuthGate.tsx
'use client';

import { useGrailAuth, signInWithGoogle, signOut } from '@/lib/grail/useGrailAuth';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { userId, loading } = useGrailAuth();

  if (loading) {
    return <p className="text-sm text-zinc-500 text-center py-10">Loading…</p>;
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-zinc-400">Sign in to view your grail tracker.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => signOut()}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verify manually in the browser**

Run: `npm run dev`, navigate to any page that renders `<AuthGate>` (wired in Task 6). Confirm the
sign-in button appears when signed out, clicking it opens Google's OAuth consent screen, and after
completing it the gated content renders with a "Sign out" link. This can only be fully exercised
once Task 6 mounts `AuthGate` — a stub page is acceptable to verify this task in isolation if
Task 6 isn't done yet.

- [ ] **Step 4: Commit**

```bash
git add src/lib/grail/useGrailAuth.ts src/components/grail/AuthGate.tsx
git commit -m "Add Google sign-in auth hook and gate for grail tracker"
```

---

### Task 5: Static Act/Area zone list

**Files:**
- Create: `src/lib/grail/zones.ts`

**Interfaces:**
- Produces:
  ```ts
  const ACTS: readonly string[];
  const AREAS_BY_ACT: Record<string, string[]>;
  ```
  Consumed by Task 8 (log-find form's Act/Area dependent dropdowns).

- [ ] **Step 1: Write the zone list**

```ts
// src/lib/grail/zones.ts
// Not exhaustive — covers commonly-referenced farming/quest areas per act.
// Extend as needed; this is reference data for the log-find form's dropdowns only.
export const ACTS = ['Act I', 'Act II', 'Act III', 'Act IV', 'Act V'] as const;
export type Act = (typeof ACTS)[number];

export const AREAS_BY_ACT: Record<Act, string[]> = {
  'Act I': [
    'Blood Moor', 'Cold Plains', 'Stony Field', 'Dark Wood', 'Black Marsh',
    'The Forgotten Tower', 'Tristram', 'Cathedral', 'Catacombs', "Countess' Tower",
    'Other / Unknown',
  ],
  'Act II': [
    'Rocky Waste', 'Dry Hills', 'Far Oasis', 'Lost City', 'Valley of Snakes',
    'Claw Viper Temple', 'Arcane Sanctuary', "Tal Rasha's Tombs", "Duriel's Lair",
    'Other / Unknown',
  ],
  'Act III': [
    'Spider Forest', 'Great Marsh', 'Flayer Jungle', 'Kurast Bazaar', 'Travincal',
    'Durance of Hate', 'Other / Unknown',
  ],
  'Act IV': [
    'Outer Steppes', 'Plains of Despair', 'City of the Damned', 'River of Flame',
    "Diablo's Lair", 'Other / Unknown',
  ],
  'Act V': [
    'Bloody Foothills', 'Frigid Highlands', 'Arreat Plateau', "Nihlathak's Temple",
    'Crystalline Passage', 'Frozen Tundra', "Ancients' Way", 'Worldstone Keep',
    'Throne of Destruction', 'Other / Unknown',
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/grail/zones.ts
git commit -m "Add static Act/Area zone list for grail find logging"
```

---

### Task 6: Grail checklist page

**Files:**
- Create: `src/lib/grail/catalog.ts`
- Create: `src/app/[locale]/grail/page.tsx`
- Create: `src/components/grail/GrailChecklist.tsx`
- Create: `src/components/grail/GrailItemCard.tsx`

**Interfaces:**
- Consumes: `data/uniques.json`/`data/sets.json` (Task 1), `bestFind` (Task 2), `listFinds`/`FindRecord` (Task 3), `AuthGate` (Task 4).
- Produces:
  ```ts
  // catalog.ts
  interface GrailItem { /* same shape as Task 1's generator output */ }
  function getAllGrailItems(): GrailItem[];
  ```

- [ ] **Step 1: Write the catalog loader**

```ts
// src/lib/grail/catalog.ts
import uniques from '../../../data/uniques.json';
import sets from '../../../data/sets.json';

export interface GrailStat {
  key: string;
  label: string;
  min: number;
  max: number;
}

export interface GrailFixedStat {
  key: string;
  label: string;
  value: number;
}

export interface GrailItem {
  id: string;
  code: string;
  name: string;
  kind: 'unique' | 'set';
  setName: string | null;
  levelReq: number;
  category: 'weapons' | 'armor' | 'other';
  stats: GrailStat[];
  fixedStats: GrailFixedStat[];
  setBonuses: GrailStat[];
  statPriority: string[];
}

const ALL_ITEMS: GrailItem[] = [...(uniques as GrailItem[]), ...(sets as GrailItem[])];

export function getAllGrailItems(): GrailItem[] {
  return ALL_ITEMS;
}
```

- [ ] **Step 2: Write the item card component**

```tsx
// src/components/grail/GrailItemCard.tsx
'use client';

import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { bestFind } from '@/lib/grail/bestCopy';

export default function GrailItemCard({
  item,
  finds,
  onClick,
}: {
  item: GrailItem;
  finds: FindRecord[];
  onClick: () => void;
}) {
  const found = finds.length > 0;
  const best = found ? bestFind(finds, item.statPriority) : null;
  const topStat = best && item.statPriority[0]
    ? item.stats.find(s => s.key === item.statPriority[0])
    : undefined;
  const topValue = best && topStat ? best.statValues[topStat.key] : undefined;

  return (
    <button
      onClick={onClick}
      disabled={!found}
      className={`text-left rounded-lg border p-3 transition-colors ${
        found
          ? 'border-amber-500/50 bg-zinc-900 hover:border-amber-400 cursor-pointer'
          : 'border-zinc-800 bg-zinc-950 text-zinc-600 cursor-default'
      }`}
    >
      <div className={`font-semibold text-sm ${found ? 'text-zinc-100' : 'text-zinc-600'}`}>
        {item.name}
      </div>
      {found && (
        <div className="text-xs text-zinc-400 mt-1">
          {finds.length} {finds.length === 1 ? 'copy' : 'copies'}
          {topStat && topValue !== undefined && (
            <> · best {topStat.label}: {topValue}</>
          )}
        </div>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Write the checklist component**

```tsx
// src/components/grail/GrailChecklist.tsx
'use client';

import { useEffect, useState } from 'react';
import { getAllGrailItems, type GrailItem } from '@/lib/grail/catalog';
import { listFinds, type FindRecord } from '@/lib/grail/findsApi';
import AuthGate from './AuthGate';
import GrailItemCard from './GrailItemCard';

const CATEGORIES: GrailItem['category'][] = ['weapons', 'armor', 'other'];
const CATEGORY_LABELS: Record<GrailItem['category'], string> = {
  weapons: 'Weapons',
  armor: 'Armor',
  other: 'Other',
};

function GrailChecklistInner() {
  const [finds, setFinds] = useState<FindRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GrailItem | null>(null);
  const items = getAllGrailItems();

  useEffect(() => {
    listFinds()
      .then(setFinds)
      .catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!finds) return <p className="text-zinc-500 text-sm">Loading your collection…</p>;

  const findsByCode = new Map<string, FindRecord[]>();
  for (const f of finds) {
    const list = findsByCode.get(f.itemCode) ?? [];
    list.push(f);
    findsByCode.set(f.itemCode, list);
  }

  const foundCount = items.filter(i => (findsByCode.get(i.code)?.length ?? 0) > 0).length;

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-zinc-400">
        {foundCount} / {items.length} items found
      </p>
      {CATEGORIES.map(category => {
        const categoryItems = items.filter(i => i.category === category);
        const categoryFound = categoryItems.filter(
          i => (findsByCode.get(i.code)?.length ?? 0) > 0
        ).length;
        return (
          <section key={category}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              {CATEGORY_LABELS[category]} ({categoryFound}/{categoryItems.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {categoryItems.map(item => (
                <GrailItemCard
                  key={item.id}
                  item={item}
                  finds={findsByCode.get(item.code) ?? []}
                  onClick={() => setSelected(item)}
                />
              ))}
            </div>
          </section>
        );
      })}
      {selected && (
        <ItemDetailPlaceholder item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// Replaced by the real component in Task 7; kept here so Task 6 is independently
// testable/mountable before Task 7 lands.
function ItemDetailPlaceholder({ item, onClose }: { item: GrailItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <p className="text-zinc-100 font-semibold">{item.name}</p>
        <p className="text-zinc-500 text-sm mt-2">Detail view coming in Task 7.</p>
      </div>
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

- [ ] **Step 4: Write the page route**

```tsx
// src/app/[locale]/grail/page.tsx
import { routing } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';
import GrailChecklist from '@/components/grail/GrailChecklist';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function GrailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Grail Tracker</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">
          Track which unique and set items you've found, and your best roll of each.
        </p>
      </div>
      <div className="w-full max-w-4xl">
        <GrailChecklist />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify manually in the browser**

Run: `npm run dev`, sign in (Task 4 flow), navigate to `/en/grail`. Confirm: all ~538 items render
grouped into Weapons/Armor/Other with per-category and overall found/total counts; every item
starts grayed out (no finds logged yet); clicking a grayed-out (unfound) item does nothing (button
is disabled); no console errors from the Supabase query.

- [ ] **Step 6: Commit**

```bash
git add src/lib/grail/catalog.ts src/app/[locale]/grail src/components/grail/GrailChecklist.tsx src/components/grail/GrailItemCard.tsx
git commit -m "Add grail checklist page with category grouping and progress counts"
```

---

### Task 7: Item detail view (all copies)

**Files:**
- Create: `src/components/grail/GrailItemDetail.tsx`
- Modify: `src/components/grail/GrailChecklist.tsx:1-999` (replace `ItemDetailPlaceholder` usage with the real component)

**Interfaces:**
- Consumes: `GrailItem` type (Task 6's `catalog.ts`), the `selected` `GrailItem` state already held by `GrailChecklist` (Task 6, passed down as a prop — no new lookup needed), `sortFindsByRank` (Task 2), `FindRecord` (Task 3).
- Produces: `<GrailItemDetail item={GrailItem} finds={FindRecord[]} onClose={() => void} />`, consumed by `GrailChecklist`.

- [ ] **Step 1: Write the detail component**

```tsx
// src/components/grail/GrailItemDetail.tsx
'use client';

import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { sortFindsByRank } from '@/lib/grail/bestCopy';

export default function GrailItemDetail({
  item,
  finds,
  onClose,
}: {
  item: GrailItem;
  finds: FindRecord[];
  onClose: () => void;
}) {
  const sorted = sortFindsByRank(finds, item.statPriority);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">{item.name}</h3>
            {item.setName && <p className="text-xs text-amber-400">{item.setName}</p>}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>

        {item.fixedStats.length > 0 && (
          <div className="mb-4 text-xs text-zinc-400 flex flex-col gap-0.5">
            {item.fixedStats.map(f => (
              <div key={f.key}>{f.label}: {f.value}</div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {sorted.map((find, i) => (
            <div key={find.id} className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
              <div className="flex justify-between text-xs text-zinc-500 mb-2">
                <span>{i === 0 ? 'Best copy' : `Copy #${i + 1}`}</span>
                <span>{find.foundAt}{find.ethereal ? ' · Ethereal' : ''}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {item.stats.map(stat => (
                  <div key={stat.key} className="text-zinc-300">
                    {stat.label}: <span className="font-semibold">{find.statValues[stat.key] ?? '—'}</span>
                    <span className="text-zinc-600 text-xs"> ({stat.min}-{stat.max})</span>
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
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into GrailChecklist**

In `src/components/grail/GrailChecklist.tsx`:
- Remove the `ItemDetailPlaceholder` function entirely.
- Add `import GrailItemDetail from './GrailItemDetail';` at the top.
- Replace:
  ```tsx
      {selected && (
        <ItemDetailPlaceholder item={selected} onClose={() => setSelected(null)} />
      )}
  ```
  with:
  ```tsx
      {selected && (
        <GrailItemDetail
          item={selected}
          finds={findsByCode.get(selected.code) ?? []}
          onClose={() => setSelected(null)}
        />
      )}
  ```

- [ ] **Step 3: Verify manually in the browser**

This requires at least one logged find to inspect — if Task 8 (log-find form) isn't done yet,
temporarily insert a test row directly in the Supabase Dashboard's Table Editor for `finds`
(any valid `item_code` from `data/uniques.json`, e.g. `"hax"`, with `stat_values: {"dmg%": 65}`),
reload `/en/grail`, click that item's now-enabled card, and confirm the modal shows the copy's
stats, the `(min-max)` hint per stat, and closes on the ✕ button or backdrop click. Delete the
test row afterward once Task 8 provides a real way to add finds.

- [ ] **Step 4: Commit**

```bash
git add src/components/grail/GrailItemDetail.tsx src/components/grail/GrailChecklist.tsx
git commit -m "Add grail item detail view listing all copies, best-first"
```

---

### Task 8: Log-find form

**Files:**
- Create: `src/components/grail/LogFindForm.tsx`
- Modify: `src/components/grail/GrailChecklist.tsx:1-999` (mount the form behind a "Log a find" button)

**Interfaces:**
- Consumes: `getAllGrailItems` (Task 6), `insertFind` (Task 3), `ACTS`/`AREAS_BY_ACT` (Task 5).
- Produces: `<LogFindForm onSaved={() => void} onCancel={() => void} />`.

- [ ] **Step 1: Write the form component**

```tsx
// src/components/grail/LogFindForm.tsx
'use client';

import { useState } from 'react';
import { getAllGrailItems, type GrailItem } from '@/lib/grail/catalog';
import { insertFind } from '@/lib/grail/findsApi';
import { ACTS, AREAS_BY_ACT, type Act } from '@/lib/grail/zones';

export default function LogFindForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const items = getAllGrailItems();
  const [itemId, setItemId] = useState('');
  const [act, setAct] = useState<Act>('Act I');
  const [area, setArea] = useState(AREAS_BY_ACT['Act I'][0]);
  const [ethereal, setEthereal] = useState(false);
  const [foundAt, setFoundAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [statValues, setStatValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected: GrailItem | undefined = items.find(i => i.id === itemId);

  function handleActChange(next: Act) {
    setAct(next);
    setArea(AREAS_BY_ACT[next][0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const values: Record<string, number> = {};
      for (const stat of selected.stats) {
        const raw = statValues[stat.key];
        if (raw !== undefined && raw !== '') values[stat.key] = Number(raw);
      }
      await insertFind({
        itemCode: selected.code,
        itemKind: selected.kind,
        statValues: values,
        ethereal,
        foundAct: act,
        foundArea: area,
        foundAt,
        notes,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto flex flex-col gap-4"
      >
        <h3 className="text-lg font-bold text-zinc-100">Log a find</h3>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Item</label>
          <select
            required
            value={itemId}
            onChange={e => { setItemId(e.target.value); setStatValues({}); }}
            className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
          >
            <option value="">— Select an item —</option>
            {(['weapons', 'armor', 'other'] as const).map(category => (
              <optgroup key={category} label={category}>
                {items
                  .filter(i => i.category === category)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(i => (
                    <option key={i.id} value={i.id}>{i.name}{i.setName ? ` (${i.setName})` : ''}</option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>

        {selected && selected.stats.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Rolled stats</label>
            {selected.stats.map(stat => (
              <div key={stat.key} className="flex items-center gap-2">
                <span className="text-sm text-zinc-300 flex-1">
                  {stat.label} <span className="text-zinc-600 text-xs">({stat.min}-{stat.max})</span>
                </span>
                <input
                  type="number"
                  value={statValues[stat.key] ?? ''}
                  onChange={e => setStatValues(v => ({ ...v, [stat.key]: e.target.value }))}
                  className="w-24 bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1 text-zinc-100"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Act</label>
            <select
              value={act}
              onChange={e => handleActChange(e.target.value as Act)}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
            >
              {ACTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Area</label>
            <select
              value={area}
              onChange={e => setArea(e.target.value)}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
            >
              {AREAS_BY_ACT[act].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Found date</label>
            <input
              type="date"
              value={foundAt}
              onChange={e => setFoundAt(e.target.value)}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
            />
          </div>
          <label className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={ethereal}
              onChange={e => setEthereal(e.target.checked)}
              className="w-4 h-4 accent-amber-400"
            />
            <span className="text-sm text-zinc-200">Ethereal</span>
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selected || saving}
            className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 disabled:opacity-30 transition-colors"
          >
            {saving ? 'Saving…' : 'Save find'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Mount it in GrailChecklist behind a button**

In `src/components/grail/GrailChecklist.tsx`:
- Add `import LogFindForm from './LogFindForm';` at the top.
- Add `const [showForm, setShowForm] = useState(false);` alongside the existing `useState` calls in `GrailChecklistInner`.
- Add a re-fetch helper and refresh after saving — replace the `useEffect` fetch block with:
  ```tsx
  function refresh() {
    listFinds()
      .then(setFinds)
      .catch(e => setError(e instanceof Error ? e.message : String(e)));
  }

  useEffect(() => {
    refresh();
  }, []);
  ```
- Add a button above the category loop (right after the `foundCount` paragraph):
  ```tsx
  <button
    onClick={() => setShowForm(true)}
    className="self-start px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
  >
    Log a find
  </button>
  ```
- At the bottom, alongside the `{selected && ...}` block, add:
  ```tsx
  {showForm && (
    <LogFindForm
      onSaved={() => { setShowForm(false); refresh(); }}
      onCancel={() => setShowForm(false)}
    />
  )}
  ```

- [ ] **Step 3: Verify manually in the browser**

Run: `npm run dev`, sign in, on `/en/grail` click "Log a find", pick an item with at least one
variable stat (e.g. search for "Gnasher"), enter a value within its printed min-max range, pick an
Act (confirm the Area dropdown updates to that act's areas), toggle Ethereal, set a date, add a
note, submit. Confirm: the modal closes, the grid re-renders with that item now enabled showing
"1 copy · best <stat>: <value>", and clicking it opens the detail view showing everything just
entered. Log a second find for the *same* item with a better roll and confirm the card's displayed
"best" value updates to the new one, while the detail view still lists both copies.

- [ ] **Step 4: Commit**

```bash
git add src/components/grail/LogFindForm.tsx src/components/grail/GrailChecklist.tsx
git commit -m "Add log-find form for recording grail item copies"
```

---

### Task 9: i18n keys and site navigation entry point

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh-TW.json`
- Modify: `messages/zh-CN.json`
- Modify: `src/components/Footer.tsx`

**Interfaces:**
- No new exported interfaces — this task wires existing UI strings through `next-intl` and adds a
  discoverable link to `/grail`, per the project's existing convention of routing all UI text
  through message files (`plans/todo.md`: "Wire all UI text through next-intl").

This plan's components (Tasks 4, 6, 7, 8) used hardcoded English strings to keep earlier tasks
focused and independently testable. This task moves those strings into the message files and
updates the components to consume them via `useTranslations('Grail')`.

- [ ] **Step 1: Add the `Grail` namespace to all three message files**

In `messages/en.json`, add a top-level `"Grail"` key alongside the existing `"Home"`, `"Appraiser"`,
`"Footer"` keys:
```json
"Grail": {
  "navLink": "Grail Tracker",
  "pageTitle": "Grail Tracker",
  "pageSubtitle": "Track which unique and set items you've found, and your best roll of each.",
  "loading": "Loading…",
  "loadingCollection": "Loading your collection…",
  "signInPrompt": "Sign in to view your grail tracker.",
  "signInGoogle": "Sign in with Google",
  "signOut": "Sign out",
  "progressCount": "{found} / {total} items found",
  "logFind": "Log a find",
  "categoryWeapons": "Weapons",
  "categoryArmor": "Armor",
  "categoryOther": "Other",
  "copiesOne": "1 copy",
  "copiesMany": "{count} copies",
  "bestLabel": "best {stat}: {value}",
  "bestCopy": "Best copy",
  "copyNumber": "Copy #{number}",
  "rolledStats": "Rolled stats",
  "act": "Act",
  "area": "Area",
  "foundDate": "Found date",
  "ethereal": "Ethereal",
  "notes": "Notes",
  "selectItem": "— Select an item —",
  "cancel": "Cancel",
  "save": "Save find",
  "saving": "Saving…"
}
```

Add the identical block (same English text — translation is a deferred fast-follow per this
plan's Global Constraints) to `messages/zh-TW.json` and `messages/zh-CN.json`.

- [ ] **Step 2: Run a build to confirm no missing-message errors**

Run: `npm run build`
Expected: build succeeds and generates `/en/grail`, `/zh-TW/grail`, `/zh-CN/grail` — check for
`out/en/grail/index.html`, `out/zh-TW/grail/index.html`, `out/zh-CN/grail/index.html`.

- [ ] **Step 3: Wire the message keys into the grail components**

Replace hardcoded strings with `useTranslations('Grail')` calls. For example, in
`src/app/[locale]/grail/page.tsx`:
```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
// ...
const t = await getTranslations('Grail');
// ...
<h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('pageTitle')}</h1>
<p className="mt-2 text-sm text-zinc-400 max-w-md">{t('pageSubtitle')}</p>
```

Apply the equivalent `const t = useTranslations('Grail');` (client components) substitution across
`AuthGate.tsx`, `GrailChecklist.tsx`, `GrailItemCard.tsx`, `GrailItemDetail.tsx`, and
`LogFindForm.tsx`, replacing every hardcoded string introduced in Tasks 4, 6, 7, and 8 with the
matching key from Step 1's list. Use next-intl's `t('progressCount', { found, total })` /
`t('bestLabel', { stat: topStat.label, value: topValue })` / `t('copyNumber', { number: i + 1 })`
interpolation form for the parameterized keys; use `t('copiesOne')`/`t('copiesMany', { count })`
conditionally based on `finds.length === 1`.

- [ ] **Step 4: Add the nav link in the Footer**

In `src/components/Footer.tsx`, add a link to the grail tracker next to the existing Ko-fi link:
```tsx
import Link from 'next/link';
// ...
<Link
  href="/grail"
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-amber-400 hover:text-amber-300 transition-colors"
>
  {t('grailLink')}
</Link>
```
Add `"grailLink": "Grail Tracker"` to the existing `"Footer"` key in all three message files
(alongside `"support"`/`"tagline"`).

- [ ] **Step 5: Verify manually in the browser**

Run: `npm run dev`. Confirm the Footer's "Grail Tracker" link navigates to `/en/grail` from the
home page, and that switching locale (EN/繁中/简中) on the grail page itself renders without any
next-intl "missing message" console errors (text will read in English for zh-TW/zh-CN until
translated, which is expected per this plan's constraints).

- [ ] **Step 6: Run the full test suite**

Run: `npm run test`
Expected: all existing appraiser tests plus the new `bestCopy.test.ts` and `grail-data.test.ts`
suites pass.

- [ ] **Step 7: Commit**

```bash
git add messages src/app/[locale]/grail src/components/grail src/components/Footer.tsx
git commit -m "Wire grail tracker UI through next-intl and add nav entry point"
```

---

## Post-plan follow-ups (explicitly out of scope here)

- Icon coverage for the ~374 base item codes used by uniques/sets (currently only 41 are in `public/items/`).
- A UI for reordering `statPriority` per item (currently hand-edit `data/uniques.json`/`data/sets.json`).
- zh-TW/zh-CN translation of the `Grail` message namespace (currently English text duplicated).
- Manual completeness/accuracy spot-check of `data/uniques.json`/`data/sets.json` against https://d2r.world/en-US.
