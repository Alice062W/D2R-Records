# Grail Item Reference (d2r.world-style stat sheets) — Design Spec

_Follow-up to the 2026-07-13 grail tracker. Makes every catalog item browsable as a full stat
reference — found or not — so a fresh drop can be compared against its possible rolls to decide
keep/dump. Presentation modeled on d2r.world's conventions; data stays sourced from the vendored
`blizzhackers/d2data` (MIT), never copied from d2r.world._

## Problem

The shipped grail checklist only makes *found* items clickable, and the detail view exists to show
logged copies. But the owner's primary in-game workflow is the reverse: an item just dropped, and
they need to see its **possible stat ranges** (e.g. Str 5–10) to judge the roll — before/without
logging anything. Today unfound cards are dead ends, and the grid's three broad categories
(Weapons/Armor/Other) make locating 1 item among 538 slow.

## Goals

1. Every item card opens a full stat sheet, found or not.
2. Stat sheet presentation follows d2r.world / in-game conventions (see Layout).
3. Grid regrouped into d2r.world-style slot categories with per-slot progress.
4. Item icons on cards and detail views (community game-sprite extracts; graceful fallback).
5. Logged copies render *against* the ranges, making roll comparison immediate.

## Non-goals

- No scraping/copying of d2r.world's database, text, or site assets (unchanged standing rule;
  d2r.world remains a visual reference and completeness checklist only).
- No changes to the finds data model, Supabase schema, auth, or the log-find flow's fields and
  submission. (The log-find form's item-picker `optgroup`s do switch from the removed `category`
  to `slotCategory` — a mechanical consequence, not a workflow change.)
- No zh-TW/zh-CN translation of new strings (same deferred-translation rule as the base feature).
  All new user-facing strings (slot category names, stat-sheet block headings, etc.) still get
  `Grail` namespace keys in all three message files, English text duplicated — same global
  constraint as before. The now-obsolete `categoryWeapons`/`categoryArmor`/`categoryOther` keys
  are removed along with the `category` field.

## Data: catalog enrichment

Regenerate `data/uniques.json` / `data/sets.json` (same generator, same vendored source, already
pinned). New fields per item, all derived from `vendor/d2data/json/items.json` +
`itemtypes.json` — verified derivable with zero missing base codes:

| Field | Source / derivation |
|---|---|
| `baseName` | `items[code].name` (e.g. "Grim Helm") |
| `grade` | compare `code` against the base's `normcode`/`ubercode`/`ultracode` → `normal` \| `exceptional` \| `elite` |
| `slotCategory` | `items[code].type` mapped through an explicit type→slot table (39 distinct type codes in use) |
| `defense` | `{ min: minac, max: maxac }` or `null` (weapons/jewelry) |
| `requiredStrength` | `items[code].reqstr` or `null` |
| `durability` | `items[code].durability` or `null` |
| `invFile` | unique entry's own `invfile` if present (unique art), else base's `invfile` — icon lookup key |

Slot categories (d2r.world's grouping): `helms` (helm, circ, phlm, pelt), `armors` (tors),
`shields` (shie, ashd, head), `belts`, `boots`, `gloves`, `rings`, `amulets`, `charms`
(scha/mcha/lcha), `jewels`, `swords`, `daggers` (knif), `axes`, `polearms`, `spears` (spea/aspe),
`clubs`, `maces`, `hammers`, `scepters`, `staves`, `orbs`, `wands`, `katars` (h2h2 and kin),
`bows` (bow/abow), `crossbows`, `javelins` (jave/ajav), `throwings` (taxe/tkni), `katars` maps
the observed `h2h2` code. The generator
maps every one of the 39 observed type codes explicitly and **fails loudly** on an unmapped type
(no silent `other` bucket); the regression test asserts every item has a valid slot category.
The existing `category` field (weapons/armor/other) is superseded and removed; all UI moves to
`slotCategory`.

## Layout

### Grid
- Sections per slot category, d2r.world's order (armor slots → jewelry → weapons), each with a
  `found/total` count. Items within a section ordered normal → exceptional → elite, then by
  required level.
- A sticky quick-jump bar (slot names) at the top — 20+ sections is too much blind scrolling.
- Cards: icon (when available), item name (gold for unique / green for set, both per in-game
  convention), base name in small muted text. Found cards keep their copies/best-roll line;
  unfound cards are dimmed but **enabled**.

### Item detail (opened from any card)
1. **Header**: icon, item name (gold/green), base name + grade, set name if applicable.
2. **Item Stats block** (only rows that apply): Defense (min–max), Required Level, Required
   Strength, Durability.
3. **Magic Properties block**: every stat one line, blue text (in-game convention). Variable
   rolls render as ranges — `+30–40% Faster Run/Walk`; fixed stats as single values. Set items
   additionally list partial-set bonuses (data already in `setBonuses`).
4. **Your copies** (only if finds exist): each copy's rolled value shown beside the possible
   range for that stat (e.g. `37 (30–40)`), best copy first via the existing priority comparator.
   Ethereal/date/location/notes unchanged from current detail view.

## Icons

- Source: community game-sprite extracts (PNGs converted from the game's own files via
  open-source tools such as dc6→png converters). **Honest standing**: item art is Blizzard IP;
  hosting extracts is universal tolerated practice among D2 fan sites (and this repo's existing
  41 icons are already exactly this), but it is *not* open-licensed like the stats data. A note
  to this effect goes in the icon directory's README. Owner accepted this basis 2026-07-13.
- Files land in `public/items/` named by `invFile` key (e.g. `invhaxu.png`), alongside/replacing
  the 41 legacy code-named files once superseded.
- Coverage is incremental: card + detail render a bordered placeholder (item-name initial) when
  the icon file is missing, so partial coverage never breaks layout.
- Completeness target: unique-art files for uniques (`uniqueinvfile`) + base art fallback.

## QA / verification

- Regenerated catalog: existing count/id/stat-shape tests extended to assert `grade`,
  `slotCategory`, `baseName` present and valid on all 538 items.
- Spot-check ≥10 items across slots against d2r.world (stat lines, ranges, grade, base name) —
  comparison for accuracy only.
- Manual: grid navigation via jump bar, unfound-card detail, found-card roll-vs-range display,
  all three locales build.

## Open questions / deferred

- Exact icon source repo — to be selected during implementation (first task researches and pins
  one; if no workable source is found, feature ships icon-less with placeholders and icons stay
  a follow-up).
- Search/filter box for the grid — likely wanted at 538 items but out of scope here; the jump
  bar covers navigation for now.
