# Icon BasePath Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix item icons 404ing on the deployed GitHub Pages site (served under
`/D2R-Records/`) by prefixing every icon `src` with the same `basePath` Next.js
already computes for routing, while keeping local dev (served at `/`) unchanged.

**Architecture:** Expose the existing `next.config.ts` `basePath` value to
client/server components via a `NEXT_PUBLIC_BASE_PATH` env var and a tiny shared
constant, then prefix every hardcoded icon `src` string across 10 files with it.

**Tech Stack:** Next.js (static export), Vitest.

## Global Constraints

- `BASE_PATH` must be `''` locally/in tests (no `GITHUB_ACTIONS` env var set), so
  every existing test assertion on icon `src` strings (e.g.
  `.toContain('/items/inv/invhax.png')`) keeps passing unchanged — do not touch any
  test file.
- No change to `next/image`/`<img>` component choice, fallback-on-error behavior, or
  any other rendering logic — this is purely prefixing the `src` string.

---

### Task 1: BasePath helper + wire into all 10 icon-rendering files

**Files:**
- Modify: `next.config.ts`
- Create: `src/lib/basePath.ts`
- Modify: `src/components/items/CategoryCardGrid.tsx`
- Modify: `src/components/items/BaseItemTable.tsx`
- Modify: `src/components/grail/GrailItemDetail.tsx`
- Modify: `src/components/items/RuneList.tsx`
- Modify: `src/components/items/ItemStatCard.tsx`
- Modify: `src/components/items/CubeRecipeList.tsx`
- Modify: `src/components/items/CraftedItemList.tsx`
- Modify: `src/components/items/RunewordList.tsx`
- Modify: `src/components/items/SetGroupList.tsx`
- Modify: `src/components/AppraiserForm.tsx`

**Interfaces:**
- Produces: `BASE_PATH: string` exported from `src/lib/basePath.ts`, imported by all
  9 icon components and `AppraiserForm.tsx`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/basePath.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { BASE_PATH } from './basePath';

describe('BASE_PATH', () => {
  it('is empty in the local/test environment (no GITHUB_ACTIONS env var set)', () => {
    expect(BASE_PATH).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/basePath.test.ts`
Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 3: Add NEXT_PUBLIC_BASE_PATH to next.config.ts**

Modify `next.config.ts` — add an `env` block passing through the already-computed
`basePath`:

```ts
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// GitHub Pages serves this repo under /<repo-name>/, so the basePath is only
// needed when building in that Actions workflow — local dev and other hosts stay at "/".
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const basePath = process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  env: {
    // Exposes the same basePath to plain <img>/<Image> src strings that Next's own
    // routing/asset pipeline already handles automatically — see src/lib/basePath.ts.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Create the shared helper**

Create `src/lib/basePath.ts`:

```ts
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/basePath.test.ts`
Expected: PASS.

- [ ] **Step 6: Wire BASE_PATH into all 9 icon component files**

For each of the following 9 files, add the import
`import { BASE_PATH } from '@/lib/basePath';` and change the `src` template literal
from `` `/items/inv/${X}.png` `` to `` `${BASE_PATH}/items/inv/${X}.png` `` (the
variable name `X` differs per file — use exactly what's already there, don't rename
it). Read each file first to place the import correctly among existing imports and
confirm the exact variable name.

1. `src/components/items/CategoryCardGrid.tsx` (line ~15, variable `invFile`)
2. `src/components/items/BaseItemTable.tsx` (line ~27, variable `line.invFile`)
3. `src/components/grail/GrailItemDetail.tsx` (line ~42, variable `item.invFile`)
4. `src/components/items/RuneList.tsx` (line ~16, variable `invFile`)
5. `src/components/items/ItemStatCard.tsx` (line ~32, variable `item.invFile`)
6. `src/components/items/CubeRecipeList.tsx` (line ~21, variable `invFile`)
7. `src/components/items/CraftedItemList.tsx` (line ~18, variable `invFile`)
8. `src/components/items/RunewordList.tsx` (line ~15, variable `invFile`)
9. `src/components/items/SetGroupList.tsx` (line ~12, variable `invFile`)

Example (for `CategoryCardGrid.tsx`, others follow the identical pattern with their
own variable name):

```tsx
import { BASE_PATH } from '@/lib/basePath';
// ...
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
```

- [ ] **Step 7: Wire BASE_PATH into AppraiserForm.tsx**

Modify `src/components/AppraiserForm.tsx` — add the same import, and change both of
its two `` src={`/items/${selectedBase.code}.png`} `` occurrences (the selected-item
preview and the result preview) to
`` src={`${BASE_PATH}/items/${selectedBase.code}.png`} ``.

- [ ] **Step 8: Run full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, all existing icon-src test assertions still pass unchanged
(since `BASE_PATH` is `''` in the test environment).

- [ ] **Step 9: Manual basePath build check**

Run a build simulating the real GitHub Actions environment:

```bash
GITHUB_ACTIONS=true GITHUB_REPOSITORY=Alice062W/D2R-Records npm run build
```

Then check that the exported HTML's icon `src` attributes are correctly prefixed:

```bash
grep -o '/D2R-Records/items/inv/[a-zA-Z0-9]*\.png' out/en/items/unique/index.html | head -3
```

Expected: at least one match (confirms the prefix applied in a GitHub-Actions-like
build). Then run a normal build (`npm run build`, no env vars) and confirm icon
`src` attributes are back to plain `/items/inv/...png` (no stray prefix locally).

- [ ] **Step 10: Commit**

```bash
git add next.config.ts src/lib/basePath.ts src/lib/basePath.test.ts src/components/items/CategoryCardGrid.tsx src/components/items/BaseItemTable.tsx src/components/grail/GrailItemDetail.tsx src/components/items/RuneList.tsx src/components/items/ItemStatCard.tsx src/components/items/CubeRecipeList.tsx src/components/items/CraftedItemList.tsx src/components/items/RunewordList.tsx src/components/items/SetGroupList.tsx src/components/AppraiserForm.tsx
git commit -m "Fix item icons 404ing on GitHub Pages by prefixing src with basePath"
```

---

### Task 2: Full verification + spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-17-icon-basepath-fix-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual spot-check**

Repeat Task 1 Step 9's GitHub-Actions-simulated build check across a few more pages
(Base Items, Runes, Runewords, Set Items index, Crafted Items) to confirm icons are
prefixed everywhere they appear. Confirm the normal (no env vars) build still has
unprefixed paths, matching local dev's expectations.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
