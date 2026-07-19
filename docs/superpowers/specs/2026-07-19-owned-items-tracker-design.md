# Owned-Item Checkboxes for Set/Unique/Runeword Pages — Design

## Goal

Let any visitor sign in with Google and check off individual Unique, Set, and
Runeword items as "owned" directly on the existing reference pages
(`/items/unique/[category]`, `/items/set/[setSlug]`, `/items/runewords`),
persist that per-user, and let them filter each page to Collected /
Missing / All. Signed-out visitors see these pages exactly as they do today
— no login is required to browse.

## Background

The existing Grail Tracker (`/grail`) already has everything needed for
auth, reusable as-is:

- **Google OAuth via Supabase Auth** — `useGrailAuth()` (session state),
  `signInWithGoogle()`, `signOut()` in `src/lib/grail/useGrailAuth.ts`, and
  `AuthGate.tsx` as a full-page gate. `@supabase/supabase-js` is already a
  dependency; `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are
  already set locally (`.env.local`) and (per the grail-tracker plan) as
  GitHub Actions secrets for the deployed build.
- **RLS is already generically multi-user-safe.** The existing `finds`
  table's policies are `auth.uid() = user_id`, not hardcoded to one
  account — the "site-owner-only" line in the original grail-tracker spec
  was a stated *intent*, never an actual technical restriction. Opening
  this new feature to any visitor requires no auth-layer changes at all.
- **Stable, unique IDs already exist for all three categories** —
  `catalog.ts`'s `GrailItem.id` (`"unique-42"`, `"set-69"`) for
  Unique/Set, and `runewords-full.json`'s own `id` field
  (`"runeword-Runeword1"`) for Runewords, confirmed directly against the
  generated data. No new ID scheme is needed.
- The Unique/Set reference pages already import from `catalog.ts` and
  render the *same* `GrailItem` objects `/grail` does — `id`s are
  consistent across both surfaces.

What doesn't exist: a boolean "owned" concept. The current `finds` table is
a detailed per-copy log (rolled stats, ethereal, found act/area/date,
notes) — the right model for `/grail`'s logbook, wrong shape for a simple
checkbox.

**A real risk found during investigation**: `supabaseClient.ts` throws at
*module load time* if the env vars are missing. Today that only breaks
`/grail` (already a known, accepted gap when unconfigured). If new
components on `/items/unique`, `/items/set`, `/items/runewords` import that
client unconditionally, those core pages — which work today with zero
Supabase dependency — would break entirely in any environment missing the
vars (a fresh clone, a CI job, a fork). This must not be allowed to happen;
see the resilience section below.

## Design

### Data model

A new table, independent of `finds`:

```sql
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

No `update` policy needed — toggling "owned" is an insert (checked) or
delete (unchecked) of the single row per `(user_id, item_id)`, never an
edit. Checked into the repo as
`supabase/migrations/0002_owned_items.sql` for documentation, applied
manually via the Supabase Dashboard SQL editor — same pattern as
`0001_finds.sql` (this project has no migration runner; the dashboard is
the actual source of truth, per the original grail-tracker plan's own
note).

### Client data layer

`src/lib/grail/ownedItemsApi.ts`, mirroring `findsApi.ts`'s shape:

```ts
export interface OwnedItem { itemId: string; kind: 'unique' | 'set' | 'runeword'; }

export async function listOwnedItems(): Promise<OwnedItem[]>
export async function addOwnedItem(itemId: string, kind: OwnedItem['kind']): Promise<void>
export async function removeOwnedItem(itemId: string): Promise<void>
```

### Resilience: never break a page that doesn't need auth

`supabaseClient.ts` is changed from throw-on-import to a lazily-created,
nullable client (`getSupabase(): SupabaseClient | null`, memoized, logging a
console warning instead of throwing when env vars are absent).
`useGrailAuth`, `findsApi.ts`, and the new `ownedItemsApi.ts` all switch to
this accessor. When it returns `null`:

- `useGrailAuth()` resolves `userId: null, loading: false` immediately
  (never signed in, never crashes).
- The new owned-items hook (below) behaves identically to "signed out" —
  checkboxes and the filter bar simply don't render.
- `/grail` keeps its current behavior unchanged (`AuthGate` already shows a
  sign-in prompt for `userId === null`; today's throw-based "hard failure"
  becomes a graceful "feature unavailable" instead — a strict improvement,
  not a behavior regression anyone depends on).

