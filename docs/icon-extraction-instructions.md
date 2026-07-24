# D2R Item Icon Extraction — Instructions for Claude Code (Windows)

## Context

This extracts item inventory icons from a legally-owned Diablo II: Resurrected install,
for personal/fan-project use in a D2R companion site. D2R's item icons are still classic
DC6 sprite files, so this is a two-step extraction: pull the raw files out of D2R's CASC
archive with CascView, then convert DC6 → PNG with the `dc6png` npm package.

**Prerequisite check before starting:** confirm Diablo II: Resurrected is actually
installed on this machine and locate the install folder (commonly
`C:\Program Files (x86)\Diablo II Resurrected`, or wherever Battle.net put it — if
unsure, open the Battle.net launcher, right-click D2R, and choose **Show in Explorer**).

---

## Step 1 — Extract raw game files with CascView

CascView is a GUI tool from the D2-modding community (zezula.net, no relation to
Blizzard) for browsing/extracting Blizzard's CASC archive format.

1. Download CascView: http://www.zezula.net/en/casc/main.html — get the latest CascView
   zip, unzip it to a scratch folder (e.g. `C:\tools\CascView\`).
2. Launch `CascView.exe`.
3. **File → Open Storage**, and point it at the D2R install folder confirmed above.
4. In the file tree on the left, navigate to `data\global\items\`.
5. Select all files in that folder (Ctrl+A), right-click → **Extract**, and extract to
   `C:\d2r-extract\items\` (create this folder if it doesn't exist).
6. Separately, navigate to `data\global\palette\ACT1\`, select `pal.dat`, right-click →
   **Extract**, and extract it to `C:\d2r-extract\pal.dat`. This palette file is required
   for the DC6→PNG conversion to know which colors to use.

You do **not** need to extract the full `global`/`hd`/`local` folders (~30GB total) —
just these two items.

**Verification after Step 1** (run in PowerShell):
```powershell
Get-ChildItem "C:\d2r-extract\items\" -Filter *.dc6 | Measure-Object | Select-Object Count
Test-Path "C:\d2r-extract\pal.dat"
```
Expected: a count in the hundreds (there are 692 base item types plus unique/set variants
that share the same base sprites, so several hundred distinct `.dc6` files is normal),
and `Test-Path` returns `True`. If the count is 0, the extraction step was skipped or
pointed at the wrong folder — go back to step 4/5.

---

## Step 2 — Convert DC6 → PNG with dc6png

1. Confirm Node.js is installed: `node --version` (any recent LTS, e.g. v20+). If not
   installed, get it from https://nodejs.org/.
2. Install the converter globally:
   ```powershell
   npm install -g dschu012/dc6png
   ```
3. Run the conversion:
   ```powershell
   dc6png -p "C:\d2r-extract\pal.dat" -f "C:\d2r-extract\items\*.dc6" -o "C:\d2r-extract\png"
   ```
4. This produces one PNG per item graphic in `C:\d2r-extract\png\`, named to match the
   original DC6 filename (e.g. `invhaxu.dc6` → `invhaxu.png`). These filenames already
   match the `invFile` key used throughout this project's catalog data
   (`data/uniques.json`/`data/sets.json`), so **no renaming is needed**.

**Verification after Step 2** (run in PowerShell):
```powershell
Get-ChildItem "C:\d2r-extract\png\" -Filter *.png | Measure-Object | Select-Object Count
Get-ChildItem "C:\d2r-extract\png\" -Filter *.png | Select-Object -First 5 Name
```
Expected: the PNG count roughly matches the `.dc6` count from Step 1's verification (a
few may fail to convert — that's fine, note how many if so), and the sample filenames
look like `invhaxu.png`, `invaxe.png`, etc. — lowercase, `inv`-prefixed.

Spot-check that at least one PNG actually opens as a real image (not a 0-byte or
corrupted file):
```powershell
$sample = Get-ChildItem "C:\d2r-extract\png\" -Filter *.png | Select-Object -First 1
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($sample.FullName)
"$($sample.Name): $($img.Width)x$($img.Height)"
```
Expected: prints a filename and non-zero width/height (D2 item sprites are typically
small, e.g. under 150x150 pixels).

---

## Step 3 — Package the result

Zip the entire `C:\d2r-extract\png\` folder:
```powershell
Compress-Archive -Path "C:\d2r-extract\png\*" -DestinationPath "C:\d2r-extract\item-icons.zip"
```

Report back: the final PNG count, the zip file location and size, and the results of the
verification checks above. Send the zip back (attach in chat, or share a cloud-drive
link) — from there, dropping the files into the project's `public/items/inv/` directory
and wiring up the fetch/verification is handled on the other end. No further coding
needed on this machine.

## If something goes wrong

- **CascView can't open the storage / errors on launch**: confirm the path points at the
  D2R install root (the folder containing `Diablo II Resurrected.exe`), not a
  subdirectory.
- **`dc6png` command not found after install**: the global npm bin folder may not be on
  PATH — try `npx dschu012/dc6png` instead, or run
  `npm config get prefix` and add that path's `node_modules\.bin` (or the prefix itself
  on Windows) to your PATH.
- **Very few or zero `.dc6` files extracted**: double check step 4 selected the *files*
  inside `data\global\items\`, not the folder itself, and that "Extract" (not "Extract
  keeping directory structure" pointed elsewhere) was used.
