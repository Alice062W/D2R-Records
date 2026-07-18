# Unique/Set/Runeword Stat Color Highlighting — Design

## Goal

On Unique, Set, and Runeword item displays, color variable-range stats and
skill-granting stats differently from regular fixed stats, matching d2r.world's own
color scheme.

## Background

Inspected `d2r.world`'s actual computed styles directly (colors only — no images or
text copied) on a Unique Items page:

- Regular magic/fixed property text: `rgb(128, 128, 243)` / `#8080f3` — already the
  color this project uses for all stat lines today (no distinction currently made).
- **Skill-granting properties**: only the skill NAME substring within the line is
  colored `rgb(255, 74, 105)` / `#ff4a69` (verified directly: for "+ to Skeleton
  Mastery (Necromancer Only)", the spans are `"+ to "` (blue) → `"Skeleton Mastery"`
  (**pink**) → `" (Necromancer Only)"` (blue) — only the skill name itself changes
  color, not the whole line).
- **Variable/ranged properties** (stats whose value differs from copy to copy of the
  same item, e.g. Duskdeep's Enhanced Defense): marked with a `"+-"` prefix rendered
  in `rgb(255, 248, 24)` / `#fff818` (yellow).

This project's generator (`scripts/generate-grail-data.mjs`) already computes
`isSkillRef` internally in both `extractProps()` and `extractSetBonuses()` (used by
uniques, sets, set bonuses, and runewords, all via the same shared functions) — it's
used today only to decide whether a stat's label needs a skill name interpolated
(`localizedLabelWithSkill`), then discarded rather than attached to the output. The
data model **already separates variable-range stats from fixed stats into two
distinct arrays** (`stats` vs `fixedStats`) at every level this session has touched
— so no min/max comparison is needed at render time; the array a stat lives in
already tells us whether it's variable or fixed.

Confirmed `RawGrailStat`/`GrailStat`/`RawGrailFixedStat`/`GrailFixedStat` in
`src/lib/grail/catalog.ts`, and `localizeGrailItem()`'s mapping, currently strip
every field down to `{key, label, min, max}`/`{key, label, value}` — any new field
added to the raw generator output needs to be explicitly added to these interfaces
and the mapping function too, or it's silently dropped before reaching components.
Runewords (`data/runewords-full.json`) have no such intermediate typed layer —
`RunewordList.tsx` infers its type directly from the JSON shape
(`(typeof runewordsFullJson)[number]`), so a new field there flows through
automatically with no extra interface work.

## Design

- **Generator**: add `isSkillRef` (boolean) to every object pushed in
  `extractProps()` (3 push sites: the `min===max` fixed case, the variable case, and
  the `par`-only fixed case) and `extractSetBonuses()` (2 push sites). This is a
  one-line addition per site reusing the `isSkillRef` constant already computed
  right above each site — no new logic, no re-derivation.
- **`src/lib/grail/catalog.ts`**: add `isSkillRef: boolean` to `RawGrailStat`,
  `RawGrailFixedStat`, `GrailStat`, and `GrailFixedStat`; thread it through
  `localizeGrailItem()`'s `stats`/`fixedStats`/`setBonuses` mapping (currently strips
  to `{key, label, min, max}` etc. — add `isSkillRef: s.isSkillRef` alongside).
- **Color scheme** (both `ItemStatCard.tsx` for Unique/Set and `RunewordList.tsx`
  for Runewords):
  - A stat in the **variable** array (`item.stats` / `rw.stats`, real min–max range)
    renders in yellow (`text-[#fff818]`) by default.
  - A stat in the **fixed** array (`item.fixedStats` / `rw.fixedStats`, single
    value) renders in the existing blue (`text-[#8080f3]`) by default — unchanged
    from today.
  - **Regardless of which array it's in**, a stat with `isSkillRef: true` renders in
    pink (`text-[#ff4a69]`) instead — matching d2r.world's own priority (a skill
    name is always pink, whether the stat itself is fixed or variable).
  - Set bonuses (`item.setBonuses`) follow the same rule: pink if `isSkillRef`,
    otherwise the existing green (`#22ff55]`, unchanged — set bonuses were never
    blue to begin with) unless a genuinely variable/fixed distinction exists there
    too (it does — `extractSetBonuses` produces both ranged and single-value
    entries in one array, distinguished at render time by `min === max`, since that
    function doesn't split into two arrays the way `extractProps` does).
- **Regenerate** `data/uniques.json`, `data/sets.json`, `data/runewords-full.json`
  (and, harmlessly, every other file sharing `extractProps`/`extractSetBonuses` —
  `data/magic-affixes.json`, `data/crafted-items.json`, `data/runes.json`,
  `data/set-groups.json` — the new field is simply unused by their current
  components, not a behavior change for those pages).

## Non-goals

- Any change to Magic Items / Rare Items / Cube Recipes / Crafted Items page
  *rendering* — only Unique, Set, and Runeword displays get the new colors, per the
  user's explicit scope. (The data files for those other categories gain the
  `isSkillRef` field as a harmless side effect of the shared generator functions,
  but their components aren't touched.)
- Replicating d2r.world's exact `"+-"` prefix glyph — this project already shows
  the real `min–max` range numbers (d2r.world's own display hides the actual values
  behind that marker in some contexts), so the color is applied to the whole
  variable-stat line rather than inventing a new prefix symbol.

## Testing plan

- Data test: for a known unique with a skill-granting stat (spot-check one with
  "+X to <some skill>"), confirm the generated `isSkillRef: true` on that specific
  stat and `false`/absent-equivalent on regular stats.
- Component test: `ItemStatCard` renders a variable stat in yellow, a fixed stat in
  blue, and a skill-ref stat (in either array) in pink, for a constructed sample
  item covering all three cases. Same for `RunewordList`.
- Manual spot-check: a real Unique item with a skill charge (e.g. an item granting
  "Level X <Skill> (Y Charges)"), a Set item with a variable stat, and a Runeword
  with a skill-tab bonus, all rendering the expected colors.
