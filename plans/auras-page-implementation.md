# Auras Reference Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new page listing all 20 Paladin auras (icon, in-game visual, name,
short description, and the clean facts: required level, mana cost, radius at level
1/20), plus a new nav entry, using the user's own extracted assets.

**Architecture:** Copy the provided asset files into `public/skills/`, a
hand-authored static data file (`src/lib/grail/auras.ts`) with the 20 auras' clean
numeric facts (verified directly against `vendor/d2data/json/skills.json`), i18n
message keys for names/descriptions, a new `AuraList` component, a new page route,
and one new nav entry.

**Tech Stack:** Next.js/next-intl/Tailwind CSS 4, Vitest.

## Global Constraints

- No exact per-level numeric effect values (damage %, resist %, etc.) — documented
  non-goal, the underlying formula language isn't reliably parseable.
- Asset files are copied from `MyInput/skill_icons/` and `MyInput/visuals/` exactly
  as provided (already correctly named, 116×116 PNGs) — no re-processing.
- `reqLevel`/`radiusBase`/`radiusPerLevel`/`manaCost` values must match
  `vendor/d2data/json/skills.json`'s `reqlevel`/`Param1`/`Param2`/`minmana` fields
  exactly for all 20 auras — copy the table below verbatim, don't re-derive.

---

### Task 1: Assets + data file

**Files:**
- Create: `public/skills/icons/*.png` (20 files, copied from `MyInput/skill_icons/`)
- Create: `public/skills/visuals/*.png` (20 files, copied from `MyInput/visuals/`)
- Create: `src/lib/grail/auras.ts`
- Create: `src/lib/grail/auras.test.ts`

**Interfaces:**
- Produces: `AURAS: Aura[]` where
  ```ts
  export interface Aura {
    id: string;
    nameKey: string;
    descriptionKey: string;
    reqLevel: number;
    radiusBase: number;
    radiusPerLevel: number;
    manaCost: number;
  }
  ```

- [ ] **Step 1: Copy the asset files**

```bash
mkdir -p public/skills/icons public/skills/visuals
cp MyInput/skill_icons/*.png public/skills/icons/
cp MyInput/visuals/*.png public/skills/visuals/
```

Verify: `ls public/skills/icons | wc -l` and `ls public/skills/visuals | wc -l` both
print `20`.

- [ ] **Step 2: Write the failing data test**

Create `src/lib/grail/auras.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { AURAS } from './auras';

describe('AURAS', () => {
  it('has exactly 20 entries', () => {
    expect(AURAS.length).toBe(20);
  });

  it('Might has the correct clean facts (verified against vendor/d2data/json/skills.json)', () => {
    const might = AURAS.find(a => a.id === 'might')!;
    expect(might.reqLevel).toBe(1);
    expect(might.radiusBase).toBe(16);
    expect(might.radiusPerLevel).toBe(2);
    expect(might.manaCost).toBe(1);
  });

  it('Conviction has a zero radiusPerLevel (fixed radius, verified against source)', () => {
    const conviction = AURAS.find(a => a.id === 'conviction')!;
    expect(conviction.radiusBase).toBe(20);
    expect(conviction.radiusPerLevel).toBe(0);
  });

  it('every aura has a matching icon and visual file in public/skills/', () => {
    for (const aura of AURAS) {
      expect(existsSync(join(process.cwd(), 'public/skills/icons', `${aura.id}.png`))).toBe(true);
      expect(existsSync(join(process.cwd(), 'public/skills/visuals', `${aura.id}.png`))).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/auras.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 4: Implement auras.ts**

Create `src/lib/grail/auras.ts` with the complete data below (numeric fields copied
directly from `vendor/d2data/json/skills.json`'s `reqlevel`/`Param1`/`Param2`/
`minmana` fields for each of the 20 `"aura": 1` Paladin skills — verified this
session, not guessed):

```ts
export interface Aura {
  id: string;
  nameKey: string;
  descriptionKey: string;
  reqLevel: number;
  radiusBase: number;
  radiusPerLevel: number;
  manaCost: number;
}

