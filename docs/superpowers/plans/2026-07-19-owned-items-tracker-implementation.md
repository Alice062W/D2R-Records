# Owned-Item Checkboxes for Set/Unique/Runeword Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any visitor sign in with Google and check off Unique, Set, and Runeword items as "owned" directly on the existing reference pages, persist per-user via Supabase, and filter each page to Collected/Missing/All — without requiring login to browse, and without ever breaking those pages if Supabase is unconfigured.

**Architecture:** A new `owned_items` Supabase table (separate from the existing `finds` log), a resilient nullable Supabase client accessor, a small `ownedItemsApi.ts` data layer, a `useOwnedItems()` React hook, a checkbox added to the two existing item-card components (`ItemStatCard.tsx`, `RunewordList.tsx`), and a Collected/Missing/All filter added to the three page-level components that already own client-side filter state (`CategoryItemList.tsx`, `SetGroupDetail.tsx`, the Runewords page).

**Tech Stack:** Next.js 16 (static export), next-intl, `@supabase/supabase-js` (already a dependency), Vitest + Testing Library.

## Global Constraints

- The database migration (`supabase/migrations/0002_owned_items.sql`) has **already been applied** by the user via the Supabase Dashboard SQL editor ("Success. No rows returned"). Do not instruct anyone to run it — just check the file into the repo for documentation, matching `0001_finds.sql`'s existing pattern.
- `/items/unique`, `/items/set`, `/items/runewords` **must render identically to today, for signed-out visitors, in any environment** — including one with no `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` set. No new code path introduced by this plan may throw or crash page rendering when Supabase is unconfigured.
- Do **not** modify `/grail`'s existing `finds` table, `GrailItemDetail.tsx`, or `LogFindForm.tsx` — this feature is fully independent, per the approved design.
- Checkbox and filter UI must be hidden (not shown disabled) for signed-out visitors — no dead controls implying a broken feature.
- Reuse the existing `pill()` button style (`px-3 py-1.5 rounded-lg text-sm font-cinzel transition-colors`, active = `bg-gold text-ink-950 font-semibold`, inactive = `bg-panel border border-panel-border text-parchment hover:bg-panel-alt`) for the new filter control, matching `RunewordFilters.tsx`/`CategoryItemList.tsx`'s existing pattern exactly.
- New i18n keys go in the `Grail` namespace (already home to `slot_*`, `signInPrompt`, etc.) in all three locale files (`messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`).
- `GrailItem.id` (`"unique-42"`, `"set-69"`) and `runewords-full.json`'s own `id` field (`"runeword-Runeword1"`) are the stable IDs to key `owned_items.item_id` on — confirmed unique already, no new ID scheme needed.

---

### Task 1: Resilient Supabase client — never throw on missing config

**Files:**
- Modify: `src/lib/grail/supabaseClient.ts`
- Modify: `src/lib/grail/useGrailAuth.ts`
- Modify: `src/lib/grail/findsApi.ts`
- Test: `src/lib/grail/supabaseClient.test.ts` (new)
- Test: `src/lib/grail/useGrailAuth.test.ts` (new)

**Interfaces:**
- Produces: `getSupabase(): SupabaseClient | null` — the only way any grail code should reach the Supabase client from now on. Returns the same memoized client instance on every call when configured; returns `null` (and logs one `console.warn`, not a throw) when either env var is missing. Later tasks (`ownedItemsApi.ts`) consume this.
- Consumes: nothing new — `@supabase/supabase-js`'s existing `createClient`.

- [ ] **Step 1: Write the failing tests for `getSupabase()`**

```ts
// src/lib/grail/supabaseClient.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

describe('getSupabase', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns null and warns, never throws, when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getSupabase } = await import('./supabaseClient');
    expect(() => getSupabase()).not.toThrow();
    expect(getSupabase()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns the same memoized client instance on repeated calls when configured', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    const { getSupabase } = await import('./supabaseClient');
    const a = getSupabase();
    const b = getSupabase();
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/supabaseClient.test.ts`
Expected: FAIL — `getSupabase` is not exported (the module currently only exports a throwing `supabase` const).

- [ ] **Step 3: Rewrite `supabaseClient.ts`**

```ts
// src/lib/grail/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined; // undefined = not yet resolved

// Never throws. Pages that don't need auth (the Unique/Set/Runeword reference
// pages) must keep rendering normally even when Supabase isn't configured —
// only the features that actually need it (checkboxes, the /grail page)
// degrade to "signed out" behavior instead.
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — Grail sign-in and owned-item tracking are disabled. See plans/grail-tracker-implementation.md "External setup".'
    );
    cached = null;
    return cached;
  }
  cached = createClient(supabaseUrl, supabaseAnonKey);
  return cached;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/supabaseClient.test.ts`
Expected: PASS (2/2)

- [ ] **Step 5: Update `useGrailAuth.ts` to use `getSupabase()` and degrade gracefully**

Read the current file first (`src/lib/grail/useGrailAuth.ts`) — replace its `import { supabase } from './supabaseClient';` and all three `supabase.auth.*` call sites with:

```ts
'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from './supabaseClient';

export function useGrailAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setUserId(null);
      setLoading(false);
      return;
    }
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
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  });
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
```

- [ ] **Step 6: Write the failing test for `useGrailAuth` degrading gracefully**

