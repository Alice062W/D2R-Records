# Summoner-Theme Restyle — Design

## Goal

Reshape this site's color theme and typography to match the user's own
`alice062w.github.io/Summoner` site (a dark warm fantasy-UI theme using the Cinzel
Google Font), while preserving every already-hardcoded in-game rarity color (unique
tan-gold, set green, magic/rare stat blue, etc.) exactly as-is.

## Background

Inspected `alice062w.github.io/Summoner/index.html`'s computed styles directly (no
image/asset copying — this is a color/typography reference only) and extracted its
concrete design tokens:

- Page background: `rgb(21, 17, 13)` / `#15110D`.
- Panel/card background: `rgb(28, 22, 16)` / `#1C1610`, 1px border
  `rgb(74, 58, 36)` / `#4A3A24`, `border-radius: 12px`.
- Slightly lighter panel variant (e.g. tab buttons): `rgb(34, 26, 18)` / `#221A12`.
- Body/data text: `rgb(216, 201, 168)` / `#D8C9A8`.
- Accent/gold (links, active states, borders on highlighted panels):
  `rgb(201, 162, 39)` / `#C9A227`.
- Brighter gold (hover/emphasis, e.g. button hover text): `rgb(240, 216, 120)` /
  `#F0D878`.
- Typography: **Cinzel** (Google Font, weights 500/700) for headings, nav links, and
  buttons/tabs; plain system sans-serif for body/data text (paragraphs, table cells).

This project's current theme (`src/app/globals.css`, `src/app/[locale]/layout.tsx`)
uses Tailwind's stock cool-gray `zinc-*` palette (`bg-zinc-950` page background,
`bg-zinc-900`/`border-zinc-700` cards, `text-zinc-100`-`zinc-500` text) plus
`amber-300`-`amber-500` for accents, and Geist Sans/Mono for all text. Audited every
`zinc-*`/`amber-*` Tailwind class actually used across the codebase (58 distinct
class+shade combinations across 53 files) — all are plain utility classes, not CSS
custom properties, so there's no existing theme-token layer to swap in one place;
this is a mechanical, one-to-one class-name sweep.

Confirmed via `grep` that no test asserts a specific Tailwind class name anywhere in
the codebase — this restyle cannot break any existing test, only visual appearance.

Confirmed the site's already-hardcoded in-game rarity colors are literal arbitrary
hex values (e.g. `text-[#cbb87f]` for unique items, `text-[#22ff55]` for set items,
`text-[#8080f3]` for magic/rare stat lines, plus several more in
`SiteNavDrawer.tsx`'s `GAME_ITEM_LINKS` table) — these are a completely separate
class-name pattern (`text-[#hex]`, not `text-zinc-*`/`text-amber-*`) and are
**explicitly out of scope**, per the user's direct instruction to preserve them
exactly.

## Design

### New theme tokens (Tailwind v4 `@theme`, added to `src/app/globals.css`)

```css
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
}
```

This makes `bg-ink-950`, `bg-panel`, `bg-panel-alt`, `border-panel-border`,
`border-panel-border-light`, `border-panel-border-dark`, `text-parchment-bright`,
`text-parchment`, `text-muted`, `text-muted-dark`, `text-gold`, `bg-gold`,
`border-gold`, etc. all valid Tailwind utility classes automatically (Tailwind v4
generates every color-role utility — `bg-*`, `text-*`, `border-*`, `ring-*`, `/opacity`
variants — from one `--color-*` token).

### Mechanical class-name mapping (applied everywhere a `zinc-*`/`amber-*` utility is
used, regardless of file)

| Old class | New class |
|---|---|
| `bg-zinc-950` | `bg-ink-950` |
| `text-zinc-950` | `text-ink-950` |
| `bg-zinc-900` | `bg-panel` |
| `bg-zinc-800`, `bg-zinc-800/50`, `bg-zinc-800/60` | `bg-panel-alt`, `bg-panel-alt/50`, `bg-panel-alt/60` |
| `text-zinc-800` | `text-panel-alt` |
| `border-zinc-800` | `border-panel-border-dark` |
| `border-zinc-700` | `border-panel-border` |
| `border-zinc-600` | `border-panel-border-light` |
| `text-zinc-100`, `text-zinc-200` | `text-parchment-bright` |
| `text-zinc-300` | `text-parchment` |
| `text-zinc-400`, `text-zinc-500` | `text-muted` |
| `text-zinc-600` | `text-muted-dark` |
| `text-amber-300`, `text-amber-400` | `text-gold-bright`, `text-gold` |
| `border-amber-400` | `border-gold` |
| `bg-amber-400` | `bg-gold-bright` |
| `bg-amber-500` | `bg-gold` |
| `bg-amber-500/20` | `bg-gold/20` |
| `bg-amber-950/40` | `bg-gold/10` |

