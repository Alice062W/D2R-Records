# D2R.world-Style Navigation Shell + Unique/Set Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a d2r.world-style slide-out navigation drawer covering all 14 of d2r.world's
sections (12 as "coming soon" placeholders, 2 — Unique Items and Set Items — with real,
public, no-sign-in content), plus a new "Our Tools" group linking the existing Appraiser
and Grail Tracker pages.

**Architecture:** A new client-side `SiteNavDrawer` component is added to the shared
`[locale]/layout.tsx`, giving every page a hamburger-triggered overlay drawer. Unique/Set
Items pages reuse the existing locale-aware catalog (`getAllGrailItems`/
`localizeGrailItem`) filtered by `kind`, with new presentational components
(`ItemCategoryGrid`, `ItemStatCard`) adapted from the existing Grail category sidebar and
item detail components but with all auth/found-tracking logic stripped out.

**Tech Stack:** Next.js 16 (App Router, static export), next-intl 4.x, Tailwind CSS 4,
Vitest + `@testing-library/react`, `opencc-js` (zh-CN derivation, devDependency only).

## Global Constraints

- Every new page follows the existing pattern: `generateStaticParams` returning
  `routing.locales.map(locale => ({ locale }))`, `await params`, `setRequestLocale(locale)`,
  then `getTranslations(...)` — see `src/app/[locale]/grail/page.tsx` for the reference
  shape.
- All new UI text goes through next-intl. zh-TW is hand-authored; zh-CN for **new**
  message keys is derived from the hand-authored zh-TW via a one-off `opencc-js` script,
  following the exact pattern in `scripts/translate-grail-ui-zh-cn.mjs` — never
  independently translated.
- Locale-prefixed links use plain `next/link` with a manually-built `/${locale}/...` href
  (this project has no `createNavigation` wrapper — see `src/components/Footer.tsx` for the
  established pattern). Do not introduce `@/i18n/navigation`.
- Dark theme Tailwind classes match the existing palette: `bg-zinc-950`/`bg-zinc-900`
  surfaces, `border-zinc-700`/`border-zinc-800` borders, `text-zinc-100`/`text-zinc-400`/
  `text-zinc-500` text, `bg-amber-500`/`text-amber-300` accents. Reuse existing class
  strings from `GrailCategorySidebar.tsx`/`GrailItemDetail.tsx` where the new component is
  a direct adaptation.
- Generic item/stat vocabulary (slot category names, "Item Stats", "Magic Properties",
  grade names, base/defense/level/strength/durability labels) is **reused from the
  existing `Grail` message namespace** rather than duplicated into a new namespace. These
  labels aren't Grail-tracker-specific — they're generic Diablo item-domain vocabulary
  already fully translated in all 3 locales. Only page-specific text (titles, subtitles)
  goes into the new `Items` namespace. Do not copy/duplicate `Grail`'s stat-label keys.
- The existing Grail Tracker (`src/components/grail/AuthGate.tsx`,
  `src/lib/grail/findsApi.ts`, Supabase-backed sign-in gate, "Log a find" flow) is not
  modified anywhere in this plan.
- Category ordering always follows the existing `SLOT_ORDER` export from
  `src/lib/grail/catalog.ts` — do not redefine or reorder it.

---

### Task 1: Nav + Items message namespaces

**Files:**
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`
- Create: `scripts/translate-nav-items-ui-zh-cn.mjs`
- Test: `messages/nav-items-messages.test.ts`

**Interfaces:**
- Produces: message namespaces `Nav` (drawer/menu labels) and `Items` (page titles/
  subtitles for the unique/set pages) available via `useTranslations('Nav')` /
  `useTranslations('Items')` in every subsequent task.

- [ ] **Step 1: Add the `Nav` and `Items` namespaces to `messages/en.json`**

Open `messages/en.json`. It currently has top-level keys `Home`, `Appraiser`, `Footer`,
`Grail` in that order. Add two new top-level keys, `Nav` and `Items`, after `Grail` (before
the closing `}`):

```json
  "Nav": {
    "openMenu": "Open menu",
    "closeMenu": "Close menu",
    "group_gameItems": "Game Items",
    "group_misc": "Misc",
    "group_ourTools": "Our Tools",
    "item_base": "Base Items",
    "item_magic": "Magic Items",
    "item_rare": "Rare Items",
    "item_set": "Set Items",
    "item_unique": "Unique Items",
    "item_runes": "Runes",
    "item_runewords": "Runewords",
    "item_cubeRecipes": "Cube Recipes",
    "item_crafted": "Crafted Items",
    "misc_fcrFhrFbr": "FCR/FHR/FBR",
    "misc_alvl85": "Alvl85 Areas",
    "misc_areaLevel": "Area Level",
    "misc_levelUp": "Level Up",
    "misc_maxSockets": "Max Sockets",
    "tool_appraiser": "Appraiser",
    "tool_grailTracker": "Grail Tracker",
    "aboutUs": "About Us",
    "comingSoon": "This section hasn't been built yet — check back soon."
  },
  "Items": {
    "uniquePageTitle": "Unique Items",
    "uniquePageSubtitle": "Browse every unique item in Diablo II: Resurrected.",
    "setPageTitle": "Set Items",
    "setPageSubtitle": "Browse every set item in Diablo II: Resurrected."
  }
