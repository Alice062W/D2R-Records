# Unique/Set Category Pages — Verification

_Task 5 of 5 in the unique-set-category-pages plan: wires together the Task 1-4
building blocks (`getCategoriesForKind`, `Items.backToCategories`, `CategoryCardGrid`,
`CategoryItemList`) into the final, real content — updated `/items/unique` and
`/items/set` landing pages that now use `CategoryCardGrid` instead of the old
`ItemBrowser` sidebar, plus two brand-new dynamic routes,
`/items/unique/[category]` and `/items/set/[category]`, using `CategoryItemList`. The
now-superseded `ItemBrowser`/`ItemCategoryGrid` components and their tests were
deleted._

**Note on scope:** this pass was run by an agent with Bash/file-tool access only — no
browser automation tool. All "manual" verification below was performed via `curl`
against a locally running dev server (confirmed to be this worktree's own checkout,
branch `unique-set-category-pages`, via `pwd`/`git branch --show-current` immediately
beforehand) and, for the specific `output: 'export'`-only 404 behavior, against the
built static `out/` directory served with a plain Python HTTP server. The d2r.world
cross-check (spot-checking 2-3 categories per kind against d2r.world's own category
pages) was **explicitly deferred to the controller**, who has live-browser/internet
access this agent does not; nothing here should be read as claiming that cross-check
was done.

## Implementation summary

- `src/app/[locale]/items/unique/page.tsx` and `src/app/[locale]/items/set/page.tsx`
  rewritten to call `getCategoriesForKind('unique' | 'set')` and render
  `CategoryCardGrid` in place of `ItemBrowser`.
- `src/app/[locale]/items/unique/[category]/page.tsx` and
  `src/app/[locale]/items/set/[category]/page.tsx` created: each validates `category`
  against `getCategoriesForKind`, calls `notFound()` for unknown categories, filters
  `getAllGrailItems()` by `kind`/`slotCategory`, localizes and sorts via
  `localizeGrailItem`/`sortItemsForDisplay`, and renders a category `<h2>`, a
  "back to categories" `Link`, and `CategoryItemList`.
- `src/components/items/ItemBrowser.tsx`, `ItemBrowser.test.tsx`,
  `ItemCategoryGrid.tsx`, `ItemCategoryGrid.test.tsx` deleted via `git rm`. Confirmed
  no remaining references to either component anywhere under `src/`.

## Automated verification

All executed from this task's actual worktree
(`/Users/yli15/Documents/ClaudeCode/D2RInstitute/.worktrees/unique-set-category-pages`,
branch `unique-set-category-pages` — confirmed with `pwd` and
`git branch --show-current` before running anything).

- `npx tsc --noEmit` — clean, no output, exit 0.
- `npm run lint` (ESLint) — clean, no warnings/errors, exit 0.
- `npm test` (vitest run) — **9 test files, 44 tests, all passing**, exit 0. (The
  deleted `ItemBrowser.test.tsx`/`ItemCategoryGrid.test.tsx` are gone from the suite;
  no replacement tests were added or required by this task's brief, which scoped
  Task 5 as wiring + verification, not new component tests.)
