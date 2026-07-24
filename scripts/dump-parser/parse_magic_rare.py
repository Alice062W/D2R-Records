#!/usr/bin/env python3
"""One-time parser for d2r.world's decoded magic/rare-affix dump (Task 3 of
the myinput-data-accuracy plan). Not wired into the site build or CI.

Each of the 26 per-item-type pages (boots.decoded.html, rings.decoded.html,
...) has a Prefixes table and a Suffixes table, each row:

  Affix name
  Alvl
  <stat lines, possibly multiple stats per row separated by a "diamond
   bullet" glyph>

This is the *collapsed* d2r.world row -- only the single highest-alvl tier
is shown (confirmed: searching the raw HTML for an affix name like "Godly"
finds exactly one occurrence per page, so no hidden expanded-tier markup
exists in the static dump). So this parser can only validate, for each
(item-type, affix name), the MAX-alvl tier's alvl + stat value + which
item-type pages it appears on -- not the full per-tier breakdown already
in data/magic-affixes.json.

Output: a JSON list of {itemType, kind, name, alvl, statLines: [str]}
for each page/locale, written to the scratchpad (not committed).
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

BULLET = '⬩'  # small diamond used to separate multiple stats on one row


def clean(s: str) -> str:
    # Drop stray private-use-area glyphs (font-icon characters like the
    # row-expand chevron) that show up as their own "line" in the .decoded.txt
    # dump; keep everything else (including the bullet glyph, handled by caller).
    return ''.join(ch for ch in s if not (0xE000 <= ord(ch) <= 0xF8FF)).strip()


def parse_page(path: Path):
    raw_lines = path.read_text(encoding='utf-8').split('\n')
    lines = [clean(l) for l in raw_lines]
    # Truncate at the page's user-comments section (present on every page,
    # both locales) -- its free-text content would otherwise get vacuumed
    # into the last suffix row's stat text.
    for i, l in enumerate(lines):
        if l.endswith('Comments') and ('Magic Items' in l or 'Rare Items' in l):
            lines = lines[:i]
            break
    starts = [i for i, l in enumerate(lines) if l == 'Affix']
    if len(starts) < 2:
        return []
    results = []
    for idx, start in enumerate(starts):
        kind = 'prefix' if idx == 0 else 'suffix'
        i = start + 1
        while i < len(lines) and lines[i] in ('', 'Alvl', '(Max) Magic Properties'):
            i += 1
        end = starts[idx + 1] if idx + 1 < len(starts) else len(lines)

        # Rows are separated by blank lines: name, alvl (int), then one or
        # more bullet-separated stat parts. The last row's chunk sometimes
        # runs into the "Suffixes"/"Prefixes" section-title text with no
        # blank line in between -- treat those literal tokens as separators.
        chunk = []

        def flush():
            if len(chunk) >= 2 and re.match(r'^\d+$', chunk[1]):
                name = chunk[0]
                alvl = int(chunk[1])
                stat_lines = []
                cur = []
                for part in chunk[2:]:
                    if part == BULLET:
                        if cur:
                            stat_lines.append(' '.join(cur))
                            cur = []
                    else:
                        cur.append(part)
                if cur:
                    stat_lines.append(' '.join(cur))
                results.append({'kind': kind, 'name': name, 'alvl': alvl, 'statLines': stat_lines})

        for j in range(i, end):
            l = lines[j]
            if l in ('Prefixes', 'Suffixes'):
                l = ''
            if l == '':
                if chunk:
                    flush()
                    chunk = []
                continue
            chunk.append(l)
        if chunk:
            flush()
    return results


def main():
    out = {}
    for dataset, subdir in (('magic_all', 'magic'), ('rare_all', 'rare')):
        base = REPO_ROOT / 'MyInput/MyData' / dataset / 'site/en-US/info/item' / subdir
        if not base.exists():
            continue
        for f in sorted(base.glob('*.decoded.txt')):
            item_type = f.stem.replace('.decoded', '')
            rows = parse_page(f)
            out[f'{dataset}/{item_type}'] = rows

    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO_ROOT / 'scripts/tmp/magic_rare_parsed.json'
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    total = sum(len(v) for v in out.values())
    print(f'Parsed {len(out)} pages, {total} affix rows -> {out_path}')


if __name__ == '__main__':
    main()
