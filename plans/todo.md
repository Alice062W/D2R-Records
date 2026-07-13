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

## Upcoming: Grail Tracker (personal collection tracker)

_Spec: [docs/superpowers/specs/2026-07-13-grail-tracker-design.md](../docs/superpowers/specs/2026-07-13-grail-tracker-design.md) · Plan: [plans/grail-tracker-implementation.md](./grail-tracker-implementation.md)_

- [ ] Vendor `d2data` + generate `data/uniques.json`/`data/sets.json` (403 uniques, 135 sets)
- [ ] Priority-ranked best-copy comparator (`src/lib/grail/bestCopy.ts`) + unit tests
- [ ] External setup: Supabase project + Google OAuth provider + env vars (site owner, manual)
- [ ] Supabase client, finds API, RLS schema migration
- [ ] Google sign-in auth hook + gate
- [ ] Static Act/Area zone list
- [ ] Grail checklist page (category grouping, progress counts)
- [ ] Item detail view (all copies, best-first)
- [ ] Log-find form
- [ ] i18n keys (en/zh-TW/zh-CN) + Footer nav link

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