This mapping is exhaustive against the current codebase's actual usage (verified via
`grep -rohE "(bg|text|border|ring)-(zinc|amber)-[0-9]+(/[0-9]+)?" src/`). Any
`text-[#hex]`/`bg-[#hex]` arbitrary-value class (the preserved rarity colors) is
**never** touched by this mapping — it only matches named `zinc-*`/`amber-*` utility
classes.

### Typography

- Add **Cinzel** via `next/font/google` in `src/app/[locale]/layout.tsx` (weights
  `500`/`700`, matching the reference site), exposed as a CSS variable
  (`--font-cinzel`), the same pattern already used for Geist Sans/Mono in that file.
- Register it as a Tailwind font-family token in the same `@theme` block:
  `--font-family-cinzel: var(--font-cinzel), serif;` → generates the `font-cinzel`
  utility class.
- Apply globally to all headings via `src/app/globals.css`:
  ```css
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-cinzel), serif;
    letter-spacing: 0.02em;
  }
  ```
  This covers every page's title and every card/section heading site-wide with zero
  per-component edits (grepped: headings are used consistently for page
  titles/section headers throughout, never for plain data text).
- Add the `font-cinzel` utility class explicitly to the small, enumerable set of
  non-heading "chrome" elements that the reference site also renders in Cinzel — nav
  links/buttons and tab-style selectors:
  - `src/components/nav/SiteNavDrawer.tsx` (top bar links, drawer links, section
    labels)
  - `src/components/items/BaseSubCategoryTabs.tsx` (Helms/Shields sub-tabs)
  - `src/components/items/FcrFhrFbrTable.tsx` (class-selector buttons)
  - `src/components/items/RunewordFilters.tsx` (filter buttons)
  - `src/components/items/CategoryCardGrid.tsx` (category tile labels)
  - `src/components/items/SetGroupList.tsx` (set-name tile links)
  - `src/components/grail/GrailCategorySidebar.tsx` (sidebar category links), if this
    component exists under that name — confirm exact filename during implementation
- Body/data text (item stat lines, table cells, descriptions) keeps the current
  Geist Sans — matching the reference site's own paragraph/table text, which stays
  plain sans-serif, not Cinzel.

### Base layout colors

`src/app/[locale]/layout.tsx`'s `<body>` class changes from
`bg-zinc-950 text-zinc-100` to `bg-ink-950 text-parchment`, and
`src/app/globals.css`'s `:root` variables (`--background`/`--foreground`) update to
the new `ink-950`/`parchment` hex values, matching the mechanical mapping above.

## Non-goals

- Any change to the already-hardcoded in-game rarity hex colors (unique, set, magic/
  rare, runes, runewords — every `text-[#hex]`/`bg-[#hex]` arbitrary-value class) —
  explicitly preserved per the user's instruction.
- Any change to page structure, component logic, data, or test files.
- Pixel-perfect replication of the Summoner site's layout/spacing/component
  structure — only color palette and font family are being matched, per the user's
  request ("similar color theme... and font style").
- Copying any image, icon, or other asset from the Summoner site.

## Testing plan

- No existing test asserts a Tailwind class name (confirmed via grep), so the full
  existing test suite must continue passing unchanged after this restyle — that's
  the primary regression check.
- `npx tsc --noEmit` / `npm run lint` / `npm run build` all clean.
- Manual spot-check (curl against the served static export where sufficient, plus a
  small number of visual checks — not a long screenshot session): confirm the new
  palette and Cinzel headings render across a representative sample of pages (home,
  a category grid page, an item detail page, the nav drawer), and confirm every
  preserved rarity color (e.g. a Set item's green name, a Unique item's tan-gold
  name) is visually unchanged.