- `npm run build` — **required copying this repo's gitignored `.env.local`
  (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`) into this worktree
  first** — it hadn't been copied when the worktree was created (git worktrees don't
  carry over untracked/gitignored files), and the `/grail` page's prerender fails
  without it. This is pre-existing project config, unrelated to this task's diff; no
  source files were changed to work around it. After copying `.env.local`, the build
  succeeds cleanly.

  Route listing confirms:
  - `/[locale]/items/unique` and `/[locale]/items/set` (landing pages) — SSG, 3
    locales each.
  - `/[locale]/items/unique/[category]` — SSG, listed as
    `/en/items/unique/helms`, `/en/items/unique/armors`, `/en/items/unique/shields`,
    `+81 more paths` = **84 total = 28 categories × 3 locales**, matching
    `getCategoriesForKind('unique')`.
  - `/[locale]/items/set/[category]` — SSG, listed as `/en/items/set/helms`,
    `/en/items/set/armors`, `/en/items/set/shields`, `+60 more paths` = **63 total =
    21 categories × 3 locales**, matching `getCategoriesForKind('set')` (sets have no
    charms/jewels/gloves-only-exceptions etc.; 21 of the 28 possible slot categories
    have at least one set item).
  - Confirmed on disk: `find out/en/items/unique -maxdepth 1 -type d` → 29 entries
    (28 category dirs + parent) and `find out/en/items/set -maxdepth 1 -type d` → 22
    entries (21 category dirs + parent).

  **Content directly inspected** (not just existence), per the project's established
  verification practice:

  ```
  $ grep -o '<h2[^<]*</h2>' out/en/items/unique/axes/index.html
  <h2 class="text-xl font-semibold text-zinc-100">Axes</h2>

  $ grep -o '<h2[^<]*</h2>' out/zh-TW/items/set/boots/index.html
  <h2 class="text-xl font-semibold text-zinc-100">靴子</h2>
  ```

  Both match the brief's expected output exactly (`<h2>Axes</h2>` and the correct
  zh-TW translation for "Boots").

## Manual verification (dev server + curl, no browser tool available)

Dev server started from this worktree (`npx next dev -p 3006`), with `pwd` and
`git branch --show-current` confirmed immediately beforehand
(`unique-set-category-pages` branch, this worktree path) to avoid the
stale-checkout false alarm documented in prior verification passes in this project.

**Landing pages, all 3 locales x 2 kinds, via `curl -sL`:**

| URL | `<h1>` content |
|---|---|
| `/en/items/unique` | `Unique Items` |
| `/en/items/set` | (not separately re-checked by locale beyond category link scrape; see below) |
| `/zh-TW/items/unique` | `獨特裝備` |
| `/zh-CN/items/unique` | `独特装备` |

**Category card links server-rendered on `/en/items/unique`:** all 28 expected slot
categories present as `<a href="/en/items/unique/<slot>/">` links (helms, armors,
shields, belts, boots, gloves, rings, amulets, charms, jewels, swords, daggers, axes,
polearms, spears, clubs, maces, hammers, scepters, staves, orbs, wands, grimoires,
katars, bows, crossbows, javelins, throwings) — confirmed by scraping all `href`
attributes from the response.

**Category card links on `/en/items/set`:** 21 links present (helms, armors, shields,
belts, boots, bows, daggers, gloves, grimoires, hammers, katars, maces, orbs,
polearms, rings, scepters, staves, swords, wands, amulets, axes) — notably **no
`charms` link**, consistent with there being no set charms in the catalog.

**Category detail page, `/en/items/unique/axes`:**
- `<h1>Unique Items</h1>`, `<h2>Axes</h2>`, "Back to categories" link text present
  (appears twice in the rendered markup — top link and a footer/secondary
  occurrence from the layout).
- Grade-tab buttons for Normal / Exceptional / Elite present and correctly rendered
  (`aria-pressed="false"` initial state, matching `CategoryItemList`'s
  `activeGrade === null` default).
- Real catalog item names rendered as `<h3>` card titles: The Gnasher, Fechmars Axe,
  Deathspade, Goreshovel, Bladebone, The Chieftan, Mindrend, Brainhew, Rakescar, The
  Humongous — genuine unique axes from the catalog, not placeholder data.

**Category detail page, `/zh-TW/items/unique/axes`:** `<h2>斧頭</h2>` (correct
Traditional Chinese for "Axes").

**`/en/items/set/charms` — 404 behavior:**

This needed a subtlety not anticipated by the brief's plain "confirm it 404s"
instruction. With `output: 'export'` set in `next.config.ts`, the Next.js **dev
server** does not fall back to running the page component (and its internal
`notFound()` call) for a dynamic-segment value outside `generateStaticParams()` —
instead it throws a framework-level error and returns **HTTP 500** in dev mode:

```
⨯ Error: Page "/[locale]/items/set/[category]/page" is missing param
"/[locale]/items/set/[category]" in "generateStaticParams()", which is required
with "output: export" config.
 GET /en/items/set/charms/ 500 in 1613ms
```

This is expected dev-server behavior for `output: 'export'` projects, not a defect
in this task's code — it reflects the framework enforcing "only known params exist"
one step earlier (at param-resolution time) than our own `notFound()` check ever
gets to run. The behavior that actually matters — what a real visitor hits against
the deployed static export — was verified directly against the **built** `out/`
directory:

- `find out/en/items/set -maxdepth 1` confirms no `charms` directory/file exists.
- Serving `out/` with `python3 -m http.server` and requesting
  `http://localhost:8099/en/items/set/charms/` returns a genuine **404** (no such
  file), while `http://localhost:8099/en/items/unique/axes/` returns **200**.

