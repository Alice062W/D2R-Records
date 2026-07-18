# Unique/Set/Runeword Stat Color Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On Unique, Set, and Runeword item displays, render variable-range stats in
yellow, fixed stats in the existing blue, and any skill-granting stat (in either
group) in pink — matching d2r.world's own color scheme, verified this session
against d2r.world's actual computed styles.

**Architecture:** Attach the `isSkillRef` boolean (already computed internally in
the generator, just never attached to output) to every stat/fixedStat/setBonus
object in `scripts/generate-grail-data.mjs`, thread it through
`src/lib/grail/catalog.ts`'s Raw/localized type layer, and apply the three-color
scheme in `ItemStatCard.tsx` and `RunewordList.tsx`.

**Tech Stack:** Node.js generator script, TypeScript, React/Next.js, Vitest.

## Global Constraints

- Colors (verified against d2r.world's real computed styles this session):
  skill-ref → `text-[#ff4a69]`; variable stat → `text-[#fff818]`; fixed stat →
  `text-[#8080f3]` (unchanged from today).
- `isSkillRef` takes priority over the variable/fixed color — a skill-ref stat is
  always pink regardless of which array it's in.
- Only `ItemStatCard.tsx` (Unique/Set) and `RunewordList.tsx` (Runewords) change —
  no other component's rendering changes, even though the underlying data files
  they don't use also gain the (unused, harmless) new field.

---

### Task 1: Generator — attach isSkillRef to stat output

**Files:**
- Modify: `scripts/generate-grail-data.mjs` (`extractProps`, `extractSetBonuses`)
- Modify: `data/uniques.json`, `data/sets.json`, `data/runewords-full.json`, `data/magic-affixes.json`, `data/crafted-items.json`, `data/runes.json`, `data/set-groups.json` (regenerated output)
- Modify: `data/grail-data.test.ts`

- [ ] **Step 1: Write the failing data test**

Add a new `describe` block to `data/grail-data.test.ts` (near the existing
`uniques`/`sets` describe blocks — check the file for the exact existing import
names for `uniques`/`sets`/`runewordsFull` data and reuse them):

```ts
describe('isSkillRef on generated stats', () => {
  it('marks a known skill-granting unique stat as isSkillRef, and a known plain stat as not', () => {
    // "Iros Torch" (unique club) — confirmed directly against data/uniques.json
    // this session: fixedStats include "Necromancer Skill Levels" (a skill-ref
    // stat) and "Life Steal %"/"Light Radius"/"Energy"/"Mana Regenerated %"
    // (plain stats); stats (variable) includes "Fire Damage" (plain, 5-9).
    const irosTorch = uniques.find(u => u.name.en === 'Iros Torch')!;
    const skillStat = irosTorch.fixedStats.find(f => f.label.en === 'Necromancer Skill Levels')!;
    expect(skillStat.isSkillRef).toBe(true);
    const plainFixed = irosTorch.fixedStats.find(f => f.label.en === 'Light Radius')!;
    expect(plainFixed.isSkillRef).toBe(false);
    const plainVariable = irosTorch.stats.find(s => s.label.en === 'Fire Damage')!;
    expect(plainVariable.isSkillRef).toBe(false);
  });

  it("marks a known skill-granting runeword stat as isSkillRef (Enigma's Teleport charge)", () => {
    // Confirmed directly against data/runewords-full.json this session: Enigma's
    // fixedStats include "Skill Bonus (Teleport)" — a skill/oskill/charged-coded
    // stat (SKILL_REF_PROPS) — alongside plain stats like "Faster Run/Walk %".
    // "All Skills" is a separate "allskills" code, NOT in SKILL_REF_PROPS (it's a
    // flat bonus, not a specific-skill reference), so it stays isSkillRef: false —
    // don't assert it as skill-ref.
    const enigma = runewordsFull.find(r => r.name.en === 'Enigma')!;
    const skillStat = enigma.fixedStats.find(f => f.label.en === 'Skill Bonus (Teleport)')!;
    expect(skillStat.isSkillRef).toBe(true);
    const plainStat = enigma.fixedStats.find(f => f.label.en === 'Faster Run/Walk %')!;
    expect(plainStat.isSkillRef).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "isSkillRef"`
Expected: FAIL — `isSkillRef` field doesn't exist on generated stats yet.

- [ ] **Step 3: Add isSkillRef to extractProps' three push sites**

In `scripts/generate-grail-data.mjs`, modify `extractProps` (the `isSkillRef` const
is already computed on the line just above — add the field to each of the 3
existing `push` calls, don't recompute or rename anything else):

```js
    if (min !== undefined && max !== undefined) {
      if (min === max) fixed.push({ key, label, value: min, isSkillRef });
      else variable.push({ key, label, min, max, isSkillRef });
      continue;
    }
    // Some props (level-scaling stats like hp/lvl, dmg/lvl; also sock,
    // rep-dur, rep-quant) carry only a `par` field instead of min/max.
    // Surface these as a fixed entry rather than silently dropping the
    // stat line — dropping it made e.g. Harlequin Crest's Life/Mana
    // (Based on Character Level) and Windforce's scaling max damage
    // disappear entirely.
    if (par !== undefined) {
      fixed.push({ key, label, value: par, isSkillRef });
    }
```

- [ ] **Step 4: Add isSkillRef to extractSetBonuses' two push sites**

In the same file, modify `extractSetBonuses`:

```js
      if (min !== undefined && max !== undefined) {
        bonuses.push({ key, label, min, max, isSkillRef });
        continue;
      }
      // Same par-only case as extractProps (level-scaling bonuses like
      // att/lvl, ac/lvl) — surface as a fixed min===max entry rather than
      // silently dropping the bonus line.
      if (par !== undefined) {
        bonuses.push({ key, label, min: par, max: par, isSkillRef });
      }
```

- [ ] **Step 5: Regenerate and run test to verify it passes**

Run: `node scripts/generate-grail-data.mjs && npx vitest run data/grail-data.test.ts -t "isSkillRef"`
Expected: PASS. Also run the whole file to confirm nothing else broke:
`npx vitest run data/grail-data.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-grail-data.mjs data/uniques.json data/sets.json data/runewords-full.json data/magic-affixes.json data/crafted-items.json data/runes.json data/set-groups.json data/grail-data.test.ts
git commit -m "Attach isSkillRef to generated stat/fixedStat/setBonus objects"
```

---

### Task 2: Thread isSkillRef through catalog.ts types

**Files:**
- Modify: `src/lib/grail/catalog.ts`
- Modify: `src/components/items/ItemStatCard.test.tsx` (existing fixtures need the new required field)

**Interfaces:**
- Produces: `GrailStat.isSkillRef: boolean`, `GrailFixedStat.isSkillRef: boolean`
  (also present on `setBonuses` entries, which reuse `GrailStat`).

- [ ] **Step 1: Add isSkillRef to the Raw and localized interfaces**

Modify `src/lib/grail/catalog.ts`:

```ts
export interface RawGrailStat {
  key: string;
  label: LocalizedText;
  min: number;
  max: number;
  isSkillRef: boolean;
}

export interface RawGrailFixedStat {
  key: string;
  label: LocalizedText;
  value: number;
  isSkillRef: boolean;
}
```

```ts
export interface GrailStat {
  key: string;
  label: string;
  min: number;
  max: number;
  isSkillRef: boolean;
}

export interface GrailFixedStat {
  key: string;
  label: string;
  value: number;
  isSkillRef: boolean;
}
```

- [ ] **Step 2: Thread isSkillRef through localizeGrailItem**

Modify the same file's `localizeGrailItem` function:

```ts
    stats: item.stats.map(s => ({ key: s.key, label: s.label[locale], min: s.min, max: s.max, isSkillRef: s.isSkillRef })),
    fixedStats: item.fixedStats.map(f => ({ key: f.key, label: f.label[locale], value: f.value, isSkillRef: f.isSkillRef })),
    setBonuses: item.setBonuses.map(b => ({ key: b.key, label: b.label[locale], min: b.min, max: b.max, isSkillRef: b.isSkillRef })),
```

- [ ] **Step 3: Update existing ItemStatCard.test.tsx fixtures**

`GrailStat`/`GrailFixedStat` gained a new required `isSkillRef` field, so the
existing fixture literals in `src/components/items/ItemStatCard.test.tsx` (the
`stats: [{ key: 'dmg%', ... }]` and `fixedStats: [{ key: 'str', ... }]` entries in
the first test) will fail to typecheck. Add `isSkillRef: false` to both existing
entries — do not change anything else about those two tests.

- [ ] **Step 4: Run full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean (this task has no new runtime behavior yet — Task 3 adds the
actual color rendering — so existing tests should just continue passing once the
fixtures are updated).

- [ ] **Step 5: Commit**

```bash
git add src/lib/grail/catalog.ts src/components/items/ItemStatCard.test.tsx
git commit -m "Thread isSkillRef through GrailStat/GrailFixedStat types"
```

---

### Task 3: Apply the three-color scheme in ItemStatCard and RunewordList

**Files:**
- Modify: `src/components/items/ItemStatCard.tsx`
- Modify: `src/components/items/ItemStatCard.test.tsx`
- Modify: `src/components/items/RunewordList.tsx`
- Modify: `src/components/items/RunewordList.test.tsx`

- [ ] **Step 1: Write the failing component tests**

Add to `src/components/items/ItemStatCard.test.tsx` (new test, alongside the
existing ones — reuse the file's existing `GrailItem` fixture shape):

```tsx
it('colors variable stats yellow, fixed stats blue, and skill-ref stats pink regardless of which array they are in', () => {
  const item: GrailItem = {
    id: 'unique-2', code: 'x', name: 'Test Item', kind: 'unique', setName: null,
    levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'axes',
    defense: null, requiredStrength: null, durability: null, invFile: '',
    stats: [
      { key: 'dmg%', label: 'Enhanced Damage %', min: 60, max: 70, isSkillRef: false },
      { key: 'skill:1', label: 'Level 1-20 Fireball', min: 1, max: 20, isSkillRef: true },
    ],
    fixedStats: [
      { key: 'str', label: 'Strength', value: 8, isSkillRef: false },
      { key: 'oskill:2', label: 'Combat Skills', value: 2, isSkillRef: true },
    ],
    setBonuses: [], statPriority: [],
  };
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ItemStatCard item={item} />
    </NextIntlClientProvider>
  );
  expect(screen.getByText(/Enhanced Damage %/).closest('div')).toHaveClass('text-[#fff818]');
  expect(screen.getByText(/Level 1-20 Fireball/).closest('div')).toHaveClass('text-[#ff4a69]');
  expect(screen.getByText(/Strength/).closest('div')).toHaveClass('text-[#8080f3]');
  expect(screen.getByText(/Combat Skills/).closest('div')).toHaveClass('text-[#ff4a69]');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/items/ItemStatCard.test.tsx`
Expected: FAIL — every stat line currently renders in one shared blue color.

- [ ] **Step 3: Implement the color scheme in ItemStatCard**

Modify `src/components/items/ItemStatCard.tsx` — replace the "Magic Properties"
block (the one currently wrapping both `item.stats` and `item.fixedStats` in a
single `text-[#8080f3]` div) and the "Set Bonuses" block:

```tsx
      {(item.stats.length > 0 || item.fixedStats.length > 0) && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('magicProperties')}</h4>
          <div className="text-sm flex flex-col gap-0.5">
            {item.stats.map(stat => (
              <div key={stat.key} className={stat.isSkillRef ? 'text-[#ff4a69]' : 'text-[#fff818]'}>
                {stat.label}: {stat.min}–{stat.max}
              </div>
            ))}
            {item.fixedStats.map(f => (
              <div key={f.key} className={f.isSkillRef ? 'text-[#ff4a69]' : 'text-[#8080f3]'}>
                {f.label}: {f.value}
              </div>
            ))}
          </div>
        </div>
      )}

      {item.setBonuses.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('setBonusesLabel')}</h4>
          <div className="text-sm flex flex-col gap-0.5">
            {item.setBonuses.map((b, i) => (
              <div
                key={`${b.key}-${i}`}
                className={b.isSkillRef ? 'text-[#ff4a69]' : b.min === b.max ? 'text-[#22ff55]' : 'text-[#fff818]'}
              >
                {b.label}: {b.min === b.max ? b.min : `${b.min}–${b.max}`}
              </div>
            ))}
          </div>
        </div>
      )}
```

Note: set bonuses don't have a separate variable/fixed array split (unlike
`stats`/`fixedStats`) — `min === max` is the correct way to tell a fixed set bonus
from a variable one, per the design spec.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/items/ItemStatCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the failing RunewordList test**

Add to `src/components/items/RunewordList.test.tsx` (check the file first for its
existing fixture conventions and reuse them):

```tsx
it('colors variable stats yellow, fixed stats blue, and skill-ref stats pink', () => {
  const rw = {
    ...baseRunewordFixture, // adapt to this file's existing base fixture, or construct inline matching the Runeword shape
    stats: [{ key: 'dmg%', label: { en: 'Enhanced Damage %', 'zh-TW': 'x', 'zh-CN': 'x' }, min: 100, max: 150, isSkillRef: false }],
    fixedStats: [
      { key: 'str', label: { en: 'Strength', 'zh-TW': 'x', 'zh-CN': 'x' }, value: 20, isSkillRef: false },
      { key: 'oskill:1', label: { en: 'All Skill Levels', 'zh-TW': 'x', 'zh-CN': 'x' }, value: 2, isSkillRef: true },
    ],
  };
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RunewordList runewords={[rw]} locale="en" />
    </NextIntlClientProvider>
  );
  expect(screen.getByText(/Enhanced Damage %/).closest('div')).toHaveClass('text-[#fff818]');
  expect(screen.getByText(/Strength/).closest('div')).toHaveClass('text-[#8080f3]');
  expect(screen.getByText(/All Skill Levels/).closest('div')).toHaveClass('text-[#ff4a69]');
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/items/RunewordList.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implement the color scheme in RunewordList**

Modify `src/components/items/RunewordList.tsx` — replace the stats block:

```tsx
          {(rw.stats.length > 0 || rw.fixedStats.length > 0) && (
            <div className="mt-4">
              <div className="text-sm flex flex-col gap-0.5">
                {rw.stats.map(stat => (
                  <div key={stat.key} className={stat.isSkillRef ? 'text-[#ff4a69]' : 'text-[#fff818]'}>
                    {stat.label[locale]}: {stat.min}–{stat.max}
                  </div>
                ))}
                {rw.fixedStats.map(f => (
                  <div key={f.key} className={f.isSkillRef ? 'text-[#ff4a69]' : 'text-[#8080f3]'}>
                    {f.label[locale]}: {f.value}
                  </div>
                ))}
              </div>
            </div>
          )}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/components/items/RunewordList.test.tsx`
Expected: PASS.

- [ ] **Step 9: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add src/components/items/ItemStatCard.tsx src/components/items/ItemStatCard.test.tsx src/components/items/RunewordList.tsx src/components/items/RunewordList.test.tsx
git commit -m "Apply skill/variable/fixed color scheme to Unique, Set, and Runeword stats"
```

---

### Task 4: Full verification + d2r.world spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-18-stat-color-highlighting-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual spot-check**

Serve the static export locally. Find a real Unique item with a skill-granting stat
(e.g. a class-skill-tab or charges item), a Set item with a genuinely variable
stat, and a Runeword with a skill bonus (e.g. Enigma's +2 to All Skills). Confirm
each renders with the correct color: pink for the skill line, yellow for a variable
line, blue for an unrelated fixed line. Check in all three locales (colors are
locale-independent, but confirm nothing broke rendering).

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
