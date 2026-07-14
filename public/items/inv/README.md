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

The UI already degrades gracefully with zero icons (confirmed in Task 3): when an icon file is
missing or fails to load, the icon element simply doesn't render — no placeholder box, no initial
letter, just absence of an icon. Cards display only the item name and subtitle text; the detail view
never attempts to render icons. Nothing downstream depends on this directory being populated.

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

## Self-extraction from your own D2R install (the actual path forward)

No redistributable source exists (see above) — but if you own a legal copy of D2R, you can extract
your **own** copy's item icons for personal, non-commercial use, the same basis every D2 fan
database's icons ultimately rest on. Confirmed: D2R's item inventory icons are still stored as
classic DC6 sprite files (remastered artwork, same file format) — see
[Blizzard forum discussion](https://us.forums.blizzard.com/en/d2r/t/missing-item-icons-in-inventory-after-latest-patch-nvidia/172301)
confirming DC6 is still the active inventory-icon format in D2R. That means this is a two-step
extraction, not a 3D-texture pipeline. This must be done on the machine D2R is actually installed
on (Windows).

### Step 1 — Extract the raw game files with CascView

D2R stores its assets in Blizzard's CASC archive format, not as loose files — CascView is the
standard, GUI-based tool the D2 modding community uses to browse and extract it.

1. Download CascView from [zezula.net/en/casc/main.html](http://www.zezula.net/en/casc/main.html)
   (a modding-community tool, no relation to Blizzard) and unzip it.
2. Open CascView, click **File → Open Storage**, and point it at your D2R install folder (e.g.
   `C:\Program Files (x86)\Diablo II Resurrected`, or wherever Battle.net installed it — right-click
   D2R in the Battle.net launcher → **Show in Explorer** if unsure).
3. In the CascView file tree, navigate to `data\global\items\`.
4. Select all files in that folder, right-click → **Extract**, and extract to a scratch folder on
   your machine, e.g. `C:\d2r-extract\items\`.
5. Separately, navigate to `data\global\palette\ACT1\` and extract `pal.dat` to the same scratch
   folder (e.g. `C:\d2r-extract\pal.dat`) — the DC6→PNG conversion needs this palette file to know
   which colors to use.

You do **not** need to extract the full `global`/`hd`/`local` data folders (~30GB) — just the two
items above are enough for item icons specifically.

### Step 2 — Convert DC6 → PNG with dc6png

1. Install [Node.js](https://nodejs.org/) if you don't already have it (any recent LTS version).
2. Open a terminal (PowerShell or Command Prompt) and install the converter:
   ```
   npm install -g dschu012/dc6png
   ```
3. Run it against the extracted item files:
   ```
   dc6png -p "C:\d2r-extract\pal.dat" -f "C:\d2r-extract\items\*.dc6" -o "C:\d2r-extract\png"
   ```
4. `C:\d2r-extract\png\` should now contain one PNG per item graphic, named to match the DC6
   filenames (e.g. `invhaxu.dc6` → `invhaxu.png`) — these names already match the `invFile` key on
   every entry in `data/uniques.json`/`data/sets.json`, so no renaming should be needed.

### Step 3 — Send the files back

Zip up the `png` folder and send it over (attach in chat, or share a cloud-drive link) — from
there, dropping the files into this directory (`public/items/inv/`, one PNG per `invFile` name) and
wiring up the fetch/verification is something I can finish directly. No need to write any code
yourself.
