#!/usr/bin/env python3
"""One-time parser for d2r.world's decoded runewords dump (Task 0 of the
d2r.world-validation plan). Not wired into the site build or CI -- run by hand
when validating data/runewords-full.json against MyInput/MyData.

Each runeword's whole DOM block (anchor id, name, allowed items, rune order,
magic properties) lives under one shared parent div, keyed by the anchor id's
container:

  <div>                                  <- one of these per runeword
    <div id="<slug>"></div>              <- anchor target (invisible spacer)
    <div>...<name text>...</div>
    <div class="jsx-3649696824 container">
      ...Allowed Items... / ...Rune Order... / ...Magic Properties...
    </div>
  </div>

"Magic Properties" starts with a "Required Level: N" line, then either a flat
list of "<diamond bullet><stat text>" pairs, or -- for runewords whose stats
differ per base-item type (Hysteria/Dragon/Dream/Phoenix/Spirit/Fortitude) --
one or more "<Base Type>:" sub-headers each followed by their own bullet list.
A stat under a sub-header gets a `qualifier` field; flat stats don't.
"""
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

REPO_ROOT = Path(__file__).resolve().parents[2]


def text_of(el):
    return el.get_text(strip=True) if el else ''


def section_headers(parent):
    # The three section headers (Allowed Items / Rune Order / Magic Properties)
    # share one CSS class regardless of page language and always appear in
    # this fixed order, so index into them positionally rather than matching
    # English text -- the same parser then works unmodified on zh-TW (see
    # parse_file's shared call for both locales).
    return parent.find_all(
        'div', class_=lambda c: c and 'r-18pl4tm' in c and 'r-1281ybr' in c and 'r-1b43r93' in c
    )


def parse_allowed_items(header):
    if not header:
        return []
    list_container = header.find_next_sibling('div')
    items = []
    for a in list_container.find_all('a'):
        label = a.find('div', class_=lambda c: c and 'r-a023e6' in c)
        if label:
            items.append(text_of(label))
    return items


def parse_rune_order(header):
    if not header:
        return []
    list_container = header.find_next_sibling('div')
    runes = []
    for entry in list_container.find_all('div', class_=lambda c: c and 'jsx-2240695209' in c):
        # en-US shows 2 divs per rune (English name, "#N"); zh-TW shows 3
        # (Chinese name, English name, "#N") -- order is always the last div,
        # display name is always the first.
        divs = entry.find_all('div', recursive=False)
        if len(divs) < 2:
            continue
        name = text_of(divs[0])
        order = text_of(divs[-1]).lstrip('#').strip()
        runes.append({'rune': name, 'order': int(order) if order.isdigit() else None})
    return runes


def is_bullet_row(div):
    # A stat row: css-1dbjc4n r-18u37iz wrapping a diamond-bullet div + a text div.
    if 'r-18u37iz' not in (div.get('class') or []):
        return False
    kids = div.find_all('div', recursive=False)
    return len(kids) == 2 and kids[0].get_text(strip=True) == '⬩'


def stat_text_from_row(div):
    kids = div.find_all('div', recursive=False)
    # Join all span text (skill-name links render as nested <span>s); drop the
    # decorative trailing SVG shown next to "Enhanced Damage" ranges.
    return re.sub(r'\s+', ' ', kids[1].get_text(' ', strip=True)).strip()