```ts
// src/lib/grail/useGrailAuth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('./supabaseClient', () => ({ getSupabase: () => null }));

describe('useGrailAuth', () => {
  it('resolves userId: null, loading: false when Supabase is unconfigured, without throwing', async () => {
    const { useGrailAuth } = await import('./useGrailAuth');
    const { result } = renderHook(() => useGrailAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userId).toBeNull();
  });
});
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/useGrailAuth.test.ts`
Expected: PASS (1/1)

- [ ] **Step 8: Update `findsApi.ts` to use `getSupabase()`**

Read the current file (`src/lib/grail/findsApi.ts`) in full. Replace `import { supabase } from './supabaseClient';` with `import { getSupabase } from './supabaseClient';`, and at the start of every exported function that currently calls `supabase.*` (`listFinds`, `insertFind`, and any others in the file — read it fully, there may be `updateFind`/`deleteFind` too), add:

```ts
  const supabase = getSupabase();
  if (!supabase) throw new Error('Grail sign-in is not configured');
```

This preserves existing behavior for `/grail` (which is always rendered behind `AuthGate`, so this code path only runs when a user is already interacting with grail features) while removing the module-load-time throw. Do not change any other logic in this file.

- [ ] **Step 9: Run the full test suite and confirm nothing else broke**

Run: `npm test`
Expected: all existing tests still pass, plus the 3 new tests from this task (33+ files, all green).

- [ ] **Step 10: Verify the resilience guarantee manually**

```bash
mv .env.local .env.local.bak
npm run build 2>&1 | tail -40
mv .env.local.bak .env.local
```
Expected: the build's static pages for `/items/unique/*`, `/items/set/*`, `/items/runewords` succeed. (The `/grail` page's own prerender may still fail exactly as it does today when unconfigured — that's a pre-existing, accepted gap for that specific page, not a regression this task needs to fix.)

- [ ] **Step 11: Commit**

```bash
git add src/lib/grail/supabaseClient.ts src/lib/grail/useGrailAuth.ts src/lib/grail/findsApi.ts src/lib/grail/supabaseClient.test.ts src/lib/grail/useGrailAuth.test.ts
git commit -m "Make Supabase client resilient to missing config (never throw at import time)"
```

---

### Task 2: `owned_items` migration file + `ownedItemsApi.ts`

**Files:**
- Create: `supabase/migrations/0002_owned_items.sql`
- Create: `src/lib/grail/ownedItemsApi.ts`
- Test: `src/lib/grail/ownedItemsApi.test.ts`

**Interfaces:**
- Consumes: `getSupabase()` from Task 1.
- Produces:
  ```ts
  export interface OwnedItem { itemId: string; kind: 'unique' | 'set' | 'runeword'; }
  export async function listOwnedItems(): Promise<OwnedItem[]>
  export async function addOwnedItem(itemId: string, kind: OwnedItem['kind']): Promise<void>
  export async function removeOwnedItem(itemId: string): Promise<void>
  ```
  Task 3's `useOwnedItems()` hook consumes all three.

- [ ] **Step 1: Write the migration file (documentation only — already applied live)**

```sql
-- supabase/migrations/0002_owned_items.sql
-- Applied manually via the Supabase Dashboard SQL editor (this project has
-- no migration runner — the dashboard is the actual source of truth, same
-- as 0001_finds.sql). Checked in for documentation.

create table public.owned_items (
  user_id uuid not null default auth.uid(),
  item_id text not null,
  kind text not null check (kind in ('unique', 'set', 'runeword')),
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.owned_items enable row level security;

create policy "select own owned_items" on public.owned_items
  for select using (auth.uid() = user_id);

create policy "insert own owned_items" on public.owned_items
  for insert with check (auth.uid() = user_id);

create policy "delete own owned_items" on public.owned_items
  for delete using (auth.uid() = user_id);
```

- [ ] **Step 2: Write the failing tests for `ownedItemsApi.ts`**

```ts
// src/lib/grail/ownedItemsApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(),
  auth: { getSession: vi.fn() },
};

vi.mock('./supabaseClient', () => ({ getSupabase: () => mockSupabase }));

describe('ownedItemsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listOwnedItems maps rows to camelCase OwnedItem objects', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ item_id: 'unique-1', kind: 'unique' }, { item_id: 'runeword-Runeword1', kind: 'runeword' }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    mockSupabase.from.mockReturnValue({ select });

    const { listOwnedItems } = await import('./ownedItemsApi');
    const result = await listOwnedItems();

    expect(mockSupabase.from).toHaveBeenCalledWith('owned_items');
    expect(result).toEqual([
      { itemId: 'unique-1', kind: 'unique' },
      { itemId: 'runeword-Runeword1', kind: 'runeword' },
    ]);
  });

  it('listOwnedItems throws the Supabase error when the query fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    mockSupabase.from.mockReturnValue({ select: vi.fn().mockReturnValue({ order }) });
    const { listOwnedItems } = await import('./ownedItemsApi');
    await expect(listOwnedItems()).rejects.toEqual({ message: 'boom' });
  });

  it('addOwnedItem inserts a row with the current user id', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({ insert });

    const { addOwnedItem } = await import('./ownedItemsApi');
    await addOwnedItem('set-69', 'set');

    expect(mockSupabase.from).toHaveBeenCalledWith('owned_items');
    expect(insert).toHaveBeenCalledWith({ user_id: 'user-1', item_id: 'set-69', kind: 'set' });
  });

  it('addOwnedItem throws when not signed in', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    const { addOwnedItem } = await import('./ownedItemsApi');
    await expect(addOwnedItem('set-69', 'set')).rejects.toThrow('Not signed in');
  });

  it('removeOwnedItem deletes by user id and item id', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    const eqItem = vi.fn().mockResolvedValue({ error: null });
    const eqUser = vi.fn().mockReturnValue({ eq: eqItem });
    const del = vi.fn().mockReturnValue({ eq: eqUser });
    mockSupabase.from.mockReturnValue({ delete: del });

    const { removeOwnedItem } = await import('./ownedItemsApi');
    await removeOwnedItem('unique-42');

    expect(mockSupabase.from).toHaveBeenCalledWith('owned_items');
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user-1');
    expect(eqItem).toHaveBeenCalledWith('item_id', 'unique-42');
  });

  it('all three functions no-op / return empty when Supabase is unconfigured', async () => {
    vi.doMock('./supabaseClient', () => ({ getSupabase: () => null }));
    vi.resetModules();
    const { listOwnedItems, addOwnedItem, removeOwnedItem } = await import('./ownedItemsApi');
    await expect(listOwnedItems()).resolves.toEqual([]);
    await expect(addOwnedItem('unique-1', 'unique')).resolves.toBeUndefined();
    await expect(removeOwnedItem('unique-1')).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/ownedItemsApi.test.ts`
