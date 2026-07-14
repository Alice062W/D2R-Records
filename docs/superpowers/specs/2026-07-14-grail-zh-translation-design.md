# Grail zh-TW / zh-CN Translation — Design Spec

_Full translation of the grail item reference feature (catalog content + UI chrome) into
Traditional and Simplified Chinese, matching d2r.world's level of localization. Follow-up to the
2026-07-13/14 grail item reference and category sidebar work._

## Problem

Every string introduced by the grail feature — item names, stat labels, skill names, category
names, buttons, form labels — currently ships as English text duplicated verbatim into
`messages/zh-TW.json` and `messages/zh-CN.json` (an explicit, intentional deferral from every prior
grail plan). The catalog data (`data/uniques.json`/`data/sets.json`) has no locale concept at all —
`name`, `baseName`, and every stat `label` are flat English strings. The owner wants this properly
localized, matching d2r.world's own multi-language presentation.

## Data sources found (research already done, see conversation)

- **`vendor/d2data/json/localestrings-chi.json`** (same MIT-licensed, already-vendored d2data repo)
  — ~8,715 official Traditional Chinese strings, script-verified. Keyed directly by the exact
  English string used elsewhere in the source data: item base codes (e.g. `chi["2ax"]` →
  `"雙刃斧"`), unique/set item `index` names verbatim (e.g. `chi["Harlequin Crest"]` →
  `"諧角之冠"`), and skill names via `skillname{id}` (e.g. `chi["skillname74"]` →
  `"屍體爆炸"`, matching the numeric skill IDs already resolved for the English label fix).
  Coverage measured: **385/403 (95.5%) unique items**, **127/135 (94%) set items** have an official
  name. The ~26 misses are newer content (the "Reign of the Warlock" necromancer-class items,
  plus a handful of non-spawnable placeholder/debug entries) not yet in this localization snapshot.
- **No official Simplified Chinese source found** in this dataset (the separate NetEase-published
  Mainland client's strings aren't present). zh-CN is derived by converting the zh-TW output via
  `opencc-js` (pure-JS, no native deps, tested and confirmed producing correct conversions, e.g.
  `諧角之冠` → `谐角之冠`).
- **Stat label phrasing** (e.g. "Skill Bonus", "Chance to Cast on Striking") has no official simple
  lookup — same as the existing English `PROP_LABELS` dictionary, which is hand-curated, not
  official strings. zh-TW versions of these ~90 entries are hand-translated the same way the
  English ones were; zh-CN is derived via the same OpenCC conversion.

## Fallback policy (applies everywhere)

If no official Chinese name/label exists for a given string, **display the English text as-is** in
both zh-TW and zh-CN — never freehand-translate a proper noun (item/skill name) without an
authoritative source. This is the same graceful-degradation principle already used for missing
icons: honest and visible, not silently wrong. Converting an English fallback through OpenCC is a
harmless no-op (no Traditional Chinese characters to convert), so the derivation pipeline doesn't
need a special case for it.

## Non-goals

- No changes to the finds pipeline, auth, comparator, or Supabase schema — this is data/display
  only. `stat.key` (used for `statPriority` and `find.statValues`) stays locale-agnostic; only
  `stat.label` (display text) becomes locale-aware.
- No UI indicator distinguishing "official" vs "OpenCC-converted" vs "English fallback" text — the
  existing project convention (bases.json/runewords.json) doesn't surface this distinction to the
  user either; it's documented in code/README, not in the UI.
- No attempt to source an authoritative Simplified Chinese string table in this pass — OpenCC
  conversion is the accepted approach, with the same "worth native review" caveat the project
  already carries for its existing Chinese content.
- No translation of the pre-existing `Home`/`Appraiser`/`Footer` namespaces — those were already
  properly translated when the original appraiser shipped; only the `Grail` namespace (and the one
  `Footer.grailLink` key) is in scope.

## Data model change

New shared type in `src/lib/grail/catalog.ts`:
```ts
interface LocalizedText {
  en: string;
  'zh-TW': string;
  'zh-CN': string;
}
```

