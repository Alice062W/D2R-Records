# vendor/d2data

Source: https://github.com/blizzhackers/d2data (MIT License, see LICENSE in this directory)
Pinned commit: 477bcf63e964f39f4c774e588a79fd598ae472de

These JSON files are the raw upstream data used to generate `data/uniques.json` and
`data/sets.json` via `scripts/generate-grail-data.mjs` (`skills.json` resolves skill
IDs referenced by skill/charge-granting item stats to their display names).
`localestrings-chi.json` provides official Traditional Chinese strings (item names, base
names, skill names) for the grail feature's zh-TW/zh-CN localization; zh-CN is derived
from it via OpenCC conversion at generation time, not a separate official source. Do not
hand-edit these files —
re-run the generation script against a newer pinned commit instead, and re-verify the
generated output's item counts/names against https://d2r.world/en-US for completeness.

`runes.json` provides runeword definitions (required runes, base item type
restriction, and granted stat properties in the same `T{n}Code`/`Min`/`Max`/`Param`
shape as `uniqueitems.json`/`setitems.json`) for the Runewords reference page.

`gems.json` provides gem/rune definitions (`weaponMod`/`helmMod`/`shieldMod` properties
per socket-type) for the Runes reference page. `cubemain.json` provides every Horadric
Cube recipe (plain-English description, structured inputs/output, and — for craft
recipes — guaranteed `mod {n}` properties in the same shape as `uniqueitems.json`) for
the Cube Recipes and Crafted Items reference pages.

`magicprefix.json`/`magicsuffix.json` provide magic/rare item affixes (name, level
requirement, item-type restrictions, and granted properties) for the Magic Items and
Rare Items reference pages. Both pages draw from the same `frequency > 0` active-affix
pool; Rare Items further restricts to entries where `rare === 1` (verified this session
via direct comparison against d2r.world: an affix present on the Magic page without a
`rare` flag is absent from the Rare page for the same item type, and vice versa for a
`rare: 1` entry appearing only on the Rare page — this is a real, curated subset
distinction in the game's own item generation, not an artifact of stale/versioned data).