Expected: FAIL — `./ownedItemsApi` does not exist yet.

- [ ] **Step 4: Implement `ownedItemsApi.ts`**

```ts
// src/lib/grail/ownedItemsApi.ts
import { getSupabase } from './supabaseClient';

export interface OwnedItem {
  itemId: string;
  kind: 'unique' | 'set' | 'runeword';
}

interface OwnedItemRow {
  item_id: string;
  kind: 'unique' | 'set' | 'runeword';
}

export async function listOwnedItems(): Promise<OwnedItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('owned_items')
    .select('item_id, kind')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as OwnedItemRow[]).map(row => ({ itemId: row.item_id, kind: row.kind }));
}

export async function addOwnedItem(itemId: string, kind: OwnedItem['kind']): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not signed in');
  const { error } = await supabase.from('owned_items').insert({ user_id: userId, item_id: itemId, kind });
  if (error) throw error;
}

export async function removeOwnedItem(itemId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not signed in');
  const { error } = await supabase.from('owned_items').delete().eq('user_id', userId).eq('item_id', itemId);
  if (error) throw error;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/ownedItemsApi.test.ts`
Expected: PASS (6/6)

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0002_owned_items.sql src/lib/grail/ownedItemsApi.ts src/lib/grail/ownedItemsApi.test.ts
git commit -m "Add owned_items table (migration doc) and ownedItemsApi data layer"
```

---

### Task 3: `useOwnedItems()` hook

**Files:**
- Create: `src/lib/grail/useOwnedItems.ts`
- Test: `src/lib/grail/useOwnedItems.test.ts`

**Interfaces:**
- Consumes: `useGrailAuth()` (Task 1), `listOwnedItems`/`addOwnedItem`/`removeOwnedItem` (Task 2).
- Produces:
  ```ts
  export function useOwnedItems(): {
    userId: string | null;
    loading: boolean;
    ownedIds: Set<string>;
    toggle: (itemId: string, kind: 'unique' | 'set' | 'runeword') => void;
    error: string | null;
  }
  ```
  Consumed by `ItemStatCard.tsx`, `RunewordList.tsx` (checkbox), and `CategoryItemList.tsx`/`SetGroupDetail.tsx`/the Runewords page (filter) in later tasks.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/grail/useOwnedItems.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const mockUseGrailAuth = vi.fn();
vi.mock('./useGrailAuth', () => ({ useGrailAuth: () => mockUseGrailAuth() }));

const mockListOwnedItems = vi.fn();
const mockAddOwnedItem = vi.fn();
const mockRemoveOwnedItem = vi.fn();
vi.mock('./ownedItemsApi', () => ({
  listOwnedItems: () => mockListOwnedItems(),
  addOwnedItem: (id: string, kind: string) => mockAddOwnedItem(id, kind),
  removeOwnedItem: (id: string) => mockRemoveOwnedItem(id),
}));

describe('useOwnedItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes an empty set and does not call the API when signed out', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: null, loading: false });
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ownedIds.size).toBe(0);
    expect(mockListOwnedItems).not.toHaveBeenCalled();
  });

  it('fetches owned items once signed in and exposes them as a Set of itemIds', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockListOwnedItems.mockResolvedValue([
      { itemId: 'unique-1', kind: 'unique' },
      { itemId: 'set-69', kind: 'set' },
    ]);
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ownedIds).toEqual(new Set(['unique-1', 'set-69']));
  });

  it('toggle optimistically adds an unowned item, then calls addOwnedItem', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockListOwnedItems.mockResolvedValue([]);
    mockAddOwnedItem.mockResolvedValue(undefined);
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.toggle('unique-1', 'unique'));
    expect(result.current.ownedIds.has('unique-1')).toBe(true); // optimistic
    await waitFor(() => expect(mockAddOwnedItem).toHaveBeenCalledWith('unique-1', 'unique'));
  });

  it('toggle optimistically removes an owned item, then calls removeOwnedItem', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockListOwnedItems.mockResolvedValue([{ itemId: 'unique-1', kind: 'unique' }]);
    mockRemoveOwnedItem.mockResolvedValue(undefined);
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.ownedIds.has('unique-1')).toBe(true));

    act(() => result.current.toggle('unique-1', 'unique'));
    expect(result.current.ownedIds.has('unique-1')).toBe(false); // optimistic
    await waitFor(() => expect(mockRemoveOwnedItem).toHaveBeenCalledWith('unique-1'));
  });

  it('reverts the optimistic update and sets an error message when the API call fails', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockListOwnedItems.mockResolvedValue([]);
    mockAddOwnedItem.mockRejectedValue(new Error('network down'));
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.toggle('unique-1', 'unique'));
    expect(result.current.ownedIds.has('unique-1')).toBe(true); // optimistic
    await waitFor(() => expect(result.current.ownedIds.has('unique-1')).toBe(false)); // reverted
    expect(result.current.error).toBe('network down');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/useOwnedItems.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the hook**

```ts
// src/lib/grail/useOwnedItems.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGrailAuth } from './useGrailAuth';
import { listOwnedItems, addOwnedItem, removeOwnedItem, type OwnedItem } from './ownedItemsApi';
import { getErrorMessage } from './errors';

