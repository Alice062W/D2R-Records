# Cube Recipes / Crafted Items Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add icons to Cube Recipes and Crafted Items, resolved from this project's own
already-extracted `public/items/inv/` icon set, matching d2r.world's presentation.

**Architecture:** A shared icon-code resolver added to `scripts/generate-grail-data.mjs`,
used to add new icon fields to `data/cube-recipes.json` and `data/crafted-items.json`
from the vendored `cubemain.json`'s structured `input N`/`output` fields (not by
re-parsing the display description text). Components render the resolved icons using
the existing fail-safe `<img>` pattern.

**Tech Stack:** Node.js generator script, React/Next.js components, Vitest.

## Global Constraints

- Never download, hotlink, or embed any image from d2r.world — every icon resolves
  through this project's own `public/items/inv/` files.
- The resolver returns `null` for genuinely-unresolvable codes (broad supertypes like
  `armo`/`weap`/`blun`, gem-quality-tier-only codes `gem0`-`gem4`, potion-type-only
  codes `hpot`/`mpot`, and quest/portal/dynamic-keyword strings) — never guess a
  representative icon for these.
- `cube-recipes.json`'s icons are a deduplicated, order-preserving set built from the
  raw `input 1..N` fields — NOT positionally matched to the free-text description
  (confirmed unsafe: "Prismatic Amulet"'s recipe has `numinputs: 7` but only 2
  human-readable description segments).
- `crafted-items.json`'s `additionalInputIcons` IS positionally aligned with
  `additionalInputs` (safe here — the craft-recipe description format is rigid and
  the existing generator code already relies on the same positional split).
- No change to any existing `description`/`name` text, categorization, or any other
  page.

---

### Task 1: Icon resolver + cube-recipes.json icon fields

**Files:**
- Modify: `scripts/generate-grail-data.mjs` (add resolver; modify `cubeRecipesOut`, around line 1062)
- Modify: `data/cube-recipes.json` (regenerated output)
- Modify: `data/grail-data.test.ts` (add to the existing `describe('cube-recipes.json', ...)` block)
- Modify: `src/components/items/CubeRecipeList.tsx`
- Modify: `src/components/items/CubeRecipeList.test.tsx`

**Interfaces:**
- Produces: `resolveIconFor(rawField: string | undefined): string | null` — a
  module-level function in the generator script (used by both this task and Task 2).
- Produces: `cube-recipes.json[].ingredientIcons: string[]` and
  `cube-recipes.json[].outputIcon: string | null`.

- [ ] **Step 1: Write the failing data tests**

Add to the existing `describe('cube-recipes.json', ...)` block in
`data/grail-data.test.ts`:

```ts
  it('resolves ingredientIcons and outputIcon for a simple 2-input recipe (Staff of Kings + Amulet of the Viper -> Horadric Staff)', () => {
    const r = cubeRecipesData.find(r => r.description.en === 'Staff of Kings + Amulet of the Viper -> Horadric Staff')!;
    expect(r.ingredientIcons).toEqual(['invmsf', 'invvip']);
    expect(r.outputIcon).toBe('invhst');
  });

  it('deduplicates and does NOT positionally match description segments for the Prismatic Amulet recipe (7 raw inputs, 2 description segments)', () => {
    const r = cubeRecipesData.find(r => r.description.en === '6 Perfect Gems (1 of each type) + 1 Magic Amulet -> Prismatic Amulet')!;
    expect(r.ingredientIcons).toEqual(['invamu', 'invgsve', 'invgsye', 'invgsbe', 'invgsge', 'invgsre', 'invgswe']);
    expect(r.outputIcon).toBe('invamu');
  });

  it('resolves an abstract item-type code to its category representative icon (Throwing Axe: Axe (Any) + Dagger (Any))', () => {
    const r = cubeRecipesData.find(r => r.description.en === '1 Axe (Any) + 1 Dagger (Any) -> Throwing Axe')!;
    expect(r.ingredientIcons).toEqual(['invhax', 'invdgr']);
    expect(r.outputIcon).toBe('invtax');
  });

  it('leaves outputIcon null for a quest/portal recipe with no real item code (Wirt\\'s Leg -> Secret Cow Level portal)', () => {
    const r = cubeRecipesData.find(r => r.description.en === "Wirt's Leg + Tome of Town Portal -> Portal to The Secret Cow Level")!;
    expect(r.ingredientIcons).toEqual(['invleg', 'invbbk']);
    expect(r.outputIcon).toBeNull();
  });

  it('every resolved icon in every recipe corresponds to a real file in public/items/inv', () => {
    for (const r of cubeRecipesData) {
      for (const icon of r.ingredientIcons) {
        expect(existsSync(join(process.cwd(), 'public/items/inv', `${icon}.png`))).toBe(true);
      }
      if (r.outputIcon) {
        expect(existsSync(join(process.cwd(), 'public/items/inv', `${r.outputIcon}.png`))).toBe(true);
      }
    }
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run data/grail-data.test.ts -t "ingredientIcons"`
Expected: FAIL — `data/cube-recipes.json` has no `ingredientIcons`/`outputIcon` fields yet.