```

(Exact placement: this is the last property of the object, so the line above `Grail`'s
closing `}` needs a trailing comma added, and `Nav`'s closing `}` needs a comma before
`"Items"`, and `Items`'s closing `}` has no trailing comma since it's now last.)

- [ ] **Step 2: Add the same namespaces to `messages/zh-TW.json`, hand-authored**

Add, in the same position (after `Grail`, following the same comma rules):

```json
  "Nav": {
    "openMenu": "開啟選單",
    "closeMenu": "關閉選單",
    "group_gameItems": "物品資訊",
    "group_misc": "其他資訊",
    "group_ourTools": "站內工具",
    "item_base": "基礎裝備",
    "item_magic": "魔法裝備",
    "item_rare": "稀有裝備",
    "item_set": "成套裝備",
    "item_unique": "獨特裝備",
    "item_runes": "符文",
    "item_runewords": "符文之語",
    "item_cubeRecipes": "方塊配方",
    "item_crafted": "手工藝品",
    "misc_fcrFhrFbr": "FCR/FHR/FBR",
    "misc_alvl85": "85場景表",
    "misc_areaLevel": "場景等級",
    "misc_levelUp": "最佳練級難度",
    "misc_maxSockets": "最大孔數",
    "tool_appraiser": "鑑定工具",
    "tool_grailTracker": "聖杯追蹤器",
    "aboutUs": "關於本站",
    "comingSoon": "此區塊尚未建置，敬請期待。"
  },
  "Items": {
    "uniquePageTitle": "獨特裝備",
    "uniquePageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的獨特物品。",
    "setPageTitle": "成套裝備",
    "setPageSubtitle": "瀏覽暗黑破壞神2：獄火重生中所有的套裝物品。"
  }
```

Values for `group_gameItems`, `group_misc`, `item_*`, `misc_*`, and `aboutUs` are taken
verbatim from d2r.world's own zh-TW site (confirmed by direct inspection: 物品資訊 / 其他資訊
group headers; 基礎裝備 / 魔法裝備 / 稀有裝備 / 成套裝備 / 獨特裝備 / 符文 / 符文之語 / 方塊配方 /
手工藝品 section names; 85場景表 / 場景等級 / 最佳練級難度 / 最大孔數 misc names; 關於本站 for
About Us) — matching terminology exactly, per the brief. `tool_grailTracker`'s value
matches the existing `Footer.grailLink` translation ("聖杯追蹤器") for consistency within this
site. `group_ourTools`, `tool_appraiser`, `openMenu`, `closeMenu`, `comingSoon`, and the
`Items` namespace are original to this site (not on d2r.world) and are ordinary
hand-translated Traditional Chinese.

- [ ] **Step 3: Write the zh-CN derivation script**

Create `scripts/translate-nav-items-ui-zh-cn.mjs`:

```js
// scripts/translate-nav-items-ui-zh-cn.mjs
// One-off script: converts messages/zh-TW.json's Nav + Items namespaces to Simplified
// Chinese via OpenCC and writes them into messages/zh-CN.json, leaving every other key
// in zh-CN.json untouched. Mirrors scripts/translate-grail-ui-zh-cn.mjs. Not part of the
// build; run once, then leave as a reference for the next time Nav/Items zh-TW text
// changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as OpenCC from 'opencc-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES = join(__dirname, '..', 'messages');

const toZhCn = OpenCC.Converter({ from: 'tw', to: 'cn' });

const zhTw = JSON.parse(readFileSync(join(MESSAGES, 'zh-TW.json'), 'utf8'));
const zhCn = JSON.parse(readFileSync(join(MESSAGES, 'zh-CN.json'), 'utf8'));

zhCn.Nav = Object.fromEntries(
  Object.entries(zhTw.Nav).map(([key, value]) => [key, toZhCn(value)])
);
zhCn.Items = Object.fromEntries(
  Object.entries(zhTw.Items).map(([key, value]) => [key, toZhCn(value)])
);

writeFileSync(join(MESSAGES, 'zh-CN.json'), JSON.stringify(zhCn, null, 2) + '\n');
console.log('Converted Nav + Items namespaces to zh-CN.');
```

- [ ] **Step 4: Run the script**

Run: `node scripts/translate-nav-items-ui-zh-cn.mjs`
Expected output: `Converted Nav + Items namespaces to zh-CN.`

- [ ] **Step 5: Write the failing test first (key-parity + non-empty check)**

Create `messages/nav-items-messages.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import en from './en.json';
import zhTw from './zh-TW.json';
import zhCn from './zh-CN.json';

