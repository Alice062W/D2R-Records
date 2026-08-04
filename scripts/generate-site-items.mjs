#!/usr/bin/env node
// scripts/generate-site-items.mjs
//
// Replaces generate-grail-data.mjs's unique/set item generation
// (data/uniques.json, data/sets.json) with data sourced directly from the
// D2RAssets pipeline's item_database.json + per-language variants --
// authoritative, exhaustively cross-language-audited output (see
// C:\Users\yanhu\Documents\ClaudeCode\D2RAssets\docs\item-display-template.md
// and pipeline/build_item_db2.py) instead of this repo's own ~4000-line
// reimplementation of the same stat-text composition logic, which
// duplicated (and had not received the same scrutiny/fixes as) that work.
//
// What's KEPT from generate-grail-data.mjs: item-type -> UI slot bucket
// mapping (TYPE_TO_SLOT) and per-base-item-type weapon speed
// (WEAPON_BASE_SPEED) -- both are UI-categorization facts, not translation
// content, and were already verified against d2r.world independently of
// this change. Copied verbatim rather than imported, since importing the
// monolithic generate-grail-data.mjs would re-run its own top-level
// file-writing side effects.
//
// What's REPLACED: all property/stat label composition, poison-DoT
// merging, chance-to-cast phrasing, skill-name resolution, pierce-resist
// sign handling, "/lvl" scaling, etc. -- all of that is now the pipeline's
// job (build_item_db2.py), already fixed there across ~30 confirmed bugs
// this session. This script just reads the pipeline's pre-composed,
// pre-filtered, pre-sorted `.text` strings and the computed
// finalDefense/finalDamage/finalTwoHandDamage fields directly.

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(__dirname, '..', 'vendor', 'd2data', 'json');
const OUT = join(__dirname, '..', 'data');
const HD_ICON_OUT_DIR = join(__dirname, '..', 'public', 'items', 'hd');

// The pipeline's own extracted-data folder (see docs/item-display-template.md).
const EXTRACT = 'C:\\d2r-extract\\hd-png';
const HD_PNG_ROOT = join(EXTRACT, 'data', 'data', 'hd', 'global', 'ui', 'items');

const LOCALES = ['en', 'zh-TW', 'zh-CN'];
const LOCALE_FILE_SUFFIX = { en: '', 'zh-TW': '.zh-TW', 'zh-CN': '.zh-CN' };

