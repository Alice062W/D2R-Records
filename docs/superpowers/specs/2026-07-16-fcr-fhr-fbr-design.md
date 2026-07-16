# FCR/FHR/FBR — Design

## Goal

Build the final remaining Misc page (currently an unbuilt "Coming Soon" placeholder at
`/[locale]/character/fcr-fhr-fbr`): the Faster Cast Rate / Faster Hit Recovery / Faster
Block Rate breakpoint tables, one per class/form, matching d2r.world's
`https://d2r.world/en-US/info/character/fcr-fhr-fbr` content exactly.

## Background

FCR/FHR/FBR breakpoints are frame-count thresholds: a character's animation for
casting/getting-hit/blocking takes a fixed number of engine frames, and each point on
d2r.world's tables is the exact %-stat needed to drop from N+1 frames down to N frames.
The underlying frame counts come from each skill/action's internal animation data
(`.cof`/mode-length values baked into the client), not a plain vendored JSON field —
the same kind of gap hit during the Alvl85 Areas sub-project, where `levels.json`'s
monster-list fields turned out incomplete for several areas. Per that same established
policy, and per explicit user direction this session, the full breakpoint tables are
**hand-transcribed from d2r.world** rather than re-derived from a formula, for all 10
class/form tabs:

- Amazon, Assassin, Barbarian, Necromancer/Warlock, Necromancer Vampire Form, Paladin,
  Sorceress — one straightforward table each (Frames | FCR | FHR | FBR), though several
  have sub-columns for weapon-type or skill-type exceptions (see below).
- Druid Human Form, Druid Bear Form, Druid Wolf Form — three separate tables (Druid's
  three "modes" have different animation frames).
- Column structure isn't uniform across classes — some tables have plain single-value
  FCR/FHR/FBR columns, others split a column into named sub-cases:
  - **Sorceress FCR**: split into "other spells" vs. "Lightning / Chain Lightning" (that
    one skill has a different cast animation).
  - **Amazon FBR**: split into "1H swinging weapon" vs. "Other weapons".
  - **Druid Human Form FHR**: split into "1H swinging weapon" vs. "Other weapons".
  - **Paladin FCR**: split into "other spells" vs. "Fist of the Heavens".
  - **Paladin FHR**: split into "Spears and staves" vs. "Other weapons".
  - **Paladin FBR**: split into "Normal" vs. "Holy Shield".
  - All other tables (Assassin, Barbarian, Necromancer/Warlock, Necromancer Vampire
    Form, Druid Bear Form, Druid Wolf Form) have single-value FCR/FHR/FBR columns with
    no sub-split.
- Not every frame row has a value in every column — a blank cell means that frame count
  isn't a valid breakpoint for that stat (e.g. Sorceress frame 3 only has an FBR value,
  no FCR or FHR value at that frame count). This must be preserved exactly, not filled
  in or interpolated.

## Design

- A single hand-authored static TypeScript data file, `src/lib/grail/fcrFhrFbr.ts`,
  containing all 10 class/form tables transcribed from d2r.world. Source cited in a
  code comment, matching the Alvl85 Areas and Level Up precedent.
- Data shape accommodates the variable sub-column structure per table without forcing
  a one-size-fits-all shape:
  ```ts
  export type StatColumn = { label: string; rows: Record<number, string> }[];
  // rows: frame count -> percentage string (e.g. "200%"), or omitted if no breakpoint
  // at that frame for this column. A column with only one entry (no real sub-split)
  // still uses this shape with a single { label: '', rows } — the renderer omits the
  // sub-header when every column for that stat has an empty label.

  export interface FcrFhrFbrTable {
    id: string;           // e.g. 'sorceress', 'druid-human'
    className: string;    // e.g. 'Sorceress', 'Druid Human Form' — display name
    fcr: StatColumn;
    fhr: StatColumn;
    fbr: StatColumn;
  }

  export const FCR_FHR_FBR_TABLES: FcrFhrFbrTable[] = [ ... ];
  ```
- New page `/[locale]/character/fcr-fhr-fbr`: replaces the current `ComingSoonPage`
  placeholder. Renders a tab/accordion selector for the 10 class/forms (matching
  d2r.world's left-hand tab-list UX, adapted to this project's existing list-page
  conventions — a simple `useState`-driven tab selector, following the same pattern as
  the Base Items sub-category tabs component), and below it a table for the selected
  class: Frames column, then FCR/FHR/FBR columns (with sub-column headers only where
  the table has real sub-splits).
- No skill-level filtering or search — this is a flat reference table per class,
  matching d2r.world's own presentation (no interactivity beyond the class selector).

## Non-goals

- Deriving frame-count breakpoints from a formula or from vendored skill/animation
  data — investigated conceptually during this session's brainstorming; the underlying
  animation-length values aren't in a plain JSON field the way other game data is, and
  the user explicitly chose hand-transcription up front for this sub-project (same
  policy basis as Alvl85 Areas).
- Any interactive breakpoint *calculator* (e.g. "enter your current IAS/FCR and see your
  frame count") — d2r.world's page is a static reference table, not a calculator, and
  this project's established pattern for Misc pages is straightforward reference
  content, not a new interactive tool.
- Changes to any other page.

## Testing plan

- Data test: `FCR_FHR_FBR_TABLES` has exactly 10 entries with the expected `id`s;
  spot-check a handful of known values per table (e.g. Sorceress frame 11 Lightning/CL
  FCR = "194%", Paladin frame 1 Holy Shield FBR = "86%", Amazon frame 5 1H swinging
  weapon FBR = "480%") against the transcribed source.
- Component test: the page renders the class selector, switches tables on click, and
  renders sub-column headers only for tables that have them (e.g. Sorceress shows
  "other spells" / "Lightning / Chain Lightning" under FCR; Assassin shows no sub-header
  under FCR).
- Manual + d2r.world spot-check: compare rendered tables for at least half the
  class/forms against d2r.world directly, in both desktop and mobile width, and in all
  three locales (only the class-name/column labels need i18n; the percentage values and
  frame counts are locale-independent).
