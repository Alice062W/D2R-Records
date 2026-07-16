# D2RInstitute.gg — Task Tracker

_Updated as tasks are created and completed. Each implementation plan links to a file in `plans/`._

---

## Current Phase: Phase 0 — Architecture

### 🔲 To Do

- [ ] Deploy to Netlify and confirm CI/CD pipeline works

### ✅ Completed

- [x] Bootstrap Next.js 16 project (`--typescript --tailwind --app`)
- [x] Install and configure `next-intl` 4.x with `[locale]` route group
- [x] Set up three locales: `en`, `zh-TW`, `zh-CN` — verified `/en`, `/zh-TW`, `/zh-CN` all return correct language
- [x] Configure dark mode (class-based via `@custom-variant dark`, `<html class="dark">` default)
- [x] Create `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json` with placeholder strings
- [x] Set up localStorage limit scaffold (`src/lib/constants.ts` — `SAVE_LIMIT = Infinity`)
- [x] Install Vitest + React Testing Library; added `npm run test` and `npm run test:watch` scripts
- [x] Fixed Next.js 16 binary issue (use `node ./node_modules/next/dist/bin/next` in scripts)
- [x] Renamed `middleware.ts` → `proxy.ts` (Next.js 16 convention)

---

## Phase 1 — Data Prep + MVP Appraiser ✅

- [x] Parse `diablo-tools/d2-runewords` GitHub TypeScript source → `data/runewords.json` (93 runewords, all patches)
- [x] Build `data/bases.json` — 41 curated elite/exceptional/normal bases with EN/zh-TW/zh-CN names
- [x] Build `data/thresholds.json` — Larzuk socket rules
- [x] Implement `src/lib/appraise.ts` — pure Keep/Dump function (tier 1–4, eth notes, socket notes)
- [x] 8/8 unit tests passing in `src/lib/appraise.test.ts`
- [x] Build appraiser UI — `AppraiserForm.tsx` client component with item selector, sockets, ilvl, eth toggle
- [x] Wire all UI text through next-intl (EN / 繁中 / 简中 all verified)
- [x] Footer with Ko-fi button + language switcher (`LocaleSwitcher.tsx`)
- [x] Item icons — 41 base item sprites downloaded to `/public/items/`, shown in form preview and result panel (`AppraiserForm.tsx`)
- [ ] **Verify Traderie deep-link URL format manually** (open a result and click through)
- [ ] **Mobile test** — check on 375px viewport

### ⚠️ Chinese name review needed
`data/runewords.json` and `data/bases.json` contain zh-TW/zh-CN names translated from English. 
The user should review these against official D2R Chinese localization (reference: d2r.world).

---

## Upcoming: Phase 2 — Save Feature + Soft Limits

- [ ] "Save appraisal" feature with localStorage persistence
- [ ] Free tier limit: 10–20 saved items
- [ ] Upgrade prompt shown when limit reached

---

## Upcoming: Phase 3 — Monetization

- [ ] Lemon Squeezy integration ($4.99 one-time unlock)
- [ ] License key → localStorage → ad-free + unlimited saves
- [ ] Light AdSense sidebar (non-intrusive, sidebar only)

---

## Upcoming: Phase 4 — Korean

- [ ] KO translation (`messages/ko.json`)
- [ ] hreflang tags
- [ ] Korean SEO

---

## Upcoming: Phase 5 — Scale

- [ ] Amazon affiliate links (gaming peripherals page)
- [ ] Sponsorship outreach (at 20K+ monthly visitors)

---

## Grail Tracker (personal collection tracker) ✅

_Spec: [docs/superpowers/specs/2026-07-13-grail-tracker-design.md](../docs/superpowers/specs/2026-07-13-grail-tracker-design.md) · Plan: [plans/grail-tracker-implementation.md](./grail-tracker-implementation.md)_

