# Magic/Rare Affix Pages — Post-Launch Refinements Design Spec

Date: 2026-08-07
Status: Approved by user, ready for implementation

## Goal

Fix 6 issues found during user QA of the just-shipped Magic/Rare affix
redesign, all traced to their root cause in the raw game data or the
generator/display logic — no guessing, every fix verified against
`vendor/d2data/json/*`, `C:\d2r-hd-all\...\global\excel\*.txt`,
`C:\d2r-hd-all\...\local\lng\strings\*.json`, and cross-checked against
https://d2r.world/zh-TW/info/item/rare/rings where relevant.

## Confirmed facts (verified by direct inspection — don't re-derive)

1. **`spawnable: 0` affixes are currently shown but shouldn't be.**
   `magicAffixesFrom()` only filters `frequency > 0`; it never checks
   `spawnable`. Of 1256 `frequency > 0` entries, **104 have
   `spawnable: 0`** — these cannot appear on any item in-game regardless
   of frequency. Verified two concrete cases the user flagged ("Virulent",
   "of Acidity", both `group: 307`, `spawnable: 0`, `level: 92`) are
   absent from d2r.world's rare-rings page, confirming this is the
   correct explanation, not a coincidence.

2. **14 affixes have no zh-TW/zh-CN name** because `localizedItemName()`
   sources names from `vendor/d2data/json/localestrings-chi.json`, which
   has genuine coverage gaps for newer/ladder-era affixes (e.g.
   "Sullied", "TaintedAffix", "of Apocalypse"). The newer
   `vendor/d2data/json/item-nameaffixes.json` (added for the affix-data
   step-1 work) has **complete coverage, all 14 languages**, for every
   one of these 14 names — verified directly, e.g.
   `item-nameaffixes.json['Sullied'].zhTW === '玷汙'`.

3. **Double `%%` in percentage stats.** Raw templates use printf-style
   `%%` to mean "one literal `%` character" (e.g.
   `"Cold Resist %+d%%"` really means "Cold Resist +N%", not "+N%%").
   `substituteTemplate`'s `PLACEHOLDER_ORDER` (`'%+d%'`, `'%d%'`, ...)
   misreads this as one 4-character placeholder, leaving the second `%`
   of the escape sequence un-consumed in the output. Verified: 31 distinct
   templates in the dataset contain `%%`, all following this exact
   printf-escape pattern (never a coincidental double-literal-percent
   elsewhere).

4. **Skill-referencing stats need full sentence composition, not a
   min–max range.** For the 4 skill-ref codes that actually occur in
   spawnable magic/rare affixes (`att-skill`: 7 occurrences, `hit-skill`:
   4, `gethit-skill`: 11, `charged`: 213 — dominant), `mod1min`/`mod1max`
   are NOT a range at all; they're two independent parameters. Verified
   templates and field mapping for each, via `item-modifiers.json` +
   cross-checking real affix rows against plausible real-world values:
   - `att-skill` → `item-modifiers.json['ItemExpansiveChancX']`:
     `"%d%% Chance to cast level %d %s on attack"` — `min` = chance%,
     `max` = skill level (verified: suffix-442 "of Chain Lightning" has
     `min:5, max:3, param:53` → "5% Chance to cast level 3 Chain
     Lightning on attack", matches real in-game tooltip convention).
   - `hit-skill` → `['ItemExpansiveChanc1']`:
     `"%d%% Chance to cast level %d %s on striking"` — same field
     order (min=chance%, max=level).
   - `gethit-skill` → `['ItemExpansiveChanc2']`:
     `"%d%% Chance to cast level %d %s when struck"` — same field order.
   - `charged` → `['ModStre10d']`: `"Level %d %s (%d/%d Charges)"` —
     `min` = charge count, `max` = skill level (verified via plausibility:
     suffix-438 "of Lightning" has `min:50, max:1` → "Level 1 Lightning
     (50/50 Charges)" is a sane low-tier charged item; the reverse
     reading, "Level 50 Lightning, 1 charge," would be absurdly
     overpowered and contradicts typical D2 charged-item design).
   - Skill names resolve via a verified chain: affix `mod{n}param` (a
     skill id, e.g. `49`) → `skills.txt`'s `skilldesc` column (e.g.
     `"lightning"`) → `skilldesc.txt`'s `str name` column (e.g.
     `"skillname49"`) → `local\lng\strings\skills.json`'s matching `Key`
     entry, all 13 languages present (verified:
     `skillname49.zhTW === '閃電箭'`).

