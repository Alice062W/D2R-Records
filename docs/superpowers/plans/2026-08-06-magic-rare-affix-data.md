# Magic/Rare Affix Data (Step 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich `data/magic-affixes.json` with a `group` (mutual-exclusivity) field and real formatted stat templates (e.g. `"%+d Defense"`), and produce a new all-14-language extract-folder file — without touching the display layer (that's a separate, later step).

**Architecture:** Add 4 new committed vendor JSON snapshots (`properties.json`, `itemstatcost.json`, `item-nameaffixes.json`, `item-modifiers.json`) converted once from the raw D2R game-data files, matching the existing `vendor/d2data/json/` convention already used for `magicprefix.json` etc. Extend `scripts/generate-grail-data.mjs`'s existing magic-affix section (already reads `magicprefix.json`/`magicsuffix.json`) to resolve each stat's `mod{n}code` to a formatted template via `properties.txt`(code→stat1) → `itemstatcost.txt`(Stat→descstrpos) → `item-modifiers.json`(key→localized template), with an explicit fallback list for codes that don't resolve through that chain.

**Tech Stack:** Python 3 (one-off vendor conversion scripts, not committed — same convention as `pipeline/`), Node.js/`.mjs` (the existing generator, already the source of truth for `data/magic-affixes.json`).

---

## Confirmed facts from research (do not re-derive)

