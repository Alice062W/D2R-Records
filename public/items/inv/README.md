# Item inventory icons

**Status: no source pinned. This directory is intentionally empty.**

Task 4 of the grail item reference plan (see `.superpowers/sdd/task-4-brief.md`) required finding
a GitHub repo that (a) hosts an individual PNG per D2 item graphic, fetchable via raw URLs without
auth; (b) uses filenames mappable to the game's `invFile` keys (e.g. `invhaxu.png`), the lookup key
already present on every entry in `data/uniques.json` / `data/sets.json`; (c) is a plain public
asset collection, not a paywalled/private dump. The brief explicitly ruled out meeting the bar by
scraping d2r.world, maxroll.gg, diablo2.io, or any other fan database's CDN, even if their image
paths could be enumerated — that was treated as equivalent to finding no source at all.

## Search performed

Queries run via web search and GitHub code/repo search (2026-07-13):

- `github diablo 2 dc6 item inventory png extracted repository`
- `github d2 "invfile" png items repository`
- `diablo 2 item graphics png collection github open source`
- `d2planner github item icons sprites repository`
- `"invhax" OR "invaxe" png github raw`
- `diablo 2 resurrected item icons sprite sheet github open source dataset`
- `"d2-item-icons" OR "diablo2-icons" github repository png`
- `github awesome diablo2 resources item icons assets list`
- GitHub code search: `filename:invhaxu.png`, `filename:invhax`, `invhax extension:png` — all
  returned 0 results across all of public GitHub.

## Candidates evaluated and why each failed

| Candidate | What it actually is | Why it fails the criteria |
|---|---|---|
| `dexterrawlinson/D2R-MuleChecker` | Ships only tab-separated `.txt` data files extracted from D2R's CASC archive (weapons.txt, armor.txt, uniqueitems.txt, etc.) | No image files anywhere in the repo. (An early web-search summary claimed it "contains extracted inventory item sprites in PNG format" — verified false by fetching the repo tree directly via `gh api`; the README's directory diagram doesn't even mention PNGs. Search-engine summaries are not reliable evidence on their own.) |
| `dschu012/dc6png`, `gucio321/d2dc6`, `dzik87/d2r-sprites`, `AtsusaKai/D2RSpriteConverter`, `eezstreet/D2RModding-SpriteEdit`, `nebuladevs/pcx-to-spritesheet` | DC6/sprite **conversion tools** | Each requires the user to supply their own copy of D2R's game files (MPQ/CASC archives) as input. None ships pre-extracted PNGs — doing so would redistribute Blizzard's binary game assets directly, which none of these projects choose to do. |
| `JeffVanGorp/Hero-Editor-Assets` | Collection of Hero Editor `.d2i` **save files** (single items saved as save-editor payloads), organized by slot/rarity | Not images. `.d2i` files encode item stats for save editors, not graphics. |
| `DeadatNight/DeadZones-Diablo-2-Item-Pack` | Same as above — a pack of saved item files by item type/tier | Not images, same as Hero-Editor-Assets. |
| `jordanbrauer/diablo2-single-player-item-pack` | Same category — save-editor item files | Not images. |
| `d2planner/d2planner.github.io`, `eduardocmoreno/d2planner` | D2 character planner web app + its data refactoring scripts | Repo only contains `invfile`/`uniqueinvfile` as data *fields* (referenced by name in JS objects), not actual image assets. No PNG files present. |
| `blizzhackers/d2data`, `pinkufairy/D2R-Excel` | JSON/TSV game data (already vendored/used elsewhere in this project for stats) | Data only, no graphics — same category as MuleChecker. |
| `OpenDiablo2/OpenDiablo2` | Open-source game engine re-implementation | Explicitly does not ship or redistribute Blizzard's assets; requires a legally owned copy of the game to supply them at runtime. |
| icons8.com, iconarchive.com, Diablo Wiki (Fandom) image categories | Third-party icon galleries / wiki image hosting | Not GitHub raw-fetchable asset collections; wiki images are individual manual downloads with unclear per-file licensing/hosting stability, and are themselves fan-site derived — same category problem the brief rules out for d2r.world et al. |

## Why the pattern holds

Every extraction *tool* found treats the actual D2 sprite graphics as something the end user must
supply from their own legally-owned game install — none of them redistribute the converted PNGs
in the repo itself. This is consistent with the graphics being Blizzard-owned IP: publishing a
complete pre-extracted PNG-per-item set as an open "plain asset collection" would carry the same
copyright exposure as scraping a fan site's CDN, just hosted differently. No repo threading that
needle (open asset dump, not a conversion tool, not a save-file pack, not fan-site scraping) turned
up in this search.

## Outcome

No source met all three acceptance criteria. `public/items/inv/` ships empty. No fetch script was
written (writing one against a source that doesn't exist would leave an untested, unusable script
in the repo, which the task explicitly avoids).

The UI already degrades gracefully with zero icons (confirmed in Task 3): cards and detail views
render a bordered placeholder with the item-name initial when the icon file is missing. Nothing
downstream depends on this directory being populated.

## If a source turns up later

Re-run Step 1 of `.superpowers/sdd/task-4-brief.md` with a specific candidate repo in hand. If it
meets all three criteria, write `scripts/fetch-item-icons.mjs` to read `data/uniques.json` +
`data/sets.json`, collect distinct `invFile` values, and download `<RAW_BASE_URL>/<invFile>.png`
into this directory (skipping existing files), then add a `fetch:icons` script to `package.json`
and follow Steps 3–5 of the brief as written.

These images, if ever added, would be Diablo II game art © Blizzard Entertainment, used as
tolerated fan content (the same basis as every D2 fan database) — not covered by this repository's
open-source licensing. If Blizzard objects, delete this directory; the UI degrades gracefully to
text-only cards.