function loadItemDb(locale) {
  const path = join(EXTRACT, `item_database${LOCALE_FILE_SUFFIX[locale]}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const dbByLocale = Object.fromEntries(LOCALES.map(l => [l, loadItemDb(l)]));
// Index each locale's item list by internalKey for cross-locale lookup. A
// handful of unique items share one internalKey across multiple distinct
// rows (e.g. the 8 elemental variants of "Rainbow Facet", or Azurewrath's
// ladder/non-ladder rows) -- keep every occurrence, in source order, so the
// Nth occurrence in one locale's list can be matched to the Nth occurrence
// in another's rather than collapsing them onto a single Map key (which
// would both silently drop items and cross-wire mismatched translations).
const byKeyPerLocale = Object.fromEntries(
  LOCALES.map(l => {
    const map = new Map();
    for (const it of dbByLocale[l]) {
      if (!map.has(it.internalKey)) map.set(it.internalKey, []);
      map.get(it.internalKey).push(it);
    }
    return [l, map];
  })
);
// Occurrence index (0-based) of each en item among en items sharing its
// internalKey, in source order -- used to pick the matching zh-TW/zh-CN row.
const enOccurrenceIndex = new Map();
{
  const counts = new Map();
  for (const it of dbByLocale.en) {
    const n = counts.get(it.internalKey) ?? 0;
    enOccurrenceIndex.set(it, n);
    counts.set(it.internalKey, n + 1);
  }
}

const items = JSON.parse(readFileSync(join(VENDOR, 'items.json'), 'utf8'));

// ---- Kept verbatim from generate-grail-data.mjs (UI categorization, not
// translation content -- see file header comment) ----
const TYPE_TO_SLOT = {
  helm: 'helms', circ: 'helms', phlm: 'helms', pelt: 'helms',
  tors: 'armors',
  shie: 'shields', ashd: 'shields', head: 'shields',
  belt: 'belts', boot: 'boots', glov: 'gloves',
  ring: 'rings', amul: 'amulets',
  scha: 'charms', mcha: 'charms', lcha: 'charms', csch: 'charms',
  jewl: 'jewels',
  // "Colossal Jewel" (cjw/cjwl) is 3.2 "Reign of the Warlock" content, added
  // after generate-grail-data.mjs's original TYPE_TO_SLOT table was built --
  // confirmed via item_database.json categories (['Colossal Jewel', 'Jewel',
  // 'Socket Filler', 'Miscellaneous']) it's the same slot as a normal jewel.
  cjwl: 'jewels',
  swor: 'swords', knif: 'daggers', axe: 'axes', pole: 'polearms',
  spea: 'spears', aspe: 'spears',
  club: 'clubs', mace: 'maces', hamm: 'hammers',
  scep: 'scepters', staf: 'staves', orb: 'orbs', wand: 'wands',
  grim: 'grimoires', h2h: 'katars', h2h2: 'katars',
  bow: 'bows', abow: 'bows', xbow: 'crossbows',
  jave: 'javelins', ajav: 'javelins',
  taxe: 'throwings', tkni: 'throwings',
};

const unmappedTypes = new Set();
function slotFor(code) {
  const type = items[code]?.type;
  const slot = TYPE_TO_SLOT[type];
  if (!slot) {
    unmappedTypes.add(`${type} (code "${code}")`);
    return 'unknown';
  }
  return slot;
}

function gradeFor(code) {
  const base = items[code];
  if (base?.ultracode === code) return 'elite';
  if (base?.ubercode === code) return 'exceptional';
  return 'normal';
}

// See generate-grail-data.mjs for provenance/verification notes -- copied
// verbatim, this table has no dependency on translation-pipeline data.
const WEAPON_BASE_SPEED = {
  "Ancient Axe": 10, "Ancient Sword": 0, "Arbalest": -10, "Archon Staff": 10,
  "Ataghan": -20, "Axe": 10, "Ballista": 10, "Balrog Blade": 0,
  "Balrog Spear": 10, "Barbed Club": 0, "Bardiche": 10, "Bastard Sword": 10,
  "Battle Axe": 10, "Battle Cestus": -10, "Battle Dart": 0, "Battle Hammer": 20,
  "Battle Scythe": -10, "Battle Staff": 0, "Battle Sword": 0, "Bearded Axe": 0,
  "Bec-de-Corbin": 0, "Berserker Axe": 0, "Bill": 0, "Blade": -10,
  "Bone Knife": -20, "Bone Wand": -20, "Brandistock": -20, "Broad Axe": 0,
  "Broad Sword": 0, "Burnt Wand": 0, "Caduceus": -10, "Cedar Bow": 0,
  "Cedar Staff": 10, "Ceremonial Bow": 10, "Ceremonial Javelin": -10, "Ceremonial Pike": 20,
  "Champion Axe": -10, "Champion Sword": -10, "Chu-Ko-Nu": -60, "Cinquedeas": -20,
  "Claymore": 10, "Cleaver": 10, "Club": -10, "Colossus Blade": 5,
  "Colossus Crossbow": 10, "Composite Bow": -10, "Crossbow": 0, "Crowbill": -10,
  "Crusader Bow": 10, "Cryptic Axe": 10, "Cryptic Sword": -10, "Cudgel": -10,
  "Cutlass": -30, "Dacian Falx": 10, "Dagger": -20, "Decapitator": 10,
  "Demon Crossbow": -60, "Devil Star": 10, "Dimensional Blade": 0, "Dimensional Shard": 10,
  "Dirk": 0, "Divine Scepter": -10, "Double Axe": 10, "Double Bow": -10,
  "Edge Bow": 5, "Elder Staff": 0, "Eldritch Orb": -10, "Elegant Blade": -10,
  "Espandon": 0, "Ettin Axe": 10, "Executioner Sword": 10, "Falchion": 20,
  "Fanged Knife": -20, "Feral Claws": -20, "Flail": -10, "Flamberge": -10,
  "Flanged Mace": 0, "Flying Axe": 10, "Francisca": 10, "Fuscina": 0,
  "Ghost Glaive": 20, "Giant Axe": 10, "Giant Sword": 0, "Giant Thresher": -10,
  "Gladius": 0, "Glorious Axe": 10, "Gnarled Staff": 10, "Gothic Axe": -10,
  "Gothic Bow": 10, "Gothic Staff": 0, "Gothic Sword": 10, "Grand Matron Bow": 10,
  "Grand Scepter": 10, "Grave Wand": 0, "Great Axe": -10, "Great Maul": 20,
  "Great Sword": 10, "Greater Talons": -30, "Grim Scythe": -10, "Grim Wand": 0,
  "Halberd": 0, "Hand Axe": 0, "Hatchet": 0, "Heavy Crossbow": 10,
  "Holy Water Sprinkler": 10, "Hunter's Bow": -10, "Hydra Bow": 10, "Hyperion Spear": -10,
  "Jagged Star": 10, "Jo Staff": -10, "Knout": -10, "Kris": -20,
  "Lance": 20, "Large Axe": -10, "Large Siege Bow": 10, "Legend Spike": -10,
  "Legend Sword": -15, "Legendary Mallet": 20, "Lich Wand": -20, "Light Crossbow": -10,
  "Lochaber Axe": 10, "Long Battle Bow": 10, "Long Bow": 0, "Long Staff": 0,
  "Long Sword": -10, "Long War Bow": 10, "Mace": 0, "Mancatcher": -20,
  "Martel de Fer": 20, "Matriarchal Bow": -10, "Matriarchal Javelin": -10, "Matriarchal Spear": 0,
  "Maul": 10, "Mighty Scepter": 0, "Military Axe": -10, "Military Pick": -10,
  "Mithril Point": 0, "Morning Star": 10, "Mythical Sword": 0, "Naga": 0,
  "Ogre Axe": 0, "Ogre Maul": 10, "Partizan": 10, "Petrified Wand": 10,
  "Phase Blade": -30, "Pike": 20, "Poignard": -20, "Poleaxe": 10,
  "Quarterstaff": 0, "Razor Bow": -10, "Reinforced Mace": 0, "Repeating Crossbow": -40,
  "Rondel": 0, "Rune Bow": 0, "Rune Scepter": 0, "Rune Staff": 20,
  "Rune Sword": -10, "Sabre": -10, "Scepter": 0, "Scimitar": -20,
  "Scissors Suwayyah": 0, "Scourge": -10, "Scythe": -10, "Shamshir": -10,
  "Short Battle Bow": 0, "Short Bow": 5, "Short Siege Bow": 0, "Short Staff": -10,
  "Short Sword": 0, "Short War Bow": 0, "Siege Crossbow": 0, "Silver-edged Axe": 0,
  "Spear": -10, "Spetum": 0, "Spiked Club": 0, "Stiletto": -10,
  "Swirling Crystal": 10, "Tabar": 10, "Thresher": -10, "Thunder Maul": 20,
  "Tomahawk": 0, "Tomb Wand": -20, "Trident": 0, "Truncheon": -10,
  "Tulwar": 20, "Tusk Sword": 0, "Twin Axe": 10, "Two-Handed Sword": 0,
  "Tyrant Club": 0, "Unearthed Wand": 0, "Voulge": 0, "Wand": 0,
  "War Axe": 0, "War Club": 10, "War Fork": -20, "War Hammer": 20,
  "War Pike": 20, "War Scepter": -10, "War Scythe": -10, "War Spear": -10,
  "War Spike": -10, "War Staff": 20, "War Sword": 0, "Ward Bow": 0,
  "Winged Axe": -10, "Winged Harpoon": -10, "Winged Knife": -20, "Wrist Sword": -10,
  "Yari": 0, "Yew Wand": 10, "Zweihander": -10,
};

// ---- HD icon asset copying ----
// The pipeline's hdIcon value is a path relative to HD_PNG_ROOT (e.g.
// "armor/helmet/crown.png"). Multiple items legitimately share the same
// base art (e.g. every "Crown"-based unique) -- copying by basename (not
// per-item) both matches the old site convention (bare id -> /items/hd/
// {id}.png) and avoids redundant copies.
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

// ---- Rainbow Facet per-element icon override ----
// The game's own HD-icon lookup table has exactly one entry for the
// "rainbow_facet" internalKey (a plain gem/perfect_diamond, no per-element
// variant) -- shared by all 8 of Rainbow Facet's real item rows (4
// elements x death-trigger/level-up-trigger). The numbered
// perfect_diamond1-6 assets that also exist in the HD folder are the random
// drop colors a jewel can roll in-game, but aren't wired to any specific
// item in the extracted data. Site-only cosmetic choice (see
// docs memory "rainbow-facet-diamond-icons", 2026-08-04): assign a distinct
// numbered diamond per element so the 8 variants are visually
// distinguishable instead of all showing the identical plain diamond.
const RAINBOW_FACET_ELEMENT_DIAMOND = {
  'extra-cold': 'misc/gem/perfect_diamond1.png',
  'extra-fire': 'misc/gem/perfect_diamond2.png',
  'extra-ltng': 'misc/gem/perfect_diamond3.png',
  'extra-pois': 'misc/gem/perfect_diamond4.png',
};
function rainbowFacetIconOverride(enItem) {
  if (enItem.internalKey !== 'rainbow_facet') return null;
  const elementProp = enItem.properties.find(p => p.code in RAINBOW_FACET_ELEMENT_DIAMOND);
  return elementProp ? siteHdIconId(RAINBOW_FACET_ELEMENT_DIAMOND[elementProp.code]) : null;
}

// ---- Property-array conversion ----
// Converts the pipeline's already-filtered/sorted/localized properties[]
// (or setPiecesBonuses[]/setFullBonus[]/setBonuses[]) array -- one entry
// per locale, matched by array position, since all three locale files were
// generated from the exact same filtered+sorted array order -- into a
// single locale-keyed-label array for the site.
// min/max/variable are carried through (not just the pre-composed label
// text) so the site's Grail find-tracking feature can still let a user
// record which specific value they rolled within a variable stat's range
// (e.g. Undead Crown's ac% rolled 47 out of its 30-60 range) -- purely
// additive to the pre-composed label, which remains the source of truth
// for display text.
function convertPropList(enList, twList, cnList) {
  return enList.map((p, i) => ({
    code: p.code,
    label: { en: p.text, 'zh-TW': twList[i]?.text ?? p.text, 'zh-CN': cnList[i]?.text ?? p.text },
    min: Number(p.min),
    max: Number(p.max),
    variable: !!p.variable,
  }));
}

function convertPieceBonusList(enList, twList, cnList) {
  return enList.map((p, i) => ({
    piecesRequired: p.piecesRequired,
    code: p.code,
    label: { en: p.text, 'zh-TW': twList[i]?.text ?? p.text, 'zh-CN': cnList[i]?.text ?? p.text },
    min: Number(p.min),
    max: Number(p.max),
    variable: !!p.variable,
  }));
}

function finalRange(r) {
  return r ? { min: r.min, max: r.max } : null;
}

function buildItem(enItem, idPrefix, idSuffix) {
  const occurrence = enOccurrenceIndex.get(enItem);
  const twItem = byKeyPerLocale['zh-TW'].get(enItem.internalKey)?.[occurrence];
  const cnItem = byKeyPerLocale['zh-CN'].get(enItem.internalKey)?.[occurrence];
  if (!twItem || !cnItem) {
    throw new Error(`Item "${enItem.internalKey}" (occurrence ${occurrence}) missing from a locale file`);
  }

  const code = enItem.itemCode;
  const hdIcon = rainbowFacetIconOverride(enItem) ?? siteHdIconId(enItem.hdIcon);

  return {
    id: `${idPrefix}-${enItem.internalKey}${idSuffix}`,
    code,
    name: { en: enItem.name, 'zh-TW': twItem.name, 'zh-CN': cnItem.name },
    kind: enItem.kind,
    setName: enItem.setName ? { en: enItem.setName, 'zh-TW': twItem.setName, 'zh-CN': cnItem.setName } : null,
    levelReq: Number(enItem.levelReq) || 0,
    baseName: { en: enItem.baseName, 'zh-TW': twItem.baseName, 'zh-CN': cnItem.baseName },
    grade: gradeFor(code),
    slotCategory: slotFor(code),
    defense: finalRange(enItem.finalDefense),
    oneHandDamage: finalRange(enItem.finalDamage),
    twoHandDamage: finalRange(enItem.finalTwoHandDamage),
    requiredStrength: enItem.combatStats?.reqStr ?? null,
    requiredDexterity: enItem.combatStats?.reqDex ?? null,
    weaponSpeed: WEAPON_BASE_SPEED[enItem.baseName] ?? null,
    durability: enItem.combatStats?.durability ?? null,
    // classRestriction is NOT per-language in the pipeline output (it's the
    // same bare English class-code string, e.g. "Assassin", in every locale
    // file -- it's a filter/category facet, not display text). Site
    // renders it via its own class-name translation strings.
    classRestriction: enItem.classRestriction || null,
    invFile: (enItem.classicIcon || '').replace(/\.dc6$/i, '') || null,
    hdIcon,
    properties: convertPropList(enItem.properties, twItem.properties, cnItem.properties),
    // Codes of this item's own variable-roll properties, in tooltip display
    // order (already sorted by the pipeline) -- used by the Grail
    // find-tracking feature (src/lib/grail/bestCopy.ts) to rank a player's
    // recorded copies by "best roll on the stat that matters most first".
    statPriority: enItem.properties.filter(p => p.variable).map(p => p.code),
    setPiecesBonuses: convertPieceBonusList(
      enItem.setPiecesBonuses || [], twItem.setPiecesBonuses || [], cnItem.setPiecesBonuses || []
    ),
    setFullBonus: convertPropList(enItem.setFullBonus || [], twItem.setFullBonus || [], cnItem.setFullBonus || []),
    setBonuses: convertPieceBonusList(
      enItem.setBonuses || [], twItem.setBonuses || [], cnItem.setBonuses || []
    ),
    ladderRestricted: !!enItem.ladderRestricted,
    firstLadderSeason: enItem.firstLadderSeason ?? null,
    lastLadderSeason: enItem.lastLadderSeason ?? null,
  };
}

// internalKey is unique per item almost everywhere, but a handful of unique
// items (e.g. "Rainbow Facet"'s 8 elemental variants, Azurewrath's
// ladder/non-ladder rows) share one internalKey across multiple distinct
// item rows -- suffix the id with a 1-based counter among same-kind
// siblings so every output id stays unique.
function buildItemsForKind(kind, idPrefix) {
  const kindItems = enDb.filter(it => it.kind === kind);
  const counts = new Map();
  for (const it of kindItems) counts.set(it.internalKey, (counts.get(it.internalKey) ?? 0) + 1);
  const seen = new Map();
  return kindItems.map(it => {
    const total = counts.get(it.internalKey);
    if (total === 1) return buildItem(it, idPrefix, '');
    const n = (seen.get(it.internalKey) ?? 0) + 1;
    seen.set(it.internalKey, n);
    return buildItem(it, idPrefix, `-${n}`);
  });
}

const enDb = dbByLocale.en;
const uniquesOut = buildItemsForKind('unique', 'unique');
const setsOut = buildItemsForKind('set', 'set');

writeFileSync(join(OUT, 'uniques.json'), JSON.stringify(uniquesOut, null, 2));
writeFileSync(join(OUT, 'sets.json'), JSON.stringify(setsOut, null, 2));

if (unmappedTypes.size > 0) {
  console.error('ERROR: unmapped item types (fix TYPE_TO_SLOT before trusting output):');
  for (const t of unmappedTypes) console.error(`  ${t}`);
  process.exitCode = 1;
}

// ---- Set-group summary (data/set-groups.json) ----
// A set's own setPiecesBonuses/setFullBonus are IDENTICAL across every
// piece belonging to that set (confirmed: they're a set-wide bonus, not
// per-item) -- so the group-level summary can be built directly from any
// one representative piece rather than needing a separate computation.
const setGroupsOut = [];
const seenSetNames = new Set();
for (const it of setsOut) {
  const setNameEn = it.setName.en;
  if (seenSetNames.has(setNameEn)) continue;
  seenSetNames.add(setNameEn);
  const pieces = setsOut.filter(p => p.setName.en === setNameEn);
  setGroupsOut.push({
    setName: it.setName,
    pieceIds: pieces.map(p => p.id),
    repInvFile: pieces[0].invFile,
    repHdIcon: pieces[0].hdIcon,
    partialBonuses: Object.entries(
      pieces[0].setPiecesBonuses.reduce((acc, p) => {
        (acc[p.piecesRequired] ??= []).push({ code: p.code, label: p.label });
        return acc;
      }, {})
    ).map(([piecesRequired, props]) => ({ piecesRequired: Number(piecesRequired), properties: props })),
    fullSetBonus: pieces[0].setFullBonus,
  });
}
writeFileSync(join(OUT, 'set-groups.json'), JSON.stringify(setGroupsOut, null, 2));
console.log(`Wrote ${setGroupsOut.length} set groups -> data/set-groups.json`);

console.log(`Wrote ${uniquesOut.length} unique items -> data/uniques.json`);
console.log(`Wrote ${setsOut.length} set items -> data/sets.json`);
console.log(`Copied ${copiedIcons.size} distinct HD icon PNGs -> public/items/hd/`);
