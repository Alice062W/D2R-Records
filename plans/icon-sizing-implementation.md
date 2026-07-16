# Item Icon Sizing Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase item inventory icon size from 40px to 80px in `ItemStatCard.tsx` and
`GrailItemDetail.tsx`, matching d2r.world's more prominent icon presentation.

**Architecture:** Single className change (`w-10 h-10` → `w-20 h-20`) in each of the two
components that render item icons. No data, test-assertion, or layout-structure changes
needed — existing tests only assert `src`/`alt`, not size classes.

**Tech Stack:** Next.js 16, React, Tailwind CSS 4.

## Global Constraints

- Only the icon `<img>` size class changes — no change to `onError` fallback logic,
  `alt`/`aria-hidden` attributes, the `flex items-start gap-3` row structure, or any data
  file.
- No other component gets icons in this plan (category-grid landing pages are a separate,
  already-agreed follow-up).

---

### Task 1: Increase icon size in `ItemStatCard` and `GrailItemDetail`

**Files:**
- Modify: `src/components/items/ItemStatCard.tsx`
- Modify: `src/components/grail/GrailItemDetail.tsx`

**Interfaces:** None new — purely a className change on the existing `<img>` element in
each file.

- [ ] **Step 1: Confirm current state**

Run: `grep -n "w-10 h-10" src/components/items/ItemStatCard.tsx src/components/grail/GrailItemDetail.tsx`
Expected: one match per file, `className="w-10 h-10 object-contain shrink-0"`.

- [ ] **Step 2: Change the size class in both files**

In `src/components/items/ItemStatCard.tsx`, change:
```tsx
            className="w-10 h-10 object-contain shrink-0"
```
to:
```tsx
            className="w-20 h-20 object-contain shrink-0"
```

In `src/components/grail/GrailItemDetail.tsx`, make the identical change:
```tsx
            className="w-10 h-10 object-contain shrink-0"
```
to:
```tsx
            className="w-20 h-20 object-contain shrink-0"
```

- [ ] **Step 3: Run the existing tests to confirm nothing broke**

Run: `npx vitest run src/components/items/ItemStatCard.test.tsx src/components/grail/GrailItemDetail.test.tsx`
Expected: PASS (existing tests only assert `src`/`alt`, unaffected by the size class
change) — 4 + 3 tests, all passing.

- [ ] **Step 4: Run full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean (the pre-existing unrelated `RunewordList.test.tsx` `vi`-unused
warning is fine).

- [ ] **Step 5: Commit**

```bash
git add src/components/items/ItemStatCard.tsx src/components/grail/GrailItemDetail.tsx
git commit -m "Increase item inventory icon size from 40px to 80px"
```

---

### Task 2: Browser verification

**Files:** none (verification only)

- [ ] **Step 1: Build and manually verify**

Run: `npm run build`, serve the static export locally, navigate to a Unique/Set Items
category page (e.g. `/en/items/unique/axes`) and the Grail Tracker. Confirm icons render
visibly larger (80px) without looking disproportionate against the card layout, and
without distortion (aspect ratio preserved via `object-contain`) — check at both a
desktop width (~1280px) and a mobile width (~375px) using the browser tool's
`resize_window`.

- [ ] **Step 2: No commit needed if verification is clean**

If manual verification surfaces no issues, this task requires no further commit — Task
1's commit already covers the full change.