5/6. **Group headers break down for multi-property groups.** Two real
   cases: "of the Sun" (suffix-312) has 2 real, comparable stats (Light
   Radius, Attack Rating%) but the header only shows the first (`stats[0]`
   convention from the original design). Group 3 (rings) has 3 members —
   "of Coolness"/"of Warming"/"of Resistance" — each granting a
   *different element's* absorb (fire/cold/lightning) at the *same*
   alvl (13); picking one as "the" representative is inherently arbitrary
   since the properties aren't comparable. Skill-ref-heavy groups (e.g.
   group 44, 213 `charged` members) make "best value" meaningless for a
   different reason — 213 different skills granted, no single "best."

## Fixes

### Data (`scripts/generate-grail-data.mjs`)

- **Fix 1**: add `&& v.spawnable !== 0` to `magicAffixesFrom`'s existing
  `frequency > 0` filter.
- **Fix 2**: `magicAffixesFrom` looks up the affix's 3-locale `name` from
  `itemNameAffixesData` (already loaded, used for `nameFull`) instead of
  `localizedItemName(rawName)`, when a matching entry exists — fall back
  to the existing `localizedItemName` path only if `item-nameaffixes.json`
  genuinely has no entry for that name (a defensive fallback, not
  expected to trigger given the confirmed 100% coverage of the 14 gap
  cases, but avoids a regression for any name not yet checked).
- **Fix 4**: extend `templateFor`-equivalent resolution so `att-skill`/
  `hit-skill`/`gethit-skill`/`charged` produce a **fully composed,
  all-14-language string** (not `template: null` as today) with the
  skill name and numbers already substituted in — this happens once, at
  data-generation time, not at render time (unlike the simple `%+d`-style
  templates, which stay as templates substituted at render time — the
  skill-ref case has 3 independent values to compose, not a min/max
  range, so composing the final string during generation is simpler and
  avoids inventing new render-time API surface for a one-off case). This
  becomes a new field, e.g. `composedText: {en, ...} | null`, checked by
  `formatAffixStatText` before the `template`/fallback logic.

### Display formatter (`formatAffixTemplate.ts`)

- **Fix 3**: rewrite `substituteTemplate` to (a) substitute the `%+d`/`%d`
  placeholder with the number, then (b) collapse any remaining `%%` in
  the result to a single `%` — order matters, do the placeholder
  substitution first so a literal `%%` elsewhere in the string isn't
  mistaken for part of the placeholder.
- `formatAffixStatText` gains a `composedText` field check (from Fix 4)
  ahead of the `template` check.

### Grouping (`affixCatalog.ts`)

- **Fix 5/6**: replace `groupAffixesByExclusivity`'s `headerText`
  computation:
  - If every member's every stat has `isSkillRef: false`: compute the
    set of distinct stat `key`s across all members in the group: for
    each key, find the single highest min/max pair achieved by any
    member for that key, format it via `formatAffixStatText`, and join
    all distinct-key results into the header (e.g. "Light Radius: +5 to
    Light Radius · Attack Rating %: +5% Bonus to Attack Rating" — exact
    separator/punctuation is implementer's judgment, not a functional
    ambiguity).
  - If any member has an `isSkillRef` stat: use a **general title** —
    just the highest-alvl affix's own translated name, no computed
    value appended (matches user's explicit direction: "for the group
    title, you can give a general title").

## Verification plan

- Re-run the generator, confirm the affix count for `rings`/`swords`/etc.
  drops by the expected ~8% (spawnable exclusion).
- Spot-check "Virulent"/"of Acidity" no longer appear anywhere in
  `data/magic-affixes.json`.
- Spot-check all 14 previously-untranslated names now have real zh-TW/
  zh-CN text.
- Spot-check a `%%`-bearing stat (e.g. "Azure" / Cold Resist) renders as
  `"+N% Cold Resist"`, not `"+N%%"`.
- Spot-check "of Chain Lightning" renders as
  `"5% Chance to cast level 3 Chain Lightning on attack"` in English, and
  a real (non-placeholder) sentence in zh-TW/zh-CN.
- Spot-check "of the Sun"'s own group header shows both Light Radius and
  Attack Rating%.
- Spot-check group 3 (elemental absorb)'s header no longer arbitrarily
  picks one element.
- Spot-check group 44 (the 213-member `charged` group) shows a general
  title (just a name), not a broken/huge computed value list.
- Run existing test suites (`formatAffixTemplate.test.ts`,
  `affixCatalog.test.ts`, `AffixTable.test.tsx`) — expect some existing
  tests to need updates given the header-computation change; write new
  tests for the 6 fixes above.

## Out of scope

- The 6 "-Affix1/2" internal-tracking-flag stat keys leaking into
  `stats[]` for a handful of Renewed-tier charm affixes (already flagged
  as a pre-existing, separate issue during final review of the display
  redesign — not part of this refinement pass).
- `skill`/`oskill`/`death-skill`/`levelup-skill`/`aura`/`kill-skill`
  (other `SKILL_REF_PROPS` codes) — verified to have zero occurrences
  among currently spawnable magic/rare affixes, so no composed-text work
  needed for them right now.