- [ ] **Step 3: Add the resolver and wire it into cubeRecipesOut**

In `scripts/generate-grail-data.mjs`, add this right after `categoryIconsOut` is fully
built and written (after the `console.log('Wrote ... category icons ...')` line,
around line 640 — `categoryIconsOut`, `items`, and `TYPE_TO_SLOT` are all already in
scope by this point):

```js
// Resolves a raw cubemain.json input/output field (e.g. `"rin,mag,pre=372"`, `axe`,
// `hst`) to one of this project's own already-extracted icon files in
// public/items/inv/ — never by downloading or embedding an image from elsewhere.
// Returns null for genuinely-unresolvable codes (broad supertypes, gem/potion
// quality-tier-only codes, quest/portal display names, and the dynamic
// usetype/useitem/any keywords) rather than guessing a representative icon.
const CUBE_TYPE_ALIASES = { shld: 'shie', rod: 'staf' };

function resolveIconFor(rawField) {
  if (!rawField) return null;
  const code = rawField.replace(/^"|"$/g, '').split(',')[0];
  if (items[code]?.invfile) return items[code].invfile;
  const aliased = CUBE_TYPE_ALIASES[code] ?? code;
  const slot = TYPE_TO_SLOT[aliased];
  if (slot && categoryIconsOut[slot]) return categoryIconsOut[slot];
  return null;
}
```

Then modify `cubeRecipesOut` (the existing map, originally around line 1062) to add
`ingredientIcons`/`outputIcon`:

```js
const cubeRecipesOut = Object.entries(cubeMainData)
  .filter(([id, v]) => (v.enabled === 1 || RECIPE_CATEGORY[id] === 'craftedGrandCharm') && !CRAFT_RECIPE_IDS.has(Number(id)))
  .map(([id, v]) => {
    const ingredientIcons = [];
    for (let n = 1; n <= 7; n++) {
      const icon = resolveIconFor(v[`input ${n}`]);
      if (icon && !ingredientIcons.includes(icon)) ingredientIcons.push(icon);
    }
    return {
      id: `recipe-${id}`,
      description: localizedItemName(v.description),
      category: RECIPE_CATEGORY[id] ?? (() => { throw new Error(`Unclassified cube recipe id ${id}: "${v.description}"`); })(),
      ingredientIcons,
      outputIcon: resolveIconFor(v.output),
    };
  });
```

- [ ] **Step 4: Regenerate and run tests to verify they pass**

Run: `node scripts/generate-grail-data.mjs && npx vitest run data/grail-data.test.ts -t "ingredientIcons"`
Expected: PASS (5 tests). Also run the whole file to confirm no pre-existing
`cube-recipes.json` test broke: `npx vitest run data/grail-data.test.ts`.

- [ ] **Step 5: Write the failing component test**

Add to `src/components/items/CubeRecipeList.test.tsx` (check the file first for its
existing test/fixture conventions and adapt accordingly):