// Numeric fields (reqLevel/radiusBase/radiusPerLevel/manaCost) copied directly from
// vendor/d2data/json/skills.json's reqlevel/Param1/Param2/minmana fields for each of
// the 20 skills carrying the literal "aura": 1 flag — the definitive marker for which
// Paladin skills are auras (not a guess). Exact per-level numeric effect values are
// deliberately excluded — see the design spec's non-goals.
export const AURAS: Aura[] = [
  { id: 'might', nameKey: 'aura_might', descriptionKey: 'aura_might_desc', reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1 },
  { id: 'prayer', nameKey: 'aura_prayer', descriptionKey: 'aura_prayer_desc', reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1 },
  { id: 'resist_fire', nameKey: 'aura_resistFire', descriptionKey: 'aura_resistFire_desc', reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'holy_fire', nameKey: 'aura_holyFire', descriptionKey: 'aura_holyFire_desc', reqLevel: 6, radiusBase: 6, radiusPerLevel: 1, manaCost: 0 },
  { id: 'thorns', nameKey: 'aura_thorns', descriptionKey: 'aura_thorns_desc', reqLevel: 6, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'defiance', nameKey: 'aura_defiance', descriptionKey: 'aura_defiance_desc', reqLevel: 6, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'resist_cold', nameKey: 'aura_resistCold', descriptionKey: 'aura_resistCold_desc', reqLevel: 6, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'blessed_aim', nameKey: 'aura_blessedAim', descriptionKey: 'aura_blessedAim_desc', reqLevel: 12, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'cleansing', nameKey: 'aura_cleansing', descriptionKey: 'aura_cleansing_desc', reqLevel: 12, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'resist_lightning', nameKey: 'aura_resistLightning', descriptionKey: 'aura_resistLightning_desc', reqLevel: 12, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'concentration', nameKey: 'aura_concentration', descriptionKey: 'aura_concentration_desc', reqLevel: 18, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'holy_freeze', nameKey: 'aura_holyFreeze', descriptionKey: 'aura_holyFreeze_desc', reqLevel: 18, radiusBase: 6, radiusPerLevel: 1, manaCost: 0 },
  { id: 'vigor', nameKey: 'aura_vigor', descriptionKey: 'aura_vigor_desc', reqLevel: 18, radiusBase: 16, radiusPerLevel: 3, manaCost: 0 },
  { id: 'holy_shock', nameKey: 'aura_holyShock', descriptionKey: 'aura_holyShock_desc', reqLevel: 24, radiusBase: 6, radiusPerLevel: 1, manaCost: 0 },
  { id: 'sanctuary', nameKey: 'aura_sanctuary', descriptionKey: 'aura_sanctuary_desc', reqLevel: 24, radiusBase: 5, radiusPerLevel: 1, manaCost: 1 },
  { id: 'meditation', nameKey: 'aura_meditation', descriptionKey: 'aura_meditation_desc', reqLevel: 24, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'fanaticism', nameKey: 'aura_fanaticism', descriptionKey: 'aura_fanaticism_desc', reqLevel: 30, radiusBase: 11, radiusPerLevel: 1, manaCost: 0 },
  { id: 'conviction', nameKey: 'aura_conviction', descriptionKey: 'aura_conviction_desc', reqLevel: 30, radiusBase: 20, radiusPerLevel: 0, manaCost: 0 },
  { id: 'redemption', nameKey: 'aura_redemption', descriptionKey: 'aura_redemption_desc', reqLevel: 30, radiusBase: 16, radiusPerLevel: 0, manaCost: 0 },
  { id: 'salvation', nameKey: 'aura_salvation', descriptionKey: 'aura_salvation_desc', reqLevel: 30, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/auras.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add public/skills/icons public/skills/visuals src/lib/grail/auras.ts src/lib/grail/auras.test.ts
git commit -m "Add Paladin aura icons, visuals, and clean-fact data"
```

---

### Task 2: Page, component, i18n, and nav entry

**Files:**
- Create: `src/components/items/AuraList.tsx`
- Create: `src/components/items/AuraList.test.tsx`
- Create: `src/app/[locale]/character/auras/page.tsx`
- Modify: `src/components/nav/SiteNavDrawer.tsx`
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Consumes: `AURAS` from Task 1's `src/lib/grail/auras.ts`.

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Nav` namespace (in `MISC_LINKS`'s existing key group,
alongside `misc_levelUp` etc.):
```json
    "misc_auras": "Auras"
```

Add to `messages/en.json`'s `Items` namespace:
```json
    "aurasPageTitle": "Paladin Auras",
    "aurasPageSubtitle": "Browse every Paladin aura in Diablo II: Resurrected.",
    "aurasReqLevelLabel": "Required Level",
    "aurasManaCostLabel": "Mana Cost",
    "aurasRadiusLabel": "Radius (Lv. 1 / Lv. 20)",
    "aura_might": "Might",
    "aura_might_desc": "Increases the melee attack damage of the Paladin and nearby allies.",
    "aura_prayer": "Prayer",
    "aura_prayer_desc": "Slowly heals the Paladin and nearby allies over time.",
    "aura_resistFire": "Resist Fire",
    "aura_resistFire_desc": "Increases fire resistance for the Paladin and nearby allies.",
    "aura_holyFire": "Holy Fire",
    "aura_holyFire_desc": "Periodically burns nearby enemies for fire damage.",
    "aura_thorns": "Thorns",
    "aura_thorns_desc": "Reflects a portion of melee damage back at attackers.",
    "aura_defiance": "Defiance",
    "aura_defiance_desc": "Increases the defense of the Paladin and nearby allies.",
    "aura_resistCold": "Resist Cold",
    "aura_resistCold_desc": "Increases cold resistance for the Paladin and nearby allies.",
    "aura_blessedAim": "Blessed Aim",
    "aura_blessedAim_desc": "Increases the attack rating of the Paladin and nearby allies.",
    "aura_cleansing": "Cleansing",
    "aura_cleansing_desc": "Reduces the duration of poison, curses, and other negative effects, and slowly heals nearby allies.",
    "aura_resistLightning": "Resist Lightning",
    "aura_resistLightning_desc": "Increases lightning resistance for the Paladin and nearby allies.",
    "aura_concentration": "Concentration",
    "aura_concentration_desc": "Increases attack damage and grants immunity to hit-recovery interruption for the Paladin and nearby allies.",
    "aura_holyFreeze": "Holy Freeze",
    "aura_holyFreeze_desc": "Slows and damages nearby enemies with a freezing aura.",
    "aura_vigor": "Vigor",
    "aura_vigor_desc": "Increases the movement speed, stamina, and stamina recovery of the Paladin and nearby allies.",
    "aura_holyShock": "Holy Shock",
    "aura_holyShock_desc": "Periodically shocks nearby enemies for lightning damage.",
    "aura_sanctuary": "Sanctuary",
    "aura_sanctuary_desc": "Damages and repels undead enemies, and prevents corpse explosion near the Paladin.",
    "aura_meditation": "Meditation",
    "aura_meditation_desc": "Increases the mana regeneration rate of the Paladin and nearby allies.",
    "aura_fanaticism": "Fanaticism",
    "aura_fanaticism_desc": "Increases the attack speed, attack rating, and damage of the Paladin and nearby allies.",
    "aura_conviction": "Conviction",
    "aura_conviction_desc": "Reduces the defense and elemental resistances of nearby enemies.",
    "aura_redemption": "Redemption",
    "aura_redemption_desc": "Converts nearby corpses into experience, life, and mana for the Paladin.",
    "aura_salvation": "Salvation",
    "aura_salvation_desc": "Increases all elemental resistances for the Paladin and nearby allies."
```

Add hand-authored zh-TW equivalents to `messages/zh-TW.json` (same key set):
```json
    "misc_auras": "光環",
    "aurasPageTitle": "聖騎士光環",
    "aurasPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中每個聖騎士光環。",
    "aurasReqLevelLabel": "需求等級",
    "aurasManaCostLabel": "魔力消耗",
    "aurasRadiusLabel": "半徑（1 級 / 20 級）",
    "aura_might": "勇氣",
    "aura_might_desc": "提升聖騎士與附近隊友的近戰攻擊傷害。",
    "aura_prayer": "祈禱",
    "aura_prayer_desc": "緩慢治療聖騎士與附近隊友的生命值。",
    "aura_resistFire": "抗火",
    "aura_resistFire_desc": "提升聖騎士與附近隊友的火焰抗性。",
    "aura_holyFire": "聖火",
    "aura_holyFire_desc": "週期性對附近敵人造成火焰傷害。",
    "aura_thorns": "荊棘",
    "aura_thorns_desc": "將部分近戰傷害反彈給攻擊者。",
    "aura_defiance": "蔑視",
    "aura_defiance_desc": "提升聖騎士與附近隊友的防禦力。",
    "aura_resistCold": "抗冷",
    "aura_resistCold_desc": "提升聖騎士與附近隊友的冷凍抗性。",
    "aura_blessedAim": "祝福射準",
    "aura_blessedAim_desc": "提升聖騎士與附近隊友的攻擊等級。",
    "aura_cleansing": "淨化",
    "aura_cleansing_desc": "縮短中毒、詛咒等負面效果的持續時間，並緩慢治療附近隊友。",
    "aura_resistLightning": "抗電",
    "aura_resistLightning_desc": "提升聖騎士與附近隊友的閃電抗性。",
    "aura_concentration": "專注",
    "aura_concentration_desc": "提升攻擊傷害，並使聖騎士與附近隊友免疫擊退。",
    "aura_holyFreeze": "聖冰",
    "aura_holyFreeze_desc": "以冰凍光環減速並傷害附近敵人。",
    "aura_vigor": "活力",
    "aura_vigor_desc": "提升聖騎士與附近隊友的移動速度、體力與體力恢復。",
    "aura_holyShock": "聖電",
    "aura_holyShock_desc": "週期性對附近敵人造成閃電傷害。",
    "aura_sanctuary": "聖所",
    "aura_sanctuary_desc": "傷害並擊退不死系敵人，並防止聖騎士附近的屍體爆炸。",
    "aura_meditation": "冥想",
    "aura_meditation_desc": "提升聖騎士與附近隊友的魔力恢復速度。",
    "aura_fanaticism": "狂熱",
    "aura_fanaticism_desc": "提升聖騎士與附近隊友的攻擊速度、攻擊等級與傷害。",
    "aura_conviction": "堅信",
    "aura_conviction_desc": "降低附近敵人的防禦力與元素抗性。",
    "aura_redemption": "救贖",
    "aura_redemption_desc": "將附近屍體轉化為聖騎士的經驗值、生命值與魔力。",
    "aura_salvation": "救援",
    "aura_salvation_desc": "提升聖騎士與附近隊友的所有元素抗性。"
```

Run `node scripts/translate-nav-items-ui-zh-cn.mjs` to derive zh-CN from zh-TW.

- [ ] **Step 2: Write the failing component test**

Create `src/components/items/AuraList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AuraList from './AuraList';
import messages from '../../../messages/en.json';
import type { Aura } from '@/lib/grail/auras';

describe('AuraList', () => {
  it('renders icon, visual, name, description, and the three facts for a sample aura', () => {
    const aura: Aura = {
      id: 'might', nameKey: 'aura_might', descriptionKey: 'aura_might_desc',
      reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1,
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuraList auras={[aura]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Might')).toBeInTheDocument();
    expect(screen.getByText(/Increases the melee attack damage/)).toBeInTheDocument();
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    expect(imgs.some(i => i.src.includes('/skills/icons/might.png'))).toBe(true);
    expect(imgs.some(i => i.src.includes('/skills/visuals/might.png'))).toBe(true);
    // radius at level 1 = 16, at level 20 = 16 + 2*19 = 54
    expect(screen.getByText(/16.*54/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/items/AuraList.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement AuraList**

Create `src/components/items/AuraList.tsx`:

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

export default function AuraList({ auras }: { auras: Aura[] }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-4 w-full">
      {auras.map(aura => {
        const radiusAtMax = aura.radiusBase + aura.radiusPerLevel * 19;
        return (
          <div key={aura.id} className="bg-panel border border-panel-border rounded-xl p-6 flex flex-col sm:flex-row gap-4">
            <div className="flex sm:flex-col items-center gap-3 shrink-0">
              <AuraImage src={`${BASE_PATH}/skills/icons/${aura.id}.png`} alt="" size="w-16 h-16" />
              <AuraImage src={`${BASE_PATH}/skills/visuals/${aura.id}.png`} alt="" size="w-24 h-24" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-gold">{t(aura.nameKey)}</h3>
              <p className="text-sm text-parchment">{t(aura.descriptionKey)}</p>
              <div className="text-xs text-muted flex flex-col gap-0.5 mt-1">
                <span>{t('aurasReqLevelLabel')}: {aura.reqLevel}</span>
                <span>{t('aurasManaCostLabel')}: {aura.manaCost}</span>
                <span>{t('aurasRadiusLabel')}: {aura.radiusBase} / {radiusAtMax}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/items/AuraList.test.tsx`
Expected: PASS.

- [ ] **Step 6: Wire the page**

Create `src/app/[locale]/character/auras/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AURAS } from '@/lib/grail/auras';
import AuraList from '@/components/items/AuraList';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function AurasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('aurasPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('aurasPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-3xl">
        <AuraList auras={AURAS} />
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Add the nav entry**

Modify `src/components/nav/SiteNavDrawer.tsx` — add one entry to `MISC_LINKS`:

```ts
const MISC_LINKS = [
  ['misc_fcrFhrFbr', 'character/fcr-fhr-fbr'],
  ['misc_alvl85', 'monster/alvl85'],
  ['misc_areaLevel', 'monster/area-level'],
  ['misc_levelUp', 'character/level-up'],
  ['misc_maxSockets', 'misc/max-sockets'],
  ['misc_auras', 'character/auras'],
] as const;
```

- [ ] **Step 8: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm `out/en/character/auras/index.html` (and zh-TW/zh-CN
equivalents) exist with real content, and that the icon/visual `src` paths resolve
correctly (this project's `BASE_PATH` helper, from the Icon BasePath Fix sub-project,
already handles GitHub Pages' subpath — reuse it here rather than hardcoding a root-
relative path).

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/components/items/AuraList.tsx src/components/items/AuraList.test.tsx "src/app/[locale]/character/auras/page.tsx" src/components/nav/SiteNavDrawer.tsx
git commit -m "Add Auras reference page and nav entry"
```

---

### Task 3: Full verification + spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-18-auras-page-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual spot-check**

Serve the static export locally. Navigate to `/en/character/auras`. Confirm all 20
auras render with icon, visual, name, description, and the three facts, and that the
nav drawer's Misc group now includes an "Auras" link that navigates correctly.
Check zh-TW/zh-CN locales too. Check mobile width.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