The raw catalog entry (`data/uniques.json`/`data/sets.json`, as generated) changes from flat
strings to `LocalizedText` for every translatable field:
```ts
interface RawGrailItem {
  id: string; code: string; kind: 'unique' | 'set';
  name: LocalizedText;
  baseName: LocalizedText;
  setName: LocalizedText | null;
  levelReq: number; grade: 'normal' | 'exceptional' | 'elite'; slotCategory: string;
  defense: { min: number; max: number } | null;
  requiredStrength: number | null; durability: number | null; invFile: string;
  stats: { key: string; label: LocalizedText; min: number; max: number }[];
  fixedStats: { key: string; label: LocalizedText; value: number }[];
  setBonuses: { key: string; label: LocalizedText; min: number; max: number }[];
  statPriority: string[];
}
```
`id`, `code`, `kind`, `key` fields, numbers, `grade`, `slotCategory`, `invFile` are identity/numeric
— locale-agnostic, unchanged.

`getAllGrailItems()` now returns `RawGrailItem[]`. A new `localizeGrailItem(item, locale):
GrailItem` projects one raw entry down to today's flat single-locale shape — **the existing
`GrailItem` interface name and shape are kept for the projected result**, so every consuming
component (`GrailItemCard`, `GrailItemDetail`, `GrailCategorySidebar`) needs zero changes; only the
two call sites of `getAllGrailItems()` (`GrailChecklist.tsx`, `LogFindForm.tsx`) change, adding one
`useLocale()` call and one `.map(i => localizeGrailItem(i, locale))`. `sortItemsForDisplay`,
`bestFind`/`sortFindsByRank`/`compareFinds` (comparator), and `SLOT_ORDER` are all already
locale-agnostic (grade/levelReq/keys, not display text) and need no changes.

## Generator changes (`scripts/generate-grail-data.mjs`)

- Vendor `localestrings-chi.json` (matching existing `vendor/d2data/json/` convention) and add
  `opencc-js` as a **devDependency** (build-script-only — never imported into the shipped app
  bundle, since generation happens once via `npm run generate:grail`, not at runtime).
- `chineseNameFor(key)`: `chi[key] ?? key` (English fallback) — used for item names (via `index`)
  and base names (via `code`).
- `PROP_LABELS_ZH_TW`: new hand-curated dictionary mirroring every key in the existing
  `PROP_LABELS`, hand-translated. Unmapped codes fall back to the resolved English label (not the
  raw code — more readable than today's English-only fallback-to-raw-code).
- `skillNameForLocale(par, locale)`: for numeric `par`, look up `chi[`skillname${par}`]` (zh-TW) or
  `skills[par].skill` (en); for string `par` (already-literal names in the source data), try
  `chi[par]` for zh-TW, else the literal string itself for both locales.
- A single `toZhCn(zhTwText)` helper wraps the OpenCC converter; zh-CN for every field is always
  derived by running the resolved zh-TW value through it — no separate lookup path, no special
  English-fallback case (no-op on non-Chinese text).
- `labelFor`/`labelWithSkill` become `labelForLocale(code, locale)` /
  `labelWithSkillForLocale(code, par, locale)`, called three times per stat (once per locale) to
  build the `LocalizedText` object.

## Message file changes

The `Grail` namespace (all ~70 keys, including the 28 `slot_*` category names) and
`Footer.grailLink` get real zh-TW translations, with zh-CN derived via the same `opencc-js`
conversion (a one-off script pass over the JSON values, not per-key manual work — consistent with
how the catalog data is derived). `en.json` is unchanged.

## Testing

Extend `data/grail-data.test.ts`:
- Every `LocalizedText` field (`name`, `baseName`, stat/fixedStat/setBonus `label`) has non-empty
  `en`, `zh-TW`, `zh-CN` values on every item (fallback guarantees non-empty even when unofficial).
- Spot-check known official translations survive regeneration verbatim (e.g. Harlequin Crest's
  `name['zh-TW']` equals `'諧角之冠'`), guarding against a future data refresh silently losing the
  lookup.
- `zh-CN` values differ from `zh-TW` wherever the source contains Traditional-only characters
  (regression guard that the OpenCC conversion step is actually running, not passing through
  unconverted).

Manual: build all three locale `/grail` pages, spot-check a sample of items in the browser per
locale (same d2r.world-comparison spot-check convention as the prior item-reference plan, checked
against d2r.world's zh-TW listing for terminology sanity — reference only, not copied).

## Open questions / deferred

- Native-speaker review of the OpenCC-derived zh-CN text and the hand-translated zh-TW stat-label
  phrasing — same standing caveat as the project's existing Chinese content.
- The ~26 items without an official Chinese name — revisit if a fuller/newer localization snapshot
  becomes available upstream.