```tsx
it('renders ingredient and output icons alongside the existing description text', () => {
  const recipe = {
    id: 'recipe-0',
    description: { en: 'Staff of Kings + Amulet of the Viper -> Horadric Staff', 'zh-TW': 'x', 'zh-CN': 'x' },
    category: 'quests' as const,
    ingredientIcons: ['invmsf', 'invvip'],
    outputIcon: 'invhst',
  };
  const { container } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CubeRecipeList recipes={[recipe]} locale="en" />
    </NextIntlClientProvider>
  );
  expect(screen.getByText('Staff of Kings + Amulet of the Viper -> Horadric Staff')).toBeInTheDocument();
  const imgs = container.querySelectorAll('img');
  const srcs = Array.from(imgs).map(i => (i as HTMLImageElement).src);
  expect(srcs.some(s => s.includes('invmsf'))).toBe(true);
  expect(srcs.some(s => s.includes('invvip'))).toBe(true);
  expect(srcs.some(s => s.includes('invhst'))).toBe(true);
});

it('renders no output icon when outputIcon is null', () => {
  const recipe = {
    id: 'recipe-2',
    description: { en: "Wirt's Leg + Tome of Town Portal -> Portal to The Secret Cow Level", 'zh-TW': 'x', 'zh-CN': 'x' },
    category: 'quests' as const,
    ingredientIcons: ['invleg', 'invbbk'],
    outputIcon: null,
  };
  const { container } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CubeRecipeList recipes={[recipe]} locale="en" />
    </NextIntlClientProvider>
  );
  const srcs = Array.from(container.querySelectorAll('img')).map(i => (i as HTMLImageElement).src);
  expect(srcs.filter(s => s.includes('invleg') || s.includes('invbbk')).length).toBe(2);
  expect(srcs.some(s => s.includes('invhst'))).toBe(false);
});
```

Note: `CubeRecipeList`'s existing type alias (`type Recipe = (typeof cubeRecipesJson)[number]`)
will pick up the new fields automatically once `data/cube-recipes.json` is
regenerated — the fixture literals above use an explicit inline type only because
this test constructs recipes that aren't in the real regenerated file's exact
`category` union order; adjust to match this file's existing test conventions if it
already imports `Recipe` directly.

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/items/CubeRecipeList.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implement icons in CubeRecipeList**

Modify `src/components/items/CubeRecipeList.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type cubeRecipesJson from '../../../data/cube-recipes.json';

type Recipe = (typeof cubeRecipesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

const CATEGORY_ORDER = [
  'runeGemUpgrade', 'quests', 'consumables', 'sockets', 'itemUpgrade',
  'itemRepair', 'magicItemRerolls', 'magicItemCreation', 'craftedGrandCharm',
] as const;

function RecipeIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-6 h-6 object-contain inline-block"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function CubeRecipeList({ recipes, locale }: { recipes: Recipe[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-8 w-full">
      {CATEGORY_ORDER.map(category => {
        const items = recipes.filter(r => r.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              {t(`cubeRecipesCategory_${category}`)}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map(r => (
                <div key={r.id} className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300">
                  {(r.ingredientIcons.length > 0 || r.outputIcon) && (
                    <div className="flex items-center gap-1 mb-1">
                      {r.ingredientIcons.map((icon, i) => <RecipeIcon key={`${icon}-${i}`} invFile={icon} />)}
                      {r.outputIcon && (
                        <>
                          <span className="text-zinc-500 mx-1">&rarr;</span>
                          <RecipeIcon invFile={r.outputIcon} />
                        </>
                      )}
                    </div>
                  )}
                  {r.description[locale]}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/components/items/CubeRecipeList.test.tsx data/grail-data.test.ts`
Expected: PASS.

