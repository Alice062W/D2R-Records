# Auras Reference Page — Design

## Goal

Add a new page introducing all 20 Paladin auras (icon, in-game visual, name, and a
factual description), plus a new nav tab, using the icon/visual assets the user
extracted from their own game install.

## Background

Confirmed via `vendor/d2data/json/skills.json`: exactly 20 Paladin skills carry the
literal `"aura": 1` flag (the definitive, unambiguous marker — not a guess):

```
Prayer, Resist Fire, Defiance, Resist Cold, Cleansing, Resist Lightning, Vigor,
Meditation, Redemption, Salvation, Might, Blessed Aim, Concentration, Holy Fire,
Holy Freeze, Holy Shock, Sanctuary, Fanaticism, Conviction, Thorns
```

The user has provided both requested asset sets in `MyInput/`, self-extracted from
their own D2R install, one PNG per aura in each (116×116, filenames snake_case
matching each aura's name, e.g. `holy_fire.png`):
- `MyInput/skill_icons/` — the skill-tree icon.
- `MyInput/visuals/` — an in-game screenshot of the aura's active ground effect.

Investigated whether exact per-level numeric effects (e.g. "+40% damage at level 1,
+10%/level after") can be cleanly derived, the same way FCR/FHR/FBR or Set bonuses
were: **they cannot, reliably**. Each aura's effect is computed via an
`aurastatcalc` mini-formula-language field (e.g. `ln34`, `dm34`, `-min(ln34,150)`,
`skill('Prayer'.edns)`) with no consistent structure across auras — some reference
another skill's level, some negate, some clamp, some are multi-stat. This is a
genuinely different, harder data shape than every previous "derive from raw data"
case handled this session (which were always simple min/max/param fields). Per this
project's established "don't guess" policy, exact numeric formulas are **excluded**
rather than approximated. Confirmed d2r.world itself has no equivalent Auras
reference page to defer to either (`https://d2r.world/en-US/info/skills/aura` →
404), so there's no existing source (raw or curated) to derive or transcribe exact
numbers from.

What **is** cleanly available without any formula parsing, straight from
`skills.json`'s plain integer fields:
- `reqlevel` (character level to first use the skill) and `maxlvl` (always 20).
- `Param1`/`Param2` — confirmed via the vendored file's own inline
  `"*Param1 Description"`/`"*Param2 Description"` comment fields (e.g. Might's are
  literally labeled `"Radius baseline"`/`"Radius per level"`) — a real, self-
  documenting field, not a guess. Present for every aura.
- `minmana` (mana cost to activate).

A short factual description of *what* each aura does (e.g. "Increases attack rating
and damage of nearby allies" for Might) is common, undisputed D2 game-mechanics
knowledge with no single canonical source to attribute — hand-authored the same way
this project already hand-authors other purely-descriptive, non-numeric UI copy
(e.g. page subtitles), not treated as "curated data requiring a cited source" the
way numeric tables (Level Up, Alvl85) were, since there's no factual dispute about
what these auras qualitatively do.

## Design

- **Assets**: copy `MyInput/skill_icons/*.png` → `public/skills/icons/`, and
  `MyInput/visuals/*.png` → `public/skills/visuals/`, filenames unchanged (already a
  clean, consistent slug per aura).
- **Data**: new hand-authored static file `src/lib/grail/auras.ts`, one entry per
  aura:
  ```ts
  export interface Aura {
    id: string;          // slug, matches the asset filenames, e.g. 'holy_fire'
    name: string;         // localized via existing i18n message keys, not baked in here
    reqLevel: number;
    radiusBase: number;
    radiusPerLevel: number;
    manaCost: number;
    descriptionKey: string; // i18n message key for the short factual description
  }
  export const AURAS: Aura[] = [ /* 20 entries, reqLevel/radius/mana taken directly
    from skills.json's reqlevel/Param1/Param2/minmana fields */ ];
  ```
  `reqLevel`/`radiusBase`/`radiusPerLevel`/`manaCost` are copied directly from the
  vendored data (verifiable, not invented); `name`/description text go through this
  project's normal i18n message-key system (`messages/en.json` etc.), matching every
  other page's localization pattern rather than hardcoding English in the data file.
- **Page**: new route `/[locale]/character/auras`, following the same
  page/component split as every other reference page this session (e.g. Runes).
- **Component**: `AuraList.tsx` — one card per aura: icon (small, top-left) + visual
  screenshot (larger, alongside) + name + short description + the three clean facts
  (required level, mana cost, radius at level 1 and level 20 computed as
  `radiusBase + radiusPerLevel × 19`).
- **Nav**: add one new entry to `SiteNavDrawer.tsx`'s `MISC_LINKS` (or a new
  small `CHARACTER_LINKS` grouping alongside the existing FCR/FHR/FBR and Level Up
  character-related links — match whichever grouping those two already live under),
  pointing at `character/auras`.

## Non-goals

- Exact numeric per-level effect values (damage %, resist %, attack rating bonus,
  etc.) — the underlying formula language isn't reliably parseable without
  guessing, and no existing source (raw data or a reference site) has them in a
  directly usable form. Documented gap, not a guess.
- Necromancer curses, or any other skill type sometimes colloquially conflated with
  "auras" — the D2 `"aura": 1` flag is exclusively the 20 Paladin skills above; this
  page covers exactly those.
- Any change to existing pages.

## Testing plan

- Data test: `AURAS` has exactly 20 entries; spot-check a couple of known values
  (e.g. Might: `reqLevel: 1`, `radiusBase: 16`, `radiusPerLevel: 2`, `manaCost: 1`)
  against the vendored source directly.
- Asset test: every aura's icon and visual file exists in
  `public/skills/icons/`/`public/skills/visuals/`.
- Component test: renders icon, visual, name, description, and the three facts for a
  sample aura.
- Manual spot-check: the new nav entry appears and links correctly, in all three
  locales.
