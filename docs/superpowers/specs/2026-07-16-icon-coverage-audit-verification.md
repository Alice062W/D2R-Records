# Icon Coverage Audit — Verification

## Automated verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (1 pre-existing unrelated warning in `RunewordList.test.tsx`).
- `npm test` — 324/324 tests passing across 60 files.
- `npm run build` — succeeds; static export includes icons for Base Items, Runes,
  Runewords, and the Set Items browse-by-name index.

## A real bug found and fixed along the way

The 33 rune icon files delivered in an earlier PR (`add-item-icons`, commit `ca444df`)
were all lowercase (e.g. `invrel.png`), but every rune's real `invfile` value in the
vendored game data is mixed-case (e.g. `invrEl`, `invrShae`). macOS's default
case-insensitive filesystem hid this locally, but GitHub Pages serves from a
case-sensitive filesystem — the icons would have 404'd in production. Fixed by
renaming all 33 files to their exact real-case names (commit `a1f65c5`) before wiring
them into the Runes/Runewords pages.

Two further vendored-data quirks were found and handled correctly during
implementation (verified against `vendor/d2data/json/items.json` and
`vendor/d2data/json/runes.json` directly):
- Rune "Jah"'s real `invfile` is `invrJo`, not `invrJah` — a genuine Blizzard data
  oddity. `data/runes.json` and every runeword's `runeInvFiles` correctly resolve to
  `invrJo`.
- The runeword "Wealth" has a vendor-data typo in its rune list (`"LmKoTir"` instead of
  `"LumKoTir"`). Handled with a narrow `RUNE_NAME_ALIASES = { Lm: 'Lum' }` lookup used
  only for icon resolution — the displayed rune name text (`"Lm"`) is left untouched,
  matching this project's established "don't guess, fix narrowly" precedent.

## Manual spot-check (via curl against the served static export — no repeated browser screenshots, per this session's token-cost guidance)

- `/en/items/runes`: all 33 rune icons render with the correct case
  (`/items/inv/invrEl.png` … `/items/inv/invrZod.png`), and each file returns HTTP 200.
- `/en/items/runewords`: rune-order icons render inline per runeword (e.g. Enigma
  shows `invrJo.png`, `invrIth.png`, `invrBer.png` in order).
- `/en/items/base/axes`: Base Items icons render (e.g. `invaxe.png`, `inv2ax.png`).
- Set Items browse-by-name index and Set Items detail page icons verified in the
  earlier Tasks 1–2 merge.

## Notes

- Cube Recipes and Crafted Items remain out of scope (confirmed non-goal — their data
  is plain description text with no structured item-code link).
- No change to any already-working icon rendering (unique/set item detail, category
  tiles).
