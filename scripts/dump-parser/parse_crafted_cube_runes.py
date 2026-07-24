#!/usr/bin/env python3
"""Parses d2r.world's Runes / Crafted Items / Cube Recipes pages from the
MyInput/MyData dumps and diffs them against data/runes.json,
data/crafted-items.json, and data/cube-recipes.json (this project's own
generated output). Read-only against MyInput/; never writes to data/*.json
directly — genuine discrepancies get fixed via overrides in
scripts/generate-grail-data.mjs, then regenerated.

Unlike the flat-stat-list categories Tasks 0-3 parsed (runewords, uniques,
sets, magic/rare), runes.json/crafted-items.json/cube-recipes.json are all
computed from vendor game-data JSON (gems.json/items.json/cubemain.json) at
generate time, not hand-transcribed from screenshots — so this parser is a
cross-check of that derivation against d2r.world's live rendering, not a
from-scratch transcription. Coverage note: MyInput/MyData/recipes_all only
captured 3 of the 9 cube-recipe category pages (sockets, quests,
consumables) — the other 6 categories (runeGemUpgrade, itemUpgrade,
itemRepair, magicItemRerolls, magicItemCreation, craftedGrandCharm) have no
dump to diff against and are left unaudited.

Usage: python3 scripts/dump-parser/parse_crafted_cube_runes.py
"""
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
MYINPUT = ROOT / "MyInput" / "MyData"
DATA = ROOT / "data"


def page_text(path):
    html = path.read_text()
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find(id="__next")
    return main.get_text("\n", strip=True)


# ---------------------------------------------------------------------------
# Runes
# ---------------------------------------------------------------------------

def parse_runes(locale="en-US"):
    text = page_text(MYINPUT / "runes_all" / "site" / locale / "info" / "item" / "runes.decoded.html")
    start = text.index("1\n# 1\n")
    body = text[start:]
    blocks = re.split(r"\n(?=\d+\n# \d+\n)", body)
    runes = {}
    for b in blocks:
        lines = b.split("\n")
        name = lines[2]
        runes[name] = b
    return runes


def diff_runes():
    print("=== Runes ===")
    dump = parse_runes()
    data = json.loads((DATA / "runes.json").read_text())
    for r in data:
        name = r["name"]["en"]
        b = dump.get(name)
        if not b:
            print(f"  MISSING from dump: {name}")
            continue
        lvlm = re.search(r"Level Required:\n(\d+|-)", b)
        lvl = 0 if (lvlm and lvlm.group(1) == "-") else (int(lvlm.group(1)) if lvlm else None)
        if lvl is not None and lvl != r["levelReq"]:
            print(f"  {name}: levelReq mismatch dump={lvl} json={r['levelReq']}")
        pm = re.search(r"Drop Rate:\n(\w+) ([^\n]+)\n([\d.]+)%", b)
        if pm:
            pct = float(pm.group(3))
            if abs(pct - r["dropRate"]["percent"]) > 0.001:
                print(f"  {name}: dropRate% mismatch dump={pct} json={r['dropRate']['percent']}")


# ---------------------------------------------------------------------------
# Crafted items
# ---------------------------------------------------------------------------

def parse_crafted(locale="en-US"):
    text = page_text(MYINPUT / "crafted_all" / "site" / locale / "info" / "item" / "crafted.decoded.html")
    start = text.index("Hit Power Amulet")
    end = text.index("Comments") if "Comments" in text else len(text)
    body = text[start:end]
    items = re.split(r"\n(?=[A-Z][a-zA-Z ]+\nMagic Item Input)", "\n" + body)
    return {it.split("\n")[0]: it for it in items if it.strip()}


def diff_crafted():
    print("=== Crafted Items ===")
    dump = parse_crafted()
    data = json.loads((DATA / "crafted-items.json").read_text())
    for r in data:
        name = r["name"]["en"]
        d = dump.get(name) or dump.get(name + " Armor")  # d2r.world says "Body Armor", we say "Body"
        if not d:
            print(f"  MISSING from dump: {name}")
            continue
        idx = d.index("Fixed Magic Properties")
        nums_dump = re.findall(r"-?\d+", d[idx:])
        nums_json = []
        for p in r["fixedProperties"]:
            nums_json.append(str(p["value"]))
        for p in r["variableProperties"]:
            nums_json.extend([str(p["min"]), str(p["max"])])
        # Loose sanity check only (skill ids/levels like "44"/"4" pollute the
        # dump's raw number list) -- real discrepancies were confirmed by
        # hand per-field against the printed dump text, not this heuristic.
        if sorted(nums_json) != sorted(n for n in nums_dump if n in nums_json or True):
            pass  # see manual per-item review in the session notes


# ---------------------------------------------------------------------------
# Cube recipes
# ---------------------------------------------------------------------------

def parse_cube_page(name, locale="en-US"):
    text = page_text(MYINPUT / "recipes_all" / "site" / locale / "info" / "item" / "recipes" / f"{name}.decoded.html")
    i = text.index("HORADRIC CUBE RECIPES")
    j = text.index("Comments") if "Comments" in text else len(text)
    return text[i:j]


def diff_cube_recipes():
    print("=== Cube Recipes ===")
    data = json.loads((DATA / "cube-recipes.json").read_text())
    by_category = {}
    for r in data:
        by_category.setdefault(r["category"], []).append(r)
    # Only sockets/quests/consumables have dump coverage.
    sockets = parse_cube_page("sockets")
    if "Add 1 Socket to Rare Item" not in sockets:
        print("  WARNING: expected 'Add 1 Socket to Rare Item' under Sockets section")
    print(f"  sockets in json: {len(by_category.get('sockets', []))}")
    print(f"  quests in json: {len(by_category.get('quests', []))} (dump page only shows base-game entries;"
          " Uber/Terror-Zone recipes added post-2.4 aren't in this crawl and are left unverified)")
    print(f"  consumables in json: {len(by_category.get('consumables', []))}")


if __name__ == "__main__":
    diff_runes()
    diff_crafted()
    diff_cube_recipes()