So the end-to-end "does `/items/set/charms` 404" requirement is satisfied for the
artifact that's actually shipped (the static export); the dev-server 500 is a known,
pre-existing characteristic of `output: 'export'` + dynamic routes and not something
introduced or fixable by this task's diff.

Client-side interactive behavior (clicking a category card to navigate, clicking a
grade tab to filter, toggling a tab off) is **not directly observable via curl** (it
requires executing the client bundle's JS) — this is covered instead by
`CategoryItemList`'s own component behavior (grade filter state, `aria-pressed`
toggling) being visible in the server-rendered initial markup above, and by the
existing test suite (`npm test`, 44 passing) which was unaffected by this task's
changes to the two page routes (no page/route-level tests exist or were required by
the brief for Task 5).

## Deferred: d2r.world spot-check

**Explicitly not performed** — this agent has no ability to reach the external
`d2r.world` site (no browser tool, no general internet fetch tool available in this
session). The brief's Step 6 instruction to "spot-check 2-3 categories per kind
against d2r.world's own category pages" is left to the controller to perform
separately.

## Commands run (verbatim)

```
npx tsc --noEmit                     # exit 0, clean
npm run lint                         # exit 0, clean
npm test                             # exit 0, 9 files / 44 tests passed
npm run build                        # exit 0 (after copying .env.local into this worktree)
grep -o '<h2[^<]*</h2>' out/en/items/unique/axes/index.html
grep -o '<h2[^<]*</h2>' out/zh-TW/items/set/boots/index.html
npx next dev -p 3006 &               # from this worktree, confirmed pwd + branch first
curl -sL http://localhost:3006/en/items/unique
curl -sL http://localhost:3006/en/items/set
curl -sL http://localhost:3006/zh-TW/items/unique
curl -sL http://localhost:3006/zh-CN/items/unique
curl -sL http://localhost:3006/en/items/unique/axes
curl -sL http://localhost:3006/zh-TW/items/unique/axes
curl -sI http://localhost:3006/en/items/set/charms/    # 500 in dev (see note above)
cd out && python3 -m http.server 8099 &
curl -o /dev/null -w "%{http_code}" http://localhost:8099/en/items/set/charms/    # 404
curl -o /dev/null -w "%{http_code}" http://localhost:8099/en/items/unique/axes/   # 200
```

## Concerns / notes for the controller

1. This worktree's `.env.local` was missing (gitignored, not copied when the
   worktree was created); it was copied in locally from the main checkout purely to
   unblock `npm run build`. It is not committed (still gitignored) and is unrelated
   to this task's source changes.
2. The dev-server 500-vs-404 nuance for `output: 'export'` dynamic routes described
   above — worth being aware of if anyone tests `next dev` directly against an
   invalid category slug and is surprised not to see a plain 404 page.
3. d2r.world cross-check deferred to controller, as instructed.
