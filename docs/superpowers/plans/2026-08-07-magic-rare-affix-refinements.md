# Magic/Rare Affix Post-Launch Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 user-reported issues on the Magic/Rare affix pages: dead (`spawnable:0`) affixes shown, 14 untranslated names, double `%%` in percentages, garbled skill-referencing stats, and group headers that break down for multi-property/heterogeneous groups.

**Architecture:** Most fixes live in `scripts/generate-grail-data.mjs` (the data generator) since they're data-correctness issues (wrong filter, wrong name source, missing composed text) — the generator already has hand-verified `chanceToCastEntry`/`chargedEntry` helper functions used by every OTHER item type (uniques/sets/runewords) except magic/rare affixes; this plan wires them in and extends them to full 14-language coverage using already-vendored `item-modifiers.json` templates. The remaining fixes are in `formatAffixTemplate.ts` (the `%%` escape bug) and `affixCatalog.ts` (the group-header algorithm).

**Tech Stack:** Python 3 (one-off vendor conversion, not committed), Node.js/`.mjs` (existing generator), TypeScript/React (existing site), Vitest.

---

## Confirmed facts (don't re-derive — see the design spec for full citations)

- `magicAffixesFrom` filters `frequency > 0` but never checks `spawnable` — 104 of 1256 entries have `spawnable: 0` and must be excluded.
- `item-nameaffixes.json` (already vendored) has complete 14-language coverage for all 14 names `localizedItemName`/`localestrings-chi.json` currently misses.
- `substituteTemplate`'s placeholder tokens (`'%+d%'` etc.) incorrectly consume only half of a `%%` printf-escape sequence, leaving a stray `%` in the output.
- `chanceToCastEntry(code, par, min, max)` (line ~539) and `chargedEntry(code, par, min, max)` (line ~561) already exist, are already hand-verified against d2r.world, and are already used by every extraction path EXCEPT `extractMagicAffixStats` (the magic/rare affix one) — confirmed via `grep`, 8 call sites elsewhere, 0 in the magic-affix function.
- `item-modifiers.json` has the SAME composed templates in all 14 languages (`ItemExpansiveChancX`/`ItemExpansiveChanc1`/`ItemExpansiveChanc2` for att-skill/hit-skill/gethit-skill, `ModStre10d` for charged) — cross-checked, the English/zh-TW text these produce is identical in structure to `chanceToCastEntry`/`chargedEntry`'s hand-typed versions, confirming both are correct.
- **Critical subtlety, verified by direct inspection**: several languages in `item-modifiers.json`'s composed templates use **positional placeholders** (`%0`/`%1`/`%2`/`%3`) with different word order instead of sequential `%d`/`%s` consumption — e.g. `ModStre10d`'s `esES` value is `"%1 de nivel %0 (%2/%3 cargas)"` (level first as `%1`... actually skill name via `%1`, level via `%0` — order differs from English entirely). Confirmed for `es`, `es-MX`, `pl`, `ja`, `pt`, `ru` (varies per template, not a fixed language list) — a substitution function MUST detect and handle both styles per-template, not assume one style for the whole dataset.
- Skill name resolution chain for all 14 languages (verified): affix's `mod{n}param` (skill id, e.g. `49`) → `skills.txt`'s `skilldesc` column (e.g. `"lightning"`) → `skilldesc.txt`'s `str name` column (e.g. `"skillname49"`) → `C:\d2r-hd-all\...\local\lng\strings\skills.json`'s matching `Key` entry (13 languages present, `enUS` counts as the 14th via the same entry).
- Existing `skillNameForLocale`/`localizedSkillName` only cover en/zh-TW/zh-CN (via `localestrings-chi.json` + the vendor `skills.json` table's English `.skill` field) — a NEW all-14-language skill-name source is needed (Task 1).

---

## Task 1: Vendor `skillnames.json`

**Files:**
- Create: `vendor/d2data/json/skillnames.json`

- [ ] **Step 1: Write and run the conversion script**

```python
import json
import os

REPO = r'C:\Users\yanhu\Documents\ClaudeCode\D2RAssets\D2R-Records\vendor\d2data\json'

with open(r'C:\d2r-hd-all\data\data\data\local\lng\strings\skills.json', encoding='utf-8-sig') as f:
    data = json.load(f)
rows = {e['Key']: e for e in data if e.get('Key')}
with open(os.path.join(REPO, 'skillnames.json'), 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)
print(f'Wrote {len(rows)} rows to skillnames.json')
```

Run it. Expected: `Wrote 2328 rows to skillnames.json` (verified count from research).

- [ ] **Step 2: Verify shape**

```bash
node -e "
const s = require('./vendor/d2data/json/skillnames.json');
console.log(s['skillname49']);
"
```
Expected: an object with `enUS: 'Lightning'`, `zhTW: '閃電箭'`, and 11 other language keys.

- [ ] **Step 3: Commit**

```bash
cd D2R-Records
git add vendor/d2data/json/skillnames.json
git commit -m "Vendor skillnames.json for all-language skill-name resolution

Needed to compose full skill-referencing affix sentences (Chance to
Cast X, Level Y Skill charges) in all 14 site languages instead of
just en/zh-TW/zh-CN.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Fix `spawnable` filter and name source

**Files:**
- Modify: `scripts/generate-grail-data.mjs`

- [ ] **Step 1: Fix the spawnable filter**

Find (around line 4065):
```js
    .filter(([, v]) => (v.frequency ?? 0) > 0)
    .filter(([, v]) => !hasMalformedNegativeCharge(v))
```
Replace with:
```js
    .filter(([, v]) => (v.frequency ?? 0) > 0)
    // spawnable:0 means this affix can never actually appear on any item
    // regardless of frequency -- verified: 104 of 1256 frequency>0 entries
    // have spawnable:0 (e.g. "Virulent"/"of Acidity", group 307, both
    // level:92/spawnable:0), confirmed absent from d2r.world's rare item
    // pages, confirming this is dead data, not a filtering mistake.
    .filter(([, v]) => v.spawnable !== 0)
    .filter(([, v]) => !hasMalformedNegativeCharge(v))
```

- [ ] **Step 2: Fix the name source**

Find (around line 4073-4078):
```js
      const rawName = v.Name ?? `Unnamed Affix ${id}`;
      const nameAffixEntry = itemNameAffixesData[rawName];
      return {
        id: `${kind}-${id}`,
        name: localizedItemName(rawName),
        nameFull: nameAffixEntry ? localizedAll(nameAffixEntry) : null,
```
Replace with:
```js
      const rawName = v.Name ?? `Unnamed Affix ${id}`;
      const nameAffixEntry = itemNameAffixesData[rawName];
      // item-nameaffixes.json (vendored for the affix-data work) has more
      // complete coverage than localestrings-chi.json for newer/ladder-era
      // affix names -- verified: 14 names (e.g. "Sullied", "TaintedAffix")
      // that localizedItemName() couldn't translate all resolve correctly
      // here. Fall back to localizedItemName only if this source genuinely
      // has no entry (not expected to trigger given confirmed coverage,
      // but avoids a regression for any name not yet spot-checked).
      const nameFromAffixSource = nameAffixEntry
        ? { en: nameAffixEntry.enUS, 'zh-TW': nameAffixEntry.zhTW, 'zh-CN': nameAffixEntry.zhCN }
        : null;
      return {
        id: `${kind}-${id}`,
        name: nameFromAffixSource ?? localizedItemName(rawName),
        nameFull: nameAffixEntry ? localizedAll(nameAffixEntry) : null,
```

- [ ] **Step 3: Run the generator and verify**

Run: `node scripts/generate-grail-data.mjs` (from `D2R-Records`).

**IMPORTANT**: this generator has a large scope (covers many data files, not just magic-affixes) and, as of a prior session, has a pre-existing unrelated bug in `normalizeRunewordName` that may or may not still be present — check `git log` for a commit titled "Fix normalizeRunewordName crash on object-shaped names" to confirm it's already fixed before running. If the script crashes with `TypeError: name.replace is not a function`, that fix is missing — stop and report BLOCKED rather than working around it again.

After a clean run, the generator will have regenerated MANY files beyond `data/magic-affixes.json` (this is expected — it's one script covering the whole site's data). **Only `data/magic-affixes.json` and the extract-folder `magic-affixes-full.json` are in scope for this plan.** Run `git status` and `git diff --stat` — revert every OTHER changed `data/*.json` file back to its committed version (`git checkout -- data/<file>.json` for each) before committing, same as established precedent from the original affix-data work. Do not investigate or fix unrelated drift in those files — that's explicitly out of scope (see the standing "Investigate large drift" follow-up task already flagged in an earlier session).

Verify:
```bash
node -e "
const data = require('./data/magic-affixes.json');
console.log('total:', data.length);
console.log('Virulent present:', data.some(a => a.name.en === 'Virulent'));
console.log('of Acidity present:', data.some(a => a.name.en === 'of Acidity'));
const sullied = data.find(a => a.name.en === 'Sullied');
console.log('Sullied zh-TW:', sullied?.name['zh-TW']);
"
```
Expected: `total` around 1152 (1256 minus ~104), `Virulent present: false`, `of Acidity present: false`, `Sullied zh-TW: 玷汙`.

- [ ] **Step 4: Commit**

```bash
cd D2R-Records
git add scripts/generate-grail-data.mjs data/magic-affixes.json
git commit -m "Exclude spawnable:0 dead affixes, fix name-source coverage gap

magicAffixesFrom only filtered frequency>0, missing that spawnable:0
means an affix can never actually appear on any item regardless of
frequency (104 of 1256 entries affected, e.g. Virulent/of Acidity --
verified absent from d2r.world). Also switches name lookup to
item-nameaffixes.json, which has complete 14-language coverage for 14
names the older localestrings-chi.json source was missing.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Compose full skill-referencing sentences (all 14 languages)

**Files:**
- Modify: `scripts/generate-grail-data.mjs`

- [ ] **Step 1: Add the all-language skill-name resolver and template substitution helper**

Near the existing vendor loads (around line 3802, after `itemNameAffixesData`), add:

```js
const skillNamesData = JSON.parse(readFileSync(join(VENDOR, 'skillnames.json'), 'utf8'));

// All-14-language skill name resolution, extending skillNameForLocale's
// existing zh-TW-only lookup (localestrings-chi.json) to every language
// via skillnames.json (vendored from local/lng/strings/skills.json).
// Same lowercase/capitalized "skillname{id}"/"Skillname{id}" key split
// already established for zh-TW (ids 0-220 lowercase, 222+ capitalized)
// -- verified this convention is consistent across all languages in the
// source file, not just zh-TW.
function skillNameAllLangs(par) {
  if (!isNumericPar(par)) {
    const fallback = String(par);
    return Object.fromEntries(Object.values(AFFIX_LANG_MAP).map(l => [l, fallback]));
  }
  const entry = skillNamesData[`skillname${par}`] ?? skillNamesData[`Skillname${par}`];
  if (!entry) {
    const fallback = skills[String(par)]?.skill ?? String(par);
    return Object.fromEntries(Object.values(AFFIX_LANG_MAP).map(l => [l, fallback]));
  }
  return localizedAll(entry);
}

// Substitutes positional args into a composed-sentence template, handling
// BOTH placeholder styles found in item-modifiers.json (verified: some
// languages use sequential %d/%s consumed in order, others use explicit
// %0/%1/%2/%3 positional references with different word order -- e.g.
// ModStre10d's esES value "%1 de nivel %0 (%2/%3 cargas)" places the
// skill name (args[1]) before the level (args[0]), unlike English's
// "Level %d %s" order). `args` is always in the SAME fixed order
// regardless of template style (verified: positional indices %N
// consistently refer to the Nth element of the same args array the
// sequential style would consume in order).
function substituteComposedTemplate(template, args) {
  let result;
  if (/%\d/.test(template)) {
    result = template.replace(/%(\d)/g, (_, idx) => String(args[Number(idx)]));
  } else {
    let i = 0;
    result = template.replace(/%d|%s/g, () => String(args[i++]));
  }
  // "%%" is a printf escape for one literal "%" -- collapse it after
  // substitution (same fix as formatAffixTemplate.ts's client-side path,
  // done here at generation time since these sentences are composed once,
  // not re-rendered from a stored template).
  return result.replace(/%%/g, '%');
}

// The 4 skill-referencing codes that actually occur among currently
// spawnable magic/rare affixes (verified: 'skill'/'oskill'/'death-skill'/
// 'levelup-skill'/'aura'/'kill-skill' -- the other SKILL_REF_PROPS codes
// -- have zero occurrences, so are intentionally not handled here).
// Each maps to its item-modifiers.json descstrpos key (found via
// properties.txt -> itemstatcost.json, same chain templateFor() uses) and
// the fixed arg order verified against real affix rows.
const COMPOSED_SKILL_TEMPLATES = {
  'att-skill': { descKey: 'ItemExpansiveChancX', args: (min, max, skill) => [min, max, skill] },
  'hit-skill': { descKey: 'ItemExpansiveChanc1', args: (min, max, skill) => [min, max, skill] },
  'gethit-skill': { descKey: 'ItemExpansiveChanc2', args: (min, max, skill) => [min, max, skill] },
  // charged: min=charges, max=level (verified: suffix-438 "of Lightning"
  // min:50/max:1 -> "Level 1 Lightning (50/50 Charges)" is the sane
  // reading; the reverse, "Level 50, 1 charge," would be absurdly
  // overpowered and contradicts typical D2 charged-item design).
  charged: { descKey: 'ModStre10d', args: (min, max, skill) => [max, skill, min, min] },
};

// Produces a fully-composed, all-14-language sentence for the 4 codes
// above (e.g. "5% Chance to cast level 3 Chain Lightning on attack"),
// or null for any other code. Composed once at generation time (unlike
// the simple %+d-style templates, which stay as templates substituted at
// render time) since these have 3+ independent values, not a min/max
// range, and per-language word-order/placeholder-style differences are
// easier to resolve once here than to re-derive in the browser.
function composedSkillRefText(code, par, min, max) {
  const spec = COMPOSED_SKILL_TEMPLATES[code];
  if (!spec || min === undefined || max === undefined) return null;
  const modifierEntry = itemModifiersData[spec.descKey];
  if (!modifierEntry) return null;
  const skillNames = skillNameAllLangs(par);
  const out = {};
  for (const [gameLang, siteLang] of Object.entries(AFFIX_LANG_MAP)) {
    const template = modifierEntry[gameLang];
    if (!template) continue;
    out[siteLang] = substituteComposedTemplate(template, spec.args(min, max, skillNames[siteLang]));
  }
  return out;
}
```

- [ ] **Step 2: Wire it into `extractMagicAffixStats`**

Find (the loop body in `extractMagicAffixStats`, around line 3990-3997):
```js
  for (let n = 1; n <= 3; n++) {
    const rawCode = entry[`mod${n}code`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`mod${n}param`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
    const template = isSkillRef ? null : templateFor(code);
```
Replace with:
```js
  for (let n = 1; n <= 3; n++) {
    const rawCode = entry[`mod${n}code`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`mod${n}param`];
    const min = entry[`mod${n}min`];
    const max = entry[`mod${n}max`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const composedText = isSkillRef ? composedSkillRefText(code, par, min, max) : null;
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
    const template = isSkillRef ? null : templateFor(code);
```

(Note: `min`/`max` are now declared earlier in the loop body than before — find their OLD declaration further down, around what's now line ~4002-4003 in the original, `const min = entry[...]` / `const max = entry[...]`, and DELETE that now-duplicate pair of lines, since they're declared above. Keep everything else in the loop unchanged.)

Now add `composedText` to all 4 `push` call sites in this function (the same 4 sites Task 2 of the ORIGINAL affix-display-data plan already added `template` to) — find each `{ key, label, template, ... }` object literal and add `composedText` right after `template`:

```js
      if (min === max) fixed.push({ key, label, template, composedText, value: min, isSkillRef, signed: ADDITIVE_SIGN_CODES.has(code) });
      else variable.push({ key, label, template, composedText, min, max, isSkillRef, signed: ADDITIVE_SIGN_CODES.has(code) });
```
```js
      fixed.push({ key, label, template, composedText, value: par, isSkillRef, signed: ADDITIVE_SIGN_CODES.has(code) });
```
```js
    fixed.push({ key, label, template, composedText, value: 1, isSkillRef });
```

Finally, in `magicAffixesFrom`'s stats-mapping line (around line 4084):
```js
        stats: [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, template: f.template, min: f.value, max: f.value, isSkillRef: f.isSkillRef }))],
```
Replace with:
```js
        stats: [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, template: f.template, composedText: f.composedText, min: f.value, max: f.value, isSkillRef: f.isSkillRef }))],
```

- [ ] **Step 3: Run and verify**

Run: `node scripts/generate-grail-data.mjs`, then revert unrelated regenerated `data/*.json` files (same as Task 2 Step 3).

```bash
node -e "
const data = require('./data/magic-affixes.json');
const chainLightning = data.find(a => a.name.en === 'of Chain Lightning');
console.log(JSON.stringify(chainLightning.stats[0].composedText, null, 2));
"
```
Expected: `en: '5% Chance to cast level 3 Chain Lightning on attack'` (or whatever this specific affix's real min/max/skill produce — verify the SHAPE/wording pattern is right, not necessarily these exact numbers if the data differs slightly from earlier research), plus all 12 other languages present and non-empty.

Also check the extract-folder all-language file:
```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/d2r-extract/hd-png/data/magic-affixes-full.json', 'utf8'));
const c = data.find(a => a.name.en === 'of Chain Lightning');
console.log(Object.keys(c.stats[0].composedText));
"
```
Expected: 13 language keys (all of `AFFIX_LANG_MAP`'s site-side values).

- [ ] **Step 4: Commit**

```bash
cd D2R-Records
git add scripts/generate-grail-data.mjs data/magic-affixes.json
git commit -m "Compose full skill-referencing affix sentences in all 14 languages

att-skill/hit-skill/gethit-skill/charged stats previously got
template: null and fell back to a broken 'label: min-max' display
(the two vendor numbers for these codes aren't a real range -- they're
independent chance%/level or charges/level parameters). Now composes
the real sentence (e.g. '5% Chance to cast level 3 Chain Lightning on
attack') using item-modifiers.json's templates, handling both the
sequential (%d/%s) and positional (%0/%1/%2) placeholder styles found
across different languages, plus a new all-language skill-name
resolver (skillnames.json).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Fix `%%` collapsing in `formatAffixTemplate.ts`

**Files:**
- Modify: `src/lib/grail/formatAffixTemplate.ts`
- Modify: `src/lib/grail/formatAffixTemplate.test.ts`

- [ ] **Step 1: Add failing tests**

Add to the `describe('substituteTemplate', ...)` block:

```ts
  it('collapses a %+d%% percent-escape sequence to a single trailing percent sign', () => {
    expect(substituteTemplate('Cold Resist %+d%%', 3, 5)).toBe('Cold Resist +3–5%');
  });

  it('collapses a %d%% percent-escape sequence to a single trailing percent sign', () => {
    expect(substituteTemplate('Heal Stamina Plus %d%%', 10, 10)).toBe('Heal Stamina Plus 10%');
  });
```

Add to `describe('formatAffixStatText', ...)`:

```ts
  it('uses composedText when present, taking priority over template', () => {
    const text = formatAffixStatText({
      label: 'Chain Lightning', template: null, min: 5, max: 3,
      composedText: '5% Chance to cast level 3 Chain Lightning on attack',
    });
    expect(text).toBe('5% Chance to cast level 3 Chain Lightning on attack');
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/grail/formatAffixTemplate.test.ts` (from `D2R-Records`)
Expected: FAIL — the `%%` tests produce `"Cold Resist +3–5%%"` (double percent) instead of the expected single `%`; the `composedText` test fails with a TypeScript error (`AffixStatLike` has no `composedText` field) or a wrong-output assertion failure.

- [ ] **Step 3: Fix the implementation**

Replace the whole file:

```ts
// src/lib/grail/formatAffixTemplate.ts
import { signedRange, signedValue } from './formatStat';

// The 4 printf-style numeric placeholder shapes used across
// data/magic-affixes.json's stats[].template field, plus the "+#%"/"#%"/
// "#" shape used by the properties.txt Tooltip-sourced English-only
// fallback templates (currently just "dmg%"). Checked longest/most-
// specific first so e.g. "%+d%" isn't matched by the shorter "%+d"
// check first.
const PLACEHOLDER_ORDER = ['%+d%', '%d%', '%+d', '%d', '+#%', '#%', '#'] as const;

// Templates use printf-style "%%" to mean one literal "%" character (e.g.
// "Cold Resist %+d%%" means "Cold Resist +N%", not "+N%%") -- verified
// against 31 distinct templates in the dataset, all following this exact
// escape pattern. substituteTemplate previously matched "%+d%"/"%d%" as
// a single 4-character token, leaving the second "%" of the escape
// un-consumed and producing a doubled "%%" in the output. Fix: substitute
// the numeric placeholder first, then collapse any remaining "%%" to "%".
export function substituteTemplate(template: string, min: number, max: number): string {
  for (const token of PLACEHOLDER_ORDER) {
    if (!template.includes(token)) continue;
    const hasPercent = token.endsWith('%');
    const signed = token.startsWith('%+d') || token.startsWith('+#');
    const numberText = min === max
      ? (signed ? signedValue(min, true) : String(min))
      : (signed ? signedRange(min, max, true) : `${min}–${max}`);
    const substituted = template.replace(token, hasPercent ? `${numberText}%` : numberText);
    return substituted.replace(/%%/g, '%');
  }
  return template;
}

export interface AffixStatLike {
  label: string;
  template: string | null;
  min: number;
  max: number;
  signed?: boolean;
  composedText?: string;
}

// Real formatted stat text for one affix stat. Priority: a fully-composed
// sentence (skill-referencing stats like "Chance to Cast" -- 3+
// independent values, composed once at generation time, see
// generate-grail-data.mjs's composedSkillRefText) > a substituted
// template (the common case) > "label: range" fallback for stats with
// neither (genuinely-unresolved codes).
export function formatAffixStatText(stat: AffixStatLike): string {
  if (stat.composedText) return stat.composedText;
  if (stat.template) return substituteTemplate(stat.template, stat.min, stat.max);
  const range = stat.min === stat.max
    ? signedValue(stat.min, stat.signed)
    : signedRange(stat.min, stat.max, stat.signed);
  return `${stat.label}: ${range}`;
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/lib/grail/formatAffixTemplate.test.ts`
Expected: PASS (15 tests — 12 existing + 3 new).

- [ ] **Step 5: Commit**

```bash
cd D2R-Records
git add src/lib/grail/formatAffixTemplate.ts src/lib/grail/formatAffixTemplate.test.ts
git commit -m "Fix double %% in percentage templates, add composedText priority

Templates use printf-style %% as an escape for one literal % character
-- substituteTemplate previously left the second % of the escape
un-consumed, producing e.g. '+3-5%%' instead of '+3-5%'. Also adds
composedText as the highest-priority field in formatAffixStatText, for
the fully-composed skill-referencing sentences Task 3 now produces.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Redesign group headers (`affixCatalog.ts`)

**Files:**
- Modify: `src/lib/grail/affixCatalog.ts`
- Modify: `src/lib/grail/affixCatalog.test.ts`

- [ ] **Step 1: Add failing tests**

Add to the existing `describe('affixCatalog', ...)` block:

```ts
  it('groupAffixesByExclusivity lists every distinct property at its best value when all members are simple stats', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    const sunGroup = groups.find(g => g.affixes.some(a => a.name === 'of the Sun'))!;
    expect(sunGroup).toBeDefined();
    // "of the Sun" has 2 real stats (Light Radius, Attack Rating%) -- both
    // should appear in the header text, not just the first.
    expect(sunGroup.headerText).toContain('Light Radius');
    expect(sunGroup.headerText).toMatch(/Attack Rating/i);
  });

  it('groupAffixesByExclusivity uses a general title (name only) for groups containing a skill-referencing stat', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    const chainLightningAffix = suffixes.find(s => s.stats.some(st => st.isSkillRef));
    expect(chainLightningAffix).toBeDefined();
    const skillGroup = groups.find(g => g.affixes.some(a => a.name === chainLightningAffix!.name))!;
    expect(skillGroup).toBeDefined();
    // General title -- just the header affix's own name, no appended value.
    expect(skillGroup.headerText).toBe(skillGroup.headerAffix.name);
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/grail/affixCatalog.test.ts` (from `D2R-Records`)
Expected: FAIL — current `headerText` only includes the first stat's text, and never special-cases skill-ref groups.

- [ ] **Step 3: Thread `composedText` through the `AffixStat` type and `getAffixesForCategory`**

Task 3/4 added a `composedText` field to the raw `data/magic-affixes.json` stats and to `formatAffixStatText`'s parameter type -- `affixCatalog.ts`'s own `AffixStat` interface and `getAffixesForCategory`'s per-stat mapping need the same field added, or `bestPropertiesHeaderText` (Step 4 below) won't type-check and `composedText` won't reach the component layer at all.

Find the `AffixStat` interface:
```ts
export interface AffixStat {
  key: string;
  label: string;
  template: string | null;
  min: number;
  max: number;
  isSkillRef: boolean;
  signed?: boolean;
}
```
Add `composedText?: string;` after `template`:
```ts
export interface AffixStat {
  key: string;
  label: string;
  template: string | null;
  composedText?: string;
  min: number;
  max: number;
  isSkillRef: boolean;
  signed?: boolean;
}
```

Find `getAffixesForCategory`'s stat-mapping (inside `toAffix`):
```ts
    stats: a.stats.map(s => ({
      key: s.key,
      label: s.label[locale],
      template: (s.template as Record<string, string> | null)?.[locale]
        ?? (s.template as Record<string, string> | null)?.en
        ?? null,
      min: s.min,
      max: s.max,
      isSkillRef: s.isSkillRef,
      signed: s.signed,
    })),
```
Add `composedText` resolution (same locale-with-English-fallback pattern as `template`) right after `template`:
```ts
    stats: a.stats.map(s => ({
      key: s.key,
      label: s.label[locale],
      template: (s.template as Record<string, string> | null)?.[locale]
        ?? (s.template as Record<string, string> | null)?.en
        ?? null,
      composedText: (s.composedText as Record<string, string> | undefined)?.[locale]
        ?? (s.composedText as Record<string, string> | undefined)?.en,
      min: s.min,
      max: s.max,
      isSkillRef: s.isSkillRef,
      signed: s.signed,
    })),
```

- [ ] **Step 4: Rewrite `groupAffixesByExclusivity`**

Find the existing function in `src/lib/grail/affixCatalog.ts` and replace it entirely:

```ts
// Buckets a flat affix list by their shared `group` (mutual-exclusivity)
// field -- affixes sharing a group id can never both roll on the same
// item. Every affix belongs to some group (verified: none are 0 in the
// data), including singleton groups of 1.
//
// headerText computation (verified against 2 real cases): if every
// stat across every member is a simple (non-skill-referencing) stat,
// list each DISTINCT stat key's best (highest min/max) value across the
// whole group -- fixes both "of the Sun" (2 real, comparable stats, only
// the first was shown) and heterogeneous groups like the 3-element
// absorb family (fire/cold/lightning, same alvl, arbitrarily picking one
// as "the" representative made no sense since they're not comparable).
// If ANY member has a skill-referencing stat, use a general title (just
// the highest-alvl affix's own name, no computed value) -- "best value"
// is meaningless for a group of e.g. 213 different granted skills.
export function groupAffixesByExclusivity(affixes: Affix[]): AffixGroup[] {
  const byGroup = new Map<number, Affix[]>();
  for (const a of affixes) {
    const list = byGroup.get(a.group);
    if (list) list.push(a);
    else byGroup.set(a.group, [a]);
  }
  const groups: AffixGroup[] = [];
  for (const members of byGroup.values()) {
    const sorted = [...members].sort((a, b) => b.alvl - a.alvl);
    const headerAffix = sorted[0];
    const hasSkillRef = members.some(a => a.stats.some(s => s.isSkillRef));
    const headerText = hasSkillRef ? headerAffix.name : bestPropertiesHeaderText(members, headerAffix);
    groups.push({ headerAffix, headerText, affixes: sorted });
  }
  return groups.sort((a, b) => b.headerAffix.alvl - a.headerAffix.alvl);
}

// For a group of simple (non-skill-ref) affixes: find every distinct
// stat `key` used by ANY member, and for each key, the single highest
// min/max pair achieved by any member carrying that key -- format each
// via formatAffixStatText and join them. Falls back to just the header
// affix's name if it has no stats at all (shouldn't happen in practice).
function bestPropertiesHeaderText(members: Affix[], headerAffix: Affix): string {
  const bestByKey = new Map<string, AffixStat>();
  for (const affix of members) {
    for (const stat of affix.stats) {
      const existing = bestByKey.get(stat.key);
      if (!existing || stat.max > existing.max) bestByKey.set(stat.key, stat);
    }
  }
  if (bestByKey.size === 0) return headerAffix.name;
  const propertyTexts = Array.from(bestByKey.values()).map(stat => formatAffixStatText(stat));
  return `${headerAffix.name} — ${propertyTexts.join(', ')}`;
}
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run src/lib/grail/affixCatalog.test.ts`
Expected: PASS (10 tests — 8 existing + 2 new). Note: the 2 EXISTING tests about "of Health"/"of Protection" grouping (`groupAffixesByExclusivity uses the highest-alvl member as the group header`) may need a small update since headerText's exact format changed slightly (still contains "of Protection" per the existing assertion `toContain('of Protection')`, which should still pass unchanged since the new format still starts with the header affix's name) -- if it fails, read the actual new output and adjust the assertion to match the new (still correct) format, don't weaken the test's intent.

- [ ] **Step 6: Commit**

```bash
cd D2R-Records
git add src/lib/grail/affixCatalog.ts src/lib/grail/affixCatalog.test.ts
git commit -m "Redesign group header text: list all properties, or general title

Previously used only the highest-alvl member's first stat as the
header, which broke down for multi-stat affixes (of the Sun's 2 real
stats, only Light Radius shown) and heterogeneous-element groups
(fire/cold/lightning absorb tied at the same alvl -- picking one was
arbitrary since they're not comparable). Now lists every distinct
property at its best value for simple groups, or falls back to a
general title (just the affix name) for groups containing
skill-referencing stats, where 'best value' isn't meaningful.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Verification

**Files:** none (verification only)

- [ ] **Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all pass except the one documented pre-existing failure (`CategoryCardGrid.test.tsx`).

- [ ] **Step 3: Manual spot-checks**

```bash
node -e "
const data = require('./data/magic-affixes.json');
console.log('Virulent/of Acidity gone:', !data.some(a => ['Virulent','of Acidity'].includes(a.name.en)));
const sullied = data.find(a => a.name.en === 'Sullied');
console.log('Sullied translated:', sullied?.name['zh-TW'] !== 'Sullied');
const azure = data.find(a => a.name.en === 'Azure');
console.log('Azure template (no double %):', azure?.stats[0]?.template?.en);
"
```

Then verify group headers using the same approach as the affixCatalog test (import `getAffixesForCategory`/`groupAffixesByExclusivity` via `npx tsx`, same pattern used during the original display feature's verification) for "of the Sun" and the elemental group, and confirm a `charged`/`att-skill` affix's `composedText` renders a real sentence via `formatAffixStatText`.

- [ ] **Step 4: Final commit if verification turned up fixes**

```bash
cd D2R-Records
git status
# If clean, nothing to do.
```

---

## Out of scope (confirmed in design spec)

- The 6 "-Affix1/2" internal-tracking-flag stat keys (pre-existing, separate issue).
- `skill`/`oskill`/`death-skill`/`levelup-skill`/`aura`/`kill-skill` composed text (zero occurrences among currently spawnable affixes).