- [ ] **Step 9: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/cube-recipes.json data/grail-data.test.ts src/components/items/CubeRecipeList.tsx src/components/items/CubeRecipeList.test.tsx
git commit -m "Add icons to Cube Recipes"
```

---

### Task 2: Crafted Items icon fields

**Files:**
- Modify: `scripts/generate-grail-data.mjs` (`craftedItemsOut`, around line 1084)
- Modify: `data/crafted-items.json` (regenerated output)
- Modify: `data/grail-data.test.ts` (existing `describe('crafted-items.json', ...)` block, around line 388)
- Modify: `src/components/items/CraftedItemList.tsx`
- Modify: `src/components/items/CraftedItemList.test.tsx`

**Interfaces:**
- Consumes: `resolveIconFor` from Task 1 (already module-level in the generator by
  this point).
- Produces: `crafted-items.json[].magicItemInputIcon: string | null` and
  `crafted-items.json[].additionalInputIcons: (string | null)[]` (same length/order
  as the existing `additionalInputs`).

- [ ] **Step 1: Write the failing data test**

Add to the existing `describe('crafted-items.json', ...)` block in
`data/grail-data.test.ts`:

```ts
  it('Hit Power Helm resolves magicItemInputIcon and additionalInputIcons in order (Jewel, Ith Rune, Perfect Sapphire)', () => {
    const helm = craftedItemsData.find(c => c.name.en === 'Hit Power Helm')!;
    expect(helm.magicItemInputIcon).toBe('invfhl');
    expect(helm.additionalInputIcons).toEqual(['invgswe', 'invrIth', 'invgsbe']);
  });

  it('every resolved icon across all crafted items corresponds to a real file in public/items/inv', () => {
    for (const c of craftedItemsData) {
      if (c.magicItemInputIcon) {
        expect(existsSync(join(process.cwd(), 'public/items/inv', `${c.magicItemInputIcon}.png`))).toBe(true);
      }
      for (const icon of c.additionalInputIcons) {
        if (icon) expect(existsSync(join(process.cwd(), 'public/items/inv', `${icon}.png`))).toBe(true);
      }
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/grail-data.test.ts -t "magicItemInputIcon"`
Expected: FAIL.

- [ ] **Step 3: Wire the resolver into craftedItemsOut**

In `scripts/generate-grail-data.mjs`, modify the `craftedItemsOut` map (originally
around line 1084):

```js
const craftedItemsOut = Object.entries(cubeMainData)
  .filter(([id]) => CRAFT_RECIPE_IDS.has(Number(id)))
  .map(([id, v]) => {
    const { variable, fixed } = extractCraftModProps(v, 3);
    const [inputsPart, outputName] = v.description.split(' -> ');
    const inputParts = inputsPart.split(' + ').map(p => p.replace(/^\d+\s*/, ''));
    const rawInputs = [];
    for (let n = 1; n <= 7; n++) {
      if (v[`input ${n}`] === undefined) break;
      rawInputs.push(v[`input ${n}`]);
    }
    return {
      id: `craft-${id}`,
      name: localizedItemName(outputName),
      family: CRAFT_FAMILY_BY_ID[id],
      magicItemInput: localizedItemName(inputParts[0]),
      magicItemInputIcon: resolveIconFor(rawInputs[0]),
      additionalInputs: inputParts.slice(1).map(localizedItemName),
      additionalInputIcons: rawInputs.slice(1).map(resolveIconFor),
      fixedProperties: fixed,
      variableProperties: variable,
    };
  });
```

- [ ] **Step 4: Regenerate and run test to verify it passes**

Run: `node scripts/generate-grail-data.mjs && npx vitest run data/grail-data.test.ts -t "magicItemInputIcon"`
Expected: PASS.

- [ ] **Step 5: Write the failing component test**

Add to `src/components/items/CraftedItemList.test.tsx` (adapt to this file's existing
fixture conventions):

```tsx
it('renders the magic-item-input icon next to the name, and one icon per additional input', () => {
  const item = {
    id: 'craft-64',
    name: { en: 'Hit Power Helm', 'zh-TW': 'x', 'zh-CN': 'x' },
    family: 'hitPower' as const,
    magicItemInput: { en: 'Magic Full Helm', 'zh-TW': 'x', 'zh-CN': 'x' },
    magicItemInputIcon: 'invfhl',
    additionalInputs: [
      { en: 'Jewel', 'zh-TW': 'x', 'zh-CN': 'x' },
      { en: 'Ith Rune', 'zh-TW': 'x', 'zh-CN': 'x' },
      { en: 'Perfect Sapphire', 'zh-TW': 'x', 'zh-CN': 'x' },
    ],
    additionalInputIcons: ['invgswe', 'invrIth', 'invgsbe'],
    fixedProperties: [],
    variableProperties: [],
  };
  const { container } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CraftedItemList items={[item]} locale="en" />
    </NextIntlClientProvider>
  );
  const srcs = Array.from(container.querySelectorAll('img')).map(i => (i as HTMLImageElement).src);
  expect(srcs.some(s => s.includes('invfhl'))).toBe(true);
  expect(srcs.some(s => s.includes('invgswe'))).toBe(true);
  expect(srcs.some(s => s.includes('invrIth'))).toBe(true);
  expect(srcs.some(s => s.includes('invgsbe'))).toBe(true);
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/items/CraftedItemList.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implement icons in CraftedItemList**

Modify `src/components/items/CraftedItemList.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type craftedItemsJson from '../../../data/crafted-items.json';

type CraftedItem = (typeof craftedItemsJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

const FAMILY_ORDER = ['hitPower', 'blood', 'caster', 'safety'] as const;

function CraftIcon({ invFile, size = 'w-8 h-8' }: { invFile: string | null; size?: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className={`${size} object-contain inline-block shrink-0`}
      onError={() => setIconFailed(true)}
    />
  );
}

export default function CraftedItemList({ items, locale }: { items: CraftedItem[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-8 w-full">
      {FAMILY_ORDER.map(family => {
        const familyItems = items.filter(i => i.family === family);
        if (familyItems.length === 0) return null;
        return (
          <div key={family}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              {t(`craftedItemsFamily_${family}`)}
            </h2>
            <div className="flex flex-col gap-3">
              {familyItems.map(item => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
                  <div className="flex items-center gap-2">
                    <CraftIcon invFile={item.magicItemInputIcon} />
                    <h3 className="text-lg font-bold text-[#cbb87f]">{item.name[locale]}</h3>
                  </div>
                  <div className="mt-2 text-sm text-zinc-300 flex items-center gap-2">
                    {t('craftedItemsInputLabel')}: <CraftIcon invFile={item.magicItemInputIcon} size="w-5 h-5" /> {item.magicItemInput[locale]}
                  </div>
                  <div className="text-sm text-zinc-300 flex items-center gap-1 flex-wrap">
                    {t('craftedItemsAdditionalInputsLabel')}:
                    {item.additionalInputs.map((input, i) => (
                      <span key={`${input[locale]}-${i}`} className="flex items-center gap-1">
                        <CraftIcon invFile={item.additionalInputIcons[i]} size="w-5 h-5" />
                        {input[locale]}{i < item.additionalInputs.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                  {item.fixedProperties.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                        {t('craftedItemsFixedPropertiesLabel')}
                      </h4>
                      <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
                        {item.fixedProperties.map(f => <div key={f.key}>{f.label[locale]}: {f.value}</div>)}
                      </div>
                    </div>
                  )}
                  {item.variableProperties.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                        {t('craftedItemsVariablePropertiesLabel')}
                      </h4>
                      <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
                        {item.variableProperties.map(s => <div key={s.key}>{s.label[locale]}: {s.min}–{s.max}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

Note: the input-label line now renders the magic-item-input icon a second time (once
next to the card title as the "result" icon per the `usetype` rule from the design
spec, once next to the "Input:" label) — this is intentional, matching the design's
"reuse the input's icon for the result" rule, not a duplication bug.

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/components/items/CraftedItemList.test.tsx data/grail-data.test.ts`
Expected: PASS.

- [ ] **Step 9: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add scripts/generate-grail-data.mjs data/crafted-items.json data/grail-data.test.ts src/components/items/CraftedItemList.tsx src/components/items/CraftedItemList.test.tsx
git commit -m "Add icons to Crafted Items"
```

---

### Task 3: Full verification + spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-cube-crafted-icons-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual spot-check (curl against the served static export — no repeated browser screenshots)**

Serve the static export locally. Confirm via `curl`/grep that `/en/items/recipes` and
`/en/items/crafted` both include real `/items/inv/*.png` src attributes for several
known rows (e.g. `invmsf`/`invvip`/`invhst` for the Horadric Staff recipe; `invfhl`/
`invgswe`/`invrIth`/`invgsbe` for Hit Power Helm). Confirm a recipe with a
quest/portal output (e.g. the Secret Cow Level portal) shows ingredient icons but no
output icon.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
