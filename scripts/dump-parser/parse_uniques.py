#!/usr/bin/env python3
"""One-time parser for d2r.world's decoded unique-items dump (Task 1 of the
myinput-data-accuracy plan). Not wired into the site build or CI -- run by
hand when validating data/uniques.json against MyInput/MyData.

Structure differs from the runewords dump (Task 0): each of the 27 category
pages (helms.decoded.html, swords.decoded.html, ...) has one block per
unique item:

  <div>                                    <- one of these per unique item
    <div id="<slug>"></div>                <- anchor target (invisible spacer)
    <div>...<name text>...</div>
    <div>
      <div>Item Stats</div>
      <div>...label:value bullet rows (Base/Grade/Defense/Required Level/...)</div>
      <div>Magic Properties</div>
      <div>...flat bullet-row list of stat text, no qualifiers/sub-headers</div>
    </div>
  </div>

Unlike runewords, unique items have no per-base-type stat variation, so
Magic Properties is always a flat bullet list (no "<Base Type>:" sub-headers).
"""
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

REPO_ROOT = Path(__file__).resolve().parents[2]

CATEGORY_DIR_EN = REPO_ROOT / 'MyInput/MyData/unique_all/site/en-US/info/item/unique'
CATEGORY_DIR_ZH = REPO_ROOT / 'MyInput/MyData/unique_all/site/zh-TW/info/item/unique'


def text_of(el):
    return el.get_text(strip=True) if el else ''


def is_bullet_row(div):
    # A stat row: div wrapping a diamond-bullet div + a text div.
    if 'r-18u37iz' not in (div.get('class') or []):
        return False
    kids = div.find_all('div', recursive=False)
    return len(kids) == 2 and kids[0].get_text(strip=True) == '⬩'


def stat_text_from_row(div):
    kids = div.find_all('div', recursive=False)
    return re.sub(r'\s+', ' ', kids[1].get_text(' ', strip=True)).strip()


def section_headers(parent):
    # "Item Stats" / "Magic Properties" headers share one CSS class regardless
    # of page language and always appear in this order -- same positional
    # trick as parse_runewords.py's section_headers.
    return parent.find_all(
        'div', class_=lambda c: c and 'r-jwli3a' in c and 'r-vnw8o6' in c and 'r-1b43r93' in c and 'r-d0pm55' in c
    )


def parse_item_stats(header):
    """Item Stats rows are "Label: value" pairs (Base, Grade, Defense,
    Required Level, Required Strength, Required Dexterity, Durability, ...).
    Rows are direct siblings of the "Item Stats" header, within the same
    parent wrapper div (the "Magic Properties" header lives in a *different*
    wrapper, so find_next_siblings naturally stops at the end of this list).
    Returns a dict keyed by the label text (colon stripped)."""
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
            # Fallback: split on first colon in the joined text.
            full = stat_text_from_row(row)
            if ':' in full:
                label, value = full.split(':', 1)
            else:
                label, value = full, ''
        out[label.strip()] = value.strip()
    return out


def parse_magic_properties(header):
    """Unlike Item Stats, the Magic Properties header lives in its own
    wrapper div together with a nested container of bullet rows (two levels
    deep) -- descend into header's next sibling and collect all bullet rows."""
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


def parse_file(html_path):
    soup = BeautifulSoup(html_path.read_text(encoding='utf-8'), 'html.parser')
    results = {}
    for anchor in soup.find_all('div', id=True):
        aid = anchor.get('id')
        if aid in ('__next', '__NEXT_DATA__', '__next-route-announcer__') or 'aswift' in aid or 'google_esf' in aid \
                or aid in ('react-native-stylesheet', 'expo-generated-fonts', 'metalgrid'):
            continue
        parent = anchor.parent
        if parent is None:
            continue
        headers = section_headers(parent)
        if len(headers) != 2:
            continue
        stats_header, magic_header = headers
        # Name is the first span-bearing text row right after the anchor div.
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
        results[aid] = {
            'name': name,
            'slug': aid,
            'itemStats': item_stats,
            'stats': magic_stats,
        }
    return results


def parse_category(category, locale_dir):
    path = locale_dir / f'{category}.decoded.html'
    if not path.exists():
        return {}
    return parse_file(path)


def main():
    categories = sorted(p.stem.replace('.decoded', '') for p in CATEGORY_DIR_EN.glob('*.decoded.html'))
    all_en = {}
    all_zh = {}
    for cat in categories:
        en = parse_category(cat, CATEGORY_DIR_EN)
        zh = parse_category(cat, CATEGORY_DIR_ZH)
        for slug, rec in en.items():
            rec['category'] = cat
            all_en[slug] = rec
        for slug, rec in zh.items():
            all_zh[slug] = rec

    for slug, rec in all_en.items():
        z = all_zh.get(slug)
        if z:
            rec['zh_TW'] = {
                'name': z['name'],
                'itemStats': z['itemStats'],
                'stats': z['stats'],
            }

    out_path = REPO_ROOT / 'scripts/dump-parser/uniques_parsed.json'
    out_path.write_text(json.dumps(all_en, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'Parsed {len(all_en)} unique items across {len(categories)} categories -> {out_path}', file=sys.stderr)


if __name__ == '__main__':
    main()
