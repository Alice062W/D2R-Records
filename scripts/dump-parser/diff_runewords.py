#!/usr/bin/env python3
"""Diffs the parsed d2r.world dump against data/runewords-full.json's stat
counts, purely to surface candidates for manual review (Task 0's diff step).
Not exact-text matching -- d2r.world visually merges "All Resistances +N"
into each individual elemental resist line (e.g. Ancients' Pledge shows "Cold
Resist +43%" for a res-cold:30 + res-all:13 pair), so plain string diffing
produces false positives for every runeword that has both. This script
flags stat-count mismatches and dumps both sides for the runewords whose
counts differ, for a human to read side by side.
"""
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def load_parsed(path):
    data = json.load(open(path, encoding='utf-8'))
    return {r['name']: r for r in data}


def main():
    parsed_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/runewords-parsed.json'
    parsed = load_parsed(parsed_path)
    current = json.load(open(REPO_ROOT / 'data/runewords-full.json', encoding='utf-8'))

    mismatches = []
    missing = []
    for rec in current:
        name = rec['name']['en']
        p = parsed.get(name)
        if not p:
            missing.append(name)
            continue
        # generate-grail-data.mjs splits a runeword's properties across two
        # arrays: `stats` (min != max, ranged rolls) and `fixedStats` (min ==
        # max, collapsed to a single `value`) -- both are real displayed
        # stat lines, so combine them for an apples-to-apples count.
        all_current = rec['stats'] + rec['fixedStats']
        n_current = len(all_current)
        n_parsed = len(p['stats'])
        if n_current != n_parsed:
            mismatches.append((name, n_current, n_parsed))

    print(f'{len(current)} current runewords, {len(parsed)} parsed, {len(missing)} unmatched by name')
    if missing:
        print('Unmatched names:', missing)
    print(f'\n{len(mismatches)} runewords with stat-count mismatch (current vs parsed):')
    for name, nc, np_ in mismatches:
        print(f'  {name}: current={nc} parsed={np_}')
        rec = next(r for r in current if r['name']['en'] == name)
        print('    current stats:')
        for s in rec['stats']:
            print('     -', s['label']['en'], f"({s['min']}-{s['max']})")
        for s in rec['fixedStats']:
            print('     -', s['label']['en'], f"({s['value']})")
        print('    parsed stats:')
        for s in parsed[name]['stats']:
            q = f" [{s['qualifier']}]" if 'qualifier' in s else ''
            print('     -', s['text'] + q)


if __name__ == '__main__':
    main()
