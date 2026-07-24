#!/usr/bin/env python3
"""One-time parser for d2r.world's decoded set-items dump (Task 2 of the
myinput-data-accuracy plan). Not wired into the site build or CI -- run by
hand when validating data/sets.json and data/set-groups.json against
MyInput/MyData/sets_all.

Each of the 34 set-specific pages (aldurs_watchtower.decoded.html, ...) has:

  <div id="<set_slug>"></div>          <- anchor for the set-bonus block
  <h2>Set Name</h2>
  <div>                                 <- "partial" container: bullet rows
    ⬩ <stat text> (N)                   whose text ends in "(N)" -- the
    ...                                  piece-count threshold that unlocks it
  </div>
  <div>                                 <- "full" container: the cumulative
    ⬩ <stat text>                       list of ALL bonuses granted when the
    ...                                  complete set is worn (repeats the
                                         partial-tier stats verbatim, plus
                                         whatever is exclusive to full-set,
                                         e.g. "Character Displays Aura Effect")
  </div>

  ... one block per piece, same shape as unique items (Task 1):
  <div id="<piece_slug>"></div>
  <div>...<name text>...</div>
  <div>
    <div>Item Stats</div>
    <div>...label:value bullet rows...</div>
    <div>Magic Properties</div>
    <div>...flat bullet-row list of stat text...</div>
  </div>
"""
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

REPO_ROOT = Path(__file__).resolve().parents[2]

SET_DIR_EN = REPO_ROOT / 'MyInput/MyData/sets_all/site/en-US/info/item/sets'
SET_DIR_ZH = REPO_ROOT / 'MyInput/MyData/sets_all/site/zh-TW/info/item/sets'

# Category index pages -- not per-set pages, skip when listing set slugs.
CATEGORY_PAGES = {
    'weapons', 'helms', 'armors', 'shields', 'belts', 'boots', 'gloves',
    'rings', 'amulets',
}


def text_of(el):
    return el.get_text(strip=True) if el else ''


def is_bullet_row(div):
    if 'r-18u37iz' not in (div.get('class') or []):
        return False
    kids = div.find_all('div', recursive=False)
    return len(kids) == 2 and kids[0].get_text(strip=True) == '⬩'


def stat_text_from_row(div):
    kids = div.find_all('div', recursive=False)
    return re.sub(r'\s+', ' ', kids[1].get_text(' ', strip=True)).strip()


def section_headers(parent):
    return parent.find_all(
        'div', class_=lambda c: c and 'r-jwli3a' in c and 'r-vnw8o6' in c and 'r-1b43r93' in c and 'r-d0pm55' in c
    )


def parse_item_stats(header):
    out = {}
    if not header:
        return out
    for row in header.find_next_siblings('div'):
        if not is_bullet_row(row):
            continue
        kids = row.find_all('div', recursive=False)
        spans = kids[1].find_all('span', recursive=False)
        if len(spans) >= 2:
            label = re.sub(r'[:：]\s*$', '', text_of(spans[0]))
            value = text_of(spans[1])
        else:
            full = stat_text_from_row(row)
            if ':' in full:
                label, value = full.split(':', 1)
            else:
                label, value = full, ''
        out[label.strip()] = value.strip()
    return out


def parse_magic_properties(header):
    stats = []
    if not header:
        return stats
    body = header.find_next_sibling('div')
    if not body:
        return stats
    for row in body.find_all('div', class_=lambda c: c and 'r-18u37iz' in c):
        if is_bullet_row(row):
            stats.append(stat_text_from_row(row))
    return stats


