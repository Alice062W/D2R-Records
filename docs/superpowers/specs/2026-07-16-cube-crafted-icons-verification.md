# Cube Recipes / Crafted Items Icons — Verification

## Automated verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (1 pre-existing unrelated warning in `RunewordList.test.tsx`).
- `npm test` — 172/172 tests passing across 30 files.
- `npm run build` — succeeds; static export includes icons on `/items/cube-recipes`
  and `/items/crafted` in all three locales.

## A real bug found and fixed during implementation

The resolver's first draft checked a code's real item entry (`items[code].invfile`)
before checking whether it was a generic item-type code. This broke on `"axe"`, which
is *both* a generic item-type code (used for "Axe (Any)" recipe inputs) *and* the real
item code for D2's plain "Axe" base item — with item-lookup-first, a generic "any
axe" ingredient incorrectly resolved to that one specific item's icon instead of the
Axes category's representative icon. Fixed by checking the item-type/category match
first, falling back to the direct item-code lookup only when no category match
exists. Verified this is the only such collision by checking every `TYPE_TO_SLOT` key
against `items.json` directly.

## Manual spot-check (via curl against the served static export)

- `/en/items/cube-recipes`: the Horadric Staff recipe (Staff of Kings + Amulet of the
  Viper) shows all three icons (`invmsf`, `invvip`, `invhst`). The "Portal to The
  Secret Cow Level" recipe (Wirt's Leg + Tome of Town Portal) shows both ingredient
  icons (`invleg`, `invbbk`) but correctly shows no output icon, since "Cow Portal" is
  a quest-flavor display name with no real item code — a documented, principled gap,
  not a broken image.
- `/en/items/crafted`: "Hit Power Helm" shows the magic-item-input icon (`invfhl`,
  Full Helm) next to its name and next to the "Input:" label, and one icon per
  additional input in order (`invgswe` Jewel, `invrIth` Ith Rune, `invgsbe` Perfect
  Sapphire) — matching the confirmed `usetype` rule that a crafted item's result icon
  is the same as its magic-item input's icon.

## Notes

- No icon exists for the documented non-goals: broad supertypes (`armo`/`weap`/
  `blun`), generic gem-quality-tier codes (`gem0`-`gem4`), unspecified-tier potion
  codes (`hpot`/`mpot`), and quest/portal display-name outputs — all confirmed
  rendering with no icon rather than a guessed or broken one.
- No image was downloaded, hotlinked, or otherwise sourced from d2r.world — every
  icon resolves through this project's own already-extracted `public/items/inv/`
  files.