- [x] Vendor `d2data` + generate `data/uniques.json`/`data/sets.json` (403 uniques, 135 sets)
- [x] Priority-ranked best-copy comparator (`src/lib/grail/bestCopy.ts`) + unit tests
- [x] External setup: Supabase project (D2R Fun Team org) + Google OAuth + env vars
- [x] Supabase client, finds API, RLS schema migration (+ authenticated-role grant)
- [x] Google sign-in auth hook + gate (+ redirectTo fix)
- [x] Static Act/Area zone list
- [x] Grail checklist page (category grouping, progress counts)
- [x] Item detail view (all copies, best-first)
- [x] Log-find form
- [x] i18n keys (en/zh-TW/zh-CN) + Footer nav link
- [x] Critical review fix: finds keyed by unique catalog `id`, not shared base `code`
- [x] Add GitHub Actions secrets (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY) + push to deploy — live at https://alice062w.github.io/D2R-Records/en/grail

## Grail Item Reference (d2r.world-style stat sheets) ✅

_Spec: [docs/superpowers/specs/2026-07-13-grail-item-reference-design.md](../docs/superpowers/specs/2026-07-13-grail-item-reference-design.md) · Plan: [plans/grail-item-reference-implementation.md](./grail-item-reference-implementation.md)_

- [x] Enrich catalog: baseName, grade, slotCategory, defense/str/durability, invFile
- [x] Stat-sheet detail view for every item (found or not), copies shown vs ranges
- [x] Slot-category grid + sticky jump bar + card restyle (gold/green names)
- [x] Item icons: researched thoroughly, no legitimate open source found — `public/items/inv/` ships empty with documented rationale, graceful fallback confirmed
- [x] d2r.world spot-check of 10 items + full verification — found/fixed 5 real generator bugs (par-only stats dropped, mislabeled stats)

## Grail Category Sidebar Navigation ✅

_Spec: [docs/superpowers/specs/2026-07-14-grail-category-sidebar-design.md](../docs/superpowers/specs/2026-07-14-grail-category-sidebar-design.md) · Plan: [plans/grail-category-sidebar-implementation.md](./grail-category-sidebar-implementation.md)_

- [x] Category sidebar component (desktop persistent column, mobile dropdown)
- [x] Retire item-detail modal → inline expanded block; remove card grid + jump bar
- [x] Icon extraction guide for owner's own D2R install (CascView + dc6png, written to public/items/inv/README.md)
- [x] Fixed real bug found during verification: skill/tab-referencing stats collapsed to identical labels + colliding storage keys

## Grail zh-TW / zh-CN Translation ✅

_Spec: [docs/superpowers/specs/2026-07-14-grail-zh-translation-design.md](../docs/superpowers/specs/2026-07-14-grail-zh-translation-design.md) · Plan: [plans/grail-zh-translation-implementation.md](./grail-zh-translation-implementation.md)_

