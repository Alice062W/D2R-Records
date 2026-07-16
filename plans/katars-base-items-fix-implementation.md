# Base Items Katars Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Katars being entirely missing from the Base Items page by adding the
correct item-type code mapping.

**Architecture:** One-line addition to `TYPE_TO_SLOT` in `scripts/generate-grail-data.mjs`.

**Tech Stack:** Node.js generator script, Vitest.

## Global Constraints

- Only add `h2h: 'katars'` to `TYPE_TO_SLOT` — do NOT touch `MAX_SOCKETS_ROWS`'s
  `['Assassin Katars', 'h2h2']` entry (line ~694). This is a legitimately different,
  correct use of the `h2h2` type code against `itemtypes.json` for the Max Sockets table
  — confirmed `itemtypes.json` has both `h2h` ("Hand to Hand") and `h2h2` ("Hand to Hand
  2", `Equiv1: h2h`) as distinct type codes, and the Max Sockets page's existing behavior
  must not change.
- Do not remove the existing (dead) `h2h2: 'katars'` entry from `TYPE_TO_SLOT` unless you
  independently re-confirm nothing else depends on it — the plan's own research found no
  other dependency, but re-verify with a fresh `grep` before removing, since leaving a
  provably-dead key is harmless while removing a wrongly-assumed-dead one is not.

---

### Task 1: Add `h2h` to `TYPE_TO_SLOT` and verify

**Files:**
- Modify: `scripts/generate-grail-data.mjs`
- Test: `data/grail-data.test.ts`

**Interfaces:** None new — `data/bases-full.json` gains katar entries via the existing
`slotCategory` field already used by every other base item.

- [ ] **Step 1: Write the failing test**

Add to `data/grail-data.test.ts`:

```ts
describe('bases-full.json katars', () => {
  it('includes katar base items (Katar, Wrist Blade, Hatchet Hands, Cestus, Claws)', () => {
    const katars = basesFull.filter((b: { slotCategory: string }) => b.slotCategory === 'katars');
    expect(katars.length).toBeGreaterThan(0);
    const names = katars.map((k: { grades: { normal: { name: { en: string } } | null } }) => k.grades.normal?.name.en);
    expect(names).toContain('Katar');
  });
});
```

(`basesFull` is already imported at the top of `data/grail-data.test.ts` from
`./bases-full.json` — reuse it, do not add a duplicate import.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "katars"`
Expected: FAIL — `katars.length` is 0.

- [ ] **Step 3: Fix the mapping**

In `scripts/generate-grail-data.mjs`, change line 373 from:

```js
  grim: 'grimoires', h2h2: 'katars',
```

to:

```js
  grim: 'grimoires', h2h: 'katars', h2h2: 'katars',
```

(Keeping the existing `h2h2: 'katars'` entry alongside the new `h2h: 'katars'` is
harmless — no vendored base item currently has `type: 'h2h2'`, confirmed by grepping
`vendor/d2data/json/items.json`, so it stays a dead-but-harmless mapping rather than one
that needs removal.)

- [ ] **Step 4: Regenerate and verify the test passes**

```bash
npm run generate:grail
npx vitest run data/grail-data.test.ts -t "katars"
```
Expected: PASS.

- [ ] **Step 5: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, including all pre-existing tests still passing.

```bash
git add scripts/generate-grail-data.mjs data/bases-full.json data/grail-data.test.ts
git commit -m "Fix Katars missing from Base Items (TYPE_TO_SLOT used wrong item-type code)"
```

---

### Task 2: d2r.world spot-check

**Files:** none (verification only)

- [ ] **Step 1: Build and manually verify**

Run: `npm run build`, serve the static export locally, navigate to `/en/items/base/katars`.
Confirm it renders real base item comparison rows (Katar, Wrist Blade, Hatchet Hands,
Cestus, Claws across normal/exceptional/elite grades where applicable), matching
d2r.world's `https://d2r.world/en-US/info/item/base/katars` content and stat values for
at least 2 of these base items.

- [ ] **Step 2: No commit needed if verification is clean**

If manual verification surfaces no issues, this task requires no further commit — Task
1's commit already covers the full change.
