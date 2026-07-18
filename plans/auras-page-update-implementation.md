# Auras Page Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove "Paladin"-specific wording from the Auras page (auras can be used
by any class via equipment), and replace the single Lv.1/Lv.20 radius line with a
full per-level (1–20) radius table per aura.

**Architecture:** i18n message-key text edits (no data-shape change) plus a
component change to `AuraList.tsx` computing and rendering a horizontal 20-column
radius table, matching this project's existing horizontal-table convention.

**Tech Stack:** Next.js/next-intl/Tailwind CSS 4, Vitest.

## Global Constraints

- `src/lib/grail/auras.ts`'s `radiusBase`/`radiusPerLevel` fields are unchanged —
  the per-level table is computed at render time (`radiusBase + radiusPerLevel *
  (level - 1)`), not stored as new data.
- Required Level and Mana Cost stay as single-value lines — only Radius becomes a
  table.
- Every locale (en/zh-TW/zh-CN) must be updated consistently.

---

### Task 1: Remove Paladin wording + add per-level radius table

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh-TW.json`
- Modify: `messages/zh-CN.json` (regenerated via script)
- Modify: `src/components/items/AuraList.tsx`
- Modify: `src/components/items/AuraList.test.tsx`

**Interfaces:** No change to `Aura` type or `AURAS` data.

- [ ] **Step 1: Update English message keys**

In `messages/en.json`'s `Items` namespace, apply these exact replacements:

```json
    "aurasPageTitle": "Auras",
    "aurasPageSubtitle": "Browse every aura in Diablo II: Resurrected.",
```

```json
    "aurasRadiusLabel": "Radius",
    "aurasLevelLabel": "Level",
```
(add `aurasLevelLabel` as a new key right after `aurasRadiusLabel`; keep
`aurasReqLevelLabel`/`aurasManaCostLabel` unchanged)

Replace these 14 description values (find-and-replace "the Paladin" → "the wearer"
except Sanctuary, which replaces "near the Paladin" → "nearby"; every other
`aura_*_desc` key not listed here is already neutral and must NOT be touched):

```json
    "aura_might_desc": "Increases the melee attack damage of the wearer and nearby allies.",
    "aura_prayer_desc": "Slowly heals the wearer and nearby allies over time.",
    "aura_resistFire_desc": "Increases fire resistance for the wearer and nearby allies.",
    "aura_defiance_desc": "Increases the defense of the wearer and nearby allies.",
    "aura_resistCold_desc": "Increases cold resistance for the wearer and nearby allies.",
    "aura_blessedAim_desc": "Increases the attack rating of the wearer and nearby allies.",
    "aura_resistLightning_desc": "Increases lightning resistance for the wearer and nearby allies.",
    "aura_concentration_desc": "Increases attack damage and grants immunity to hit-recovery interruption for the wearer and nearby allies.",
    "aura_vigor_desc": "Increases the movement speed, stamina, and stamina recovery of the wearer and nearby allies.",
    "aura_sanctuary_desc": "Damages and repels undead enemies, and prevents corpse explosion nearby.",
    "aura_meditation_desc": "Increases the mana regeneration rate of the wearer and nearby allies.",
    "aura_fanaticism_desc": "Increases the attack speed, attack rating, and damage of the wearer and nearby allies.",
    "aura_redemption_desc": "Converts nearby corpses into experience, life, and mana for the wearer.",
    "aura_salvation_desc": "Increases all elemental resistances for the wearer and nearby allies."
```

- [ ] **Step 2: Update zh-TW message keys**

In `messages/zh-TW.json`'s `Items` namespace, apply the equivalent replacements
(聖騎士 → 使用者, and the same key additions):

```json
    "aurasPageTitle": "光環",
    "aurasPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中每個光環。",
```

```json
    "aurasRadiusLabel": "半徑",
    "aurasLevelLabel": "等級",
```

```json
    "aura_might_desc": "提升使用者與附近隊友的近戰攻擊傷害。",
    "aura_prayer_desc": "緩慢治療使用者與附近隊友的生命值。",
    "aura_resistFire_desc": "提升使用者與附近隊友的火焰抗性。",
    "aura_defiance_desc": "提升使用者與附近隊友的防禦力。",
    "aura_resistCold_desc": "提升使用者與附近隊友的冷凍抗性。",
    "aura_blessedAim_desc": "提升使用者與附近隊友的攻擊等級。",
    "aura_resistLightning_desc": "提升使用者與附近隊友的閃電抗性。",
    "aura_concentration_desc": "提升攻擊傷害，並使使用者與附近隊友免疫擊退。",
    "aura_vigor_desc": "提升使用者與附近隊友的移動速度、體力與體力恢復。",
    "aura_sanctuary_desc": "傷害並擊退不死系敵人，並防止附近的屍體爆炸。",
    "aura_meditation_desc": "提升使用者與附近隊友的魔力恢復速度。",
    "aura_fanaticism_desc": "提升使用者與附近隊友的攻擊速度、攻擊等級與傷害。",
    "aura_redemption_desc": "將附近屍體轉化為使用者的經驗值、生命值與魔力。",
    "aura_salvation_desc": "提升使用者與附近隊友的所有元素抗性。"
