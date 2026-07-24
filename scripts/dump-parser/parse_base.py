#!/usr/bin/env python3
"""One-time parser for d2r.world's decoded base-item comparison-table dump
(Task 5 of the myinput-data-accuracy plan). Not wired into the site build or
CI -- run by hand when validating data/bases-full.json against
MyInput/MyData/base_all.

Each of the 23 category pages (helms.decoded.html, swords.decoded.html, ...)
renders several "base item type" groups (e.g. Cap / War Hat / Shako), each as
a *pair* of duplicate tables back-to-back in the DOM text:

  1. label-major:  <3 item names>  Defense  <3 values>  Level Req <3 values> ...
  2. item-major:   Defense Level Req Str Req ... <name> <values...> <name> ...

We only need one copy, so this parser walks BeautifulSoup's stripped_strings
in document order and matches the *first* (label-major) shape: a run of 3
plausible item names immediately followed by a primary stat label (Defense /
1h Damage / 2h Damage), then label:3-values pairs until that primary label
repeats (signalling the start of the duplicate item-major table, which we
skip).

Armor/helm/shield/belt/boot/glove pages use "Defense"; weapon pages use
"1h Damage" and/or "2h Damage" (some, e.g. axes/hammers, show both, with "-"
for the unused hand-count). Weapon pages also carry "Dex Req"; armor-type
pages don't (no dexterity requirement on armor).
"""
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

REPO_ROOT = Path(__file__).resolve().parents[2]
BASE_DIR = REPO_ROOT / 'MyInput' / 'MyData' / 'base_all' / 'site'
CATEGORIES = [
    'helms', 'armors', 'shields', 'belts', 'boots', 'gloves',
    'swords', 'daggers', 'axes', 'polearms', 'spears', 'clubs', 'puremaces',
    'hammers', 'scepters', 'wands', 'staves', 'orbs', 'katars',
    'bows', 'crossbows', 'javelins', 'throwings',
]

PRIMARY_LABELS = {'Defense', '1h Damage', '2h Damage'}
SECONDARY_LABELS = {
    'Level Req', 'Str Req', 'Dex Req', 'Durability', 'Sockets', 'qlvl',
    'Throw Damage', 'Rangeadder', 'Speed', 'Magic lvl', 'Kick Damage',
    '#Slots', '% Block', 'Weight', 'Quantity', '+Skills', 'Smite Damage',
}
ALL_LABELS = PRIMARY_LABELS | SECONDARY_LABELS


def parse_range(tok):
    """'3 - 5' -> (3, 5); '2' -> (2, 2); '-' -> None."""
    tok = tok.strip()
    if tok == '-' or tok == '':
        return None
    m = re.match(r'^(-?\d+)\s*-\s*(-?\d+)$', tok)
    if m:
        return (int(m.group(1)), int(m.group(2)))
    m = re.match(r'^(-?\d+)$', tok)
    if m:
        return (int(m.group(1)), int(m.group(1)))
    return None


def parse_int(tok, dash_value=0):
    tok = tok.strip()
    if tok == '-' or tok == '':
        return dash_value
    m = re.match(r'^-?\d+$', tok)
    return int(tok) if m else None


# Disqus comment-widget chrome ("N Comments", "Link", "Link Copied!") sits
# right before some standalone (singleton) item groups in the DOM text and
# would otherwise be mistaken for an item name.
JUNK_TOKENS = {'Link', 'Link Copied!'}


def looks_like_name(tok):
    if not tok or tok in ALL_LABELS or tok in JUNK_TOKENS:
        return False
    if re.match(r'^[\[\-]?\d', tok):
        return False
    if tok in ('-',):
        return False
    return True


def try_group(texts, i, n, count):
    """Attempt to parse a group of `count` item names starting at texts[i],
    immediately followed by a primary label and `count` values per label.
    Returns (names, fields, end_pos) or None."""
    if i + count >= n:
        return None
    names = texts[i:i + count]
    primary = texts[i + count]
    if primary not in PRIMARY_LABELS or not all(looks_like_name(t) for t in names):
        return None
    label0 = primary
    fields = {}
    pos = i + count
    first = True
    while pos < n:
        label = texts[pos]
        if label == label0 and not first:
            break
        if label not in ALL_LABELS:
            break
        values = texts[pos + 1:pos + 1 + count]
        if len(values) < count:
            break
        fields[label] = values
        pos += 1 + count
        first = False
    if not fields:
        return None
    return names, fields, pos


def parse_category(html_path):
    """Returns a flat list of {name, fields} dicts, one per base item type
    (regardless of whether it appeared in a 3-column Normal/Exceptional/Elite
    group, e.g. most weapon/armor families, or a 1-column singleton group,
    e.g. Circlets/Paladin Shields/Shrunken Heads/Grimoires which each render
    as their own standalone comparison table)."""
    html = html_path.read_text(encoding='utf8')
    soup = BeautifulSoup(html, 'html.parser')
    texts = list(soup.stripped_strings)

    rows = []
    i = 0
    n = len(texts)
    while i < n - 1:
        result = try_group(texts, i, n, 3)
        if result is None:
            result = try_group(texts, i, n, 1)
        if result is not None:
            names, fields, pos = result
            for idx, name in enumerate(names):
                rows.append({'name': name, 'fields': fields, 'idx': idx})
            i = pos
        else:
            i += 1
    return rows


def build_grade(names, fields, idx):
    grade = {'name': names[idx]}
    if 'Defense' in fields:
        r = parse_range(fields['Defense'][idx])
        grade['defense'] = {'min': r[0], 'max': r[1]} if r else None
    else:
        grade['defense'] = None
    if '1h Damage' in fields:
        r = parse_range(fields['1h Damage'][idx])
        grade['oneHandDamage'] = {'min': r[0], 'max': r[1]} if r else None
    else:
        grade['oneHandDamage'] = None
    if '2h Damage' in fields:
        r = parse_range(fields['2h Damage'][idx])
        grade['twoHandDamage'] = {'min': r[0], 'max': r[1]} if r else None
    else:
        grade['twoHandDamage'] = None
    grade['levelReq'] = parse_int(fields.get('Level Req', ['-'] * 3)[idx], dash_value=0)
    grade['requiredStrength'] = parse_int(fields.get('Str Req', ['-'] * 3)[idx], dash_value=0)
    grade['requiredDexterity'] = parse_int(fields.get('Dex Req', ['-'] * 3)[idx], dash_value=0)
    grade['durability'] = parse_int(fields.get('Durability', ['-'] * 3)[idx], dash_value=None)
    grade['sockets'] = parse_int(fields.get('Sockets', ['-'] * 3)[idx], dash_value=0)
    grade['qlvl'] = parse_int(fields.get('qlvl', ['-'] * 3)[idx], dash_value=None)
    return grade


def main():
    locale = sys.argv[1] if len(sys.argv) > 1 else 'en-US'
    out = {}
    for cat in CATEGORIES:
        path = BASE_DIR / locale / 'info' / 'item' / 'base' / f'{cat}.decoded.html'
        if not path.exists():
            print(f'MISSING: {path}', file=sys.stderr)
            continue
        rows = parse_category(path)
        out[cat] = []
        for r in rows:
            fields = r['fields']
            idx = r['idx']
            names_placeholder = [r['name']] * 3
            grade = build_grade(names_placeholder, fields, idx)
            grade['name'] = r['name']
            out[cat].append(grade)
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False)


if __name__ == '__main__':
    main()
