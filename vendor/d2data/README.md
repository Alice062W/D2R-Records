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
