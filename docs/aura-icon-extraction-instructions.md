# D2R Paladin Aura Skill Icon Extraction — Instructions for Claude Code (Windows)

## Context

This extracts the 20 Paladin aura skill icons from a legally-owned Diablo II:
Resurrected install, for the same personal/fan-project use as the earlier item-icon
extraction (see `docs/icon-extraction-instructions.md` for that precedent — same
tooling, same licensing basis: self-extracted from your own game copy, Blizzard game
art used as personal non-commercial fan content).

Skill icons live in a **different** game-data folder than item icons
(`data\global\ui\SKILLICONS\` rather than `data\global\items\`), and are typically one
DC6 file per skill rather than one per item — but confirm this by looking rather than
assuming, since the exact folder layout can vary by game version.

The 20 auras needed (Paladin's Defensive Auras + Offensive Auras skill tabs), by their
internal skill name:

```
Prayer, Resist Fire, Defiance, Resist Cold, Cleansing, Resist Lightning, Vigor,
Meditation, Redemption, Salvation,
Might, Blessed Aim, Concentration, Holy Fire, Holy Freeze, Holy Shock, Sanctuary,
Fanaticism, Conviction, Thorns
```

---

## Step 1 — Locate the skill icon files with CascView

1. Launch CascView (already installed from the earlier item-icon extraction — if not,
   see `docs/icon-extraction-instructions.md` Step 1 for the download link) and open
   the D2R install storage, same as before.
2. Navigate to `data\global\ui\SKILLICONS\`. Look for a `Paladin` subfolder (or
   similarly named — could be `PAL`, `paladin`, etc.) or a single sprite sheet file
   named something like `paladin.dc6`/`palskilltree.dc6`.
3. **Report back what you actually find here before extracting anything** — the
   exact folder name, and whether it's ~20 individual small DC6 files (one per skill)
   or one larger sprite-sheet DC6 file containing multiple icons. This determines the
   next step, so don't guess past this point.

**If it's individual per-skill files** (expected case — this is the common D2
layout): the filenames should closely match the skill names above (spaces/
punctuation may be stripped, e.g. `HolyFire.dc6` or `holyfire.dc6`). Select and
extract every file in that folder to `C:\d2r-extract\aura-icons\` (create the folder
first), plus confirm you have the same `pal.dat` palette file already extracted from
the earlier item-icon run (re-extract from `data\global\palette\ACT1\pal.dat` if
that folder no longer exists).

**If it's a single sprite sheet instead**: stop and report back the exact filename
and its frame count (CascView or a DC6 viewer should show this) — slicing a sprite
sheet into 20 individual named icons needs the frame-to-skill mapping confirmed
first, which is a different, follow-up step. Don't attempt to guess frame order.

---

## Step 2 — Convert DC6 → PNG with dc6png

(Same tool as the item-icon extraction — skip `npm install -g dschu012/dc6png` if
already installed.)

```powershell
dc6png -p "C:\d2r-extract\pal.dat" -f "C:\d2r-extract\aura-icons\*.dc6" -o "C:\d2r-extract\aura-icons-png"
```

**Verification** (run in PowerShell):
```powershell
Get-ChildItem "C:\d2r-extract\aura-icons-png\" -Filter *.png | Measure-Object | Select-Object Count
Get-ChildItem "C:\d2r-extract\aura-icons-png\" -Filter *.png | Select-Object Name
```
Expected: a count around 20 (one per aura — if it's noticeably more, the folder may
have included non-Paladin or non-aura skill icons too; that's fine, just report the
full list), and filenames that map recognizably to the 20 aura names above.

Spot-check that at least one PNG opens as a real image:
```powershell
$sample = Get-ChildItem "C:\d2r-extract\aura-icons-png\" -Filter *.png | Select-Object -First 1
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($sample.FullName)
"$($sample.Name): $($img.Width)x$($img.Height)"
```
Expected: prints a filename and non-zero width/height (skill icons are typically
small and square, e.g. 32x32 or so).

---

## Step 3 — Package and report back

```powershell
Compress-Archive -Path "C:\d2r-extract\aura-icons-png\*" -DestinationPath "C:\d2r-extract\aura-icons.zip"
```

Report back: what you found in Step 1 (folder layout, exact filenames), the final PNG
count and filenames, the verification results, and the zip's location/size. Send the
zip back the same way as the item icons (attach in chat or share a cloud-drive link)
— dropping the files into this project and wiring up the mapping/page is handled on
the other end. No further coding needed on this machine.

## If something goes wrong

- **No `SKILLICONS` folder, or nothing Paladin-related inside it**: report the actual
  folder structure you see under `data\global\ui\` instead of guessing — skill icon
  layout can differ from what's documented above, and it's better to look together
  than extract the wrong thing.
- **`dc6png`/CascView issues**: see the troubleshooting section at the bottom of
  `docs/icon-extraction-instructions.md` — same tools, same fixes apply.