export function useOwnedItems() {
  const { userId, loading: authLoading } = useGrailAuth();
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setOwnedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    listOwnedItems()
      .then((items: OwnedItem[]) => setOwnedIds(new Set(items.map(i => i.itemId))))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [userId, authLoading]);

  const toggle = useCallback((itemId: string, kind: OwnedItem['kind']) => {
    setError(null);
    const wasOwned = ownedIds.has(itemId);
    setOwnedIds(prev => {
      const next = new Set(prev);
      if (wasOwned) next.delete(itemId); else next.add(itemId);
      return next;
    });
    const request = wasOwned ? removeOwnedItem(itemId) : addOwnedItem(itemId, kind);
    request.catch(e => {
      setError(getErrorMessage(e));
      setOwnedIds(prev => {
        const reverted = new Set(prev);
        if (wasOwned) reverted.add(itemId); else reverted.delete(itemId);
        return reverted;
      });
    });
  }, [ownedIds]);

  return { userId, loading: authLoading || loading, ownedIds, toggle, error };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/useOwnedItems.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/lib/grail/useOwnedItems.ts src/lib/grail/useOwnedItems.test.ts
git commit -m "Add useOwnedItems hook with optimistic toggle"
```

---

### Task 4: i18n keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh-TW.json`
- Modify: `messages/zh-CN.json`

**Interfaces:**
- Produces: 5 new keys under the `Grail` namespace, consumed by Tasks 5-9's UI.

- [ ] **Step 1: Add keys to `messages/en.json`**

Find the `Grail` namespace block (contains `"signInPrompt"`, `"signInGoogle"`, `"signOut"`, `"loading"`). Add, right after `"signOut": "Sign out",`:

```json
    "ownedCheckboxLabel": "I own this",
    "filterAll": "All",
    "filterCollected": "Collected",
    "filterMissing": "Missing",
    "signInToTrackPrompt": "Sign in with Google to track your collection.",
```

- [ ] **Step 2: Add the matching keys to `messages/zh-TW.json`**

Same insertion point (after that file's `"signOut"` key in the `Grail` namespace):

```json
    "ownedCheckboxLabel": "我擁有這個",
    "filterAll": "全部",
    "filterCollected": "已收集",
    "filterMissing": "未收集",
    "signInToTrackPrompt": "使用 Google 登入以追蹤你的收藏。",
```

- [ ] **Step 3: Add the matching keys to `messages/zh-CN.json`**

```json
    "ownedCheckboxLabel": "我拥有这个",
    "filterAll": "全部",
    "filterCollected": "已收集",
    "filterMissing": "未收集",
    "signInToTrackPrompt": "使用 Google 登录以追踪你的收藏。",
```

- [ ] **Step 4: Verify JSON validity and key parity across all three files**

Run:
```bash
node -e "
const en = require('./messages/en.json').Grail;
const tw = require('./messages/zh-TW.json').Grail;
const cn = require('./messages/zh-CN.json').Grail;
const newKeys = ['ownedCheckboxLabel','filterAll','filterCollected','filterMissing','signInToTrackPrompt'];
for (const k of newKeys) {
  if (!en[k] || !tw[k] || !cn[k]) throw new Error('Missing key: ' + k);
}
console.log('All 5 keys present in all 3 locale files.');
"
```
Expected: prints the success line, no error.

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json
git commit -m "Add i18n keys for owned-item checkbox and collected/missing filter"
```

---

### Task 5: Checkbox on `ItemStatCard.tsx` (covers Unique pages + Set piece cards)

**Files:**
- Modify: `src/components/items/ItemStatCard.tsx`
- Test: `src/components/items/ItemStatCard.test.tsx` (existing file — add new tests, do not remove existing ones)

**Interfaces:**
- Consumes: `useOwnedItems()` (Task 3). `GrailItem.kind` is already `'unique' | 'set'` — exactly the two kinds this component ever renders, so `item.kind` can be passed straight through as the `kind` argument to `toggle`.
- Produces: no new exports: this is a leaf UI change only.

- [ ] **Step 1: Write the failing tests**

Read `src/components/items/ItemStatCard.test.tsx` in full first (it already has a `GrailItem` fixture pattern used across multiple `it()` blocks — reuse that exact fixture shape). Append:

```tsx
describe('owned checkbox', () => {
  const baseItem: GrailItem = {
    id: 'unique-99', code: 'x', name: 'Test Item', kind: 'unique', setName: null,
    levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'axes',
    defense: null, requiredStrength: null, durability: null, invFile: '',
    stats: [], fixedStats: [], setBonuses: [], statPriority: [],
  };

  it('renders no checkbox when signed out', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={baseItem} />
      </NextIntlClientProvider>
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('renders an unchecked checkbox for an unowned item when signed in', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={baseItem} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders a checked checkbox for an owned item, and calls toggle with the item id and kind on click', () => {
    const toggle = vi.fn();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(['unique-99']), toggle, error: null }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={baseItem} />
      </NextIntlClientProvider>
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(toggle).toHaveBeenCalledWith('unique-99', 'unique');
  });
});
```

Add `fireEvent` and `vi` to this test file's existing `@testing-library/react` / `vitest` imports if not already imported (check the file's current import line first — most likely only `render, screen` and `describe, it, expect` are currently imported).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/items/ItemStatCard.test.tsx`
Expected: 3 new tests FAIL (no checkbox rendered at all yet); all pre-existing tests in the file still PASS.