describe('Nav + Items message namespaces', () => {
  const locales = { en, 'zh-TW': zhTw, 'zh-CN': zhCn } as const;

  it('all three locales have the same Nav keys', () => {
    const enKeys = Object.keys(en.Nav).sort();
    expect(Object.keys(zhTw.Nav).sort()).toEqual(enKeys);
    expect(Object.keys(zhCn.Nav).sort()).toEqual(enKeys);
  });

  it('all three locales have the same Items keys', () => {
    const enKeys = Object.keys(en.Items).sort();
    expect(Object.keys(zhTw.Items).sort()).toEqual(enKeys);
    expect(Object.keys(zhCn.Items).sort()).toEqual(enKeys);
  });

  it('every Nav and Items value is non-empty in every locale', () => {
    for (const [localeName, messages] of Object.entries(locales)) {
      for (const [key, value] of Object.entries({ ...messages.Nav, ...messages.Items })) {
        expect(value, `${localeName}.${key}`).not.toBe('');
      }
    }
  });

  it('zh-CN differs from zh-TW for at least one Nav value with Traditional-only characters', () => {
    expect(zhCn.Nav.group_gameItems).not.toBe(zhTw.Nav.group_gameItems);
  });
});
```

This test doesn't need a separate "run it and see it fail" step in the usual TDD sense —
the JSON files already exist from Steps 1–2 by the time this file is written, so instead:

- [ ] **Step 6: Run the test and verify it passes**

Run: `npx vitest run messages/nav-items-messages.test.ts`
Expected: 4 tests passing.

- [ ] **Step 7: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json scripts/translate-nav-items-ui-zh-cn.mjs messages/nav-items-messages.test.ts
git commit -m "Add Nav + Items message namespaces (en/zh-TW hand-authored, zh-CN via OpenCC)"
```

---

### Task 2: SiteNavDrawer component + wire into layout

**Files:**
- Create: `src/components/nav/SiteNavDrawer.tsx`
- Create: `src/components/nav/SiteNavDrawer.test.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `Nav` namespace keys from Task 1 (`useTranslations('Nav')`), `useLocale()` from
  next-intl.
- Produces: `SiteNavDrawer` default export (client component, no props) — a self-contained
  hamburger button + overlay drawer, mounted once in the shared layout.

- [ ] **Step 1: Write the failing test**

Create `src/components/nav/SiteNavDrawer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SiteNavDrawer from './SiteNavDrawer';
import messages from '../../../messages/en.json';

function renderDrawer() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SiteNavDrawer />
    </NextIntlClientProvider>
  );
}

