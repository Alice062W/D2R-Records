# Grail Tracker — Design Spec

_Personal unique/set item collection tracker for D2R Institute. Single-user (site owner only), synced across devices._

## Purpose

Track which unique and set items in Diablo II: Resurrected have been found, with the specific
rolled values of their variable stats (e.g. a unique with a Str 5-10 range might drop with an
actual roll of 8). Since many players want to keep only the best-rolled copy of an item, but
"best" isn't always obvious when an item has multiple variable stats, this tool keeps every copy
found and lets the owner define which stat matters most per item, rather than guessing with an
automatic composite score.

This is separate from the existing "Keep or Dump" socketed-base appraiser — that feature helps
any visitor decide whether to keep a socketable base; this feature is the site owner's personal
grail checklist for unique/set items.

## Non-goals

- Not for rares or crafted items (no fixed identity, don't fit a checklist model).
- Not a multi-user feature — single account (the site owner), not a public tool.
- Not real-time/live sync — a normal "save and it's there next time you load the page" flow is enough.
- No automatic "which copy is best" scoring across stats — the owner decides priority order per item.

## Data sourcing

- **Catalog data** (item names, base codes, level requirements, variable stat definitions with
  min/max, set partial-bonus tiers): parsed at build time from
  [`blizzhackers/d2data`](https://github.com/blizzhackers/d2data) (MIT), specifically
  `json/uniqueitems.json` (403 spawnable entries) and `json/setitems.json` (140 entries). Same
  pattern already used for `data/runewords.json` / `data/bases.json` via `diablo-tools/d2-runewords`.
- **Icons**: not a blocker for MVP. Grail cards render as name + tier-styled card (no icon) at
  first, matching the pattern already used for tier badges in `AppraiserForm.tsx`. Icon coverage
  (374 distinct base codes needed vs. the 41 currently in `public/items/`) is a fast-follow, not
  part of this spec.
- **Completeness/accuracy check**: after generating `data/uniques.json` / `data/sets.json`, cross-check
  item counts and names against https://d2r.world/en-US as a reference list — comparing counts/names
  for QA, not copying their data or images into the repo.
- Do not scrape or copy data/images from d2r.world or any other fan site into this repo.

## Architecture

- Catalog (`data/uniques.json`, `data/sets.json`) stays static, bundled into the Next.js app at
  build time — no different from how the appraiser's data already works. This keeps GitHub Pages
  hosting unchanged.
- Personal find data lives in **Supabase** (Postgres + Auth), queried directly from the browser.
  The static site becomes a thin client talking to a hosted backend for this one feature; the rest
  of the site (appraiser) is unaffected.
- **Auth**: Supabase Auth, Google OAuth sign-in. Row Level Security policies scope all `finds` rows
  to `auth.uid()` — required because the Supabase anon key is necessarily public in a static site,
  so RLS (not obscurity) is what keeps the collection private.

## Data model

### Static catalog (`data/uniques.json`, `data/sets.json`)

Each entry:
```
{
  "code": "hax",            // base item code
  "name": "The Gnasher",
  "kind": "unique",          // or "set"
  "setName": null,           // set name if kind === "set"
  "levelReq": 5,
  "stats": [
    { "key": "str", "label": "Strength", "min": 8, "max": 8 },
    { "key": "openwounds", "label": "Open Wounds %", "min": 50, "max": 50 },
    { "key": "crush", "label": "Crushing Blow %", "min": 20, "max": 20 },
    { "key": "dmg%", "label": "Enhanced Damage %", "min": 60, "max": 70 }
  ],
  "setBonuses": null,        // partial-set bonus tiers, only for kind === "set"
  "statPriority": ["dmg%", "str", "crush", "openwounds"]  // default: catalog order; owner-editable later
}
```

`statPriority` defaults to the order stats are listed in the source data (typically already
roughly importance-ordered). No reordering UI in this spec — the owner can hand-edit the array
directly (in a config/data file, or a future admin UI) when they want to reprioritize a specific
item.

### Supabase table `finds`

| column | type | notes |
|---|---|---|
| `id` | uuid, pk | |
| `user_id` | uuid | FK to `auth.users`, RLS-scoped |
| `item_code` | text | matches catalog `code` |
| `item_kind` | text | `unique` \| `set` |
| `stat_values` | jsonb | `{ "dmg%": 67, "str": 8, ... }` — one value per variable stat rolled |
| `ethereal` | boolean | |
| `found_act` | text | Act I-V |
| `found_area` | text | dependent on act, from a static D2R zone list |
| `found_at` | date | when it was found in-game |
| `notes` | text | free text, e.g. character name |
| `created_at` | timestamptz | row creation, default `now()` |

One row per **copy** found. Duplicates are never overwritten or discarded — every logged find stays
in the table.

## Workflows

### Grail checklist (default view)

- All catalog items always rendered, grouped by category (weapons / armor / other), with a
  found/total progress counter per category and overall.
  - Category is derived at build time from the base item's slot/type in `d2data`'s
    `items.json`/`itemtypes.json`, and stored as a field on each catalog entry when
    `data/uniques.json`/`data/sets.json` are generated — not a new data source, just an added field.
- Unfound items: grayed out, name only, no stat detail.
- Found items: name plus the value of whichever copy ranks best. "Best" = compare copies using
  `statPriority` lexicographically — highest-priority stat wins; ties broken by the next stat down
  the list; a copy missing a stat value entirely ranks below one that has it.

### Item detail (click into a found item)

- Lists every copy logged for that item: full `stat_values` block, ethereal flag, found date,
  act/area, notes — sorted best-first by the same priority comparator.
- No delete/merge UI required in this spec; copies persist as logged.

### Logging a find

- Search/select the item from the catalog (typeahead over `data/uniques.json` + `sets.json`).
- Form fields: Act (dropdown) → Area (dependent dropdown, static D2R zone list keyed by act),
  Ethereal (toggle), Found date (date picker, defaults to today), Notes (free text), and one
  numeric input per variable stat defined on that item (bounded by its min/max as a hint, not a
  hard client-side clamp — in case of edge-case rolls like charm-affected drops).
- Submits as a new `finds` row via the Supabase client. No overwrite logic — this is always an
  insert, never an update to an existing row.

## Auth & security

- Google OAuth via Supabase Auth. Only the site owner's Google account should be able to write;
  RLS policies restrict `select`/`insert`/`update`/`delete` on `finds` to rows where
  `user_id = auth.uid()`.
- No public read access to `finds` — this is not a public leaderboard/showcase feature.
- Supabase URL + anon key are public (standard for static-site + Supabase setups); RLS is the
  actual security boundary, not key secrecy.

## Testing

- Unit test the priority-based "best copy" comparator: given a catalog item's `statPriority` and a
  list of candidate copies (varying which stats are present/better), assert it picks the right one,
  including tie-break-to-next-stat and missing-stat-ranks-lowest cases. Same spirit as the existing
  `appraise.test.ts`.
- Everything else (grail grid rendering, find-logging form, Supabase read/write, Google sign-in
  flow) verified manually in-browser, consistent with how the appraiser UI was verified.

## Open questions / deferred

- Icon coverage beyond the current 41 base sprites — deferred, not blocking.
- A UI for reordering `statPriority` per item — deferred; hand-edit the data for now.
- Category grouping taxonomy for the grail grid — to be derived from `d2data`'s item type fields
  during implementation; exact grouping isn't fixed by this spec beyond "weapons / armor / other."