- [ ] **Step 3: Add the checkbox to `ItemStatCard.tsx`**

Read the current file in full (shown in full in this plan's Background research — reproduced here for the exact edit). Add the import and hook call, and the checkbox markup next to the name:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import { BASE_PATH } from '@/lib/basePath';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

// Authentic D2 item-rarity text colors (verified against d2r.world's computed styles).
const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-[#cbb87f]',
  set: 'text-[#22ff55]',
};

export default function ItemStatCard({ item }: { item: GrailItem }) {
  const t = useTranslations('Grail');
  const [iconFailed, setIconFailed] = useState(false);
  const { userId, ownedIds, toggle } = useOwnedItems();

  const itemStatRows: [string, string][] = [
    [t('baseLabel'), item.baseName],
    [t('gradeLabel'), t(`grade_${item.grade}`)],
    ...(item.defense ? [[t('defenseLabel'), `${item.defense.min}–${item.defense.max}`] as [string, string]] : []),
    [t('requiredLevel'), String(item.levelReq)],
    ...(item.requiredStrength != null ? [[t('requiredStrength'), String(item.requiredStrength)] as [string, string]] : []),
    ...(item.durability != null ? [[t('durabilityLabel'), String(item.durability)] as [string, string]] : []),
  ];

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-6">
      <div className="mb-1 flex items-start gap-3">
        {item.invFile && !iconFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${BASE_PATH}/items/inv/${item.invFile}.png`}
            alt=""
            aria-hidden="true"
            className="w-20 h-20 object-contain shrink-0"
            onError={() => setIconFailed(true)}
          />
        )}
        <div className="flex-1 flex items-start justify-between gap-2">
          <div>
            <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
            {item.setName && <p className="text-xs text-[#22ff55]">{item.setName}</p>}
          </div>
          {userId && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={ownedIds.has(item.id)}
                onChange={() => toggle(item.id, item.kind)}
                className="w-4 h-4 accent-amber-400"
                aria-label={t('ownedCheckboxLabel')}
              />
            </label>
          )}
        </div>
      </div>

      {/* ... rest of the component is unchanged ... */}
```

The rest of the component (Item Stats / Magic Properties / Set Bonuses sections) is untouched — only the header `<div className="mb-1 flex items-start gap-3">` block changes, wrapping the existing name/setName block in a flex-justify-between row alongside the new checkbox.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/items/ItemStatCard.test.tsx`
Expected: PASS, all tests in the file (pre-existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/items/ItemStatCard.tsx src/components/items/ItemStatCard.test.tsx
git commit -m "Add owned-item checkbox to ItemStatCard (Unique pages + Set piece cards)"
```

---

### Task 6: Checkbox on `RunewordList.tsx`

**Files:**
- Modify: `src/components/items/RunewordList.tsx`
- Test: `src/components/items/RunewordList.test.tsx` (existing file — add new tests)

**Interfaces:**
- Consumes: `useOwnedItems()` (Task 3). Every runeword has a stable `id` field already (`runeword-Runeword1`, etc.) and the fixed `kind: 'runeword'`.

- [ ] **Step 1: Write the failing tests**

Read `src/components/items/RunewordList.test.tsx` in full first (reuse its existing `baseRunewordFixture`/`TestPage` pattern). Append:

```tsx
describe('owned checkbox', () => {
  it('renders no checkbox when signed out', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordList runewords={[baseRunewordFixture]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('renders a checked checkbox for an owned runeword and calls toggle with its id and kind "runeword"', () => {
    const toggle = vi.fn();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set([baseRunewordFixture.id]), toggle, error: null,
      }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordList runewords={[baseRunewordFixture]} locale="en" />
      </NextIntlClientProvider>
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(toggle).toHaveBeenCalledWith(baseRunewordFixture.id, 'runeword');
  });
});
```

Confirm `fireEvent` and `vi` are imported in this test file already (it uses `fireEvent.click` in its existing filter tests per this session's earlier work — `vi` needs adding if not already imported for mocking).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/items/RunewordList.test.tsx`
Expected: 2 new tests FAIL; pre-existing tests still PASS.

- [ ] **Step 3: Add the checkbox to `RunewordList.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type runewordsFullJson from '../../../data/runewords-full.json';
import { BASE_PATH } from '@/lib/basePath';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

type Runeword = (typeof runewordsFullJson)[number];

function RuneIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-6 h-6 object-contain inline-block"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function RunewordList({ runewords, locale }: { runewords: Runeword[]; locale: 'en' | 'zh-TW' | 'zh-CN' }) {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const { userId, ownedIds, toggle } = useOwnedItems();

  return (
    <div className="flex flex-col gap-4 w-full">
      {runewords.map(rw => (
        <div key={rw.id} className="bg-panel border border-panel-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#cbb87f]">{rw.name[locale]}</h3>
            <div className="flex items-center gap-2">
              {rw.ladderOnly && (
                <span className="text-xs px-2 py-1 rounded bg-panel-alt text-muted">
                  {t('runewordsLadderOnly')}
                </span>
              )}
              {userId && (
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ownedIds.has(rw.id)}
                    onChange={() => toggle(rw.id, 'runeword')}
                    className="w-4 h-4 accent-amber-400"
                    aria-label={tGrail('ownedCheckboxLabel')}
                  />
                </label>
              )}
            </div>
          </div>
          {/* ... rest of the card (runes/sockets/base types/stats) is unchanged ... */}
```

Only the header row changes (wrapping `ladderOnly` + the new checkbox in a `flex items-center gap-2` container next to the name); everything below it is untouched.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/items/RunewordList.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Commit**

```bash
git add src/components/items/RunewordList.tsx src/components/items/RunewordList.test.tsx
git commit -m "Add owned-item checkbox to RunewordList"
```

---

### Task 7: Collected/Missing filter on `CategoryItemList.tsx` (Unique pages)

**Files:**
- Modify: `src/components/items/CategoryItemList.tsx`
- Test: `src/components/items/CategoryItemList.test.tsx` (create if it doesn't already exist — check first)

**Interfaces:**
- Consumes: `useOwnedItems()` (Task 3).

- [ ] **Step 1: Check whether a test file already exists**

Run: `ls src/components/items/CategoryItemList.test.tsx 2>/dev/null || echo "none"`. If it exists, read it in full and add to it (preserving all existing tests); if not, create it fresh with the grade-tab test coverage this component doesn't yet have plus the new filter tests below.

- [ ] **Step 2: Write the failing tests**

```tsx
// src/components/items/CategoryItemList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CategoryItemList from './CategoryItemList';
import messages from '../../../messages/en.json';
import type { GrailItem } from '@/lib/grail/catalog';

function makeItem(id: string, name: string): GrailItem {
  return {
    id, code: id, name, kind: 'unique', setName: null,
    levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'axes',
    defense: null, requiredStrength: null, durability: null, invFile: '',
    stats: [], fixedStats: [], setBonuses: [], statPriority: [],
  };
}

describe('CategoryItemList — collected/missing filter', () => {
  it('shows no filter control when signed out', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryItemList items={[makeItem('unique-1', 'Item A')]} />
      </NextIntlClientProvider>
    );
    expect(screen.queryByRole('button', { name: 'Collected' })).not.toBeInTheDocument();
  });

  it('filters to only owned items when "Collected" is clicked', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1']), toggle: vi.fn(), error: null,
      }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryItemList items={[makeItem('unique-1', 'Item A'), makeItem('unique-2', 'Item B')]} />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collected' }));
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.queryByText('Item B')).not.toBeInTheDocument();
  });

  it('filters to only unowned items when "Missing" is clicked', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1']), toggle: vi.fn(), error: null,
      }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryItemList items={[makeItem('unique-1', 'Item A'), makeItem('unique-2', 'Item B')]} />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Missing' }));
    expect(screen.queryByText('Item A')).not.toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
  });

  it('shows all items when "All" is active (the default)', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1']), toggle: vi.fn(), error: null,
      }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryItemList items={[makeItem('unique-1', 'Item A'), makeItem('unique-2', 'Item B')]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/items/CategoryItemList.test.tsx`
Expected: FAIL (no filter control exists yet).

- [ ] **Step 4: Add the filter to `CategoryItemList.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import ItemStatCard from './ItemStatCard';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

const GRADES = ['normal', 'exceptional', 'elite'] as const;
const OWNED_FILTERS = ['all', 'collected', 'missing'] as const;
type OwnedFilter = (typeof OWNED_FILTERS)[number];

export default function CategoryItemList({ items }: { items: GrailItem[] }) {
  const t = useTranslations('Grail');
  const [activeGrade, setActiveGrade] = useState<GrailItem['grade'] | null>(null);
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const { userId, ownedIds } = useOwnedItems();

  const gradesPresent = GRADES.filter(g => items.some(i => i.grade === g));
  let activeItems = activeGrade ? items.filter(i => i.grade === activeGrade) : items;
  if (userId && ownedFilter !== 'all') {
    activeItems = activeItems.filter(i =>
      ownedFilter === 'collected' ? ownedIds.has(i.id) : !ownedIds.has(i.id)
    );
  }

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-gold text-ink-950 font-semibold'
        : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
    }`;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {gradesPresent.length > 1 && (
        <div className="flex gap-2">
          {gradesPresent.map(grade => (
            <button
              key={grade}
              onClick={() => setActiveGrade(g => (g === grade ? null : grade))}
              aria-pressed={activeGrade === grade}
              className={pill(activeGrade === grade)}
            >
              {t(`grade_${grade}`)}
            </button>
          ))}
        </div>
      )}
      {userId && (
        <div className="flex gap-2">
          {OWNED_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setOwnedFilter(f)}
              aria-pressed={ownedFilter === f}
              className={pill(ownedFilter === f)}
            >
              {t(`filter${f.charAt(0).toUpperCase()}${f.slice(1)}` as 'filterAll' | 'filterCollected' | 'filterMissing')}
            </button>
          ))}
        </div>
      )}
      {activeItems.map(item => <ItemStatCard key={item.id} item={item} />)}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/items/CategoryItemList.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/items/CategoryItemList.tsx src/components/items/CategoryItemList.test.tsx
git commit -m "Add collected/missing filter to CategoryItemList (Unique pages)"
```

---

### Task 8: Collected/Missing filter on `SetGroupDetail.tsx` (Set pages)

**Files:**
- Modify: `src/components/items/SetGroupDetail.tsx`
- Test: `src/components/items/SetGroupDetail.test.tsx` (existing file — add to it)

**Interfaces:**
- Consumes: `useOwnedItems()` (Task 3). `GrailItem[]` (the `pieces` prop) already carries stable `id`s.

- [ ] **Step 1: Write the failing tests**

Read `src/components/items/SetGroupDetail.test.tsx` in full first (reuse its existing fixture pattern). Append:

```tsx
describe('SetGroupDetail — collected/missing filter', () => {
  const pieceA: GrailItem = {
    id: 'set-1', code: 'a', name: 'Piece A', kind: 'set', setName: 'Test Set',
    levelReq: 1, baseName: 'Boots', grade: 'exceptional', slotCategory: 'boots',
    defense: null, requiredStrength: null, durability: null, invFile: '',
    stats: [], fixedStats: [], setBonuses: [], statPriority: [],
  };
  const pieceB: GrailItem = { ...pieceA, id: 'set-2', name: 'Piece B' };

  it('shows no filter control when signed out', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupDetail setName="Test Set" pieces={[pieceA, pieceB]} partialBonuses={[]} fullSetBonuses={[]} />
      </NextIntlClientProvider>
    );
    expect(screen.queryByRole('button', { name: 'Collected' })).not.toBeInTheDocument();
  });

  it('filters pieces to only owned ones when "Collected" is clicked', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['set-1']), toggle: vi.fn(), error: null,
      }),
    }));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupDetail setName="Test Set" pieces={[pieceA, pieceB]} partialBonuses={[]} fullSetBonuses={[]} />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collected' }));
    expect(screen.getByText('Piece A')).toBeInTheDocument();
    expect(screen.queryByText('Piece B')).not.toBeInTheDocument();
  });
});
```

Confirm `fireEvent` and `vi` are imported in this test file (add if missing).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/items/SetGroupDetail.test.tsx`
Expected: 2 new tests FAIL; pre-existing tests still PASS.

