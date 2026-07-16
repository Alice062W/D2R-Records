# Bar Affix Exclusion — Design

## Goal

Remove the bogus "Barbarian Items" (`bar`) category currently shown on the Magic Items
page, by excluding the 9 malformed magic suffixes that produce it — matching
d2r.world, which does not show these anywhere.

## Background

`data/magic-affixes.json`'s `itemTypesForAffix` (in
`scripts/generate-grail-data.mjs`) falls back to the raw, un-mapped `itype` code (or,
failing that, the raw `class` code) whenever no leaf category's ancestor set can
resolve it — a deliberate "don't guess, surface the gap" convention already used
elsewhere in this generator. For 9 specific Barbarian-class suffixes in
`vendor/d2data/json/magicsuffix.json`, this fallback lands on the literal class code
`"bar"`, and a previously-added i18n label ("Barbarian Items" / "蠻族物品") turns that
into a real, visible category tile at `/items/magic/bar` — a tile d2r.world does not
have.

Investigated this session and confirmed the root cause: these 9 entries — `of
Howling` (id 621), `of Potion Finding` (623), `of Taunting` (625), `of Shouting`
(627), `of Item Finding` (631), `of Battle Cry` (635), `of Battle Orders` (637), `of
War Cry` (641), `of Battle Command` (643) — are the **high-level tier of a two-tier
pair**. Each has a sibling entry with a valid `itype1` (e.g. `of Howling` id 620 has
`itype1: "phlm"`, Barbarian Helms), while the 9 broken ones have **no `itype1` field at
all** and carry nonsensical **negative** `mod1min`/`mod1max` values against `mod1code:
"charged"` (e.g. "Level -20 to -6 Howl (Charges)" — a negative skill level has no
in-game meaning). This exact pattern (`group: 44`, `mod1code: "charged"`, negative
min/max) spans all seven classes in the vendored data (Amazon, Sorceress, Necromancer,
Paladin, Barbarian, Druid, and an eighth class code `"war"`), not just Barbarian — but
only the Barbarian ones happen to be missing `itype1`, which is why only `bar` produces
a visible bogus tile today; the other classes' equivalent malformed rows silently fall
back to a raw, never-displayed slug and were never noticed.

Confirmed directly against d2r.world: neither the 9 broken entries, nor their valid
`phlm`-restricted siblings, appear on any of d2r.world's Magic Items category pages
(checked Helms, Amulets, Small/Large/Grand Charms). d2r.world's affix tables simply
omit this entire family of entries. Since the user's stated goal is matching d2r.world
exactly, the correct fix is exclusion, not re-categorization.

## Design

- In `scripts/generate-grail-data.mjs`, exclude any `magicprefix.json`/`magicsuffix.json`
  entry whose `mod1code` (or `mod2code`/`mod3code`) is `"charged"` **and** the
  corresponding `mod{n}min`/`mod{n}max` are both negative, from
  `data/magic-affixes.json` generation entirely (not included as a prefix or suffix on
  any category, matching d2r.world). This is a narrow, data-shape-based exclusion (not
  a class/name allowlist), so it correctly excludes the whole non-functional family
  across all affected classes — not just the 9 Barbarian ones that happened to produce
  a visible symptom.
- Remove the now-unused `"bar"` entries from `AffixCategories` in `messages/en.json`,
  `messages/zh-TW.json`, `messages/zh-CN.json` (the category no longer exists once its
  only 9 members are excluded).
- No change to `itemTypesForAffix`'s existing raw-code fallback behavior — it's a
  reasonable safety net for genuinely-new unmapped codes; this fix addresses the actual
  root cause (malformed source rows) rather than papering over its symptom.

## Non-goals

- Auditing every other `group: 44` malformed entry across the other 6 classes for
  additional bogus fallback categories — none of them currently produce a visible
  symptom (their raw `itype`/`class` fallback codes have no matching i18n label, so
  they silently render as an unlabeled-but-harmless slug that was never linked to from
  any real page). Excluding the whole malformed family (this design) removes them too,
  as a side effect, without needing a separate per-class investigation.
- Re-deriving what the *correct* item-type restriction should have been for these 9
  entries (e.g. guessing they meant `itype1: "mele"` like their closest analogues) —
  since d2r.world doesn't display them under any category, guessing a correct
  restriction would produce content d2r.world doesn't have, which contradicts the
  user's stated goal.

## Testing plan

- Regression test: `data/magic-affixes.json` (and the underlying generator function)
  contains none of the 9 named suffixes (`of Howling`, `of Potion Finding`, `of
  Taunting`, `of Shouting`, `of Item Finding`, `of Battle Cry`, `of Battle Orders`, `of
  War Cry`, `of Battle Command`), and no entry anywhere in the file has `itemTypes`
  containing the raw code `"bar"`.
- Regression test: valid, non-malformed affixes are unaffected — spot-check a handful
  of ordinary prefixes/suffixes (including ones using `mod1code: "charged"` with
  *positive* values, e.g. Daggers' "of Frozen Orb") are still present with correct
  `itemTypes`.
- Manual + d2r.world spot-check: `/items/magic` no longer lists a "Barbarian Items"
  tile in any locale; `/items/magic/bar` 404s.