def parse_magic_properties(header):
    if not header:
        return None, []
    body = header.find_next_sibling('div')

    # The "Required Level: N" row and any "<Base Type>:" sub-header rows share
    # one CSS class (they're both single-line label divs, as opposed to the
    # two-column diamond-bullet stat rows) -- language-agnostic, unlike
    # matching "Required Level:"/":" text directly.
    def is_label_row(div):
        classes = div.get('class') or []
        return 'r-16z3b8r' in classes and 'r-g41cf7' in classes and 'r-d0pm55' in classes

    level_req = None
    stats = []
    for child in body.find_all('div', recursive=False):
        if is_label_row(child):
            # The "Required Level: N" row is itself a leaf label div (no
            # nested div) and always the first child of the Magic Properties
            # body -- unlike the stat-list wrapper below, which is a plain
            # div wrapping either a flat bullet list or a labeled sub-group.
            m = re.search(r'\d+', text_of(child))
            level_req = int(m.group()) if m else None
            continue
        # A stat-list wrapper div: for base-type-qualified runewords
        # (Hysteria/Dragon/Dream/Phoenix/Spirit/Fortitude) its first child is
        # a "<Base Type>:" label followed by that type's bullet rows; for
        # every other runeword the wrapper's children are just the flat
        # bullet-row list with no qualifier.
        rows = child.find_all('div', recursive=False)
        qualifier = None
        if rows and is_label_row(rows[0]):
            qualifier = re.sub(r'[:：]\s*$', '', text_of(rows[0]))
            rows = rows[1:]
        for row in rows:
            if is_bullet_row(row):
                entry = {'text': stat_text_from_row(row)}
                if qualifier is not None:
                    entry['qualifier'] = qualifier
                stats.append(entry)
    return level_req, stats


def detect_ladder_only(magic_body_text):
    # Best-effort: d2r.world attaches a "Ladder Only" red tooltip to individual
    # *stats* that are ladder-exclusive game mechanics (e.g. Bulwark's "Physical
    # Damage Received Reduced"), not a per-runeword badge -- so this does NOT
    # reliably reproduce data/runewords.json's curated per-runeword ladderOnly
    # flag (confirmed: Insight is ladderOnly:true in curated data but has zero
    # "Ladder Only" occurrences in this dump). Recorded anyway for visibility,
    # but should not be treated as ground truth -- see spot-check notes.
    return 'Ladder Only' in magic_body_text


def parse_file(html_path):
    soup = BeautifulSoup(html_path.read_text(encoding='utf-8'), 'html.parser')
    results = {}
    # Anchor divs are <div id="<slug>" style="...visibility:hidden..."> with no
    # other id-bearing divs sharing their parent -- filter out unrelated ids
    # (ad slots, __next, etc.) by requiring the parent to also contain a
    # "Magic Properties" text node, which only real runeword blocks have.
    for anchor in soup.find_all('div', id=True):
        if anchor.get('id') in ('__next',) or 'aswift' in anchor.get('id', ''):
            continue
        parent = anchor.parent
        if parent is None:
            continue
        name_div = parent.find('div', class_=lambda c: c and 'r-1jkufdy' in c)
        headers = section_headers(parent)
        if not name_div or len(headers) != 3:
            continue
        allowed_header, runes_header, magic_header = headers
        name = text_of(name_div)
        level_req, stats = parse_magic_properties(magic_header)
        results[name] = {
            'name': name,
            'slug': anchor.get('id'),
            'runes': parse_rune_order(runes_header),
            'levelReq': level_req,
            'ladderOnly': detect_ladder_only(magic_header.find_next_sibling('div').get_text()),
            'allowedItems': parse_allowed_items(allowed_header),
            'stats': stats,
        }
    return results


def main():
    en_path = REPO_ROOT / 'MyInput/MyData/runewords_all/site/en-US/info/item/runewords.decoded.html'
    zh_path = REPO_ROOT / 'MyInput/MyData/runewords_all/site/zh-TW/info/item/runewords.decoded.html'

    en = parse_file(en_path)
    zh = parse_file(zh_path)

    # zh-TW section order/slugs match en-US 1:1 (same anchor ids), so merge by
    # slug rather than by (untranslated) name.
    zh_by_slug = {v['slug']: v for v in zh.values()}
    for rec in en.values():
        z = zh_by_slug.get(rec['slug'])
        if z:
            rec['zh_TW'] = {
                'name': z['name'],
                'runes': z['runes'],
                'levelReq': z['levelReq'],
                'ladderOnly': z['ladderOnly'],
                'allowedItems': z['allowedItems'],
                'stats': z['stats'],
            }
        else:
            rec['zh_TW'] = None

    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/runewords-parsed.json')
    out_path.write_text(json.dumps(list(en.values()), indent=2, ensure_ascii=False))
    print(f'Parsed {len(en)} runewords ({sum(1 for r in en.values() if r["zh_TW"])} with zh-TW match) -> {out_path}')


if __name__ == '__main__':
    main()