This guarantees `/items/unique`, `/items/set`, `/items/runewords` render
identically to today in any environment, configured or not — the new
feature is additive and fails soft.

### `useOwnedItems()` hook

`src/lib/grail/useOwnedItems.ts`, built on `useGrailAuth()`:

```ts
function useOwnedItems(): {
  userId: string | null;
  loading: boolean;
  ownedIds: Set<string>;
  toggle: (itemId: string, kind: OwnedItem['kind']) => void; // optimistic
}
```

Fetches the signed-in user's full `owned_items` list once per mount (one
small query — this table has at most a few hundred rows per user across
all three categories combined, well within a single round trip). `toggle`
updates local state optimistically, then fires the insert/delete; on
failure it reverts and surfaces a lightweight inline error (consistent
with `findsApi`'s existing `getErrorMessage` pattern).

### UI: checkbox on each item card

- **`ItemStatCard.tsx`** (shared by Unique category pages and each Set's
  piece list via `SetGroupDetail.tsx`): a small checkbox next to the item
  name, using `useOwnedItems()`. Signed out: checkbox is hidden entirely
  (not shown disabled — avoids implying a broken control) and replaced
  with nothing extra, keeping today's card layout unchanged for anonymous
  visitors.
- **`RunewordList.tsx`**: the same checkbox next to each runeword's name.

### UI: Collected/Missing filter

A small segmented control (`All` / `Collected` / `Missing`), visible only
when signed in, added to the three list-level client components that
already own their own filter state:

- **`CategoryItemList.tsx`** (Unique pages) — alongside the existing grade
  tabs (normal/exceptional/elite).
- **`SetGroupDetail.tsx`** (a given set's own piece list) — small, since
  most sets have only 3-6 pieces, but consistent with the other two.
- **`RunewordList.tsx`** (Runewords page) — alongside the existing
  `RunewordFilters` (item-type/socket-count pills).

Filtering is pure client-side (`ownedIds.has(item.id)`), same pattern as
the existing grade/type/socket filters already in these components.

### i18n

New keys under the `Grail` namespace (already home to `slot_*`,
`signInPrompt`, etc.): `ownedCheckboxLabel`, `filterAll`, `filterCollected`,
`filterMissing`, `signInToTrackPrompt` (short inline nudge shown near the
filter area when signed out, distinct from `/grail`'s full-page
`signInPrompt`). Added to `messages/en.json`, `zh-TW.json`, `zh-CN.json`.

## Non-goals

- No changes to `/grail`'s existing detailed find-logging flow, its
  `finds` table, or `GrailItemDetail.tsx`/`LogFindForm.tsx` — fully
  independent, per your explicit choice.
- No "owned" tracking for Magic/Rare/Crafted/Cube-Recipe items — scoped to
  Set, Unique, and Runeword only, matching the request.
- No migration of existing `finds` data into `owned_items` — a user who
  has logged detailed finds on `/grail` starts with an empty checkbox
  state on the reference pages; these are deliberately independent
  concepts, not backfilled from each other.
- No server-side rendering of owned state (no SSR personalization) — the
  reference pages stay static-exportable; owned state loads client-side
  after hydration, same pattern `/grail` already uses.

## Testing plan

- Data layer: unit tests for `ownedItemsApi.ts` (mocking the Supabase
  client) covering list/add/remove and the null-client no-op path.
- `useOwnedItems()`: tests for optimistic toggle + revert-on-error, and
  behavior when `getSupabase()` returns `null` (never crashes, exposes an
  empty set).
- Component tests: `ItemStatCard`/`RunewordList` render no checkbox when
  signed out; render an unchecked/checked checkbox correctly from
  `ownedIds` when signed in; clicking calls `toggle`.
- `CategoryItemList`/`SetGroupDetail`/`RunewordList` filter tests: All
  shows everything, Collected shows only `ownedIds` members, Missing shows
  the complement.
- Manual: full sign-in → check a few items across all three pages → reload
  → confirm state persists → sign out → confirm checkboxes disappear and
  the page still renders normally → verify `npm run build` succeeds with
  `.env.local` temporarily renamed away (simulating an unconfigured
  environment) to prove the resilience guarantee holds.