- [ ] **Step 3: Add the filter to `SetGroupDetail.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ItemStatCard from './ItemStatCard';
import type { GrailItem, GrailStat } from '@/lib/grail/catalog';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

const OWNED_FILTERS = ['all', 'collected', 'missing'] as const;
type OwnedFilter = (typeof OWNED_FILTERS)[number];

export default function SetGroupDetail({
  setName,
  pieces,
  partialBonuses,
  fullSetBonuses,
}: {
  setName: string;
  pieces: GrailItem[];
  partialBonuses: { piecesRequired: number; stats: GrailStat[] }[];
  fullSetBonuses: GrailStat[];
}) {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const { userId, ownedIds } = useOwnedItems();

  const visiblePieces = !userId || ownedFilter === 'all'
    ? pieces
    : pieces.filter(p => (ownedFilter === 'collected' ? ownedIds.has(p.id) : !ownedIds.has(p.id)));

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-gold text-ink-950 font-semibold'
        : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
    }`;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-2xl font-bold text-[#22ff55]">{setName}</h2>

      {userId && (
        <div className="flex gap-2">
          {OWNED_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setOwnedFilter(f)}
              aria-pressed={ownedFilter === f}
              className={pill(ownedFilter === f)}
            >
              {tGrail(`filter${f.charAt(0).toUpperCase()}${f.slice(1)}` as 'filterAll' | 'filterCollected' | 'filterMissing')}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {visiblePieces.map(piece => <ItemStatCard key={piece.id} item={piece} />)}
      </div>

      {/* ... partialBonuses / fullSetBonuses sections below are unchanged ... */}
```

Everything from `<div className="bg-panel border border-panel-border rounded-xl p-6">` (the partial/full set bonus panel) onward is untouched — it doesn't filter, since bonuses aren't per-piece.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/items/SetGroupDetail.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Commit**

```bash
git add src/components/items/SetGroupDetail.tsx src/components/items/SetGroupDetail.test.tsx
git commit -m "Add collected/missing filter to SetGroupDetail (Set pages)"
```

---

### Task 9: Collected/Missing filter on the Runewords page

**Files:**
- Modify: `src/app/[locale]/items/runewords/page.tsx`
- Test: create `src/app/[locale]/items/runewords/page.test.tsx` if none exists for this page today (check first — if none, add coverage here rather than skipping it, since this page owns real filter logic worth testing directly)

**Interfaces:**
- Consumes: `useOwnedItems()` (Task 3).

- [ ] **Step 1: Check for an existing test file**

Run: `find src/app -path "*runewords*" -name "*.test.tsx"`. This page is small and logic-light (mostly composes `RunewordFilters` + `RunewordList`, both already tested); if no test file exists, this task adds one focused specifically on the new owned-filter composition (not re-testing the existing type/socket filters, which are exercised via `RunewordList.test.tsx`/`RunewordFilters` already).

- [ ] **Step 2: Write the failing test**

```tsx
// src/app/[locale]/items/runewords/page.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../../../messages/en.json';

vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return { ...actual, useLocale: () => 'en' };
});

describe('RunewordsPage — collected/missing filter', () => {
  it('filters the list to only owned runewords when "Collected" is clicked', async () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1',
        loading: false,
        ownedIds: new Set(['runeword-Runeword1']), // "Ancients' Pledge" per data/runewords-full.json
        toggle: vi.fn(),
        error: null,
      }),
    }));
    const { default: RunewordsPage } = await import('./page');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordsPage />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collected' }));
    expect(screen.getByText("Ancients' Pledge")).toBeInTheDocument();
    expect(screen.queryByText('Enigma')).not.toBeInTheDocument();
  });
});
```

Verified directly against `data/runewords-full.json` while writing this plan: `id: 'runeword-Runeword1'` is `"Ancients' Pledge"`'s real id — the test above uses the correct, confirmed pairing, not a guess.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run "src/app/[locale]/items/runewords/page.test.tsx"`
Expected: FAIL (no "Collected" button exists yet).

