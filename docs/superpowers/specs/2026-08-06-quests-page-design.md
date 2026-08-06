# Quests Page — Design Spec

Date: 2026-08-06
Status: Approved by user, ready for implementation planning

## Goal

Add a new "Quests" tab under D2R Academy, similar in spirit to
https://diablo2.io/quests/#filter=, showing all Diablo II quests grouped by
Act with images and details, and an indicator for optional vs. required
quests. Reference layout: a mobile companion-app screenshot supplied by the
user (`MyInput/IMG_9856.PNG`) — Act tabs (I–V) → grid of ornate square quest
icons → tap to select → quest name banner → journal objective lines → a
visually distinct gold-headed "Rewards" block.

Also produce `quests.json` in the extracted-data folder with **all
languages**, to support future full-site localization of this page (matches
the site's existing i18n pattern used by cube-recipes/terms).

## Data pipeline

### Source data (authoritative — verify against these, not guesses)

- `C:\d2r-hd-all\data\data\data\local\lng\strings\quests.json` — quest
  names + full journal/log text, keyed by `Key` (e.g. `qstsa1q0`), all 14
  languages (enUS, zhTW, zhCN, deDE, esES, esMX, frFR, itIT, jaJP, koKR,
  plPL, ptBR, ruRU, + `id`).
- `C:\d2r-hd-all\data\data\data\global\ui\menu\questicons.dc6` — classic
  quest-log icon sprite sheet, one ornate square icon per quest, in-game
  reading order per Act. This is the authoritative per-quest icon and
  matches the reference screenshot exactly.
- Reward image per quest: existing HD PNG already mirrored into the repo
  (`item_database.json` for item rewards like Khalim's Will, or the skill
  icon set for skill-point/stat-point rewards), no new extraction needed.
- **Optional-quest flag**: not present in raw game data — curated by
  Claude from well-established, cross-checkable D2 community knowledge
  (e.g. Den of Evil, Tools of the Trade, The Forgotten Tower, Siege on
  Harrogath are optional; all other quests are required to progress the
  Act). Verified per-quest against public D2 references during
  implementation, not assumed.

### New tooling: DC6 sprite-sheet decoder

`questicons.dc6` has no existing decoder in this pipeline (existing code
only checks `.dc6` file *existence* for classic item icons, doesn't parse
frames). Implementation needs a small standalone DC6 parser (documented
classic Blizzard format: header + per-direction/per-frame offset table +
RLE-encoded indexed-color frame data + palette) to slice the sheet into
one PNG per quest icon. This is genuinely new code, not a reuse of
existing pipeline utilities — scope it as its own script,
e.g. `pipeline/extract_questicons.py`, with the palette sourced from the
game's standard palette (same one used for other classic `.dc6` assets in
this pipeline, if already known/available; otherwise the default D2 Act
palette).

### Output: `quests.json`

Location: `C:\d2r-extract\hd-png\data\quests.json` (mirrors the existing
`data/` subfolder convention), plus the site-facing copy that
`CubeRecipeList.tsx`-style components consume, at
`D2R-Records/data/quests.json`.

Shape (per quest):

```jsonc
{
  "id": 923,
  "key": "qstsa2q1",
  "act": 2,
  "order": 1,               // in-act display order, matches icon grid order
  "optional": false,
  "icon": "quests/icons/qstsa2q1.png",       // sliced from questicons.dc6
  "rewardImage": "items/hd/tomeof...png",     // or skill icon path; nullable
  "name": { "en": "Radament's Lair", "zh-TW": "羅達門特的巢穴", "...": "..." },
  "objectives": [
    { "en": "Find Radament's Lair in the Lut Gholein sewers.", "...": "..." },
    { "en": "Kill Radament.", "...": "..." },
    { "en": "Return to Atma for a reward.", "...": "..." }
  ],
  "reward": { "en": "Permanent +1 to a skill of your choice. ...", "...": "..." }
}
```

`objectives` vs `reward` split: the raw journal string bundles a trailing
reward-announcement line (identifiable by pattern — the line(s) following
"return to X for a reward" / equivalent per-language phrasing, or a
same-language heuristic per locale) into the same block the game shows;
split it out during data-build so the reward gets its own field. Language
keys use the site's existing convention (`en`, `zh-TW`, `zh-CN`, etc. — not
the raw `enUS`/`zhTW` game keys) for consistency with `cube-recipes.json`.

## Site page

- **Route**: new top-level Academy section, `src/app/[locale]/quests/page.tsx`.
- **Component**: `src/components/quests/QuestList.tsx`, following the
  established pattern from `CubeRecipeList.tsx` (data-driven, per-locale
  text lookup, same card/section conventions).
- **Layout** (mirrors reference screenshot, mobile-first, responsive up to
  desktop):
  1. Act tab bar (I–V) — selects/filters the active Act.
  2. Icon grid for the selected Act — one ornate square quest icon per
     quest, in-game order; each optional quest gets a small badge/marker
     on its icon (dot, ribbon, or corner label — implementation detail,
     consistent with the site's existing badge/pill styling elsewhere).
     Tapping/clicking an icon selects that quest.
  3. Selected-quest detail panel below the grid: quest name banner, then
     objective lines as a bullet list (`–` prefix, matching the
     reference), then a visually distinct **Rewards** block (gold-toned
     header label + colored body text) showing the reward text and
     `rewardImage` if present.
  4. On desktop/wide viewports, grid can expand to more columns and/or
     show grid + detail panel side-by-side rather than stacked — final
     breakpoint behavior follows existing site responsive conventions
     (same media-query approach as other Academy list pages).
- **Nav integration**: add `quests` entry to `navGroups.ts` under the
  Academy group with a curated `image` (representative quest icon), plus a
  new homepage card following the same treatment as the other 8 curated
  Academy cards (curated HD image, not emoji, per project convention).

## Testing / verification

- `npx tsc --noEmit` + `npx vitest run`, add `QuestList.test.tsx` covering:
  act filtering, optional badge rendering, reward-block rendering,
  fallback behavior for a quest with no `rewardImage`.
- Manual spot-check: journal text and optional-flag correctness for a
  sample of quests per Act against public D2 reference material.
- Icon extraction sanity check: visually confirm a handful of sliced
  `questicons.dc6` frames match their known in-game quest icon (e.g.
  Radament's Lair, Den of Evil) before wiring the full set into the JSON.

## Out of scope (v1)

- Quest-giver NPC portraits (only reward image + quest icon per quest).
- Per-difficulty (Normal/Nightmare/Hell) reward variation display — reward
  text is shown once per quest; difficulty-specific numeric differences
  (if any) are not modeled separately in v1.
- Editable/interactive quest-progress tracking (this is a reference page,
  not a save-game tracker).
