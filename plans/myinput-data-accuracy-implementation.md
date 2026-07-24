# MyInput/MyData Accuracy & Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use the full d2r.world crawl in `MyInput/MyData/` (real DOM, decoded numbers, both en-US/zh-TW, real icon/photo assets) to systematically correct every data file our site generates from, and restructure the Magic/Rare Items pages to match d2r.world's grouped/expandable affix presentation.

**Architecture:** `MyInput/MyData/<category>/site/<locale>/**/*.decoded.html` is a static snapshot of d2r.world's real rendered DOM with numbers already decoded (no more screenshot/vision-based transcription needed). Each phase: write/extend a Python parser for that category → produce an intermediate JSON per category → diff against `data/*.json` → apply fixes via the existing `scripts/generate-grail-data.mjs` override pattern (or direct data-file edits for hand-curated files) → full verification → commit.

**Tech Stack:** Python 3 (BeautifulSoup4 or stdlib `html.parser`) for parsing the dumps (one-time, not part of the build), existing Node/TypeScript generator pipeline for applying fixes.

## Global Constraints

- Every fix must be traceable to a specific line in a specific `.decoded.html`/`.decoded.txt` file — no guessing, same rule as last session's runeword audit.
- `horazons_splendor/` folder is confirmed superseded/broken (numbers not decoded) — ignore entirely; `sets_all/` has the same set fully decoded.
- Do not fabricate or infer values for anything not clearly present in the dump.
- Follow existing repo conventions: `RUNEWORD_STAT_OVERRIDES`-style override tables in `scripts/generate-grail-data.mjs` for generated data files; direct edits for hand-curated files (`data/runewords.json`, misc-page data).
- After every phase: `node scripts/generate-grail-data.mjs` → `npx vitest run --exclude "**/.claude/worktrees/**"` → `npx tsc --noEmit` → `npx eslint . --ignore-pattern ".claude/worktrees/**"` → `rm -rf .next out && npm run build`.
- Batch commits per phase (not one giant commit), with a detailed commit message per phase documenting what was found/fixed — same style as last session's runeword commits.
- **Do not push to GitHub until every phase is complete and verified** — final push happens once, at the end, after the whole-branch review.
- The parser scripts and intermediate JSON they produce are working artifacts — write them to the scratchpad/a `scripts/tmp/` style location, not committed to the repo (only the corrected `data/*.json` and any new UI components are committed).

---

### Task 0: Parser infrastructure + first proof-of-concept (Runewords)

**Files:**
- Create: `scripts/dump-parser/parse_runewords.py` (or equivalent) — parses `MyInput/MyData/runewords_all/site/en-US/info/item/runewords.decoded.html` (+ zh-TW) into a flat JSON keyed by runeword name, with stat lines, rune order, allowed items, required level, ladder-only flag
- Read-only input: `MyInput/MyData/runewords_all/site/{en-US,zh-TW}/info/item/runewords.decoded.html`
- Output (not committed): parsed JSON to scratchpad

**Interfaces:**
- Produces: a reusable pattern (anchor-id section splitting on `href="...#<slug>"`, then walking sibling stat-line divs until the next anchor) that Tasks 2-8 adapt per category's HTML shape
- The parser's per-runeword record shape: `{name, runes: [...], levelReq, ladderOnly, allowedItems: [...], stats: [{text}], zh_TW: {...same shape...}}`

