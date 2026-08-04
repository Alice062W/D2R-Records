#!/usr/bin/env node
// scripts/generate-site-base-items.mjs
//
// Builds data/bases-full.json from the D2RAssets pipeline's authoritative
// base_items.json (+ per-language variants) in C:\d2r-extract\hd-png --
// same relationship generate-site-items.mjs/generate-site-runewords.mjs
// have to their own pipeline outputs. See pipeline/build_item_db2.py's
// "Base items" section for how these are extracted (grade/family grouping
// from armor.txt/weapons.txt's own normcode/ubercode/ultracode linkage,
// plus per-item statRows -- the inclusion filter + display order this
// script's consumers rely on instead of re-deriving it).
//
// Inclusion filter for WHICH of the pipeline's 692 base items appear on
// the site: only rows whose raw itemType maps to a real equipment slot
// (TYPE_TO_SLOT below) AND that are their own family root (family===code,
// i.e. the normal-tier row) -- this naturally excludes quest items, gold,
// keys, gems, potions, scrolls, and body parts (none of which have an
// itemType in TYPE_TO_SLOT), while including every real weapon/armor/
// jewelry slot (rings/amulets/charms/jewels now included -- the OLD
// generate-grail-data.mjs pipeline excluded these, but only because
// misc.txt has no normcode column at all for it to key off of, not a
// deliberate scope decision; build_item_db2.py's family-grouping already
// handles the single-tier case correctly).

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

const baseItemsByLocale = Object.fromEntries(LOCALES.map(l => [l, loadJson('base_items', l)]));
function byId(list) {
  return new Map(list.map(it => [it.id, it]));
}
const baseItemsById = Object.fromEntries(LOCALES.map(l => [l, byId(baseItemsByLocale[l])]));

// Same TYPE_TO_SLOT table generate-site-items.mjs/generate-site-runewords.mjs
// already use (copied verbatim, not imported, to avoid those scripts'
// top-level file-writing side effects).
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

// Helms/Shields sub-category tabs (Circlet/Barbarian/Druid helms,
// Paladin/Shrunken-Head shields) -- same convention the old
// generate-grail-data.mjs used, keyed off the same raw itemType codes.
const HELM_SUB_CATEGORY = { helm: null, circ: 'circlet', phlm: 'barbarian', pelt: 'druid' };
const SHIELD_SUB_CATEGORY = { shie: null, ashd: 'paladin', head: 'shrunkenHeads' };
function subCategoryFor(itemType) {
  if (itemType in HELM_SUB_CATEGORY) return HELM_SUB_CATEGORY[itemType];
  if (itemType in SHIELD_SUB_CATEGORY) return SHIELD_SUB_CATEGORY[itemType];
  return null;
}

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

function convertStatRows(list) {
  return (list || []).map(r => ({ code: r.code, min: r.min, max: r.max, value: r.value }));
}

function localizedText(getter) {
  return Object.fromEntries(LOCALES.map(l => [l, getter(l)]));
}

function convertGrade(enGrade) {
  if (!enGrade) return null;
  return {
    name: localizedText(l => baseItemsById[l].get(enGrade.id)?.name ?? enGrade.name),
    invFile: (enGrade.classicIcon || '').replace(/\.dc6$/i, '') || null,
    hdIcon: siteHdIconId(enGrade.hdIcon),
    levelReq: enGrade.levelReq,
    qlvl: enGrade.qlvl,
    statRows: convertStatRows(enGrade.statRows),
  };
}

const enBaseItems = baseItemsByLocale.en;
const unmappedTypes = new Set();
const families = new Map(); // family root code -> { normal, exceptional, elite }
for (const it of enBaseItems) {
  const slot = TYPE_TO_SLOT[it.itemType];
  if (!slot) {
    unmappedTypes.add(`${it.itemType} (code "${it.code}")`);
    continue;
  }
  if (!families.has(it.family)) families.set(it.family, {});
  families.get(it.family)[it.grade] = it;
}

const basesOut = [];
for (const [familyCode, tiers] of families) {
  const rootItem = tiers.normal ?? tiers.exceptional ?? tiers.elite;
  const slot = TYPE_TO_SLOT[rootItem.itemType];
  basesOut.push({
    id: `base-${familyCode}`,
    slotCategory: slot,
    subCategory: subCategoryFor(rootItem.itemType),
    classRestriction: rootItem.classRestriction || null,
    invFile: (rootItem.classicIcon || '').replace(/\.dc6$/i, '') || null,
    hdIcon: siteHdIconId(rootItem.hdIcon),
    grades: {
      normal: convertGrade(tiers.normal ?? null),
      exceptional: convertGrade(tiers.exceptional ?? null),
      elite: convertGrade(tiers.elite ?? null),
    },
  });
}

writeFileSync(join(OUT, 'bases-full.json'), JSON.stringify(basesOut, null, 2));
console.log(`Wrote ${basesOut.length} base item families -> data/bases-full.json`);
console.log(`Copied ${copiedIcons.size} distinct HD icon PNGs -> public/items/hd/`);
if (unmappedTypes.size > 0) {
  console.log(`Skipped ${unmappedTypes.size} unmapped itemTypes (not real equipment slots, correctly excluded):`);
  for (const t of [...unmappedTypes].sort()) console.log(`  ${t}`);
}