def parse_set_bonus_block(anchor):
    """anchor is the <div id="<set_slug>"> spacer. Its grandparent contains
    the h2 title followed by two "container" wrapper divs: partial-bonus
    bullets (text ends in "(N)") then the full cumulative bullet list."""
    wrapper = anchor.parent
    if wrapper is None:
        return None, [], []
    gp = wrapper.parent
    if gp is None:
        return None, [], []
    h2 = wrapper.find('h2')
    set_name = text_of(h2)

    containers = gp.find_all('div', class_='jsx-4141946134')
    # containers alternate: (empty label div, bullet container) x2 in the two
    # sibling wrapper divs -- collect bullet rows from each "container" div.
    bullet_groups = []
    for cont in containers:
        rows = [stat_text_from_row(r) for r in cont.find_all('div', recursive=True) if is_bullet_row(r)]
        if rows:
            bullet_groups.append(rows)

    partial_raw = bullet_groups[0] if len(bullet_groups) >= 1 else []
    full_raw = bullet_groups[1] if len(bullet_groups) >= 2 else []
    return set_name, partial_raw, full_raw


def parse_file(html_path):
    soup = BeautifulSoup(html_path.read_text(encoding='utf-8'), 'html.parser')
    set_slug = html_path.stem.replace('.decoded', '')

    set_anchor = soup.find('div', id=set_slug)
    set_name, partial_raw, full_raw = (None, [], [])
    if set_anchor:
        set_name, partial_raw, full_raw = parse_set_bonus_block(set_anchor)

    pieces = {}
    for anchor in soup.find_all('div', id=True):
        aid = anchor.get('id')
        if aid == set_slug or aid in ('__next', '__NEXT_DATA__', '__next-route-announcer__') \
                or 'aswift' in aid or 'google_esf' in aid \
                or aid in ('react-native-stylesheet', 'expo-generated-fonts', 'metalgrid'):
            continue
        parent = anchor.parent
        if parent is None:
            continue
        headers = section_headers(parent)
        if len(headers) != 2:
            continue
        stats_header, magic_header = headers
        name_span = None
        for sib in anchor.find_next_siblings('div'):
            span = sib.find('span')
            if span:
                name_span = span
                break
            if sib is stats_header.parent or stats_header in sib.find_all():
                break
        name = text_of(name_span)
        item_stats = parse_item_stats(stats_header)
        magic_stats = parse_magic_properties(magic_header)
        pieces[aid] = {
            'name': name,
            'slug': aid,
            'itemStats': item_stats,
            'stats': magic_stats,
        }

    return {
        'slug': set_slug,
        'setName': set_name,
        'partialBonusRaw': partial_raw,
        'fullBonusRaw': full_raw,
        'pieces': pieces,
    }


def main():
    slugs = sorted(
        p.stem.replace('.decoded', '') for p in SET_DIR_EN.glob('*.decoded.html')
        if p.stem.replace('.decoded', '') not in CATEGORY_PAGES
    )
    all_en = {}
    all_zh = {}
    for slug in slugs:
        en_path = SET_DIR_EN / f'{slug}.decoded.html'
        zh_path = SET_DIR_ZH / f'{slug}.decoded.html'
        if en_path.exists():
            all_en[slug] = parse_file(en_path)
        if zh_path.exists():
            all_zh[slug] = parse_file(zh_path)

    for slug, rec in all_en.items():
        z = all_zh.get(slug)
        if z:
            rec['zh_TW'] = {
                'setName': z['setName'],
                'partialBonusRaw': z['partialBonusRaw'],
                'fullBonusRaw': z['fullBonusRaw'],
                'pieces': {
                    pid: {'name': p['name'], 'itemStats': p['itemStats'], 'stats': p['stats']}
                    for pid, p in z['pieces'].items()
                },
            }

    out_path = REPO_ROOT / 'scripts/dump-parser/sets_parsed.json'
    out_path.write_text(json.dumps(all_en, indent=2, ensure_ascii=False), encoding='utf-8')
    n_pieces = sum(len(r['pieces']) for r in all_en.values())
    print(f'Parsed {len(all_en)} sets, {n_pieces} pieces -> {out_path}', file=sys.stderr)


if __name__ == '__main__':
    main()