- [x] Locale-aware catalog generator (official zh-TW names via d2data's localestrings-chi.json, zh-CN via OpenCC)
- [x] Locale-aware catalog projection (LocalizedText model, localizeGrailItem helper, zero component changes)
- [x] Translate UI chrome (Grail namespace + Footer.grailLink) to zh-TW + zh-CN
- [x] Full verification + d2r.world spot-check across all 3 locales — final whole-branch review clean

## D2R.world-Style Nav Shell + Unique/Set Items ✅

_Spec: [docs/superpowers/specs/2026-07-14-d2rworld-nav-design.md](../docs/superpowers/specs/2026-07-14-d2rworld-nav-design.md) · Plan: [plans/d2rworld-nav-implementation.md](./d2rworld-nav-implementation.md)_

- [x] Nav + Items message namespaces (en/zh-TW hand-authored, zh-CN via OpenCC)
- [x] SiteNavDrawer hamburger menu wired into shared layout
- [x] ComingSoonPage + 13 placeholder routes for remaining d2r.world sections
- [x] ItemCategoryGrid + ItemStatCard shared components
- [x] ItemBrowser + public Unique/Set Items pages (with grade tabs) + full verification — final whole-branch review clean (one fix round: site title restored, catalog filter memoized, a vacuous test strengthened)

## Unique/Set Items Category Card Pages ✅

_Spec: [docs/superpowers/specs/2026-07-14-unique-set-category-pages-design.md](../docs/superpowers/specs/2026-07-14-unique-set-category-pages-design.md) · Plan: [plans/unique-set-category-pages-implementation.md](./unique-set-category-pages-implementation.md)_

- [x] getCategoriesForKind catalog helper
- [x] Items.backToCategories message key (en/zh-TW hand-authored, zh-CN via OpenCC)
- [x] CategoryCardGrid component (landing page)
- [x] CategoryItemList component (grade-tab filtering for one category)
- [x] New per-category routes, updated landing pages, retire ItemBrowser/ItemCategoryGrid + full verification — final whole-branch review clean, no fix rounds needed

## Base Items, Runewords, Max Sockets ✅

_Spec: [docs/superpowers/specs/2026-07-14-base-runewords-maxsockets-design.md](../docs/superpowers/specs/2026-07-14-base-runewords-maxsockets-design.md) · Plan: [plans/base-runewords-maxsockets-implementation.md](./base-runewords-maxsockets-implementation.md)_

- [x] Vendor runes.json
- [x] Generate data/bases-full.json (base item lines, 3-grade comparison data)
- [x] Generate data/runewords-full.json (real effect stats from runes.json, 99 entries)
- [x] Generate data/max-sockets.json (from real itemtypes.json + items.json data, 18 rows)
- [x] Base Items pages (card-grid landing + comparison-table category pages)
- [x] Runewords filterable list page
- [x] Max Sockets page + full verification — final whole-branch review clean after one fix round (runeword locale rendering, recovered levelReq for 11 name-mismatched runewords)

## Runes, Cube Recipes, Crafted Items, Magic Items, Rare Items ✅

_Spec: [docs/superpowers/specs/2026-07-15-runes-cube-crafted-design.md](../docs/superpowers/specs/2026-07-15-runes-cube-crafted-design.md) · Plan: [plans/runes-cube-crafted-magic-rare-implementation.md](./runes-cube-crafted-magic-rare-implementation.md)_

- [x] Vendor gems.json + cubemain.json
- [x] Generate data/runes.json (33 runes, stats, recipes, hand-transcribed drop rates)
- [x] Generate data/cube-recipes.json + data/crafted-items.json
- [x] Runes, Cube Recipes, Crafted Items pages
- [x] Vendor magicprefix.json + magicsuffix.json; generate data/magic-affixes.json
- [x] Magic Items / Rare Items category system + pages
- [x] Full verification + d2r.world spot-check — found/fixed 24 leaked raw property-code labels, added regression test; final whole-branch review clean

## Item Inventory Icons ✅

_Spec: [docs/superpowers/specs/2026-07-15-item-icons-design.md](../docs/superpowers/specs/2026-07-15-item-icons-design.md) · Plan: [plans/item-icons-implementation.md](./item-icons-implementation.md)_

- [x] Merge 623 self-extracted `inv*.png` icons (from `add-item-icons` branch) + rewrite provenance README
- [x] Render icons in ItemStatCard
- [x] Render icons in GrailItemDetail
- [x] Full verification + browser spot-check — final whole-branch review clean

## Comprehensive Property-Label Audit ✅

_Spec: [docs/superpowers/specs/2026-07-16-property-label-audit-design.md](../docs/superpowers/specs/2026-07-16-property-label-audit-design.md) · Plan: [plans/property-label-audit-implementation.md](./property-label-audit-implementation.md)_

- [x] Research and add missing property labels (34/36 leaked codes resolved across uniques/sets/runewords; `ethereal` excluded at source, `bloody`/`war`/`pierce-dmg` deliberately unmapped)
- [x] Broaden regression test to cover every data file (3 -> 8)
- [x] d2r.world spot-check + verification doc — final whole-branch review clean

## Item Icon Sizing Fix ✅

_Spec: [docs/superpowers/specs/2026-07-16-icon-sizing-design.md](../docs/superpowers/specs/2026-07-16-icon-sizing-design.md) · Plan: [plans/icon-sizing-implementation.md](./icon-sizing-implementation.md)_

- [x] Increase icon size 40px -> 80px in ItemStatCard and GrailItemDetail
- [x] Browser verification — confirmed on desktop and mobile widths, no distortion

## Category-Grid Icons ✅

_Spec: [docs/superpowers/specs/2026-07-16-category-icons-design.md](../docs/superpowers/specs/2026-07-16-category-icons-design.md) · Plan: [plans/category-icons-implementation.md](./category-icons-implementation.md)_

- [x] Generate data/category-icons.json (28 SLOT_ORDER categories -> representative invFile)
- [x] Render icons in CategoryCardGrid
- [x] Browser verification — confirmed on Base/Unique/Set (all 28) and Magic Items (25 mapped, 12 generic correctly icon-less) grids, desktop + mobile

## Base Items Katars Fix ✅

_Spec: [docs/superpowers/specs/2026-07-16-katars-base-items-fix-design.md](../docs/superpowers/specs/2026-07-16-katars-base-items-fix-design.md) · Plan: [plans/katars-base-items-fix-implementation.md](./katars-base-items-fix-implementation.md)_

- [x] Fix TYPE_TO_SLOT (h2h -> katars) so Base Items includes katars
- [x] d2r.world spot-check — all 7 katar base items match exactly

### Follow-up sub-projects (agreed order, not yet started)
- Sub-category taxonomy fix (bundled): Base Items' Shields (add Paladin Shields/Shrunken Heads/Grimoires sub-tabs) + Magic/Rare's 12 generic categories (split into Barbarian/Druid Helms, Circlets, Amazon Spears/Bows/Javelins, Sorceress Orbs, Necromancer Wands, Assassin Katars, Throwing Axes/Knives, Grand/Large/Small Charms) — then add icons for the newly-split categories
- Set Items taxonomy: combine weapon categories into one "Weapons" bucket (matching d2r.world); add the missing "browse by full Set name" view (Arctic Gear, Hsarus' Defense, etc. — previously deferred)
- Full site audit vs. d2r.world for remaining pages (especially Misc: FCR/FHR/FBR, Alvl85 Areas, Area Level, Level Up — currently unbuilt placeholders)

## Backlog / Ideas

- Batch appraisal (multiple items at once) — premium feature
- CSV/text export of results — premium feature
- Filter view: "show all Tier 1 bases for a specific runeword"
- Discord integration / community translator program
- Russian translation (zh-TW zh-CN + KO first)

---

## Implementation Plans

| Plan | Description |
|---|---|
| [strategy-research.md](./strategy-research.md) | Initial research: viability, competitors, monetization, i18n strategy |
| [grail-tracker-implementation.md](./grail-tracker-implementation.md) | Personal unique/set item collection tracker (Supabase + Google auth) |
| [grail-item-reference-implementation.md](./grail-item-reference-implementation.md) | d2r.world-style stat sheets, slot grid, icons for all 538 items |
| [grail-category-sidebar-implementation.md](./grail-category-sidebar-implementation.md) | Category sidebar navigation, retiring the single long scrolling page |
| [grail-zh-translation-implementation.md](./grail-zh-translation-implementation.md) | Full zh-TW/zh-CN translation of catalog data + UI chrome |
| [d2rworld-nav-implementation.md](./d2rworld-nav-implementation.md) | d2r.world-style nav drawer (14 sections) + public Unique/Set Items browsing |
| [unique-set-category-pages-implementation.md](./unique-set-category-pages-implementation.md) | Card-grid landing + real per-category routes for Unique/Set Items, matching d2r.world's actual flow |
| [base-runewords-maxsockets-implementation.md](./base-runewords-maxsockets-implementation.md) | Base Items comparison tables, Runewords filterable list, generated Max Sockets table |
| [runes-cube-crafted-magic-rare-implementation.md](./runes-cube-crafted-magic-rare-implementation.md) | Runes, Cube Recipes, Crafted Items, Magic Items, Rare Items — the final 5 Game Items sections |
| [item-icons-implementation.md](./item-icons-implementation.md) | Render self-extracted item inventory icons on Unique/Set item cards and detail views |
| [property-label-audit-implementation.md](./property-label-audit-implementation.md) | Close remaining leaked raw property codes across uniques/sets/runewords/magic-affixes; broaden regression test to every data file |
| [icon-sizing-implementation.md](./icon-sizing-implementation.md) | Increase item inventory icon size from 40px to 80px to match d2r.world's presentation |
| [category-icons-implementation.md](./category-icons-implementation.md) | Representative item icon per category tile on landing-page grids |
| [katars-base-items-fix-implementation.md](./katars-base-items-fix-implementation.md) | Fix Katars missing from Base Items (wrong item-type code in TYPE_TO_SLOT) |
