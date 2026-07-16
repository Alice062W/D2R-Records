# FCR/FHR/FBR — Verification

## Automated verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (1 pre-existing unrelated warning in `RunewordList.test.tsx`).
- `npm test` — 149/149 tests passing across 30 files.
- `npm run build` — succeeds; static export includes `/en/character/fcr-fhr-fbr`,
  `/zh-TW/character/fcr-fhr-fbr`, `/zh-CN/character/fcr-fhr-fbr`.

## Manual + d2r.world spot-check

Served the static export and loaded the page in-browser at desktop and mobile widths,
comparing against `https://d2r.world/en-US/info/character/fcr-fhr-fbr` (all 10
class/form tabs were screenshotted from d2r.world during design research and used as
the transcription source).

- **Amazon** (default table): all values match, including the FBR "1H swinging weapon"
  vs. "Other weapons" split and every blank cell.
- **Paladin** (most complex table — sub-splits on all three of FCR, FHR, and FBR):
  matches exactly, including the "Fist of the Heavens" FCR column only having entries
  at frames 17-19, "Holy Shield" FBR column only at frames 1-2, and the fact that frame
  16 has no value in any column (so no row renders for it) — same as d2r.world.
- **Sorceress**: FCR "other spells" (frames 7-13) vs. "Lightning / Chain Lightning"
  (frames 11-19) sub-split, plus FHR/FBR single columns, all match exactly.
- Class-selector buttons switch tables correctly; the previously-selected class stays
  visually highlighted.
- zh-TW renders with correctly translated class names (亞馬遜, 聖騎士, 女巫, etc.) and
  column headers (幀數/施法加速/擊退加速/格擋加速), with sub-column labels (e.g. "1H
  swinging weapon") left untranslated — matching this project's precedent of leaving
  narrow technical sub-labels in English where no existing i18n key covers them.
- Mobile width (375px): class-selector buttons wrap into a multi-row flex layout: the
  data table remains readable via its own horizontal scroll container without
  overflowing the page.

## Notes

- No change made to any other page.
- The `Nav.misc_fcrFhrFbr` translation key is unchanged and still used by the nav menu
  label; the page's own heading now uses the new `Items.fcrFhrFbrPageTitle` key.
