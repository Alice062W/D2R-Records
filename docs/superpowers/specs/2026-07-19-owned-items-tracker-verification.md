# Owned-Item Checkboxes for Set/Unique/Runeword Pages — Verification

## Automated verification

- `npm test` — 225/225 tests passing across 38 files (37 pre-existing files' tests still green + all new tests from this feature's 9 implementation tasks).
- `npx tsc --noEmit` — clean.
- `npm run lint` — clean. Found and fixed 2 `react-hooks/set-state-in-effect` errors during this final verification pass (not caught by any per-task review loop, since those checked tests/diffs but not lint) in `useGrailAuth.ts` and `useOwnedItems.ts` — both called `setState` synchronously inside a `useEffect` body outside any callback. Fixed by using a lazy `useState` initializer for `useGrailAuth`'s "Supabase unconfigured" case (nothing to fetch, so the effect can skip entirely) and deferring `useOwnedItems`' remaining synchronous `setState` calls into a resolved-promise microtask, matching how its async `.then()` branches already satisfied the rule. Re-ran the full suite after the fix — still 225/225.
- `npm run build` with `.env.local` temporarily removed — succeeds. Every `/items/unique/*`, `/items/set/*`, `/items/runewords` static page builds normally, and (as a bonus beyond this task's minimum bar) `/grail` now builds too — its prerender used to fail outright when unconfigured before Task 1's resilience fix.
- Grepped the built HTML output (env vars absent) for `type="checkbox"` on `/items/unique/axes` and `/items/runewords` — zero matches, confirming the checkbox feature is fully inert rather than broken when Supabase isn't configured.

## Manual spot-check (signed-out state, both configured and unconfigured)

- With `.env.local` removed entirely: `/items/unique/axes` and `/items/runewords` render with zero `<input type="checkbox">` elements in the served HTML.
- With `.env.local` present (fully configured) but no active session: same result — checkboxes and the Collected/Missing filter bar are both absent from the actual rendered HTML (verified by stripping `<script>` tags before searching, since the visible-content check must exclude the embedded i18n message JSON payload used for hydration, which naturally contains the strings "Collected"/"Missing" as translation values even when nothing renders them on screen).
- Confirmed the page looks and behaves identically to before this feature in both configurations — no visual regression, no dead/disabled controls implying a broken feature.

## Not verified in this pass — requires a real Google account

I cannot authenticate as a real user, so the following from the plan's Task 10 manual-check list still needs a human to confirm directly, ideally via `npm run dev` in this worktree:

1. Sign in with Google on `/items/unique/axes`.
2. Check a few items; reload the page; confirm the checkboxes are still checked (persisted via the `owned_items` table).
3. Click "Collected" — confirm only checked items show; "Missing" — confirm only unchecked items show; "All" — confirm everything shows again.
4. Repeat on a Set page (`/items/set/[some-set-slug]`) and `/items/runewords`.
5. Sign out — confirm checkboxes and the filter bar disappear again on all three page types.
6. Confirm `/grail`'s existing detailed find-logging flow still works exactly as before (fully independent of this feature, per the design's explicit non-goal).

## Notes

- All 9 feature-implementation tasks (Tasks 1-9) passed their individual implementer + reviewer subagent cycles with no unresolved Critical/Important findings before this final pass began.
- Tasks 5-9 collectively surfaced and fixed a real Vitest gotcha not anticipated in the plan's own example test code: `vi.doMock()` called inside an `it()` block does not affect a component that was already imported statically at the top of the test file (the import resolves before the mock registers). Every affected test was corrected to use `vi.resetModules()` + a dynamic `await import(...)` per test case that needs a different mock — confirmed correct and consistently applied across all 5 tasks that needed it, including via independent controller spot-checks in two cases where a task reviewer's report was too terse to trust at face value.
- The `owned_items` table and its RLS policies were already applied live by the user via the Supabase Dashboard SQL editor before implementation began; `supabase/migrations/0002_owned_items.sql` exists purely as checked-in documentation, matching the project's existing `0001_finds.sql` pattern (no migration runner in this project — the dashboard is the actual source of truth).