- [ ] **Step 4: Add the filter to the page**

```tsx
'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import runewordsFull from '../../../../../data/runewords-full.json';
import RunewordFilters from '@/components/items/RunewordFilters';
import RunewordList from '@/components/items/RunewordList';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

const ALL_ITEM_TYPES = Array.from(new Set(runewordsFull.flatMap(rw => rw.itemTypes))).sort();
const OWNED_FILTERS = ['all', 'collected', 'missing'] as const;
type OwnedFilter = (typeof OWNED_FILTERS)[number];

export default function RunewordsPage() {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const locale = useLocale() as 'en' | 'zh-TW' | 'zh-CN';
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeSockets, setActiveSockets] = useState<number | null>(null);
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const { userId, ownedIds } = useOwnedItems();

  let filtered = runewordsFull.filter(rw =>
    (!activeType || rw.itemTypes.includes(activeType)) &&
    (!activeSockets || rw.sockets === activeSockets)
  );
  if (userId && ownedFilter !== 'all') {
    filtered = filtered.filter(rw =>
      ownedFilter === 'collected' ? ownedIds.has(rw.id) : !ownedIds.has(rw.id)
    );
  }

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm font-cinzel transition-colors ${
      active
        ? 'bg-gold text-ink-950 font-semibold'
        : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
    }`;
  }

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('runewordsPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('runewordsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <RunewordFilters
          itemTypes={ALL_ITEM_TYPES}
          activeType={activeType}
          onTypeChange={setActiveType}
          activeSockets={activeSockets}
          onSocketsChange={setActiveSockets}
        />
        {userId && (
          <div className="flex flex-wrap gap-2">
            {OWNED_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setOwnedFilter(f)}
                aria-pressed={ownedFilter === f}
                className={pill(ownedFilter === f)}
              >
                {tGrail(`filter${f.charAt(0).toUpperCase()}${f.slice(1)}` as 'filterAll' | 'filterCollected' | 'filterMissing')}
              </button>
            ))}
          </div>
        )}
        <RunewordList runewords={filtered} locale={locale} />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run "src/app/[locale]/items/runewords/page.test.tsx"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/items/runewords/page.tsx" "src/app/[locale]/items/runewords/page.test.tsx"
