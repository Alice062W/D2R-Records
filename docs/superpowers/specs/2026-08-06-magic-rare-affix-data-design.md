# Magic/Rare Affix Data — Step 1 (Authoritative Data) Design Spec

Date: 2026-08-06
Status: Approved by user, ready for implementation

## Goal

Fix the root cause behind the Magic/Rare item pages showing unclear numbers
like "Jagged, Alvl 1, 10–20" with no indication of what the range means, and
lay groundwork for full-site i18n — matching the d2r.world reference site's
clarity, without copying its UI.

**Root-cause finding (verified, not assumed):** the raw `data/magic-affixes.json`
is already correct — full per-affix `label` text exists and is properly
encoded (an earlier "corruption" finding was a false alarm caused by the
terminal's own codepage, not the file). The real problem is two display-layer
bugs: `src/lib/grail/affixCatalog.ts`'s `getAffixesForCategory()` only reads
`a.stats[0]`, silently dropping every stat past the first (and the `label`
field itself) for multi-stat affixes; `AffixTable.tsx` then only ever renders
the bare `{min}–{max}` numbers, never a label. This spec covers only the data
side (fixing the transform/UI layer is a separate, later step).

## Scope (per user confirmation)

1. **All languages** (14, matching the quests-page precedent) instead of the
   current en/zh-TW/zh-CN-only site file, for future full-site i18n.
2. **`group` field** (mutual-exclusivity — affixes sharing a non-zero group
   id can never both roll on the same item) — present in the raw vendor data
   (`vendor/d2data/json/magicprefix.json`/`magicsuffix.json`, confirmed via
   direct inspection) but not currently captured.
3. **Real formatted stat templates** instead of bare labels — e.g.
   `"%+d Defense"` (with the placeholder substituted at render time in a
   later step), sourced from the game's own localization data, in every
   language — not the generator's current hardcoded, English/zh-TW-only
   `PROP_LABELS_EN`/`PROP_LABELS_ZH_TW` dicts.

## Data sources (verified by direct inspection — cite these, don't re-derive)

- `vendor/d2data/json/magicprefix.json` / `magicsuffix.json` — existing
  vendor source already used by `scripts/generate-grail-data.mjs`. Has a
  `group` field (confirmed present) alongside the fields the generator
  already reads (`Name`, `level`, `levelreq`, `rare`, `mod{n}code/param/min/max`,
  `itype{n}`, `class`, `frequency`).
- `C:\d2r-hd-all\...\local\lng\strings\item-nameaffixes.json` — prefix/suffix
  **names**, all 14 languages, keyed by `Key` == the exact `Name` string from
  magicprefix/suffix (same shape/convention as `quests.json`'s string table,
  verified: `Key: "Low Quality"` entry has `zhTW: "劣等的"`, etc.).
- `C:\d2r-hd-all\...\global\excel\properties.txt` — maps a property `code`
  (e.g. `"ac"`) to its underlying itemstatcost.txt `Stat` name(s) via
  `stat1`..`stat7` (usually just `stat1` for magic/rare affix stats).
- `C:\d2r-hd-all\...\global\excel\itemstatcost.txt` — maps a `Stat` name to
  a `descfunc` (formatting-shape id) and `descstrpos`/`descstrneg`/`descstr2`
  string keys.
- `C:\d2r-hd-all\...\local\lng\strings\item-modifiers.json` — the actual
  **formatted template text** for each `descstrpos`/`descstrneg`/`descstr2`
  key, all 14 languages, with the real numeric placeholder baked in
  (verified: `Key: "ModStr1i"` → `enUS: "%+d Defense"`, `zhTW: "%+d 防禦"`,
  `zhCN: "%+d 防御"`, ... all 14 present).
- A few stat codes (`dmg-max`/`dmg-min` etc.) map directly to an
  itemstatcost.txt `Stat` name without going through properties.txt at all
  (verified: `maxdamage`/`mindamage` rows exist directly, both `descfunc: 19`,
  `descstrpos: ModStr1f`/`ModStr1g`) — the generator's existing `CODE_ALIASES`
  map already encodes which raw affix-mod-code needs which resolution path;
  reuse it rather than rebuiding that mapping.

## `descfunc` coverage (verified against the actual 120 active stat codes used across all frequency>0 magic/rare affixes)

- **`descfunc 19`** (a simple single-placeholder template, e.g. `"%+d Defense"`,
  `"%d%% Resist All"`) — the large majority (58 of 72 non-skill-ref codes
  checked, plus `dmg-max`/`dmg-min` and others resolved via the direct-stat
  path). Handle generically: substitute the min–max range into the template's
  placeholder.
- **`descfunc 11`, `13`** (`rep-dur`, `bar`/`dru` class-skill bonuses) — same
  simple single-placeholder shape, verified by inspection. Handle the same
  way as 19.
- **`descfunc 14`, `15`, `24`** (`skilltab`, `att-skill`/`hit-skill`/
  `gethit-skill`, `charged`) — compound, skill-name-referencing templates
  (e.g. "5% Chance to cast level 10 Frost Nova when struck"). These already
  have dedicated handling in the generator (`localizedLabelWithSkill`,
  `SKILL_REF_PROPS`) for English/zh-TW — **out of scope for this step** to
  extend to all 14 languages (real but genuinely more complex work — the
  skill name itself needs per-language resolution too); keep existing
  behavior, don't regress it.
- **Empty/no descfunc** (`cold-len`, `sock`) — verified these stats
  genuinely have no standalone description text in the source game data at
  all (`cold-len` is folded into its paired cold-damage stat's own text in
  actual game display; `sock` — socket count — is shown via the item's
  physical socket graphics, never as a text line). Not a bug — fall back to
  the existing bare simple label for these two only.

## Output shape

Two files, mirroring the quests-page precedent:

- **Extract folder** (all 14 languages):
  `C:\d2r-extract\hd-png\data\magic-affixes-full.json`
- **Site-facing** (existing file, regenerated in place, still en/zh-TW/zh-CN
  only — no site code changes needed for step 1, since the current 3-locale
  shape is unchanged, just enriched):
  `D2R-Records/data/magic-affixes.json`

Per-affix shape (site-facing; extract-folder version has all 14 language
keys everywhere `name`/`stats[].label`/`stats[].template` appear):

```jsonc
{
  "id": "prefix-168",
  "name": { "en": "Jagged", "zh-TW": "鋸齒之", "zh-CN": "锯齿之" },
  "kind": "prefix",
  "alvl": 3,
  "group": 0,                    // NEW — 0 means "no exclusivity group"
  "itemTypes": ["grandCharms"],
  "rareEligible": true,
  "stats": [
    {
      "key": "dmg-max",
      "label": { "en": "Maximum Damage", "...": "..." },   // unchanged, existing bare label (kept as fallback)
      "template": { "en": "%+d Maximum Damage", "...": "..." },  // NEW — real game template with placeholder, nullable if no descfunc match (cold-len/sock case)
      "min": 1, "max": 2,
      "isSkillRef": false,
      "signed": true
    }
  ]
}
```

## Verification plan

- Spot-check 3-4 affixes' `template` field against known real in-game
  tooltip text (well-documented, e.g. Jagged should read "+1–2 Maximum
  Damage" once substituted).
- Confirm `group` values are non-zero only where expected (e.g. tiered
  resistance prefixes of the same element sharing one group id).
- Confirm the two `descfunc`-less codes (`cold-len`, `sock`) correctly fall
  back to `template: null` rather than a fabricated guess.
- Run existing `AffixTable.test.tsx`/any affix-catalog tests — must still
  pass unchanged, since step 1 doesn't touch the transform/UI layer.

## Out of scope (this spec)

- Fixing `affixCatalog.ts`'s single-stat truncation or `AffixTable.tsx`'s
  missing label render — that's step 2 (site display), a separate spec.
- Extending `descfunc 14/15/24` skill-referencing templates to all 14
  languages.
- Any UI reorganization/grouping-by-property (also step 2).
