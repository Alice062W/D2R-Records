# Level Up Page — Design

## Goal

Build the Level Up Misc page (currently an unbuilt "Coming Soon" placeholder): a small
guide showing which character-level range gains maximum experience in which
Act/difficulty, matching d2r.world's
`https://d2r.world/en-US/info/character/levelup` content.

## Background

Unlike Area Level (purely derivable from vendored `levels.json`), this page is a
**curated leveling guide** — community-derived "where to farm at level X" advice, not a
direct export of a single raw game-data table. No equivalent MIT-licensed raw-data
source exists for this specific "recommended range" framing. Per this project's
established policy (already applied to rune drop rates and, informally, elsewhere):
deterministic, factual numeric data with no better raw source may be hand-transcribed
from d2r.world with the source cited in code, when computing it from first principles is
out of scope.

Confirmed content (14 rows, from d2r.world directly):

| clvl | Difficulty | Act |
|---|---|---|
| 1-11 | Normal | Act 1 |
| 12-18 | Normal | Act 2 |
| 19-23 | Normal | Act 3 |
| 24-31 | Normal | Act 4 |
| 32-36 | Normal | Act 5 |
| 37-43 | Nightmare | Act 1 |
| 44-48 | Nightmare | Act 2 |
| 49-52 | Nightmare | Act 3 |
| 53-62 | Nightmare | Act 4 |
| 63-73 | Hell | Act 1 |
| 74-80 | Hell | Act 2 |
| 81-83 | Hell | Act 3 |
| 83-94 | Hell | Act 4 |
| 95-99 | Hell | Act 5 |

(Note: d2r.world's own table has no separate Nightmare Act 5 row — a d2r.world comment
thread flags this as intentional, since Nightmare Act 4/5 experience gains were merged in
their data. This project's page should match d2r.world's actual table as-is, not "fix"
this apparent gap — it isn't an error in our transcription, it's d2r.world's own
documented content.)

## Design

- Hand-author a small static data file, `src/lib/grail/levelUpGuide.ts`, exporting an
  array of `{ clvlMin: number; clvlMax: number; difficulty: 'normal' | 'nightmare' |
  'hell'; act: number }` (14 entries, source cited in a code comment). This does NOT go
  through `scripts/generate-grail-data.mjs` (no vendored raw-data source to parse from —
  consistent with how this project already distinguishes generator-derived data from
  hand-curated exceptions).
- New page `/[locale]/character/level-up`: replaces the current `ComingSoonPage`
  placeholder, rendering a simple table (clvl range / Difficulty / Act), reusing the
  already-existing `Items.areaLevelNormalLabel`/`areaLevelNightmareLabel`/
  `areaLevelHellLabel` and `Items.areaLevelAct1`-`Act5` i18n keys from the Area Level
  page (same concepts, no need for new duplicate keys).

## Non-goals

- The other 2 remaining Misc pages (Alvl85 Areas, FCR/FHR/FBR) — separate follow-ups.
- Any change to the Area Level page/data (this page reuses its i18n keys, nothing else).

## Testing plan

- Data test: the static guide array has exactly 14 entries, correctly ordered, with the
  content matching the table above exactly (verified against d2r.world directly, not
  re-derived).
- Component test: the page renders all 14 rows with correct clvl range/difficulty/act
  labels.
- Manual + d2r.world spot-check: the built page matches d2r.world's table exactly in all
  3 locales.