```

- [ ] **Step 3: Regenerate zh-CN**

Run: `node scripts/translate-nav-items-ui-zh-cn.mjs`

Verify: `grep -c "聖騎士\|圣骑士" messages/zh-CN.json` — count should be lower than
before this change (some non-aura pages may legitimately still reference Paladin,
e.g. Paladin Shields base-item category — only the Auras-related occurrences should
be gone). Spot check: `grep "aurasPageTitle\|aura_might_desc" messages/zh-CN.json`
shows the updated neutral text.

- [ ] **Step 4: Write the failing component test additions**

Modify `src/components/items/AuraList.test.tsx` — update the existing test's
description assertion (it currently checks for Paladin-specific text) and add a new
test for the radius table:

```tsx
it('renders no "Paladin" wording anywhere', () => {
  const aura: Aura = {
    id: 'might', nameKey: 'aura_might', descriptionKey: 'aura_might_desc',
    reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1,
  };
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AuraList auras={[aura]} />
    </NextIntlClientProvider>
  );
  expect(screen.queryByText(/Paladin/)).not.toBeInTheDocument();
  expect(screen.getByText(/the wearer/)).toBeInTheDocument();
});

it('renders a 20-column radius table with correct per-level values', () => {
  const aura: Aura = {
    id: 'might', nameKey: 'aura_might', descriptionKey: 'aura_might_desc',
    reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1,
  };
  const { container } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AuraList auras={[aura]} />
    </NextIntlClientProvider>
  );
  const cells = Array.from(container.querySelectorAll('table td')).map(td => td.textContent);
  // level 1 -> 16, level 20 -> 16 + 2*19 = 54
  expect(cells).toContain('16');
  expect(cells).toContain('54');
  expect(container.querySelectorAll('table th').length).toBeGreaterThanOrEqual(20);
});
```

The existing test (`'renders icon, visual, name, description, and the three facts
for a sample aura'`) has this line at the end, which must be removed — it asserted
the old single-line `16 / 54` format, which no longer exists as one text node once
the values move into separate `<table>` cells:
```tsx
    // radius at level 1 = 16, at level 20 = 16 + 2*19 = 54
    expect(screen.getByText(/16.*54/)).toBeInTheDocument();
```
Delete just that one assertion (and its comment) from the existing test; leave the
rest of that test (name, description substring, icon/visual `src` checks) unchanged
— it's still valid.

- [ ] **Step 5: Run tests to verify they fail**

Run: `npx vitest run src/components/items/AuraList.test.tsx`
Expected: FAIL — component doesn't render a table yet, and still contains "Paladin"
text (message keys not yet updated) or the test file references text that no longer
matches once Steps 1-2 land first. If Steps 1-2 already landed by this point, this
test fails specifically on the missing `<table>`.

- [ ] **Step 6: Implement the radius table in AuraList.tsx**

Replace the full contents of `src/components/items/AuraList.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Aura } from '@/lib/grail/auras';
import { BASE_PATH } from '@/lib/basePath';

function AuraImage({ src, alt, size }: { src: string; alt: string; size: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${size} object-contain rounded border border-panel-border`}
      onError={() => setFailed(true)}
    />
  );
}

function radiusAtLevel(aura: Aura, level: number) {
  return aura.radiusBase + aura.radiusPerLevel * (level - 1);
}

export default function AuraList({ auras }: { auras: Aura[] }) {
  const t = useTranslations('Items');
  const levels = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4 w-full">
      {auras.map(aura => (
        <div key={aura.id} className="bg-panel border border-panel-border rounded-xl p-6 flex flex-col sm:flex-row gap-4">
          <div className="flex sm:flex-col items-center gap-3 shrink-0">
            <AuraImage src={`${BASE_PATH}/skills/icons/${aura.id}.png`} alt="" size="w-16 h-16" />
            <AuraImage src={`${BASE_PATH}/skills/visuals/${aura.id}.png`} alt="" size="w-24 h-24" />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <h3 className="text-lg font-bold text-gold">{t(aura.nameKey)}</h3>
            <p className="text-sm text-parchment">{t(aura.descriptionKey)}</p>
            <div className="text-xs text-muted flex flex-col gap-1 mt-1">
              <span>{t('aurasReqLevelLabel')}: {aura.reqLevel}</span>
              <span>{t('aurasManaCostLabel')}: {aura.manaCost}</span>
            </div>
            <div className="overflow-x-auto mt-1">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="text-left pr-3 text-muted font-normal">{t('aurasLevelLabel')}</th>
                    {levels.map(lvl => (
                      <th key={lvl} className="px-2 text-muted font-normal">{lvl}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pr-3 text-muted">{t('aurasRadiusLabel')}</td>
                    {levels.map(lvl => (
                      <td key={lvl} className="px-2 text-parchment text-center">{radiusAtLevel(aura, lvl)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/components/items/AuraList.test.tsx`
Expected: PASS.

- [ ] **Step 8: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/components/items/AuraList.tsx src/components/items/AuraList.test.tsx
git commit -m "Remove Paladin wording from Auras page; add per-level radius table"
```

---

### Task 2: Full verification + spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-18-auras-page-update-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual spot-check**

Serve the static export locally. Navigate to `/en/character/auras`. Confirm: page
title is "Auras" (not "Paladin Auras"), no description mentions "Paladin", and each
aura shows a 20-column radius table with values matching `radiusBase +
radiusPerLevel * (level - 1)` (spot-check Might: level 1 = 16, level 20 = 54).
Check zh-TW/zh-CN (no 聖騎士/圣骑士 wording remains on this page). Check the table
scrolls horizontally on mobile width without breaking page layout.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
