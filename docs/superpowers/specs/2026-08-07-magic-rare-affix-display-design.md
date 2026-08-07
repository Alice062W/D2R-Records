# Magic/Rare Affix Pages Redesign (Step 2 — Display) Design Spec

Date: 2026-08-07
Status: Approved by user, ready for implementation

## Goal

Fix the Magic Items / Rare Items category pages so affix numbers are
understandable (root cause from step 1: `affixCatalog.ts` truncates every
affix to its first stat and drops the label/template/group entirely;
`AffixTable.tsx` never renders a label at all, only bare `min–max`), and
surface the `group` (mutual-exclusivity) and `template` (real formatted
stat text) data step 1 already produced.

## Confirmed facts (verified against `data/magic-affixes.json`, don't re-derive)

- Every affix has a non-zero `group` — many are singleton groups of 1.
  Sample scale (rings, magic category): 47 prefixes across 12 groups
  (largest group has 9 affixes), 87 suffixes across 24 groups.
- `stats[].template` (when resolved) uses exactly 4 placeholder shapes:
  `%+d`, `%+d%`, `%d`, `%d%` — no other printf-style tokens appear
  anywhere in the data. A formatter only needs to handle these 4.
- Some `stats[].template` entries are `null` (either genuinely-unresolved
  codes like `cold-len`/`sock`, or the English-only `dmg%`/`indestruct`
  fallback which only has an `en` key) — these fall back to
  `{label}: {min}–{max}` using the existing `label` field, which is
  always present.
- Affixes can have 1-3 `stats[]` entries (multi-stat affixes exist).

## Layout

- **Two columns on desktop** (Prefixes | Suffixes), stacking to one
  column on mobile/narrow viewports — same `lg:grid-cols-2` responsive
  breakpoint convention already used elsewhere on the site (e.g.
  Rune Upgrade's 2-column tier boxes on Cube Recipes).
- Within each column, affixes for that item-type category are bucketed
  into bordered group boxes (`bg-panel-alt border border-panel-border
  rounded-xl`, matching the existing Cube Recipes sub-box style) keyed by
  the shared `group` field. Every affix ends up in some box, including
  singleton groups (a box with just one row) — kept for visual
  consistency rather than special-casing singletons into a flat list.
- **Group box header**: the highest-`alvl` affix in that group's own
  name, plus its resolved stat text evaluated at its own max value (e.g.
  "Of Protection — Max Damage Reduced 10"). No "Mutually Exclusive"
  label — the box itself is the signal.
- **Rows inside a box**: every individual affix, no collapsing (tiers are
  NOT collapsed into an expandable summary row, unlike the current
  site's other affix-tier UI elsewhere — this page shows every tier as
  its own always-visible row). Each row: name, Alvl, and its real
  formatted stat text with the actual min–max range substituted in
  (e.g. "Damage Reduced by 3–5"). Multi-stat affixes render each stat as
  its own line within the row.
- Groups within a column are sorted by their header affix's `alvl`
  descending (highest-level groups first) — same "biggest/most powerful
  first" convention the existing `AffixRow` component already uses for
  intra-group tier sorting.
- `itemTypes` no longer renders per-row (redundant — the whole page is
  already scoped to one category), simplifying each row versus today's
  `AffixRow`.

## Data layer changes

`src/lib/grail/affixCatalog.ts`:

- `Affix` type gains `group: number`, `stats: {key, label, template, min,
  max, isSkillRef, signed}[]` (replacing the current flattened single
  `min`/`max` fields) — the type becomes a closer mirror of the raw
  `magic-affixes.json` per-affix shape instead of a flattened summary.
- `getAffixesForCategory()` stops truncating to `stats[0]` — returns the
  full per-affix object (name, alvl, group, stats[]) for every matching
  affix in the category.
- New grouping helper (can live in `affixCatalog.ts` or a new
  co-located module) that takes a flat affix list and returns groups:
  `{ headerAffix: Affix, headerText: string, affixes: Affix[] }[]`,
  sorted by `headerAffix.alvl` descending. `headerAffix` is the group's
  own highest-alvl member; `headerText` is that affix's name + its
  resolved-at-max-value stat text (first stat only, for the header —
  multi-stat affixes as a group header use just their first stat's text,
  since the header is a compact label not a full property list).

## Template substitution formatter

New small utility (e.g. `src/lib/grail/formatAffixTemplate.ts`,
alongside the existing `formatStat.ts`): given a template string and a
`{min, max}` pair, substitutes the range into whichever of the 4 known
placeholder shapes is present:

- `%+d` → `+{min}` if min===max, else `+{min}–{max}` (matches
  `signedRange`'s existing convention in `formatStat.ts` — reuse that
  helper rather than reimplementing sign logic)
- `%d` → `{min}` if min===max, else `{min}–{max}`
- `%+d%` / `%d%` → same as above with a trailing `%` after the number(s)

If `template` is `null`, the caller falls back to `` `${label}: ${min}–${max}` `` (or just `label` if min===max and it reads
better — implementer's judgment on exact punctuation, not a functional
ambiguity).

## Components

- `AffixTable.tsx` is substantially rewritten (current `AffixRow`/
  `AffixGroup`/`groupAffixes` collapse-by-name logic is replaced by the
  new group-by-`group`-field logic) rather than patched — the
  fundamental grouping concept changed, not just a rendering detail.
- `AffixTable.test.tsx` needs corresponding rewrites — existing tests
  assert the old collapse-by-name/expand behavior which no longer
  exists.

## Scope

- Both Magic Items and Rare Items pages use the same `AffixTable`
  component (already true today — `kind: 'magic' | 'rare'` is the only
  difference, filtering by `rareEligible`) — this redesign applies to
  both automatically, no separate Rare-specific layout needed.
- Out of scope: changing the category-listing pages (`/items/magic`,
  `/items/rare` — the grid of item-type categories linking into each
  category's affix table) — only the per-category affix table itself
  changes.
- Out of scope: the skill-referencing compound codes (`att-skill`/
  `hit-skill`/`gethit-skill`/`charged`/`skilltab`) already correctly get
  `template: null` from step 1 and fall back to the bare-label format —
  no special compound-template handling needed here.
