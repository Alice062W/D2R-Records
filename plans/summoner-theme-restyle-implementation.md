# Summoner-Theme Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape this site's color palette and typography to match
`alice062w.github.io/Summoner` (dark warm fantasy theme, Cinzel font for
headings/nav/buttons), while leaving every already-hardcoded in-game rarity color
(unique, set, magic/rare, runes, runewords) completely untouched.

**Architecture:** (1) Define new Tailwind v4 `@theme` color/font tokens and add the
Cinzel Google Font. (2) Run a single mechanical, scripted find-and-replace across
every `.tsx` file to swap old `zinc-*`/`amber-*` Tailwind classes for the new named
tokens (a class-name-only sweep — never touches `text-[#hex]` arbitrary-value
classes, which is how every preserved rarity color is written). (3) Add the
`font-cinzel` utility class to the small set of nav/tab "chrome" components. (4)
Verify.

**Tech Stack:** Next.js/Tailwind CSS 4, `next/font/google`, a one-off Node.js codemod
script (not committed — scratch tooling for Task 2 only).

## Global Constraints

- Never modify any `text-[#hex]`/`bg-[#hex]` arbitrary-value class anywhere — these
  are the preserved in-game rarity colors (unique tan-gold, set green, magic/rare
  stat blue, rune/runeword accent colors in `SiteNavDrawer.tsx`'s `GAME_ITEM_LINKS`
  table, etc.).
- The class-name mapping table below is exhaustive and must be applied exactly —
  don't invent additional shades or "improve" the palette.
- No test asserts a Tailwind class name (confirmed during design research) — the
  full existing test suite must pass unchanged; this is a pure-CSS/markup-class
  restyle with zero logic changes.
- No change to page structure, component logic, data files, or test files' actual
  assertions.

---

### Task 1: Theme tokens, font, and base layout colors

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Produces: Tailwind utility classes `bg-ink-950`, `bg-panel`, `bg-panel-alt`,
  `border-panel-border`, `border-panel-border-light`, `border-panel-border-dark`,
  `text-parchment-bright`, `text-parchment`, `text-muted`, `text-muted-dark`,
  `text-gold`, `bg-gold`, `border-gold`, `text-ink-950`, and the `font-cinzel`
  utility — all consumed by Task 2's codemod and Task 3's manual additions.

- [ ] **Step 1: Add the theme tokens and heading font rule to globals.css**

Replace the full contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

/* Enable class-based dark mode: add class="dark" to <html> to activate */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-ink-950: #15110d;
  --color-panel: #1c1610;
  --color-panel-alt: #241c14;
  --color-panel-border: #4a3a24;
  --color-panel-border-light: #6b5738;
  --color-panel-border-dark: #2a2015;
  --color-parchment-bright: #ece0c4;
  --color-parchment: #d8c9a8;
  --color-muted: #9c8a66;
  --color-muted-dark: #6b5d45;
  --color-gold: #c9a227;
  --color-gold-bright: #f0d878;
  --font-family-cinzel: var(--font-cinzel), serif;
}

:root {
  --background: #15110d; /* ink-950 */
  --foreground: #d8c9a8; /* parchment */
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-cinzel), serif;
  letter-spacing: 0.02em;
}
```

- [ ] **Step 2: Add the Cinzel font and update the body's base color classes**

Modify `src/app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Cinzel } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Footer from '@/components/Footer';
import SiteNavDrawer from '@/components/nav/SiteNavDrawer';
import '../globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const cinzel = Cinzel({ variable: '--font-cinzel', weight: ['500', '700'], subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'D2R Institute',
  description: 'Diablo II: Resurrected socketed item appraiser — keep or dump in seconds.',
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'zh-TW' | 'zh-CN')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`dark ${geistSans.variable} ${geistMono.variable} ${cinzel.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-ink-950 text-parchment antialiased">
        <NextIntlClientProvider messages={messages}>
          <SiteNavDrawer />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the build picks up the new theme**

Run: `npx tsc --noEmit && npm run build`
Expected: clean build. This step has no new automated test (pure visual/token
change) — Task 4 covers manual verification.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css "src/app/[locale]/layout.tsx"
git commit -m "Add Summoner-theme color tokens and Cinzel heading font"
```

---

### Task 2: Mechanical class-name sweep (zinc-*/amber-* → new tokens)

