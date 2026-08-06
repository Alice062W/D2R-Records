# Quests Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Quests" tab under D2R Academy showing all 27 main Diablo II quests (Acts 1-5), grouped by Act, each with its real in-game icon, journal text, a separated Rewards block, and an optional/required indicator — backed by a new `quests.json` extracted with all 14 game languages for future site-wide localization.

**Architecture:** A one-time Python extraction script decodes `questdone.dc6` (confirmed via direct byte-level inspection: 27 frames, one ornate icon per quest, matching the user's reference screenshot exactly) into 27 PNGs, mapped in game order to quest keys from `quests.json`'s string table. A second script builds the all-language `quests.json` (extract folder) and the site-facing 3-locale `data/quests.json`. The site page follows the existing `CubeRecipeList.tsx`/`[category]/page.tsx` pattern: Act-tab filtering, an icon grid, and a selected-quest detail panel.

**Tech Stack:** Python 3 + Pillow (already installed) for DC6 decoding, Next.js 16 (static export) + next-intl for the site, Vitest + Testing Library for tests — all matching the existing stack, no new dependencies.

---

## Confirmed facts from research (do not re-derive these)

- `C:\d2r-hd-all\data\data\data\global\ui\menu\questdone.dc6` is a classic DC6 sprite sheet, 1 direction × 27 frames, each 72×86px — **verified by direct decode** to be 27 visually distinct ornate quest-icon badges (not an animation — `questbutton.dc6`, same frame count, WAS confirmed to be an animation of a single button, so don't reuse that one).
- DC6 binary layout (verified against this exact file):
  - Header: `version:int32, flags:int32, encoding:int32, termination:4 bytes(0xEE×4), directions:int32, framesPerDir:int32` (24 bytes)
  - Then `directions*framesPerDir` int32 frame offsets.
  - Each frame at its offset: `flip:int32, width:int32, height:int32, offsetX:int32, offsetY:int32, unknown:int32, nextBlock:int32, length:int32` (32-byte frame header), then `length` bytes of RLE-encoded indexed-color pixel data.
  - RLE decode (verified working, produces correct visible icons): read bytes; `0x80` = end of row (reset x to 0, y -= 1); high bit set (`b & 0x80`, b != 0x80) = transparent run of `b & 0x7f` pixels (skip); otherwise `b` = count of following bytes, each a palette index, drawn left-to-right. Canvas origin: y starts at `height-1` (bottom-up).
  - Palette: `C:\d2r-hd-all\data\data\data\global\palette\units\pal.dat` — 256 × 3 bytes RGB, no header. Verified: produces correct-looking grayscale/stone icon art (matches reference screenshot's engraved-stone look).
- 27 frames = 6 (Act1) + 6 (Act2) + 6 (Act3) + 3 (Act4) + 6 (Act5) main quests — matches the standard, well-documented D2 quest count per Act.
- `C:\d2r-hd-all\data\data\data\local\lng\strings\quests.json` has one entry per string `Key`. Quest **names** are the un-suffixed keys per act: `qstsa{act}q1`..`q6` (Act4 only has `q1`..`q3`); `qstsa{act}q0` is each Act's "Prologue" flavor text, not a real quest — exclude it. **Journal/objective entries** are the same prefix with a numeric/letter suffix, e.g. `qstsa2q31`, `qstsa2q31a` belong to quest `qstsa2q3`; grouped by string-prefix match and kept in file order (already chronological in the source JSON).
- Each entry has all 14 language fields: `enUS, zhTW, deDE, esES, frFR, itIT, koKR, plPL, esMX, jaJP, ptBR, ruRU, zhCN` (+ `id`, `Key`). Site convention (matching `cube-recipes.json`) uses `en`/`zh-TW`/`zh-CN` keys — the extract-folder `quests.json` keeps **all** languages (mapped to the site's own lang-code style, e.g. `de`, `es`, `fr`, `it`, `ko`, `pl`, `es-MX` or `esMX` — pick one and use it consistently, see Task 2) for future expansion; the site-facing copy only pulls `en`/`zh-TW`/`zh-CN`.

## Curated fact table (verified against standard, stable D2 quest documentation — cross-check during Task 2's manual spot-check step, don't blindly trust)

| Act | # | Quest name (en) | Key prefix | Optional? |
|---|---|---|---|---|
| 1 | 1 | Den of Evil | qstsa1q1 | optional |
| 1 | 2 | Sisters' Burial Grounds | qstsa1q2 | required |
| 1 | 3 | Tools of the Trade | qstsa1q3 | optional |
| 1 | 4 | The Search for Cain | qstsa1q4 | required |
| 1 | 5 | The Forgotten Tower | qstsa1q5 | optional |
| 1 | 6 | Sisters to the Slaughter | qstsa1q6 | required |
| 2 | 1 | Radament's Lair | qstsa2q1 | optional |
| 2 | 2 | The Horadric Staff | qstsa2q2 | required |
| 2 | 3 | Tainted Sun | qstsa2q3 | optional |
| 2 | 4 | The Arcane Sanctuary | qstsa2q4 | required |
| 2 | 5 | The Summoner | qstsa2q5 | required |
| 2 | 6 | The Seven Tombs | qstsa2q6 | required |
| 3 | 1 | The Golden Bird | qstsa3q1 | optional |
| 3 | 2 | Blade of the Old Religion | qstsa3q2 | optional |
| 3 | 3 | Khalim's Will | qstsa3q3 | required |
| 3 | 4 | Lam Esen's Tome | qstsa3q4 | optional |
| 3 | 5 | The Blackened Temple | qstsa3q5 | required |
| 3 | 6 | The Guardian | qstsa3q6 | required |
| 4 | 1 | The Fallen Angel | qstsa4q1 | required |
| 4 | 2 | Terror's End | qstsa4q2 | required |
| 4 | 3 | Hell's Forge | qstsa4q3 | optional |
| 5 | 1 | Siege on Harrogath | qstsa5q1 | required |
| 5 | 2 | Rescue on Mount Arreat | qstsa5q2 | optional |
| 5 | 3 | Prison of Ice | qstsa5q3 | optional |
| 5 | 4 | Betrayal of Harrogath | qstsa5q4 | required |
| 5 | 5 | Rite of Passage | qstsa5q5 | optional |
| 5 | 6 | Eve of Destruction | qstsa5q6 | required |

Icon order: this table's row order (Act1 q1..q6, Act2 q1..q6, ...) is the icon-grid/`questdone.dc6` frame order (frame 0 = Act1 q1, frame 26 = Act5 q6) — **verify this alignment visually in Task 1** before trusting it (e.g. frame 0 should look like a skull/demon-face motif fitting "Den of Evil").

## Known real item/skill rewards (verify codes against `item_database.json`/skill assets in Task 2 before using — do not hardcode unverified codes)

Most quests give no fixed item (mercenary access, NPC service, waypoint, a choice of skill point, discounted shop, or pure story progress) — those get `rewardImage: null`. The exceptions with an actual fixed reward item to look up:
- **Khalim's Will** (Act3 q3): the assembled unique weapon itself — already has a confirmed HD icon `super_khalim_flail` (see `data/cube-recipes.json` recipe-1's `outputHdIcon`). Use this directly, no lookup needed.
- **The Golden Bird** (Act3 q1): rewards a **Potion of Life** (permanent +20 life). Look up its HD icon by searching `item_database.json` for a life-potion / quest-potion entry before Task 2 finalizes this row.
- **Rite of Passage** (Act5 q5) and/or **Betrayal of Harrogath**: Act 5 also has a Potion of Life-style permanent-stat reward on one of its quests — verify which one and its item code from `quests.json`'s own reward text before assigning.

Do not guess any other item codes — leave `rewardImage: null` unless the quest's own reward text names a specific item you can verify in `item_database.json`.

---

## Task 1: DC6 decoder + questdone.dc6 icon extraction

**Files:**
- Create: `pipeline/extract_questicons.py`
- Create (output): `C:\d2r-extract\hd-png\quests\icons\qstsa{act}q{n}.png` (27 files)
- Create (output, mirrored for the site): `D2R-Records/public/quests/icons/qstsa{act}q{n}.png`

- [ ] **Step 1: Write the DC6 decoder + extraction script**

```python
# pipeline/extract_questicons.py
"""
Decodes questdone.dc6 (27 ornate per-quest icon frames, verified via direct
byte inspection during design -- see docs/superpowers/specs/2026-08-06-quests-page-design.md)
into 27 individual PNGs, named by their quest string-table key.
"""
import struct
import os
from PIL import Image

DC6_PATH = r'C:\d2r-hd-all\data\data\data\global\ui\menu\questdone.dc6'
PALETTE_PATH = r'C:\d2r-hd-all\data\data\data\global\palette\units\pal.dat'
EXTRACT_OUT = r'C:\d2r-extract\hd-png\quests\icons'
SITE_OUT = os.path.join(os.path.dirname(__file__), '..', 'D2R-Records', 'public', 'quests', 'icons')

# Frame order verified to match Act1 q1..q6, Act2 q1..q6, Act3 q1..q6,
# Act4 q1..q3, Act5 q1..q6 (27 total) -- see plan's curated fact table.
QUEST_KEYS_IN_ORDER = (
    [f'qstsa1q{n}' for n in range(1, 7)]
    + [f'qstsa2q{n}' for n in range(1, 7)]
    + [f'qstsa3q{n}' for n in range(1, 7)]
    + [f'qstsa4q{n}' for n in range(1, 4)]
    + [f'qstsa5q{n}' for n in range(1, 7)]
)


def load_palette(path):
    with open(path, 'rb') as f:
        data = f.read()
    return [(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) for i in range(256)]


def decode_dc6_frames(path):
    with open(path, 'rb') as f:
        data = f.read()
    directions, frames_per_dir = struct.unpack('<ii', data[16:24])
    total = directions * frames_per_dir
    offsets = struct.unpack('<%di' % total, data[24:24 + 4 * total])
    frames = []
    for off in offsets:
        width, height = struct.unpack('<ii', data[off + 4:off + 12])
        length = struct.unpack('<i', data[off + 28:off + 32])[0]
        pixdata = data[off + 32:off + 32 + length]
        frames.append((width, height, pixdata))
    return frames


def render_frame(width, height, pixdata, palette):
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    px = img.load()
    x, y = 0, height - 1
    i, n = 0, len(pixdata)
    while i < n and y >= 0:
        b = pixdata[i]
        i += 1
        if b == 0x80:
            x = 0
            y -= 1
        elif b & 0x80:
            x += (b & 0x7f)
        else:
            for _ in range(b):
                if i >= n:
                    break
                idx = pixdata[i]
                i += 1
                if 0 <= x < width and y >= 0:
                    r, g, bl = palette[idx]
                    px[x, y] = (r, g, bl, 255)
                x += 1
    return img


def main():
    pal = load_palette(PALETTE_PATH)
    frames = decode_dc6_frames(DC6_PATH)
    assert len(frames) == 27, f'expected 27 quest icon frames, got {len(frames)}'
    os.makedirs(EXTRACT_OUT, exist_ok=True)
    os.makedirs(SITE_OUT, exist_ok=True)
    for key, (width, height, pixdata) in zip(QUEST_KEYS_IN_ORDER, frames):
        img = render_frame(width, height, pixdata, pal)
        img.save(os.path.join(EXTRACT_OUT, f'{key}.png'))
        img.save(os.path.join(SITE_OUT, f'{key}.png'))
    print(f'Extracted {len(frames)} quest icons to {EXTRACT_OUT} and {SITE_OUT}')


if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Run it**

Run: `python pipeline/extract_questicons.py`
Expected: `Extracted 27 quest icons to ...` with no assertion error.

- [ ] **Step 3: Visually verify frame-order alignment**

Open `C:\d2r-extract\hd-png\quests\icons\qstsa1q1.png` (should be "Den of Evil" — expect a demonic/skull motif) and `qstsa3q3.png` (Khalim's Will — expect a wheel/eye motif, matching the reference screenshot's "II" tab wheel-eye icon at position 4 of that 6-icon grid, which is `qstsa2q...` — re-check against the actual screenshot's Act tab (`II` = Act 2) icons, since the screenshot shows Act 2's 6 icons). Confirm by eye that icons look distinct and plausible per quest; if the order looks shifted, adjust `QUEST_KEYS_IN_ORDER` and re-run.

- [ ] **Step 4: Commit**

```bash
cd D2R-Records
git add pipeline/extract_questicons.py public/quests/icons
git commit -m "Extract per-quest icons from questdone.dc6

Decoded the classic questdone.dc6 sprite sheet (27 frames, one ornate
icon per main quest, verified by direct DC6 header/frame inspection)
into individual PNGs, matching the reference layout the user supplied
(MyInput/IMG_9856.PNG).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

Note: `pipeline/` is not a git repo (per project convention — only `D2R-Records/` is), so `extract_questicons.py` itself isn't committed by this command; only the site's mirrored PNGs are. Confirm this matches existing pipeline-script handling (other scripts like `build_terms_db.py` are likewise uncommitted, living only in the local `pipeline/` folder) before treating this as unusual.

---

## Task 2: Build `quests.json` (extract folder, all languages)

**Files:**
- Create: `pipeline/build_quests_db.py`
- Create (output): `C:\d2r-extract\hd-png\data\quests.json`

- [ ] **Step 1: Verify the two unresolved reward-item codes**

Before writing the reward table, look up the exact HD icon codes:

```bash
python3 -c "
import json
with open(r'C:\d2r-extract\hd-png\item_database.json', encoding='utf-8') as f:
    db = json.load(f)
# search for likely quest-reward potion / unique entries by name
for code, item in db.items() if isinstance(db, dict) else enumerate(db):
    pass
"
```

Adjust this to the actual `item_database.json` shape (dict-of-code or list — confirm by reading the first 50 lines of the file), then search its name fields for `Potion of Life` (Golden Bird reward) and cross-reference `C:\d2r-hd-all\...\strings\quests.json`'s `qstsa3q1*` and `qstsa5q5*`/`qstsa5q4*` reward-line text to identify the second Act5 reward item by name. Record the two confirmed `hdIcon` values for use in Step 2's `QUEST_REWARDS` table. Do not proceed to Step 2 with guessed codes.

- [ ] **Step 2: Write the build script**

```python
# pipeline/build_quests_db.py
"""
Builds quests.json (all 14 game languages) from the raw quests string
table, plus the curated Act/optional/icon/reward metadata established in
docs/superpowers/plans/2026-08-06-quests-page.md.
"""
import json
import os

STRINGS_PATH = r'C:\d2r-hd-all\data\data\data\local\lng\strings\quests.json'
OUT_PATH = r'C:\d2r-extract\hd-png\data\quests.json'

# Game string lang-code -> site's lang-code convention.
LANG_MAP = {
    'enUS': 'en', 'zhTW': 'zh-TW', 'zhCN': 'zh-CN', 'deDE': 'de',
    'esES': 'es', 'esMX': 'es-MX', 'frFR': 'fr', 'itIT': 'it',
    'jaJP': 'ja', 'koKR': 'ko', 'plPL': 'pl', 'ptBR': 'pt', 'ruRU': 'ru',
}

# (act, n, optional) in quest order -- matches questdone.dc6 frame order.
QUEST_META = (
    [(1, n, opt) for n, opt in zip(range(1, 7), [True, False, True, False, True, False])]
    + [(2, n, opt) for n, opt in zip(range(1, 7), [True, False, True, False, False, False])]
    + [(3, n, opt) for n, opt in zip(range(1, 7), [True, True, False, True, False, False])]
    + [(4, n, opt) for n, opt in zip(range(1, 4), [False, False, True])]
    + [(5, n, opt) for n, opt in zip(range(1, 7), [False, True, True, False, True, False])]
)

# Verified item/skill reward icons only -- everything else stays None.
# 'golden_bird' and 'act5_reward' filled in from Task 2 Step 1's lookup.
QUEST_REWARDS = {
    'qstsa3q3': 'super_khalim_flail',  # Khalim's Will -- confirmed via cube-recipes.json recipe-1
    # 'qstsa3q1': '<verified Potion of Life hdIcon>',
    # '<verified Act5 reward quest key>': '<verified hdIcon>',
}


def localize(entry):
    return {LANG_MAP[k]: v for k, v in entry.items() if k in LANG_MAP}


def main():
    with open(STRINGS_PATH, encoding='utf-8-sig') as f:
        strings = json.load(f)
    by_key = {e['Key']: e for e in strings}

    quests = []
    for act, n, optional in QUEST_META:
        key = f'qstsa{act}q{n}'
        name_entry = by_key.get(key)
        if name_entry is None:
            raise KeyError(f'missing quest name entry for {key}')
        # Journal/objective entries share this key as a prefix, excluding
        # the name entry itself, in source-file order.
        objective_keys = [
            e['Key'] for e in strings
            if e['Key'] != key and e['Key'].startswith(key) and not e['Key'].startswith(f'qstsa{act}qt')
        ]
        objectives = [localize(by_key[k]) for k in objective_keys]

        quests.append({
            'id': name_entry['id'],
            'key': key,
            'act': act,
            'order': n,
            'optional': optional,
            'icon': f'quests/icons/{key}.png',
            'rewardImage': (f'items/hd/{QUEST_REWARDS[key]}.png' if key in QUEST_REWARDS else None),
            'name': localize(name_entry),
            'objectives': objectives,
        })

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(quests, f, ensure_ascii=False, indent=2)
    print(f'Wrote {len(quests)} quests to {OUT_PATH}')


if __name__ == '__main__':
    main()
```

- [ ] **Step 3: Run it and sanity-check**

Run: `python pipeline/build_quests_db.py`
Expected: `Wrote 27 quests to C:\d2r-extract\hd-png\data\quests.json`

Then manually inspect the output for `qstsa2q1` (Radament's Lair) and confirm its `objectives` array's `en` text matches the three lines the user's screenshot showed ("Find Radament's Lair...", "Kill Radament.", "Return to Atma for a reward.").

- [ ] **Step 4: Commit**

```bash
cd D2R-Records
git add -A
git commit -m "Build all-language quests.json in extract folder

27 main quests (Acts 1-5), all 14 game languages, curated optional-quest
flags and verified reward-item icons (Khalim's Will confirmed against
existing cube-recipes.json data).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(Same note as Task 1: the `pipeline/` script itself lives outside the git repo; only downstream JSON that gets copied into `D2R-Records/data/` in Task 3 ends up committed.)

---

## Task 3: Site-facing `data/quests.json`

**Files:**
- Create: `D2R-Records/data/quests.json`

- [ ] **Step 1: Derive the site copy (3 locales only, matches `cube-recipes.json` convention)**

```bash
python3 -c "
import json
with open(r'C:\d2r-extract\hd-png\data\quests.json', encoding='utf-8') as f:
    quests = json.load(f)

def trim_langs(obj):
    return {k: obj[k] for k in ('en', 'zh-TW', 'zh-CN') if k in obj}

site_quests = []
for q in quests:
    site_quests.append({
        'id': q['id'],
        'key': q['key'],
        'act': q['act'],
        'order': q['order'],
        'optional': q['optional'],
        'icon': q['icon'],
        'rewardImage': q['rewardImage'],
        'name': trim_langs(q['name']),
        'objectives': [trim_langs(o) for o in q['objectives']],
    })

with open('D2R-Records/data/quests.json', 'w', encoding='utf-8') as f:
    json.dump(site_quests, f, ensure_ascii=False, indent=2)
print(f'Wrote {len(site_quests)} site quests')
"
```

- [ ] **Step 2: Verify shape matches what Task 4's component expects**

Run: `python3 -c "import json; d = json.load(open('D2R-Records/data/quests.json', encoding='utf-8')); print(len(d), d[0].keys())"`
Expected: `27 dict_keys(['id', 'key', 'act', 'order', 'optional', 'icon', 'rewardImage', 'name', 'objectives'])`

- [ ] **Step 3: Commit**

```bash
cd D2R-Records
git add data/quests.json
git commit -m "Add site-facing quests.json (en/zh-TW/zh-CN)

Trimmed from the all-language extract-folder quests.json to the site's
3 currently-supported locales, matching cube-recipes.json's convention.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: `QuestList` component + test

**Files:**
- Create: `D2R-Records/src/components/quests/QuestList.tsx`
- Create: `D2R-Records/src/components/quests/QuestList.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// D2R-Records/src/components/quests/QuestList.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import QuestList from './QuestList';
import messages from '../../../messages/en.json';

const sampleQuests = [
  {
    id: 923, key: 'qstsa2q1', act: 2, order: 1, optional: true,
    icon: 'quests/icons/qstsa2q1.png', rewardImage: null,
    name: { en: "Radament's Lair", 'zh-TW': 'x', 'zh-CN': 'x' },
    objectives: [
      { en: "Find Radament's Lair in the Lut Gholein sewers.", 'zh-TW': 'x', 'zh-CN': 'x' },
      { en: 'Kill Radament.', 'zh-TW': 'x', 'zh-CN': 'x' },
    ],
  },
  {
    id: 924, key: 'qstsa2q2', act: 2, order: 2, optional: false,
    icon: 'quests/icons/qstsa2q2.png', rewardImage: null,
    name: { en: 'The Horadric Staff', 'zh-TW': 'x', 'zh-CN': 'x' },
    objectives: [
      { en: 'Retrieve the Staff of Kings.', 'zh-TW': 'x', 'zh-CN': 'x' },
    ],
  },
  {
    id: 899, key: 'qstsa1q1', act: 1, order: 1, optional: true,
    icon: 'quests/icons/qstsa1q1.png', rewardImage: null,
    name: { en: 'Den of Evil', 'zh-TW': 'x', 'zh-CN': 'x' },
    objectives: [{ en: 'Clear the Den of Evil.', 'zh-TW': 'x', 'zh-CN': 'x' }],
  },
];

describe('QuestList', () => {
  it('shows only the selected Act\'s quest icons', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    // Defaults to Act 1 -- only Den of Evil visible.
    expect(screen.getByRole('button', { name: /Den of Evil/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Radament's Lair/i })).not.toBeInTheDocument();
  });

  it('switches Act and shows that Act\'s quests', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'II' }));
    expect(screen.getByRole('button', { name: /Radament's Lair/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /The Horadric Staff/i })).toBeInTheDocument();
  });

  it('selecting a quest shows its objectives and an Optional badge', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Den of Evil/i }));
    expect(screen.getByText('Clear the Den of Evil.')).toBeInTheDocument();
    expect(screen.getByText(messages.Items.questOptionalLabel)).toBeInTheDocument();
  });

  it('required quests do not show the Optional badge', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'II' }));
    fireEvent.click(screen.getByRole('button', { name: /The Horadric Staff/i }));
    expect(screen.queryByText(messages.Items.questOptionalLabel)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/quests/QuestList.test.tsx`
Expected: FAIL — `Cannot find module './QuestList'`

- [ ] **Step 3: Add the missing i18n keys**

Add to `D2R-Records/messages/en.json` inside the existing `"Items"` object (after `cubeRecipesPageSubtitle`, matching existing key style):

```json
    "questsPageTitle": "Quests",
    "questsPageSubtitle": "Browse every main quest in Diablo II: Resurrected, by Act.",
    "questActLabel_1": "I",
    "questActLabel_2": "II",
    "questActLabel_3": "III",
    "questActLabel_4": "IV",
    "questActLabel_5": "V",
    "questOptionalLabel": "Optional",
    "questRewardsLabel": "Rewards",
    "questNoReward": "No item reward for this quest."
```

Add the equivalent translated block to `messages/zh-TW.json` and `messages/zh-CN.json` (same key names, values translated: e.g. `questsPageTitle`: "任務" / "任务", `questOptionalLabel`: "支線" / "支线", `questRewardsLabel`: "獎勵" / "奖励").

- [ ] **Step 4: Write the component**

```tsx
// D2R-Records/src/components/quests/QuestList.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type questsJson from '../../../data/quests.json';
import { BASE_PATH } from '@/lib/basePath';

type Quest = (typeof questsJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

const ACTS = [1, 2, 3, 4, 5] as const;

function QuestIcon({ icon }: { icon: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/${icon}`}
      alt=""
      aria-hidden="true"
      className="w-16 h-16 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function RewardImage({ rewardImage }: { rewardImage: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!rewardImage || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/${rewardImage}`}
      alt=""
      aria-hidden="true"
      className="w-10 h-10 object-contain inline-block"
      onError={() => setFailed(true)}
    />
  );
}

export default function QuestList({ quests, locale }: { quests: Quest[]; locale: Locale }) {
  const t = useTranslations('Items');
  const [act, setAct] = useState<(typeof ACTS)[number]>(1);
  const actQuests = quests.filter(q => q.act === act).sort((a, b) => a.order - b.order);
  const [selectedKey, setSelectedKey] = useState<string | null>(actQuests[0]?.key ?? null);

  function selectAct(nextAct: (typeof ACTS)[number]) {
    setAct(nextAct);
    const first = quests.find(q => q.act === nextAct);
    setSelectedKey(first?.key ?? null);
  }

  const selected = quests.find(q => q.key === selectedKey) ?? null;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="flex gap-2 justify-center">
        {ACTS.map(a => (
          <button
            key={a}
            type="button"
            onClick={() => selectAct(a)}
            aria-pressed={a === act}
            className={`px-4 py-2 rounded-md border text-sm font-semibold transition-colors ${
              a === act
                ? 'bg-gold-bright text-black border-gold-bright'
                : 'bg-panel border-panel-border text-parchment hover:border-gold-bright'
            }`}
          >
            {t(`questActLabel_${a}` as never)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-panel-alt border border-panel-border rounded-xl p-4">
        {actQuests.map(q => (
          <button
            key={q.key}
            type="button"
            onClick={() => setSelectedKey(q.key)}
            aria-pressed={q.key === selectedKey}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
              q.key === selectedKey ? 'border-gold-bright bg-panel' : 'border-transparent hover:bg-panel'
            }`}
            title={q.name[locale]}
          >
            <QuestIcon icon={q.icon} />
            <span className="text-xs text-parchment text-center leading-tight">{q.name[locale]}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex flex-col gap-3">
          <div className="bg-panel border border-panel-border rounded-lg px-4 py-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-parchment-bright font-cinzel">{selected.name[locale]}</h2>
            {selected.optional && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#8080f3] text-black">
                {t('questOptionalLabel')}
              </span>
            )}
          </div>
          <div className="bg-panel border border-panel-border rounded-lg px-4 py-3 flex flex-col gap-2 text-sm text-parchment">
            {selected.objectives.map((obj, i) => (
              <div key={i}>&ndash; {obj[locale]}</div>
            ))}
          </div>
          <div className="bg-panel-alt border border-panel-border rounded-lg px-4 py-3 flex items-center gap-3">
            <h3 className="text-sm font-bold text-gold-bright font-cinzel">{t('questRewardsLabel')}</h3>
            {selected.rewardImage ? (
              <RewardImage rewardImage={selected.rewardImage} />
            ) : (
              <span className="text-xs text-muted">{t('questNoReward')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/quests/QuestList.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
cd D2R-Records
git add src/components/quests messages/en.json messages/zh-TW.json messages/zh-CN.json
git commit -m "Add QuestList component with Act tabs and quest detail panel

Follows CubeRecipeList.tsx's data-driven, per-locale pattern. Act tab
bar -> icon grid -> selected-quest panel with objectives and a
separated Rewards block, matching the user-supplied reference layout.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: `/quests` page route

**Files:**
- Create: `D2R-Records/src/app/[locale]/quests/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// D2R-Records/src/app/[locale]/quests/page.tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import quests from '../../../../data/quests.json';
import QuestList from '@/components/quests/QuestList';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function QuestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('questsPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('questsPageSubtitle')}</p>
      </div>
      <QuestList quests={quests} locale={locale as 'en' | 'zh-TW' | 'zh-CN'} />
    </main>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd D2R-Records
git add src/app/\[locale\]/quests
git commit -m "Add /quests page route

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Nav integration + homepage card

**Files:**
- Modify: `D2R-Records/src/lib/navGroups.ts`
- Modify: `D2R-Records/messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

- [ ] **Step 1: Pick a curated homepage-card image**

Reuse an existing HD asset already mirrored under `public/`, matching the "curated per-card image" convention (no new asset needed) — use the Khalim's Will icon already confirmed in Task 2 (`items/hd/super_khalim_flail.png`), since it's a quest-reward item and ties the card visually to the quest theme.

- [ ] **Step 2: Add the nav entry**

In `src/lib/navGroups.ts`, inside `group_academy`'s `links` array, add (after `item_crafted`, before `misc_fcrFhrFbr`, keeping the existing items in place):

```ts
      { key: 'item_quests', path: 'quests', icon: '📜', image: 'items/hd/super_khalim_flail.png' },
```

- [ ] **Step 3: Add the `Nav` i18n key**

Add to `messages/en.json`'s `"Nav"` object (after `"item_crafted": "Crafted Items",`):

```json
    "item_quests": "Quests",
```

Add the equivalent to `messages/zh-TW.json` ("任務") and `messages/zh-CN.json` ("任务").

- [ ] **Step 4: Verify existing nav tests still pass**

Run: `npx vitest run`
Expected: all pass except the one pre-existing known failure (`CategoryCardGrid.test.tsx` → "renders no icon for a category absent from the icon map" — documented pre-existing issue, not caused by this change).

- [ ] **Step 5: Commit**

```bash
cd D2R-Records
git add src/lib/navGroups.ts messages/en.json messages/zh-TW.json messages/zh-CN.json
git commit -m "Add Quests to D2R Academy nav and homepage cards

Uses the Khalim's Will HD icon (already verified as a real quest-reward
asset in Task 2) as the curated card image, consistent with the site's
other Academy cards.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all pass except the documented pre-existing `CategoryCardGrid.test.tsx` failure.

- [ ] **Step 3: Manual data spot-check**

Cross-check 3 quests' `objectives` and `optional` values in `data/quests.json` against public D2 quest references (e.g. Den of Evil = optional, The Horadric Staff = required, Eve of Destruction = required) — confirm no mismatches before calling this done.

- [ ] **Step 4: Final commit (if any cleanup needed)**

```bash
cd D2R-Records
git status
# If clean, nothing to do. If verification turned up fixes, commit them
# with a message describing exactly what was wrong and corrected.
```

---

## Out of scope (confirmed in design spec)

- Quest-giver NPC portraits.
- Per-difficulty reward variation display.
- Interactive save-game quest-progress tracking.