describe('SiteNavDrawer', () => {
  it('is closed by default (no nav links visible)', () => {
    renderDrawer();
    expect(screen.queryByRole('link', { name: 'Unique Items' })).not.toBeInTheDocument();
  });

  it('opens on hamburger click and shows all groups and links', () => {
    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByText('Game Items')).toBeInTheDocument();
    expect(screen.getByText('Misc')).toBeInTheDocument();
    expect(screen.getByText('Our Tools')).toBeInTheDocument();

    const expectedLinks: [string, string][] = [
      ['Base Items', '/en/items/base'],
      ['Magic Items', '/en/items/magic'],
      ['Rare Items', '/en/items/rare'],
      ['Set Items', '/en/items/set'],
      ['Unique Items', '/en/items/unique'],
      ['Runes', '/en/items/runes'],
      ['Runewords', '/en/items/runewords'],
      ['Cube Recipes', '/en/items/cube-recipes'],
      ['Crafted Items', '/en/items/crafted'],
      ['FCR/FHR/FBR', '/en/character/fcr-fhr-fbr'],
      ['Alvl85 Areas', '/en/monster/alvl85'],
      ['Area Level', '/en/monster/area-level'],
      ['Level Up', '/en/character/level-up'],
      ['Max Sockets', '/en/misc/max-sockets'],
      ['Appraiser', '/en'],
      ['Grail Tracker', '/en/grail'],
      ['About Us', '/en/about'],
    ];
    for (const [label, href] of expectedLinks) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
  });

  it('closes when the backdrop is clicked', () => {
    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('link', { name: 'Unique Items' })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('nav-drawer-backdrop'));
    expect(screen.queryByRole('link', { name: 'Unique Items' })).not.toBeInTheDocument();
  });

  it('closes when a link inside it is clicked', () => {
    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('link', { name: 'Unique Items' }));
    expect(screen.queryByRole('link', { name: 'Set Items' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/nav/SiteNavDrawer.test.tsx`
Expected: FAIL — `Cannot find module './SiteNavDrawer'`.

- [ ] **Step 3: Implement `SiteNavDrawer`**

Create `src/components/nav/SiteNavDrawer.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

const GAME_ITEM_LINKS = [
  ['item_base', 'items/base'],
  ['item_magic', 'items/magic'],
  ['item_rare', 'items/rare'],
  ['item_set', 'items/set'],
  ['item_unique', 'items/unique'],
  ['item_runes', 'items/runes'],
  ['item_runewords', 'items/runewords'],
  ['item_cubeRecipes', 'items/cube-recipes'],
  ['item_crafted', 'items/crafted'],
] as const;

const MISC_LINKS = [
  ['misc_fcrFhrFbr', 'character/fcr-fhr-fbr'],
  ['misc_alvl85', 'monster/alvl85'],
  ['misc_areaLevel', 'monster/area-level'],
  ['misc_levelUp', 'character/level-up'],
  ['misc_maxSockets', 'misc/max-sockets'],
] as const;

const TOOL_LINKS = [
  ['tool_appraiser', ''],
  ['tool_grailTracker', 'grail'],
] as const;

export default function SiteNavDrawer() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  function linkHref(path: string) {
    return path ? `/${locale}/${path}` : `/${locale}`;
  }

  return (
    <>
      <div className="flex items-center border-b border-zinc-800 px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          aria-label={t('openMenu')}
          className="text-zinc-300 hover:text-amber-300 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            data-testid="nav-drawer-backdrop"
            onClick={close}
            className="absolute inset-0 bg-black/60"
          />
          <nav className="relative w-72 max-w-[80vw] h-full bg-zinc-950 border-r border-zinc-800 overflow-y-auto p-4 flex flex-col gap-6">
            <button
              onClick={close}
              aria-label={t('closeMenu')}
              className="self-end text-zinc-400 hover:text-amber-300 transition-colors"
            >
              ✕
            </button>

            <NavGroup title={t('group_gameItems')}>
              {GAME_ITEM_LINKS.map(([key, path]) => (
                <NavLink key={key} href={linkHref(path)} onNavigate={close}>
                  {t(key)}
                </NavLink>
              ))}
            </NavGroup>

            <NavGroup title={t('group_misc')}>
              {MISC_LINKS.map(([key, path]) => (
                <NavLink key={key} href={linkHref(path)} onNavigate={close}>
                  {t(key)}
                </NavLink>
              ))}
            </NavGroup>

            <NavGroup title={t('group_ourTools')}>
              {TOOL_LINKS.map(([key, path]) => (
                <NavLink key={key} href={linkHref(path)} onNavigate={close}>
                  {t(key)}
                </NavLink>
              ))}
            </NavGroup>

            <NavLink href={linkHref('about')} onNavigate={close}>
              {t('aboutUs')}
            </NavLink>
          </nav>
        </div>
      )}
    </>
  );
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function NavLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-amber-300 transition-colors"
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/nav/SiteNavDrawer.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire into the shared layout**

Modify `src/app/[locale]/layout.tsx`. Add the import:

```tsx
import SiteNavDrawer from '@/components/nav/SiteNavDrawer';
```

and add `<SiteNavDrawer />` as the first child inside `<NextIntlClientProvider>`, directly
before `{children}`:

```tsx
        <NextIntlClientProvider messages={messages}>
          <SiteNavDrawer />
          {children}
          <Footer />
        </NextIntlClientProvider>
```

- [ ] **Step 6: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean; build succeeds for all 3 locales.

```bash
git add src/components/nav/SiteNavDrawer.tsx src/components/nav/SiteNavDrawer.test.tsx src/app/[locale]/layout.tsx
git commit -m "Add SiteNavDrawer hamburger menu, wire into shared layout"
```

---

### Task 3: ComingSoon placeholder page + 13 placeholder routes

**Files:**
- Create: `src/components/ComingSoonPage.tsx`
- Create: `src/components/ComingSoonPage.test.tsx`
- Create: `src/app/[locale]/items/base/page.tsx`
- Create: `src/app/[locale]/items/magic/page.tsx`
- Create: `src/app/[locale]/items/rare/page.tsx`
- Create: `src/app/[locale]/items/runes/page.tsx`
- Create: `src/app/[locale]/items/runewords/page.tsx`
- Create: `src/app/[locale]/items/cube-recipes/page.tsx`
- Create: `src/app/[locale]/items/crafted/page.tsx`
- Create: `src/app/[locale]/character/fcr-fhr-fbr/page.tsx`
- Create: `src/app/[locale]/monster/alvl85/page.tsx`
- Create: `src/app/[locale]/monster/area-level/page.tsx`
- Create: `src/app/[locale]/character/level-up/page.tsx`
- Create: `src/app/[locale]/misc/max-sockets/page.tsx`
- Create: `src/app/[locale]/about/page.tsx`

**Interfaces:**
- Consumes: `Nav` namespace (`title`/`comingSoon` text) from Task 1.
- Produces: `ComingSoonPage` component taking a single `title: string` prop, used by all 13
  routes above.

- [ ] **Step 1: Write the failing test**

Create `src/components/ComingSoonPage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ComingSoonPage from './ComingSoonPage';
import messages from '../../messages/en.json';

describe('ComingSoonPage', () => {
  it('renders the given title and the coming-soon message', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ComingSoonPage title="Runes" />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Runes' })).toBeInTheDocument();
    expect(
      screen.getByText("This section hasn't been built yet — check back soon.")
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ComingSoonPage.test.tsx`
Expected: FAIL — `Cannot find module './ComingSoonPage'`.

- [ ] **Step 3: Implement `ComingSoonPage`**

Create `src/components/ComingSoonPage.tsx`:

```tsx
import { useTranslations } from 'next-intl';

export default function ComingSoonPage({ title }: { title: string }) {
  const t = useTranslations('Nav');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-4 flex-1 w-full text-center">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{title}</h1>
      <p className="text-sm text-zinc-400 max-w-md">{t('comingSoon')}</p>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ComingSoonPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Create the 13 placeholder route pages**

Each follows the identical pattern used elsewhere in this codebase
(`generateStaticParams` + `setRequestLocale` + `getTranslations`). Create
`src/app/[locale]/items/base/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ComingSoonPage from '@/components/ComingSoonPage';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function BaseItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Nav');
  return <ComingSoonPage title={t('item_base')} />;
}
```

Repeat this exact pattern for the remaining 12 routes, changing only the function name,
the translation key passed to `ComingSoonPage`, and the file path:

| File | Function name | Translation key |
|---|---|---|
| `src/app/[locale]/items/magic/page.tsx` | `MagicItemsPage` | `item_magic` |
| `src/app/[locale]/items/rare/page.tsx` | `RareItemsPage` | `item_rare` |
| `src/app/[locale]/items/runes/page.tsx` | `RunesPage` | `item_runes` |
| `src/app/[locale]/items/runewords/page.tsx` | `RunewordsPage` | `item_runewords` |
| `src/app/[locale]/items/cube-recipes/page.tsx` | `CubeRecipesPage` | `item_cubeRecipes` |
| `src/app/[locale]/items/crafted/page.tsx` | `CraftedItemsPage` | `item_crafted` |
| `src/app/[locale]/character/fcr-fhr-fbr/page.tsx` | `FcrFhrFbrPage` | `misc_fcrFhrFbr` |
| `src/app/[locale]/monster/alvl85/page.tsx` | `Alvl85Page` | `misc_alvl85` |
| `src/app/[locale]/monster/area-level/page.tsx` | `AreaLevelPage` | `misc_areaLevel` |
| `src/app/[locale]/character/level-up/page.tsx` | `LevelUpPage` | `misc_levelUp` |
| `src/app/[locale]/misc/max-sockets/page.tsx` | `MaxSocketsPage` | `misc_maxSockets` |
| `src/app/[locale]/about/page.tsx` | `AboutPage` | `aboutUs` |

Example for the last one, `src/app/[locale]/about/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ComingSoonPage from '@/components/ComingSoonPage';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Nav');
  return <ComingSoonPage title={t('aboutUs')} />;
}
```

- [ ] **Step 6: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean; build output includes all 13 new routes × 3 locales (39 static
pages) with no errors.

```bash
git add src/components/ComingSoonPage.tsx src/components/ComingSoonPage.test.tsx src/app/\[locale\]/items src/app/\[locale\]/character src/app/\[locale\]/monster src/app/\[locale\]/misc src/app/\[locale\]/about
git commit -m "Add ComingSoonPage + 13 placeholder routes for remaining d2r.world sections"
```

---

### Task 4: ItemCategoryGrid + ItemStatCard shared components

**Files:**
- Create: `src/components/items/ItemCategoryGrid.tsx`
- Create: `src/components/items/ItemCategoryGrid.test.tsx`
- Create: `src/components/items/ItemStatCard.tsx`
- Create: `src/components/items/ItemStatCard.test.tsx`

**Interfaces:**
- Consumes: `GrailItem`, `SLOT_ORDER` from `@/lib/grail/catalog` (existing, unchanged);
  `Grail` namespace translations (`slot_*`, `categoriesLabel`, `itemStats`,
  `magicProperties`, `setBonusesLabel`, `baseLabel`, `gradeLabel`, `grade_normal`,
  `grade_exceptional`, `grade_elite`, `defenseLabel`, `requiredLevel`,
  `requiredStrength`, `durabilityLabel`) — reused per the Global Constraints rationale.
- Produces: `ItemCategoryGrid` (props: `items: GrailItem[]`, `activeSlot: string | null`,
  `onSelect: (slot: string) => void`) and `ItemStatCard` (props: `item: GrailItem`) —
  consumed by Task 5's `ItemBrowser`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/items/ItemCategoryGrid.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ItemCategoryGrid from './ItemCategoryGrid';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

function makeItem(overrides: Partial<GrailItem>): GrailItem {
  return {
    id: 'x', code: 'x', name: 'X', kind: 'unique', setName: null, levelReq: 1,
    baseName: 'Base', grade: 'normal', slotCategory: 'helms', defense: null,
    requiredStrength: null, durability: null, invFile: '', stats: [], fixedStats: [],
    setBonuses: [], statPriority: [], ...overrides,
  };
}

describe('ItemCategoryGrid', () => {
  it('renders only the categories present in the given items, in SLOT_ORDER', () => {
    const items = [
      makeItem({ id: '1', slotCategory: 'swords' }),
      makeItem({ id: '2', slotCategory: 'helms' }),
    ];
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemCategoryGrid items={items} activeSlot={null} onSelect={() => {}} />
      </NextIntlClientProvider>
    );
    const buttons = screen.getAllByRole('button').map(b => b.textContent);
    expect(buttons).toEqual(['Helms', 'Swords']); // helms precedes swords in SLOT_ORDER
  });

  it('calls onSelect with the clicked category', () => {
    const items = [makeItem({ id: '1', slotCategory: 'rings' })];
    const onSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemCategoryGrid items={items} activeSlot={null} onSelect={onSelect} />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Rings' }));
    expect(onSelect).toHaveBeenCalledWith('rings');
  });
});
```