**Files:**
- Modify: every `.tsx` file under `src/` using a `zinc-*` or `amber-*` Tailwind class
  (53 files, confirmed via the design research's `grep` sweep) — the codemod script
  below finds and rewrites them automatically; no file needs to be hand-edited.

**Interfaces:**
- Consumes: the new token classes from Task 1 (must be committed and merged before
  this task runs, since this task assumes they already resolve to real Tailwind
  utilities).

- [ ] **Step 1: Write and run the codemod script**

Create a scratch script (not committed — delete it after running, per Step 3) at
`/tmp/theme-sweep.mjs`:

```js
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Exhaustive mapping confirmed against this codebase's actual zinc-*/amber-* usage
// during design research (grep -rohE "(bg|text|border|ring)-(zinc|amber)-[0-9]+(/[0-9]+)?" src/).
// Longest/most-specific keys first so e.g. "bg-zinc-800/60" matches before "bg-zinc-800".
const MAP = [
  ['bg-zinc-800/60', 'bg-panel-alt/60'],
  ['bg-zinc-800/50', 'bg-panel-alt/50'],
  ['bg-amber-950/40', 'bg-gold/10'],
  ['bg-amber-500/20', 'bg-gold/20'],
  ['bg-zinc-950', 'bg-ink-950'],
  ['text-zinc-950', 'text-ink-950'],
  ['bg-zinc-900', 'bg-panel'],
  ['bg-zinc-800', 'bg-panel-alt'],
  ['text-zinc-800', 'text-panel-alt'],
  ['border-zinc-800', 'border-panel-border-dark'],
  ['border-zinc-700', 'border-panel-border'],
  ['border-zinc-600', 'border-panel-border-light'],
  ['text-zinc-100', 'text-parchment-bright'],
  ['text-zinc-200', 'text-parchment-bright'],
  ['text-zinc-300', 'text-parchment'],
  ['text-zinc-400', 'text-muted'],
  ['text-zinc-500', 'text-muted'],
  ['text-zinc-600', 'text-muted-dark'],
  ['text-amber-300', 'text-gold-bright'],
  ['text-amber-400', 'text-gold'],
  ['border-amber-400', 'border-gold'],
  ['bg-amber-400', 'bg-gold-bright'],
  ['bg-amber-500', 'bg-gold'],
];

const files = execSync(
  `grep -rlE "(bg|text|border|ring)-(zinc|amber)-[0-9]+" src/ --include=*.tsx`,
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  for (const [oldClass, newClass] of MAP) {
    // Word-boundary-safe replace: match the class only when preceded by a quote,
    // space, backtick, or ":" (so Tailwind variant prefixes like "hover:",
    // "md:hover:", "dark:" etc. are matched too — the char immediately before the
    // base class is ":" in "hover:bg-zinc-800"), and followed by a non-identifier
    // character (space, quote, backtick, or end-of-string) so e.g. "border-zinc-700"
    // doesn't partially match inside "border-zinc-700/50" incorrectly (handled by
    // listing /NN variants first in MAP) or get confused with a longer class name.
    const re = new RegExp(`(?<=[\\s"'\`:])${oldClass.replace(/[/]/g, '\\/')}(?=[\\s"'\`]|$)`, 'g');
    content = content.replace(re, newClass);
  }
  writeFileSync(file, content);
}

console.log(`Swept ${files.length} files.`);
```

Run: `node /tmp/theme-sweep.mjs`
Expected output: `Swept 53 files.` (or close to it — the exact count may differ
slightly by the time this runs; that's fine, log the actual number).

- [ ] **Step 2: Verify no old classes remain and nothing broke**

Run:
```bash
grep -rE "(bg|text|border|ring)-(zinc|amber)-[0-9]+" src/ --include=*.tsx | grep -v "text-\[#"
```
Expected: no output (every plain `zinc-*`/`amber-*` utility class replaced). If any
remain, the codemod's regex missed a variant (e.g. a `ring-` or `from-`/`to-`
gradient class not in the `MAP` table) — add it to `MAP` and rerun rather than
hand-fixing the one file, so the mapping table stays the single source of truth.

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean, all tests passing (no test asserts a class name, per the design
research — if anything fails, investigate before proceeding, don't skip).

Run: `grep -rE "text-\[#" src/ --include=*.tsx | wc -l`
Expected: a nonzero count (confirms the preserved rarity-color arbitrary-value
classes are still present and untouched — spot check a couple, e.g. `grep -n
"cbb87f" src/components/items/ItemStatCard.tsx` should still show the unique-item
gold-tan color unchanged).

- [ ] **Step 3: Clean up the scratch script and commit**

```bash
rm -f /tmp/theme-sweep.mjs
git add -A src/
git commit -m "Sweep zinc-*/amber-* Tailwind classes to Summoner-theme tokens"
```

---

### Task 3: Cinzel font on nav/tab chrome components

**Files:**
- Modify: `src/components/nav/SiteNavDrawer.tsx`
- Modify: `src/components/items/BaseSubCategoryTabs.tsx`
- Modify: `src/components/items/FcrFhrFbrTable.tsx`
- Modify: `src/components/items/RunewordFilters.tsx`
- Modify: `src/components/items/CategoryCardGrid.tsx`
- Modify: `src/components/items/SetGroupList.tsx`
- Modify: `src/components/grail/GrailCategorySidebar.tsx`

- [ ] **Step 1: Add `font-cinzel` to each component's clickable nav/tab/tile labels**

For each file above, add the `font-cinzel` class to the `className` of every
top-level clickable navigation element (top bar links, drawer links, category tabs,
filter buttons, category tiles, sidebar buttons) — the exact link/button text
elements, not surrounding wrapper `<div>`s or icons. Read each file first and add
`font-cinzel` alongside its existing classes (e.g.
`className="... font-cinzel"` or inserted into the existing template-literal class
string) rather than replacing anything. Do not add `font-cinzel` to data/stat text
inside these files if any exists (e.g. `GrailCategorySidebar`'s `{found}/{total}`
count span stays in the default font — only the category label itself gets
`font-cinzel`).

- [ ] **Step 2: Run full verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/nav/SiteNavDrawer.tsx src/components/items/BaseSubCategoryTabs.tsx src/components/items/FcrFhrFbrTable.tsx src/components/items/RunewordFilters.tsx src/components/items/CategoryCardGrid.tsx src/components/items/SetGroupList.tsx src/components/grail/GrailCategorySidebar.tsx
git commit -m "Apply Cinzel font to nav/tab chrome components"
```

---

### Task 4: Full verification + spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-17-summoner-theme-restyle-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual spot-check**

Serve the static export locally. Check a representative sample: the home/appraiser
page, `/items/unique` category grid, a Unique item detail card, a Set item detail
card (confirm its name is still the exact preserved green, `#22ff55`), the nav
drawer (confirm Cinzel on nav labels), and the Base Items page. Confirm the new dark
warm palette and Cinzel headings render everywhere, and every preserved rarity color
is visually unchanged. Check at both desktop and mobile widths via `resize_window`.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