- [ ] Write the anchor-splitting parser for the runewords page (single-page category, smallest dataset — good proof of concept)
- [ ] Run it, spot-check 5 known runewords (including Hysteria via `#hustle` anchor) against last session's manually-verified `RUNEWORD_STAT_OVERRIDES` entries in `scripts/generate-grail-data.mjs` — confirms the parser is trustworthy before relying on it for unaudited categories
- [ ] Diff full parser output against all 98 current runeword entries in `data/runewords-full.json`; list any remaining discrepancies (expect very few, since runewords were manually audited last session — this task's real purpose is validating the parser)
- [ ] Fix any discrepancies found via `RUNEWORD_STAT_OVERRIDES`, regenerate, verify
- [ ] Commit: "Validate runeword data against full d2r.world crawl; parser infrastructure"

### Task 1: Unique Items (408 items, never systematically audited)

**Files:**
- Create: `scripts/dump-parser/parse_uniques.py` (adapt Task 0's pattern to `unique_all/site/*/info/item/unique/<category>.decoded.html`, 27 sub-pages per locale)
- Modify: `scripts/generate-grail-data.mjs` (add a `UNIQUE_STAT_OVERRIDES` table, same shape/pattern as `RUNEWORD_STAT_OVERRIDES`) or `data/uniques.json` directly if simpler for this data shape
- Read-only input: `MyInput/MyData/unique_all/site/{en-US,zh-TW}/info/item/unique/*.decoded.html`

- [ ] Parse all 27 unique-item category pages (both locales)
- [ ] Diff against `data/uniques.json` (408 items) — expect many discrepancies (unaudited)
- [ ] Fix via override table, regenerate, verify
- [ ] Cross-check zh-TW/zh-CN names against the parsed zh-TW data
- [ ] Commit (batched — split into 2-3 commits by category group if the fix list is large, matching last session's runeword batching style)

### Task 2: Set Items (135 items + set bonuses, 34 sets)

**Files:**
- Create: `scripts/dump-parser/parse_sets.py`
- Modify: `scripts/generate-grail-data.mjs` (set item + set-bonus override tables)
- Read-only input: `MyInput/MyData/sets_all/site/{en-US,zh-TW}/info/item/sets/*.decoded.html` (34 set-specific pages + category index pages)

- [ ] Parse all 34 set pages (both locales) — piece stats + partial/full set bonuses
- [ ] Diff against `data/sets.json` + `data/set-groups.json`
- [ ] Fix, regenerate, verify
- [ ] Commit

### Task 3: Magic Items & Rare Items — data audit AND UI restructure

**Files:**
- Create: `scripts/dump-parser/parse_magic_rare.py`
- Modify: `data/magic-affixes.json` generation in `scripts/generate-grail-data.mjs` (data fixes)
- Modify: `src/components/items/AffixTable.tsx` — restructure to group same-named affixes into one row showing the max-tier value, with a click-to-expand revealing every tier (name/alvl/min-max), matching d2r.world's `>` chevron pattern confirmed live on `/en-US/info/item/magic/rings`
- Test: `src/components/items/AffixTable.test.tsx` (extend for new grouped/expand behavior)
- Read-only input: `MyInput/MyData/magic_all/` and `MyInput/MyData/rare_all/` (26 sub-pages each, both locales)

**Interfaces:**
- `AffixTable` currently takes `{prefixes: Affix[], suffixes: Affix[]}` flat arrays — new version groups by `name` client-side (or a new `groupAffixesByName` helper in `src/lib/grail/affixCatalog.ts`) before rendering

- [ ] Parse magic + rare pages (52 sub-pages total, both locales)
- [ ] Diff affix stat data against `data/magic-affixes.json`; fix
- [ ] Design + implement the grouped/expandable AffixTable UI (group by name → show max tier collapsed → expand to show all tiers with alvl + range)
- [ ] Full verification + browser check (desktop + mobile) of the new expand/collapse UI
- [ ] Commit (data fixes and UI restructure can be 2 separate commits)

### Task 4: Crafted Items, Cube Recipes, Runes

**Files:**
- Create: `scripts/dump-parser/parse_crafted_cube_runes.py`
- Modify: `scripts/generate-grail-data.mjs` overrides for each
- Read-only input: `MyInput/MyData/crafted_all/`, `MyInput/MyData/recipes_all/`, `MyInput/MyData/runes_all/`

- [ ] Parse and diff all three categories
- [ ] Fix, regenerate, verify
- [ ] Commit

### Task 5: Base Items

**Files:**
- Create: `scripts/dump-parser/parse_base.py`
- Modify: `scripts/generate-grail-data.mjs` or `data/bases-full.json` generation
- Read-only input: `MyInput/MyData/base_all/site/*/info/item/base/*.decoded.html` (23 sub-pages per locale)

- [ ] Parse and diff base item comparison tables
- [ ] Fix, regenerate, verify
- [ ] Commit

### Task 6: Misc pages spot-check (FCR/FHR/FBR, Level Up, Area Level, Alvl85)

**Files:**
- Create: `scripts/dump-parser/parse_misc.py`
- Modify: relevant hand-curated `data/*.json` files if discrepancies found
- Read-only input: `MyInput/MyData/misc_all/site/*/info/{character,monster}/**/*.decoded.html`

- [ ] Parse all misc pages
- [ ] Diff against existing hand-transcribed data (these were already spot-checked once — expect few/no changes)
- [ ] Fix anything found, regenerate, verify
- [ ] Commit

### Task 7: Icon/image upgrade

**Files:**
- Read-only input: `MyInput/MyData/*/assets/img/items/**/*` (real d2r.world item icons, ~1000+ files across categories) + `MyInput/skill_icons/`, `MyInput/visuals/` (aura icons)
- Modify: `public/items/inv/` (fill gaps / replace with more accurate versions where filenames can be confidently mapped to our `invFile` convention)
- Modify: `public/auras/` or equivalent if the Paladin aura icons differ from current

- [ ] Build a filename-mapping strategy from d2r.world's asset names to our `invFile` values (likely needs the `.decoded.html` `<img>` src attributes to correlate asset filename -> item, since d2r.world's filenames aren't already in our naming scheme)
- [ ] Identify: (a) icons we're missing entirely, (b) icons that differ from our self-extracted ones
- [ ] Backfill missing icons; for differing ones, present a sample diff to the user before mass-replacing (visual regression risk — this is the one task where a judgment call/approval checkpoint makes sense before applying broadly)
- [ ] Cross-check the 20 aura icons against `MyInput/skill_icons/` + `MyInput/visuals/`
- [ ] Full verification + browser spot-check across several pages
- [ ] Commit

### Task 8: Final whole-site verification + push

- [ ] Full test/tsc/lint/build one more time on the complete branch
- [ ] Browser spot-check a sample from every touched category (desktop + mobile)
- [ ] Summarize all fixes made across all phases (for the final commit/PR-style summary)
- [ ] Push everything to GitHub `main`

---

## Notes on plan format

Unlike a typical writing-plans doc, Tasks 1-6 cannot specify the *exact* diffs/fixes in advance — the specific wrong values are only known once each category's parser runs and is diffed against current data, exactly like last session's runeword audit (which found different specific bugs in nearly every runeword, discovered only by reading the source). Each task's implementer should follow the **established override-table methodology** from `scripts/generate-grail-data.mjs`'s `RUNEWORD_STAT_OVERRIDES` (see Task 0) as the concrete pattern to replicate for uniques/sets/etc., rather than a pre-written diff.