Create `src/components/items/ItemStatCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ItemStatCard from './ItemStatCard';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

describe('ItemStatCard', () => {
  it('renders name, base stats, and magic properties', () => {
    const item: GrailItem = {
      id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
      levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: 28, invFile: 'invhaxu',
      stats: [{ key: 'dmg%', label: 'Enhanced Damage %', min: 60, max: 70 }],
      fixedStats: [{ key: 'str', label: 'Strength', value: 8 }],
      setBonuses: [], statPriority: ['dmg%'],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'The Gnasher' })).toBeInTheDocument();
    expect(screen.getByText(/Hand Axe/)).toBeInTheDocument();
    expect(screen.getByText(/Enhanced Damage %/)).toBeInTheDocument();
    expect(screen.getByText(/60–70/)).toBeInTheDocument();
    expect(screen.getByText(/Strength/)).toBeInTheDocument();
  });

  it('does not crash when setName is null and there are no stats or set bonuses', () => {
    const item: GrailItem = {
      id: 'unique-1', code: 'y', name: 'Bare Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'helms',
      defense: { min: 10, max: 12 }, requiredStrength: 20, durability: 40,
      invFile: '', stats: [], fixedStats: [], setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Bare Item' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/items/`
Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Implement `ItemCategoryGrid`**

Create `src/components/items/ItemCategoryGrid.tsx` (adapted from
`GrailCategorySidebar.tsx`, with the found/total count badge removed since there's no
find-tracking on these public pages):

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SLOT_ORDER, type GrailItem } from '@/lib/grail/catalog';