git commit -m "Add collected/missing filter to the Runewords page"
```

---

### Task 10: Full verification

**Files:** none (verification only) — plus a new verification doc.

- [ ] **Step 1: Run the full automated suite**

```bash
npm test 2>&1 | tail -20
npx tsc --noEmit
npm run lint
```
Expected: all tests pass (pre-existing + every test added in Tasks 1-9), `tsc` clean, lint clean (the one pre-existing unrelated `RunewordList.test.tsx` `'vi' is defined but never used` warning may or may not still apply — check, since this plan's Task 6 now genuinely uses `vi`).

- [ ] **Step 2: Resilience re-check (env vars absent)**

```bash
mv .env.local .env.local.bak
npm run build 2>&1 | tail -40
mv .env.local.bak .env.local
```
Expected: `/items/unique/*`, `/items/set/*`, `/items/runewords` all build successfully with zero checkboxes/filters rendered (verify by grepping the output HTML for `type="checkbox"` — should find none on these pages when unconfigured).

- [ ] **Step 3: Manual spot-check with the dev server**

Start `npm run dev`, then in a real browser (not curl, since this needs real OAuth + click interactions):
1. Visit `/items/unique/axes` signed out — confirm no checkboxes, no filter bar, page looks identical to before this feature.
2. Sign in with Google.
3. Check a couple of items on `/items/unique/axes`; reload the page; confirm the checkboxes are still checked (persisted).
4. Click "Collected" — confirm only checked items show; click "Missing" — confirm only unchecked items show; click "All" — confirm everything shows again.
5. Repeat steps 3-4 on a Set page (`/items/set/[some-set-slug]`) and on `/items/runewords`.
6. Sign out — confirm checkboxes and filter bar disappear again on all three page types, with no leftover filtered state.
7. Confirm `/grail`'s existing find-logging flow still works exactly as before (independent, per the design's non-goal).

- [ ] **Step 4: Write the verification doc**

Create `docs/superpowers/specs/2026-07-19-owned-items-tracker-verification.md` following this project's established verification-doc format (see `docs/superpowers/specs/2026-07-18-stat-color-highlighting-verification.md` for the exact structure: "Automated verification" section with test/tsc/lint/build results, "Manual spot-check" section with concrete observations, "Notes" section for anything noteworthy found during verification).

- [ ] **Step 5: Update `plans/todo.md`**

Add an entry for this feature (check the file's existing format from prior entries this session, e.g. the "Unique/Set/Runeword Stat Color Highlighting" section) with all steps marked `[x]`.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-07-19-owned-items-tracker-verification.md plans/todo.md
git commit -m "Add verification doc for owned-items tracker feature"
```
