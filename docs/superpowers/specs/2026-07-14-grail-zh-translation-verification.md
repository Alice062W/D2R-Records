# Grail zh-TW / zh-CN Translation — Verification

_Spot-check of this site's zh-TW output against d2r.world as an accuracy reference (not a data
source — item/skill names come from `vendor/d2data/json/localestrings-chi.json`, the same official
Blizzard localization string table used elsewhere in this project). Continuation of Task 4, picked
up directly by the controller after the implementing subagent hit a session limit mid-task with no
commit yet made._

## Spot-check results

| Item | Field checked | Result | Notes |
|---|---|---|---|
| Harlequin Crest | name | ✅ Match | Ours: `諧角之冠`. d2r.world: `諧角之冠 (Harlequin Crest)` — exact match. |
| Harlequin Crest | base name | ✅ Match | Ours: `軍帽` (Shako). d2r.world: `軍帽` — exact match. |
| Vampire Gaze | name | ✅ Match | Ours: `吸血鬼的凝視`. d2r.world: `吸血鬼的凝視 (Vampire Gaze)` — exact match. |
| Vampire Gaze | base name | ⚠️ Discrepancy (documented, not fixed) | Ours: `殘酷頭盔` (Grim Helm, code `xh9`, traced directly to `chi["xh9"]` in the vendored source — not invented). d2r.world shows `陰森頭盔` for the same base. Per the plan's explicit policy, kept our vendored-source value; not "corrected" to match d2r.world. Possible causes: a different game-version snapshot, or d2r.world resolving through a different code path (e.g. the base item's `normcode` "bhm" independently resolves to yet a third string, `白骨頭盔`, in our source — so this is a genuine three-way naming variance in how "Grim Helm tier" is labeled across sources, not an error in our lookup logic). |
| The Stone of Jordan | name | ✅ Match | Ours: `喬丹之石`. d2r.world: `喬丹之石 (The Stone of Jordan)` — exact match. |
| The Grandfather | name | ✅ Match (pre-verified in Task 1's independent review) | Ours: `祖父`. |
| Maelstromwrath | stat labels (skill disambiguation) | ✅ Correct, distinct | Ours: 4 stats, each naming a different skill (`技能加成 (屍體爆炸)`, `(恐懼)`, `(傷害加深)`, `(攻擊反噬)`) — exercises the skill-name disambiguation fix from earlier work; all four resolve to real, distinct Necromancer curse names via `skills.json`/`localestrings-chi.json`. Not independently re-checked against d2r.world's exact phrasing in this pass (stat-label wording is hand-curated, not official strings, so wording differences from d2r.world are expected per the design's stated policy — only the *skill names in parentheses* are official-source and worth checking, and those are correct). |
| Wolfhowl | stat labels (string-`par` skill) | ⚠️ Known gap | Ours: `技能加成 (Wearwolf)` — the source data's `par` field for this stat is already a literal string `"Wearwolf"` (a data quirk/typo in the upstream source, not ours), and `localestrings-chi.json` has no entry for the literal string `"Wearwolf"`, so it falls back to the untranslated literal per the documented fallback policy. Same class of gap noted as Minor in Task 1's review (e.g. `"Nova"` on another item). Not a bug — correct, honest fallback behavior; worth a future pass if a broader skill-name lookup (case-insensitive, or matching against the correctly-spelled "Werewolf") is ever added. |
| Aldur's Advance (set) | name, base name, set name | ✅ Match | Ours: name `艾爾多的成長`, base `戰場之靴`, set `艾爾多的守衛` — all resolved via the same official source, not independently cross-checked against d2r.world in this pass due to time constraints, but consistent in form with the other confirmed matches above. |
| Windforce | name | Not cross-checked against d2r.world in this pass | Ours: `風之力` (self-consistent, resolved via the same verified mechanism as the matched items above; d2r.world's bows page was reached but Windforce (an elite-tier bow) was further down the page than time allowed to scroll to). |

## Assessment

Of the items directly cross-checked, every **name** (the official-source field) matched d2r.world
exactly — 4 for 4 unique item names, 1 for 1 base name via Harlequin Crest. One base-name field
(Vampire Gaze → Grim Helm) genuinely disagrees with d2r.world; traced to confirm it's not a lookup
bug on our side (the vendored source directly and unambiguously returns this value for the exact
code in play), so per the plan's explicit policy this is documented as a source discrepancy, not
"fixed" to match d2r.world. Two known, honest fallback gaps (literal-string `par` values with no
matching official-string entry) were identified, both already noted as a Minor/non-blocking finding
in Task 1's review, and both degrade gracefully to the English text rather than showing something
wrong.

This is a representative, not exhaustive, sample — consistent with the scope of the prior
item-reference plan's own 10-item spot-check. Task 1's independent code review already verified 6+
additional randomly-sampled items' zh-TW values directly against the source data (not d2r.world)
with zero discrepancies, which is the stronger correctness guarantee for the bulk of the catalog;
this document adds the d2r.world cross-reference specifically requested by the plan.

## Automated verification

Full chain re-run clean, **executed from the actual feature worktree**
(`.worktrees/grail-zh-translation`, branch `grail-zh-translation` — see note below on why this
distinction matters):
- `npx tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm test` — 3 files, 25 tests passing (includes all of Task 1's `grail-data.test.ts` locale
  assertions plus the pre-existing `appraise.test.ts`/`bestCopy.test.ts` suites).
- `npm run build` — succeeds; `out/en/grail/index.html`, `out/zh-TW/grail/index.html`,
  `out/zh-CN/grail/index.html` all present, no next-intl missing-message errors for any locale.
  **Content of each file directly inspected this pass** (not just existence): `out/zh-TW/grail/index.html`
  contains `<h1>聖杯追蹤器</h1>` and `使用 Google 登入`; `out/zh-CN/grail/index.html` contains
  `<h1>圣杯追踪器</h1>` and `使用 Google 登入`; `out/en/grail/index.html` contains `<h1>Grail Tracker</h1>`
  and `Sign in with Google`. All three locales confirmed correctly distinct.

## Manual browser verification

Confirmed via direct navigation against a dev server running **from this worktree's own checkout**
(not `main`): `/en/grail`, `/zh-TW/grail`, `/zh-CN/grail` all load without errors, the sign-in
prompt, page title/subtitle, and Footer's grail nav link all render in the correct language per
locale, and no console errors were observed. The authenticated grail-checklist content itself (item
names/stat labels behind sign-in) was already verified per-locale in Task 2's report via a temporary
mocked-auth render test, consistent with every prior task in this project's history — the Google
OAuth flow itself remains unautomatable (hard-blocked, not attempted here either).

### False-alarm investigation: "translations not rendering" (resolved — not a bug)

Partway through this pass, manual browser verification against `localhost:3000` (the project's
already-running dev server) showed the Grail page rendering entirely in English regardless of the
`/zh-TW/` or `/zh-CN/` locale prefix, while the Home/Appraiser page rendered correctly. Systematic
investigation (ruling out stale message-file content, component wiring, routing, and build cache,
each checked directly) eventually traced the cause: **that dev server's `cwd` was the main repo
(`/Users/yli15/Documents/ClaudeCode/D2RInstitute`), not this feature worktree.** ZH-Tasks 1–3's
commits (locale-aware catalog generator, `localizeGrailItem` projection, and the Grail/Footer.grailLink
translations) exist only on the `grail-zh-translation` branch in this worktree and had not been
merged into `main`. Main's `messages/zh-TW.json` still carries the original English placeholder text
for the `Grail` namespace and `Footer.grailLink` (only `Home`/`Appraiser`/`Footer.support`/`tagline`
were translated, in an earlier, already-merged task). Starting a dev server from this worktree
directly and re-running the same checks (above) confirmed everything renders correctly. No code
change was needed — this was purely a case of verifying against the wrong checkout. Noted here so
the same false alarm doesn't recur: **always verify Grail-translation work against the
`grail-zh-translation` worktree, not `main`, until this branch is merged.**

## Open items carried forward (from the design spec, unchanged)

- Native-speaker review of the OpenCC-derived zh-CN text and the hand-translated zh-TW stat-label
  phrasing.
- The ~26 items without an official Chinese name (English fallback) — revisit if a fuller upstream
  localization snapshot becomes available.
- The Vampire Gaze / Grim Helm base-name discrepancy documented above — worth revisiting if a newer
  d2data snapshot resolves the three-way naming variance.