export default function ItemCategoryGrid({
  items,
  activeSlot,
  onSelect,
}: {
  items: GrailItem[];
  activeSlot: string | null;
  onSelect: (slot: string) => void;
}) {
  const t = useTranslations('Grail');
  const [mobileOpen, setMobileOpen] = useState(false);

  const slots = SLOT_ORDER.filter(slot => items.some(i => i.slotCategory === slot));

  function handleSelect(slot: string) {
    onSelect(slot);
    setMobileOpen(false);
  }

  const list = (
    <nav className="flex flex-col gap-0.5">
      {slots.map(slot => {
        const active = slot === activeSlot;
        return (
          <button
            key={slot}
            onClick={() => handleSelect(slot)}
            aria-current={active ? 'true' : undefined}
            className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              active
                ? 'bg-amber-500 text-zinc-950 font-semibold'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {t(`slot_${slot}`)}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="hidden md:block w-56 shrink-0">{list}</div>

      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-200"
        >
          <span>{activeSlot ? t(`slot_${activeSlot}`) : t('categoriesLabel')}</span>
          <span className="text-zinc-500">{mobileOpen ? '▲' : '▼'}</span>
        </button>
        {mobileOpen && (
          <div className="mt-1 border border-zinc-700 rounded-lg bg-zinc-900 p-1 max-h-80 overflow-y-auto">
            {list}
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Implement `ItemStatCard`**

Create `src/components/items/ItemStatCard.tsx` (the reference-stats portion of
`GrailItemDetail.tsx`, with the "your copies"/finds section removed entirely):

```tsx
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';

const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-amber-300',
  set: 'text-green-400',
};

export default function ItemStatCard({ item }: { item: GrailItem }) {
  const t = useTranslations('Grail');

  const itemStatRows: [string, string][] = [
    [t('baseLabel'), item.baseName],
    [t('gradeLabel'), t(`grade_${item.grade}`)],
    ...(item.defense ? [[t('defenseLabel'), `${item.defense.min}–${item.defense.max}`] as [string, string]] : []),
    [t('requiredLevel'), String(item.levelReq)],
    ...(item.requiredStrength != null ? [[t('requiredStrength'), String(item.requiredStrength)] as [string, string]] : []),
    ...(item.durability != null ? [[t('durabilityLabel'), String(item.durability)] as [string, string]] : []),
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
      <div className="mb-1">
        <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
        <p className="text-xs text-zinc-400">{item.baseName}</p>
        {item.setName && <p className="text-xs text-green-500">{item.setName}</p>}
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('itemStats')}</h4>
        <div className="text-sm text-zinc-300 flex flex-col gap-0.5">
          {itemStatRows.map(([label, value]) => (
            <div key={label}>{label}: <span className="text-zinc-100">{value}</span></div>
          ))}
        </div>
      </div>

      {(item.stats.length > 0 || item.fixedStats.length > 0) && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('magicProperties')}</h4>
          <div className="text-sm text-blue-400 flex flex-col gap-0.5">
            {item.stats.map(stat => (
              <div key={stat.key}>{stat.label}: {stat.min}–{stat.max}</div>
            ))}
            {item.fixedStats.map(f => (
              <div key={f.key}>{f.label}: {f.value}</div>
            ))}
          </div>
        </div>
      )}

      {item.setBonuses.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('setBonusesLabel')}</h4>
          <div className="text-sm text-green-500 flex flex-col gap-0.5">
            {item.setBonuses.map((b, i) => (
              <div key={`${b.key}-${i}`}>{b.label}: {b.min === b.max ? b.min : `${b.min}–${b.max}`}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/items/`
Expected: PASS (4 tests).

- [ ] **Step 6: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

```bash
git add src/components/items/ItemCategoryGrid.tsx src/components/items/ItemCategoryGrid.test.tsx src/components/items/ItemStatCard.tsx src/components/items/ItemStatCard.test.tsx
git commit -m "Add ItemCategoryGrid + ItemStatCard shared components for public item pages"
```

---

### Task 5: ItemBrowser + Unique/Set Items pages + full verification

**Files:**
- Create: `src/components/items/ItemBrowser.tsx`
- Create: `src/components/items/ItemBrowser.test.tsx`
- Create: `src/app/[locale]/items/unique/page.tsx`
- Create: `src/app/[locale]/items/set/page.tsx`
- Create: `docs/superpowers/specs/2026-07-14-d2rworld-nav-verification.md`

**Interfaces:**
- Consumes: `getAllGrailItems`, `localizeGrailItem`, `sortItemsForDisplay` from
  `@/lib/grail/catalog`; `ItemCategoryGrid`, `ItemStatCard` from Task 4; `Items` namespace
  from Task 1.
- Produces: the two public browsable pages that complete this plan's stated content scope.

- [ ] **Step 1: Write the failing test**

Create `src/components/items/ItemBrowser.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ItemBrowser from './ItemBrowser';
import { getAllGrailItems } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

function renderBrowser(kind: 'unique' | 'set') {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ItemBrowser kind={kind} />
    </NextIntlClientProvider>
  );
}

describe('ItemBrowser', () => {
  it('filters the full catalog to the expected known totals per kind', () => {
    // Matches the project's known totals (see plans/todo.md): 403 uniques, 135 sets.
    const uniqueCount = getAllGrailItems().filter(i => i.kind === 'unique').length;
    const setCount = getAllGrailItems().filter(i => i.kind === 'set').length;
    expect(uniqueCount).toBe(403);
    expect(setCount).toBe(135);
  });

  it('shows a prompt before any category is selected', () => {
    renderBrowser('unique');
    expect(screen.getByText('Select a category from the menu to view its items.')).toBeInTheDocument();
  });

  it('shows only unique items (never set items) when kind="unique"', () => {
    renderBrowser('unique');
    fireEvent.click(screen.getByRole('button', { name: 'Rings' }));
    // The Stone of Jordan is a well-known unique ring.
    expect(screen.getByText('The Stone of Jordan')).toBeInTheDocument();
  });

  it('shows only set items (never unique items) when kind="set"', () => {
    renderBrowser('set');
    fireEvent.click(screen.getByRole('button', { name: 'Boots' }));
    // Aldur's Advance is a well-known set boots item; The Gnasher (unique) must not appear anywhere.
    expect(screen.queryByText('The Gnasher')).not.toBeInTheDocument();
  });

  it('shows grade tabs when a category spans multiple grades, and filters by the selected tab', () => {
    renderBrowser('unique');
    // Axes has items across all three grades (e.g. The Gnasher = normal, Runemaster = elite).
    fireEvent.click(screen.getByRole('button', { name: 'Axes' }));
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exceptional' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elite' })).toBeInTheDocument();

    expect(screen.getByText('The Gnasher')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Elite' }));
    expect(screen.queryByText('The Gnasher')).not.toBeInTheDocument();
  });

  it('hides grade tabs when the category has items in only one grade', () => {
    renderBrowser('unique');
    // Jewels only exist in a single grade in this catalog (no base-item grade tiers).
    fireEvent.click(screen.getByRole('button', { name: 'Jewels' }));
    expect(screen.queryByRole('button', { name: 'Normal' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/items/ItemBrowser.test.tsx`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Implement `ItemBrowser`**

Create `src/components/items/ItemBrowser.tsx`. In addition to category selection, this
adds a grade-tab filter (Normal/Exceptional/Elite) within the selected category, shown
only when that category actually spans more than one grade — matching d2r.world's
per-category grade tabs described in the design spec:

```tsx
'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getAllGrailItems, localizeGrailItem, sortItemsForDisplay, type GrailItem } from '@/lib/grail/catalog';
import ItemCategoryGrid from './ItemCategoryGrid';
import ItemStatCard from './ItemStatCard';

const GRADES = ['normal', 'exceptional', 'elite'] as const;

export default function ItemBrowser({ kind }: { kind: 'unique' | 'set' }) {
  const t = useTranslations('Grail');
  const locale = useLocale();
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [activeGrade, setActiveGrade] = useState<GrailItem['grade'] | null>(null);

  const items = getAllGrailItems()
    .filter(i => i.kind === kind)
    .map(i => localizeGrailItem(i, locale as 'en' | 'zh-TW' | 'zh-CN'));

  function handleSelectSlot(slot: string) {
    setActiveSlot(slot);
    setActiveGrade(null);
  }

  const slotItems: GrailItem[] = activeSlot
    ? sortItemsForDisplay(items.filter(i => i.slotCategory === activeSlot))
    : [];
  const gradesInSlot = GRADES.filter(g => slotItems.some(i => i.grade === g));
  const activeItems = activeGrade ? slotItems.filter(i => i.grade === activeGrade) : slotItems;

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <ItemCategoryGrid items={items} activeSlot={activeSlot} onSelect={handleSelectSlot} />

      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {!activeSlot ? (
          <p className="text-sm text-zinc-500">{t('selectCategoryPrompt')}</p>
        ) : (
          <>
            {gradesInSlot.length > 1 && (
              <div className="flex gap-2">
                {gradesInSlot.map(grade => (
                  <button
                    key={grade}
                    onClick={() => setActiveGrade(g => (g === grade ? null : grade))}
                    aria-pressed={activeGrade === grade}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeGrade === grade
                        ? 'bg-amber-500 text-zinc-950 font-semibold'
                        : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {t(`grade_${grade}`)}
                  </button>
                ))}
              </div>
            )}
            {activeItems.map(item => <ItemStatCard key={item.id} item={item} />)}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/items/ItemBrowser.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Create the two page routes**

Create `src/app/[locale]/items/unique/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ItemBrowser from '@/components/items/ItemBrowser';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function UniqueItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('uniquePageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('uniquePageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <ItemBrowser kind="unique" />
      </div>
    </main>
  );
}
```

Create `src/app/[locale]/items/set/page.tsx` (identical shape, `kind="set"`):

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ItemBrowser from '@/components/items/ItemBrowser';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function SetItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('setPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('setPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <ItemBrowser kind="set" />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Full automated verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm in the build output that
`out/en/items/unique/index.html`, `out/zh-TW/items/unique/index.html`,
`out/zh-CN/items/unique/index.html`, and the `set` equivalents all exist.

Also directly inspect content (not just existence), matching the lesson learned during
the zh-TW/zh-CN translation plan (a prior session tested against the wrong checkout and
nearly mistook a stale dev server for a bug):

```bash
grep -o '<h1[^<]*</h1>' out/zh-TW/items/unique/index.html
grep -o '<h1[^<]*</h1>' out/zh-CN/items/set/index.html
```

Expected: real translated Chinese text, not English, in both.

- [ ] **Step 7: Manual browser verification + d2r.world spot-check**

Start the dev server **from this feature's actual worktree** (not `main` — verify with
`pwd` before starting, per the lesson above). Navigate to `/en/items/unique`,
`/zh-TW/items/unique`, `/zh-CN/items/unique`, and the `/set` equivalents. For each:
select 2–3 categories, confirm items render with correct stats, confirm no console
errors. Spot-check 2–3 items per page against d2r.world's own unique/set item pages.
Also click through the `SiteNavDrawer` on at least one page in each locale, confirming
all 17 links (9 Game Items + 5 Misc + 2 Our Tools + About Us) navigate correctly and the
drawer closes after navigation.

Write findings to `docs/superpowers/specs/2026-07-14-d2rworld-nav-verification.md`
(follow the structure of
`docs/superpowers/specs/2026-07-14-grail-zh-translation-verification.md` as a reference
for format: a spot-check table, an automated-verification section, a manual-verification
section).

- [ ] **Step 8: Commit**

```bash
git add src/components/items/ItemBrowser.tsx src/components/items/ItemBrowser.test.tsx src/app/\[locale\]/items/unique src/app/\[locale\]/items/set docs/superpowers/specs/2026-07-14-d2rworld-nav-verification.md
git commit -m "Add ItemBrowser + public Unique/Set Items pages; full verification"
```
