# Icon BasePath Fix — Verification

## Automated verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (1 pre-existing unrelated warning in `RunewordList.test.tsx`).
- `npm test` — 173/173 tests passing across 31 files (unchanged — `BASE_PATH` is
  `''` in the test environment, so every existing icon-src assertion still matches).
- `npm run build` (normal, no env vars) — succeeds; zero `/D2R-Records` occurrences
  anywhere in the exported HTML, confirming local/non-GitHub-Actions builds are
  byte-for-byte unaffected.
- `GITHUB_ACTIONS=true GITHUB_REPOSITORY=Alice062W/D2R-Records npm run build` —
  succeeds; every icon `src` across every checked page is correctly prefixed with
  `/D2R-Records`:
  - `/items/unique`: `invcap.png`, `invqlt.png`, `invbuc.png` (category tiles)
  - `/items/base/axes`: 20 prefixed refs
  - `/items/runes`: 66 prefixed refs
  - `/items/runewords`: 376 prefixed refs
  - `/items/set`: 65 prefixed refs
  - `/items/crafted`: 222 prefixed refs

## Notes

- The homepage (Appraiser) shows zero icon refs in the static HTML in both build
  modes — expected, since no base item is preselected on initial render (the
  `<Image>` only renders once the user picks something from the dropdown, client-
  side); this is unrelated to the fix and was true before it too.
- No test file was modified — every existing assertion on a plain `/items/inv/...`
  path continues to hold, since `BASE_PATH` resolves to `''` whenever
  `GITHUB_ACTIONS`/`NEXT_PUBLIC_BASE_PATH` aren't set (local dev, CI test runs).