- `vendor/d2data/json/magicprefix.json`/`magicsuffix.json` (already in the repo) already have a `group` field per entry (verified: id 168 "Jagged" → `group: 104`). No new source needed for this field — just read it.
- `C:\d2r-hd-all\...\global\excel\properties.txt`: tab-delimited, header row, `code` is column 1, `stat1` is the underlying itemstatcost.txt Stat name (usually just `stat1`, `stat2..stat7` are for rarer compound properties not used by magic/rare affixes).
- `C:\d2r-hd-all\...\global\excel\itemstatcost.txt`: tab-delimited, header row, `Stat` is column 1, `descfunc` (col 39) is the formatting-shape id, `descstrpos`/`descstrneg`/`descstr2` (cols 41-43) are string keys into `item-modifiers.json`.
- `C:\d2r-hd-all\...\local\lng\strings\item-modifiers.json`: JSON array, each entry `{id, Key, enUS, zhTW, deDE, esES, frFR, itIT, koKR, plPL, esMX, jaJP, ptBR, ruRU, zhCN}` — same shape as `quests.json`'s string table. `Key` matches `descstrpos`/`descstrneg`/`descstr2` values (verified: `Key: "ModStr1i"` → `enUS: "%+d Defense"`, all 14 languages present).
- `C:\d2r-hd-all\...\local\lng\strings\item-nameaffixes.json`: same shape, `Key` matches the exact `Name` field from `magicprefix.json`/`magicsuffix.json` (verified: `Key: "Low Quality"` entry exists with all 14 languages).
- **Resolution coverage** (verified against the actual 120 active `mod{n}code` values used by frequency>0 magic/rare affixes): the large majority resolve cleanly via `properties.txt code → stat1 → itemstatcost Stat → descstrpos`. A few codes (`dmg-max`, `dmg-min`, and possibly others discovered during Task 2's dry run) have **no properties.txt row** but resolve directly as an itemstatcost.txt `Stat` name under a *different* string than the raw code (verified: `maxdamage`/`mindamage` rows exist, `descfunc: 19`, `descstrpos: ModStr1f`/`ModStr1g`) — these need a small hand-verified alias map, built empirically in Task 2 (don't guess additional aliases beyond what's verified here; log unresolved codes instead of fabricating).
- Codes `att-skill`/`hit-skill`/`gethit-skill`/`charged`/`skilltab` (descfunc 14/15/24) are compound, skill-name-referencing templates — **out of scope**, `template: null` for these (existing bare `label` still applies, unchanged).
- Codes `cold-len`/`sock` have **no** descfunc/descstrpos at all in the source data (verified) — genuinely no game text exists; `template: null` is correct, not a gap.

---

## Task 1: Vendor the 4 new source files

**Files:**
- Create: `vendor/d2data/json/properties.json`
- Create: `vendor/d2data/json/itemstatcost.json`
- Create: `vendor/d2data/json/item-nameaffixes.json`
- Create: `vendor/d2data/json/item-modifiers.json`

- [ ] **Step 1: Write and run the conversion script**

```python
# One-off conversion script (not committed to the repo, run from
# C:\Users\yanhu\Documents\ClaudeCode\D2RAssets — same convention as
# pipeline/ scripts, matching this project's existing vendor snapshots).
import csv
import json
import os

REPO = r'C:\Users\yanhu\Documents\ClaudeCode\D2RAssets\D2R-Records\vendor\d2data\json'


def txt_to_json_by_first_col(src_path, dst_name):
    with open(src_path, encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        rows = {}
        first_col = reader.fieldnames[0]
        for row in reader:
            key = row.get(first_col)
            if not key:
                continue
            rows[key] = row
    with open(os.path.join(REPO, dst_name), 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    print(f'Wrote {len(rows)} rows to {dst_name}')


def strings_to_json_by_key(src_path, dst_name):
    with open(src_path, encoding='utf-8-sig') as f:
        data = json.load(f)
    rows = {e['Key']: e for e in data if e.get('Key')}
    with open(os.path.join(REPO, dst_name), 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    print(f'Wrote {len(rows)} rows to {dst_name}')


txt_to_json_by_first_col(
    r'C:\d2r-hd-all\data\data\data\global\excel\properties.txt', 'properties.json')
txt_to_json_by_first_col(
    r'C:\d2r-hd-all\data\data\data\global\excel\itemstatcost.txt', 'itemstatcost.json')
strings_to_json_by_key(
    r'C:\d2r-hd-all\data\data\data\local\lng\strings\item-nameaffixes.json', 'item-nameaffixes.json')
strings_to_json_by_key(
    r'C:\d2r-hd-all\data\data\data\local\lng\strings\item-modifiers.json', 'item-modifiers.json')
```

Run it, expect 4 "Wrote N rows" lines with plausible counts (properties.txt ~300+ rows, itemstatcost.txt ~400+ rows, item-nameaffixes.json 1031 rows, item-modifiers.json 371 rows — verified counts from research).

- [ ] **Step 2: Verify shape**

```bash
node -e "
const p = require('./vendor/d2data/json/properties.json');
const s = require('./vendor/d2data/json/itemstatcost.json');
const m = require('./vendor/d2data/json/item-modifiers.json');
console.log('ac ->', p['ac']);
console.log('armorclass ->', s['armorclass']);
console.log('ModStr1i ->', m['ModStr1i']);
"
```
Expected: `p['ac'].stat1 === 'armorclass'`, `s['armorclass'].descstrpos === 'ModStr1i'`, `m['ModStr1i'].enUS === '%+d Defense'`.

- [ ] **Step 3: Commit**

```bash
cd D2R-Records
git add vendor/d2data/json/properties.json vendor/d2data/json/itemstatcost.json vendor/d2data/json/item-nameaffixes.json vendor/d2data/json/item-modifiers.json
git commit -m "Vendor properties/itemstatcost/item-nameaffixes/item-modifiers JSON

New source snapshots needed to resolve magic/rare affix stat codes to
their real formatted in-game template text (e.g. \"%+d Defense\") in
all 14 languages, matching the existing vendor/d2data/json/ convention.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Extend the generator — resolve stat codes to templates

**Files:**
- Modify: `scripts/generate-grail-data.mjs` (the existing magic-affix section, lines ~3791-3997)

- [ ] **Step 1: Add the new vendor loads, near the existing `magicPrefixData`/`magicSuffixData` loads**

```js
const propertiesData = JSON.parse(readFileSync(join(VENDOR, 'properties.json'), 'utf8'));
const itemStatCostData = JSON.parse(readFileSync(join(VENDOR, 'itemstatcost.json'), 'utf8'));
const itemModifiersData = JSON.parse(readFileSync(join(VENDOR, 'item-modifiers.json'), 'utf8'));
const itemNameAffixesData = JSON.parse(readFileSync(join(VENDOR, 'item-nameaffixes.json'), 'utf8'));

// Game string lang-code -> site lang-code, same mapping as the quests-page
// pipeline (pipeline/build_quests_db_v2.py) for consistency across the codebase.
const AFFIX_LANG_MAP = {
  enUS: 'en', zhTW: 'zh-TW', zhCN: 'zh-CN', deDE: 'de', esES: 'es', esMX: 'es-MX',
  frFR: 'fr', itIT: 'it', jaJP: 'ja', koKR: 'ko', plPL: 'pl', ptBR: 'pt', ruRU: 'ru',
};

function localizedAll(entry) {
  const out = {};
  for (const [gameLang, siteLang] of Object.entries(AFFIX_LANG_MAP)) {
    if (entry[gameLang] !== undefined) out[siteLang] = entry[gameLang];
  }
  return out;
}

// A handful of magicprefix.json/magicsuffix.json mod{n}code values have no
// properties.txt row at all, but resolve directly as an itemstatcost.json
// Stat name under a different string -- verified by direct inspection (see
// plan doc's "Confirmed facts" section). Do NOT add entries here without the
// same verification (check both properties.json and itemstatcost.json
// directly) -- this project's established convention is to surface an
// unresolved code (template: null) rather than guess.
const STAT_CODE_DIRECT_ALIASES = {
  'dmg-max': 'maxdamage',
  'dmg-min': 'mindamage',
};

// Resolves a raw affix mod{n}code (e.g. "ac", "dmg-max") to its formatted,
// all-language template text (e.g. { en: "%+d Defense", ... }), or null if
// it doesn't resolve through the properties.txt -> itemstatcost.json ->
// item-modifiers.json chain (compound skill-referencing codes, or codes
// with genuinely no standalone description text -- see plan doc).
const UNRESOLVED_TEMPLATE_CODES = new Set();

function templateFor(code) {
  let statName = null;
  const prop = propertiesData[code];
  if (prop && prop.stat1) {
    statName = prop.stat1;
  } else if (STAT_CODE_DIRECT_ALIASES[code]) {
    statName = STAT_CODE_DIRECT_ALIASES[code];
  }
  if (!statName) {
    UNRESOLVED_TEMPLATE_CODES.add(code);
    return null;
  }
  const stat = itemStatCostData[statName];
  const descKey = stat?.descstrpos;
  if (!descKey) {
    UNRESOLVED_TEMPLATE_CODES.add(code);
    return null;
  }
  const modifierEntry = itemModifiersData[descKey];
  if (!modifierEntry) {
    UNRESOLVED_TEMPLATE_CODES.add(code);
    return null;
  }
  return localizedAll(modifierEntry);
}
```

- [ ] **Step 2: Hook `templateFor` and `group` into `extractMagicAffixStats`/`magicAffixesFrom`**

In `extractMagicAffixStats` (existing function, ~line 3894), add a `template` field alongside the existing `label` for both the `variable` and `fixed` push calls:

```js
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
    const template = isSkillRef ? null : templateFor(code);
```

(skip template resolution entirely for skill-ref codes — already established as out of scope), then add `template` to both `variable.push(...)` and `fixed.push(...)` call sites, matching the existing object shape (`{ key, label, template, min, max, isSkillRef, signed }` / `{ key, label, template, value, isSkillRef, signed }`).

In `magicAffixesFrom` (existing function, ~line 3969), add `group` to the returned object, pass `template` through the final stats mapping, and add an internal-only `nameFull` field (all-14-language name, sourced from `item-nameaffixes.json` by the raw English name) that Task 2 Step 3 will consume and then strip before the site-facing write:

```js
      const rawName = v.Name ?? `Unnamed Affix ${id}`;
      const nameAffixEntry = itemNameAffixesData[rawName];
      return {
        id: `${kind}-${id}`,
        name: localizedItemName(rawName),
        nameFull: nameAffixEntry ? localizedAll(nameAffixEntry) : null,
        kind,
        alvl: v.level ?? v.levelreq ?? 0,
        group: v.group ?? 0,
        itemTypes: itemTypesForAffix(v),
        rareEligible: v.rare === 1,
        stats: [
          ...variable,
          ...fixed.map(f => ({ key: f.key, label: f.label, template: f.template, min: f.value, max: f.value, isSkillRef: f.isSkillRef })),
        ],
      };
```

- [ ] **Step 3: Write the all-language extract-folder output, alongside the existing site-facing write**

Replace the existing `const magicAffixesOut = [...magicAffixesFrom(...), ...magicAffixesFrom(...)];` + its single `writeFileSync` with this full sequence — one raw array (still carrying `nameFull`), derive both outputs from it, write both:

```js
const magicAffixesRaw = [
  ...magicAffixesFrom(magicPrefixData, 'prefix'),
  ...magicAffixesFrom(magicSuffixData, 'suffix'),
];

// Site-facing (unchanged 3-locale shape, matching this file's current consumers) --
// strip the internal-only nameFull field.
const magicAffixesOut = magicAffixesRaw.map(({ nameFull, ...a }) => a);
writeFileSync(join(OUT, 'magic-affixes.json'), JSON.stringify(magicAffixesOut, null, 2));
console.log(`Wrote ${magicAffixesOut.length} magic/rare affixes -> data/magic-affixes.json`);

// All-language extract-folder sibling -- same fields, but `name` becomes the
// full 14-language nameFull (falling back to the 3-locale name if this
// particular affix's Name had no item-nameaffixes.json entry).
const magicAffixesFullOut = magicAffixesRaw.map(({ nameFull, ...a }) => ({
  ...a,
  name: nameFull ?? a.name,
}));
writeFileSync(
  'C:\\d2r-extract\\hd-png\\data\\magic-affixes-full.json',
  JSON.stringify(magicAffixesFullOut, null, 2)
);
console.log(`Wrote ${magicAffixesFullOut.length} magic/rare affixes (all languages) -> C:\\d2r-extract\\hd-png\\data\\magic-affixes-full.json`);
```

- [ ] **Step 4: Run it and inspect the unresolved-code report**

Run: `node scripts/generate-grail-data.mjs` (from `D2R-Records`)
Expected: no crash, plausible "Wrote N magic/rare affixes" lines (both files).

Add a one-line diagnostic right after the magic-affix section (temporary, for this task only — remove or keep behind a comment once verified, matching the file's existing practice of leaving verification notes in comments rather than a runtime side-channel):

```js
console.log('Unresolved template codes:', Array.from(UNRESOLVED_TEMPLATE_CODES).sort());
```

Inspect the printed list. For each code NOT already accounted for in this plan's "Confirmed facts" (`cold-len`, `sock`, and the skill-ref codes), investigate individually (check `properties.json`/`itemstatcost.json` directly for that code, same way Task 1 Step 2 did) — either add a verified entry to `STAT_CODE_DIRECT_ALIASES` and re-run, or confirm it's a genuine gap and leave it. Do not add aliases you haven't personally verified against the vendor JSON.

- [ ] **Step 5: Remove the temporary diagnostic line once the unresolved-code list is fully accounted for**

- [ ] **Step 6: Commit**

```bash
cd D2R-Records
git add scripts/generate-grail-data.mjs data/magic-affixes.json
git commit -m "Add group and template fields to magic-affixes.json

Resolves each affix stat's raw mod-code to its real in-game formatted
template text (e.g. \"%+d Defense\") via properties.txt -> itemstatcost
-> item-modifiers.json, and adds the group (mutual-exclusivity) field
already present in the vendored source data but previously unused.
Also writes an all-14-language sibling file to the extract folder for
future full-site i18n, matching the quests-page precedent.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Verification

**Files:** none (verification only)

- [ ] **Step 1: Spot-check Jagged's template**

```bash
node -e "
const data = require('./data/magic-affixes.json');
const jagged = data.find(a => a.id === 'prefix-168');
console.log(JSON.stringify(jagged, null, 2));
"
```
Expected: `group: 104`, `stats[0].template.en` reads something like `"%+d Maximum Damage"` or the resolved template text for `maxdamage`'s `descstrpos`.

- [ ] **Step 2: Confirm group values are plausible**

```bash
node -e "
const data = require('./data/magic-affixes.json');
const nonZero = data.filter(a => a.group && a.group !== 0);
console.log(nonZero.length, 'affixes with a non-zero group, out of', data.length);
"
```
Expected: a meaningful subset (not 0, not all) have non-zero group — sanity check, not an exact number.

- [ ] **Step 3: Confirm the extract-folder file has all 14 languages**

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:\\\\d2r-extract\\\\hd-png\\\\data\\\\magic-affixes-full.json', 'utf8'));
console.log(Object.keys(data[0].name));
"
```
Expected: 13-14 language keys (however many `item-nameaffixes.json` actually has per entry — some entries may have fewer than 14 if a language is missing from source, matching the quests-page precedent's "not `ensure_ascii=False`... whatever's present" policy).

- [ ] **Step 4: Run existing tests, confirm nothing broke**

Run: `npx vitest run` (should still pass everything it did before — this task doesn't touch any component, only the data generator and the data file's shape, which is additive-only, no existing fields removed).
Run: `npx tsc --noEmit`.

- [ ] **Step 5: Final commit if verification turned up fixes**

```bash
cd D2R-Records
git status
# If clean, nothing to do.
```

---

## Out of scope (confirmed in design spec)

- Fixing `affixCatalog.ts`'s single-stat truncation or `AffixTable.tsx`'s missing label render.
- Extending skill-referencing templates (`descfunc` 14/15/24) to all 14 languages.
- Any UI reorganization.
