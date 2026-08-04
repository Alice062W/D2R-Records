#!/usr/bin/env node
// scripts/generate-site-runewords.mjs
//
// Builds data/runewords.json + data/runes.json from the D2RAssets
// pipeline's authoritative runewords.json/runes.json (+ per-language
// variants) in C:\d2r-extract\hd-png -- same relationship as
// generate-site-items.mjs has to item_database.json. See
// pipeline/build_item_db2.py's "Runewords + Runes" section for how those
// are extracted (reuses the exact same property-rendering/inclusion-filter/
// display-order engine as unique/set items -- no new tooltip logic here,
// just converting the pipeline's per-locale arrays into this site's
// locale-keyed-label shape).

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'data');
const HD_ICON_OUT_DIR = join(__dirname, '..', 'public', 'items', 'hd');

const EXTRACT = 'C:\\d2r-extract\\hd-png';
const HD_PNG_ROOT = join(EXTRACT, 'data', 'data', 'hd', 'global', 'ui', 'items');

const LOCALES = ['en', 'zh-TW', 'zh-CN'];
const LOCALE_FILE_SUFFIX = { en: '', 'zh-TW': '.zh-TW', 'zh-CN': '.zh-CN' };

function loadJson(basenameNoExt, locale) {
  const path = join(EXTRACT, `${basenameNoExt}${LOCALE_FILE_SUFFIX[locale]}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const runewordsByLocale = Object.fromEntries(LOCALES.map(l => [l, loadJson('runewords', l)]));
const runesByLocale = Object.fromEntries(LOCALES.map(l => [l, loadJson('runes', l)]));

// Index each locale's list by id (runewords/runes ids are unique -- no
// internalKey-collision handling needed here, unlike unique items).
function byId(list) {
  return new Map(list.map(it => [it.id, it]));
}
const runewordsById = Object.fromEntries(LOCALES.map(l => [l, byId(runewordsByLocale[l])]));
const runesById = Object.fromEntries(LOCALES.map(l => [l, byId(runesByLocale[l])]));

// ---- itype code -> site slot slug. Leaf item-types match the same
// TYPE_TO_SLOT table generate-site-items.mjs uses for unique/set base
// items (copied verbatim, not imported, to avoid that script's top-level
// file-writing side effects -- same convention already established there).
// Supertype/category codes runewords use that have no single leaf slot
// (mele/miss/pala/shld/weap) pass through as their raw code -- the site
// already has Grail.slot_mele/slot_miss/slot_pala/slot_shld/slot_weap
// translation strings from the previous runeword pipeline. ----
const TYPE_TO_SLOT = {
  helm: 'helms', circ: 'helms', phlm: 'helms', pelt: 'helms',
  tors: 'armors',
  shie: 'shields', ashd: 'shields', head: 'shields',
  belt: 'belts', boot: 'boots', glov: 'gloves',
  ring: 'rings', amul: 'amulets',
  scha: 'charms', mcha: 'charms', lcha: 'charms', csch: 'charms',
  jewl: 'jewels', cjwl: 'jewels',
  swor: 'swords', knif: 'daggers', axe: 'axes', pole: 'polearms',
  spea: 'spears', aspe: 'spears',
  club: 'clubs', mace: 'maces', hamm: 'hammers',
  scep: 'scepters', staf: 'staves', orb: 'orbs', wand: 'wands',
  grim: 'grimoires', h2h: 'katars', h2h2: 'katars',
  bow: 'bows', abow: 'bows', xbow: 'crossbows',
  jave: 'javelins', ajav: 'javelins',
  taxe: 'throwings', tkni: 'throwings',
};
function slotFor(code) {
  return TYPE_TO_SLOT[code] || code;
}

// ---- HD icon asset copying (same basename-dedup convention as
// generate-site-items.mjs's siteHdIconId). ----
mkdirSync(HD_ICON_OUT_DIR, { recursive: true });
const copiedIcons = new Set();
function siteHdIconId(pipelineHdIcon) {
  if (!pipelineHdIcon) return null;
  const rel = pipelineHdIcon.replace(/^data\/data\/hd\/global\/ui\/items\//, '');
  const base = basename(rel, '.png');
  if (!copiedIcons.has(base)) {
    const src = join(HD_PNG_ROOT, rel);
    const dest = join(HD_ICON_OUT_DIR, `${base}.png`);
    if (existsSync(src)) {
      copyFileSync(src, dest);
      copiedIcons.add(base);
    } else {
      console.warn(`WARNING: HD icon source missing: ${src}`);
      return null;
    }
  }
  return base;
}

// Converts the pipeline's pre-filtered/pre-sorted property list (one entry
// per locale, matched by array position -- same guarantee
// generate-site-items.mjs's convertPropList relies on) into a single
// locale-keyed-label array. min/max/variable carried through for
// consistency with unique/set items, even though runewords/runes have no
// per-copy roll-tracking feature today.
// The pipeline's rune name is the full item name including the "Rune"
// word/marker every language wraps it in ("El Rune" / "符文：艾爾" /
// "艾尔符文") -- the rune's own icon already conveys "this is a rune" so
// the site shows just the bare rune name, same convention the old
// runewords/runes data used.
const RUNE_NAME_WRAPPER = {
  en: { suffix: ' Rune' },
  'zh-TW': { prefix: '符文：' },
  'zh-CN': { suffix: '符文' },
};
function bareRuneName(fullName, locale) {
  const w = RUNE_NAME_WRAPPER[locale];
  if (!w) return fullName;
  if (w.prefix && fullName.startsWith(w.prefix)) return fullName.slice(w.prefix.length);
  if (w.suffix && fullName.endsWith(w.suffix)) return fullName.slice(0, -w.suffix.length);
  return fullName;
}

function convertPropList(enList, twList, cnList) {
  return enList.map((p, i) => ({
    code: p.code,
    label: { en: p.text, 'zh-TW': twList[i]?.text ?? p.text, 'zh-CN': cnList[i]?.text ?? p.text },
    min: Number(p.min),
    max: Number(p.max),
    variable: !!p.variable,
  }));
}

function localizedText(getter) {
  return Object.fromEntries(LOCALES.map(l => [l, getter(l)]));
}

// ---- Runes ----
const enRunes = runesByLocale.en;
const runesOut = enRunes.map(enRune => {
  const twRune = runesById['zh-TW'].get(enRune.id);
  const cnRune = runesById['zh-CN'].get(enRune.id);
  return {
    id: enRune.id,
    code: enRune.code,
    number: enRune.number,
    name: localizedText(l => bareRuneName(
      (l === 'en' ? enRune : l === 'zh-TW' ? twRune : cnRune)?.name ?? enRune.name, l
    )),
    levelReq: Number(enRune.levelReq) || 0,
    invFile: enRune.invFile || null,
    hdIcon: siteHdIconId(enRune.hdIcon),
    weaponStats: convertPropList(enRune.weaponStats, twRune?.weaponStats ?? [], cnRune?.weaponStats ?? []),
    helmStats: convertPropList(enRune.helmStats, twRune?.helmStats ?? [], cnRune?.helmStats ?? []),
    shieldStats: convertPropList(enRune.shieldStats, twRune?.shieldStats ?? [], cnRune?.shieldStats ?? []),
  };
});
writeFileSync(join(OUT, 'runes.json'), JSON.stringify(runesOut, null, 2));
console.log(`Wrote ${runesOut.length} runes -> data/runes.json`);

// ---- Runewords ----
const enRunewords = runewordsByLocale.en;
const runewordsOut = enRunewords.map(enRw => {
  const twRw = runewordsById['zh-TW'].get(enRw.id);
  const cnRw = runewordsById['zh-CN'].get(enRw.id);
  return {
    id: enRw.id,
    name: { en: enRw.name, 'zh-TW': twRw?.name ?? enRw.name, 'zh-CN': cnRw?.name ?? enRw.name },
    levelReq: Number(enRw.levelReq) || 0,
    sockets: enRw.sockets,
    itemTypes: enRw.includedItemTypes.map(t => slotFor(t.code)),
    excludedItemTypes: enRw.excludedItemTypes.map(t => slotFor(t.code)),
    runes: enRw.runes.map(r => ({
      code: r.code,
      name: localizedText(l => bareRuneName(runesById[l].get(`rune-${r.code}`)?.name ?? r.name, l)),
      invFile: r.invFile || null,
      hdIcon: siteHdIconId(r.hdIcon),
    })),
    stats: convertPropList(enRw.stats, twRw?.stats ?? [], cnRw?.stats ?? []),
    ladderRestricted: !!enRw.ladderRestricted,
    firstLadderSeason: enRw.firstLadderSeason ?? null,
    lastLadderSeason: enRw.lastLadderSeason ?? null,
    disallowedInLadder: !!enRw.disallowedInLadder,
    disallowedInNonLadder: !!enRw.disallowedInNonLadder,
  };
});
writeFileSync(join(OUT, 'runewords.json'), JSON.stringify(runewordsOut, null, 2));
console.log(`Wrote ${runewordsOut.length} runewords -> data/runewords.json`);
console.log(`Copied ${copiedIcons.size} distinct HD icon PNGs -> public/items/hd/`);
