#!/usr/bin/env node
// scripts/generate-grail-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as OpenCC from 'opencc-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(__dirname, '..', 'vendor', 'd2data', 'json');
const OUT = join(__dirname, '..', 'data');

const uniqueItems = JSON.parse(readFileSync(join(VENDOR, 'uniqueitems.json'), 'utf8'));
const setItemsRaw = JSON.parse(readFileSync(join(VENDOR, 'setitems.json'), 'utf8'));
const items = JSON.parse(readFileSync(join(VENDOR, 'items.json'), 'utf8'));
const skills = JSON.parse(readFileSync(join(VENDOR, 'skills.json'), 'utf8'));
const chi = JSON.parse(readFileSync(join(VENDOR, 'localestrings-chi.json'), 'utf8'));

const toZhCnConverter = OpenCC.Converter({ from: 'tw', to: 'cn' });
function toZhCn(text) {
  return toZhCnConverter(text);
}

// Hand-curated English labels for the most common stat codes (ranked by frequency across
// uniqueitems.json + setitems.json). Anything missing falls back to the raw code —
// functional, just less pretty. Extend as needed; cross-check wording against
// https://d2r.world/en-US when in doubt (reference only, do not copy their data).
const PROP_LABELS_EN = {
  str: 'Strength', dex: 'Dexterity', vit: 'Vitality', enr: 'Energy',
  hp: 'Life', mana: 'Mana', stam: 'Stamina',
  ac: 'Defense', 'ac%': 'Enhanced Defense %', 'ac-miss': 'Defense vs. Missile',
  'ac/lvl': 'Defense per Level', 'ignore-ac': 'Ignore Target Defense',
  'dmg%': 'Enhanced Damage %', 'dmg-min': 'Minimum Damage', 'dmg-max': 'Maximum Damage',
  'dmg-norm': 'Damage', 'dmg-fire': 'Fire Damage', 'dmg-cold': 'Cold Damage',
  'dmg-ltng': 'Lightning Damage', 'dmg-pois': 'Poison Damage', 'dmg-undead': 'Damage to Undead',
  att: 'Attack Rating', 'att%': 'Attack Rating %', 'att-skill': 'Attack Rating (skill)',
  crush: 'Crushing Blow %', deadly: 'Deadly Strike %', openwounds: 'Open Wounds %',
  thorns: 'Attacker Takes Damage', ease: 'Requirements %',
  'res-fire': 'Fire Resist %', 'res-cold': 'Cold Resist %', 'res-ltng': 'Lightning Resist %',
  'res-pois': 'Poison Resist %', 'res-all': 'All Resistances',
  'red-dmg': 'Damage Reduced', 'red-dmg%': 'Damage Reduced %', 'red-mag': 'Magic Damage Reduced',
  lifesteal: 'Life Steal %', manasteal: 'Mana Steal %',
  regen: 'Life Regenerated %', 'regen-mana': 'Mana Regenerated %', 'regen-stam': 'Stamina Regenerated %',
  block: 'Increased Chance of Blocking %', block2: 'Faster Block Rate',
  balance1: 'Faster Hit Recovery', balance2: 'Faster Hit Recovery',
  swing2: 'Faster Attack Rate', swing3: 'Faster Attack Rate',
  cast2: 'Faster Cast Rate', cast3: 'Faster Cast Rate', move2: 'Faster Run/Walk %', move3: 'Faster Run/Walk %',
  stamdrain: 'Slower Stamina Drain %',
  'pierce-fire': 'Enemy Fire Resistance %', 'pierce-ltng': 'Enemy Lightning Resistance %',
  'pierce-cold': 'Enemy Cold Resistance %', 'pierce-pois': 'Enemy Poison Resistance %', 'pierce-mag': 'Enemy Magic Resistance %',
  'extra-cold': 'Cold Skill Damage %', 'extra-fire': 'Fire Skill Damage %',
  'extra-ltng': 'Lightning Skill Damage %', 'extra-mag': 'Magic Skill Damage %', 'extra-pois': 'Poison Skill Damage %',
  light: 'Light Radius', 'half-freeze': 'Half Freeze Duration',
  slow: 'Slower Target %', sock: 'Sockets', dur: 'Indestructible', indestruct: 'Indestructible',
  skill: 'Skill Bonus', oskill: 'Skill Bonus', skilltab: 'Skill Tab Bonus', allskills: 'All Skills',
  'hit-skill': 'Chance to Cast on Striking', 'gethit-skill': 'Chance to Cast When Struck',
  'death-skill': 'Chance to Cast on Death %', 'levelup-skill': 'Chance to Cast on Level-Up %',
  charged: 'Charges', 'mag%': 'Magic Find %', 'gold%': 'Gold Find %',
  'dmg-to-mana': 'Damage Taken Goes to Mana',
  dmg: 'Maximum Damage', knock: 'Knockback',
  'abs-cold': 'Cold Absorb', 'abs-fire': 'Fire Absorb',
  'rep-quant': 'Replenishes Quantity', 'rep-dur': 'Repairs Durability', stack: 'Increased Stack Size',
  ama: 'Amazon Skill Levels', ass: 'Assassin Skill Levels', bar: 'Barbarian Skill Levels',
  dru: 'Druid Skill Levels', nec: 'Necromancer Skill Levels', pal: 'Paladin Skill Levels',
  sor: 'Sorceress Skill Levels', 'mana%': 'Increase Maximum Mana %', 'hp%': 'Increase Maximum Life %',
  // Adds elemental damage is split across two separate stat IDs (min/max) in the
  // source data for these elements — unlike dmg-cold/dmg-fire/dmg-ltng-as-single-id
  // patterns seen elsewhere, so each half renders as its own line rather than a
  // single combined "Adds X-Y Damage" range. Numerically complete, just two rows.
  'ltng-min': 'Lightning Damage (Min)', 'ltng-max': 'Lightning Damage (Max)',
  'fire-min': 'Fire Damage (Min)', 'fire-max': 'Fire Damage (Max)',
  'cold-min': 'Cold Damage (Min)', 'cold-max': 'Cold Damage (Max)', 'cold-len': 'Cold Duration',
  'pois-min': 'Poison Damage (Min)', 'pois-max': 'Poison Damage (Max)', 'pois-len': 'Poison Duration',
};

// Hand-translated Traditional Chinese counterpart to PROP_LABELS_EN — same keys, same
// fallback contract (missing key -> fall back to the English label, not the raw code,
// per the project's fallback policy). Not official strings (D2's real property
// description system is a template engine, not a simple lookup) — same "hand-curated,
// extend as needed" convention as the English dictionary; worth native review.
const PROP_LABELS_ZH_TW = {
  str: '力量', dex: '敏捷', vit: '活力', enr: '精力',
  hp: '生命值', mana: '魔力值', stam: '耐力',
  ac: '防禦力', 'ac%': '強化防禦力 %', 'ac-miss': '對抗遠程攻擊防禦力',
  'ac/lvl': '每等級防禦力', 'ignore-ac': '無視目標防禦力',
  'dmg%': '強化傷害 %', 'dmg-min': '最小傷害', 'dmg-max': '最大傷害',
  'dmg-norm': '傷害', 'dmg-fire': '火焰傷害', 'dmg-cold': '冷凍傷害',
  'dmg-ltng': '閃電傷害', 'dmg-pois': '毒素傷害', 'dmg-undead': '對不死系傷害',
  att: '攻擊等級', 'att%': '攻擊等級 %', 'att-skill': '攻擊等級（技能）',
  crush: '破碎打擊 %', deadly: '致命一擊 %', openwounds: '撕裂傷口 %',
  thorns: '攻擊者承受傷害', ease: '需求 %',
  'res-fire': '火焰抗性 %', 'res-cold': '冷凍抗性 %', 'res-ltng': '閃電抗性 %',
  'res-pois': '毒素抗性 %', 'res-all': '全抗性',
  'red-dmg': '減少傷害', 'red-dmg%': '減少傷害 %', 'red-mag': '減少魔法傷害',
  lifesteal: '生命竊取 %', manasteal: '魔力竊取 %',
  regen: '生命回復 %', 'regen-mana': '魔力回復 %', 'regen-stam': '耐力回復 %',
  block: '格擋機率 %', block2: '加快格擋速度',
  balance1: '加快恢復速度', balance2: '加快恢復速度',
  swing2: '加快攻擊速度', swing3: '加快攻擊速度',
  cast2: '加快施法速度', cast3: '加快施法速度', move2: '加快跑走速度 %', move3: '加快跑走速度 %',
  stamdrain: '減緩耐力消耗 %',
  'pierce-fire': '降低敵方火焰抗性 %', 'pierce-ltng': '降低敵方閃電抗性 %',
  'pierce-cold': '降低敵方冷凍抗性 %', 'pierce-pois': '降低敵方毒素抗性 %', 'pierce-mag': '降低敵方魔法抗性 %',
  'extra-cold': '冷凍技能傷害 %', 'extra-fire': '火焰技能傷害 %',
  'extra-ltng': '閃電技能傷害 %', 'extra-mag': '魔法技能傷害 %', 'extra-pois': '毒素技能傷害 %',
  light: '光環半徑', 'half-freeze': '減半冰凍持續時間',
  slow: '減緩目標速度 %', sock: '插槽數', dur: '不可破壞', indestruct: '不可破壞',
  skill: '技能加成', oskill: '技能加成', skilltab: '技能列加成', allskills: '全部技能',
  'hit-skill': '攻擊時觸發機率', 'gethit-skill': '受擊時觸發機率',
  'death-skill': '死亡時觸發機率 %', 'levelup-skill': '升級時觸發機率 %',
  charged: '充能次數', 'mag%': '額外魔法物品尋獲率 %', 'gold%': '額外金幣拾取率 %',
  'dmg-to-mana': '承受傷害轉換為魔力',
  dmg: '最大傷害', knock: '擊退',
  'abs-cold': '冷凍吸收', 'abs-fire': '火焰吸收',
  'rep-quant': '補充數量', 'rep-dur': '修復耐久度', stack: '增加堆疊上限',
  ama: '亞馬遜技能等級', ass: '刺客技能等級', bar: '蠻族技能等級',
  dru: '德魯伊技能等級', nec: '死靈法師技能等級', pal: '聖騎士技能等級',
  sor: '女巫技能等級', 'mana%': '增加最大魔力值 %', 'hp%': '增加最大生命值 %',
  'ltng-min': '閃電傷害（最小）', 'ltng-max': '閃電傷害（最大）',
  'fire-min': '火焰傷害（最小）', 'fire-max': '火焰傷害（最大）',
  'cold-min': '冷凍傷害（最小）', 'cold-max': '冷凍傷害（最大）', 'cold-len': '冷凍持續時間',
  'pois-min': '毒素傷害（最小）', 'pois-max': '毒素傷害（最大）', 'pois-len': '毒素持續時間',
};

const LVL_SUFFIX = { en: ' (Based on Character Level)', 'zh-TW': '（依角色等級）' };

// locale here is only 'en' | 'zh-TW' — zh-CN is always derived by converting a zh-TW
// result, never resolved independently (see localizedLabelFor / localizedItemName etc.).
function baseLabelForLocale(code, locale) {
  if (locale === 'zh-TW') return PROP_LABELS_ZH_TW[code] ?? baseLabelForLocale(code, 'en');
  return PROP_LABELS_EN[code] ?? code;
}

function labelForLocale(code, locale) {
  if (PROP_LABELS_EN[code] || PROP_LABELS_ZH_TW[code]) return baseLabelForLocale(code, locale);
  // "/lvl" suffix marks a stat whose magnitude scales with character level
  // (encoded in the source data via a `par` divisor rather than min/max) and
  // isn't itself a direct PROP_LABELS key — compose the base stat's label with
  // a level-scaling qualifier so these aren't indistinguishable from their flat
  // counterparts.
  if (code.endsWith('/lvl')) {
    const base = code.slice(0, -4);
    return `${baseLabelForLocale(base, locale)}${LVL_SUFFIX[locale]}`;
  }
  return baseLabelForLocale(code, locale);
}

function localizedLabelFor(code) {
  const zhTw = labelForLocale(code, 'zh-TW');
  return { en: labelForLocale(code, 'en'), 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
}

// Prop codes whose `par` field identifies a specific skill rather than being
// incidental (see extractProps). `par` is either a numeric skill id (looked up
// in vendor/d2data/json/skills.json for English, localestrings-chi.json's
// `skillname{id}` keys for zh-TW) or already a literal skill-name string — both
// forms occur in the source data (verified: skill/oskill/charged/hit-skill/
// gethit-skill/death-skill/att-skill/levelup-skill, 255 occurrences across the
// full catalog, zero unresolvable numeric ids for English). Without this, every
// stat sharing one of these codes on the same item renders as an identical
// generic label (e.g. "Skill Bonus: 1-3" four times on Maelstromwrath instead of
// naming each of its four granted skills) — the specific skill is silently lost.
// `Gethit-skill` (capital G) is a case-variant of `gethit-skill` in the source
// data; normalized to the lowercase code so it's treated as the same stat.
const SKILL_REF_PROPS = new Set([
  'skill', 'oskill', 'charged', 'hit-skill', 'gethit-skill',
  'death-skill', 'att-skill', 'levelup-skill',
]);
const CODE_ALIASES = { 'Gethit-skill': 'gethit-skill' };

// `skilltab`'s `par` identifies a specific skill *tab* (e.g. Necromancer
// Curses), the same collision-prone shape as SKILL_REF_PROPS above — but
// unlike individual skills, none of skills.json/skilldesc.json/playerclass.json
// in the vendored source name tabs directly (skilldesc.json has SkillPage/
// SkillRow coordinates, not a tab name), and hand-guessing tab names risks
// showing something wrong, which is worse than a generic label. So: disambiguate
// the storage *key* (fixes real data loss — multiple tab bonuses on one item,
// e.g. Jadetalon, would otherwise silently overwrite each other's logged
// values) without claiming a specific tab name in the *label*.
const KEY_ONLY_DISAMBIGUATE_PROPS = new Set(['skilltab']);

function isNumericPar(par) {
  return typeof par === 'number' || (typeof par === 'string' && /^-?\d+$/.test(par));
}

function skillNameForLocale(par, locale) {
  if (locale === 'zh-TW') {
    if (isNumericPar(par)) return chi[`skillname${par}`] ?? skillNameForLocale(par, 'en');
    return chi[String(par)] ?? String(par);
  }
  if (!isNumericPar(par)) return String(par);
  return skills[String(par)]?.skill ?? String(par);
}

function localizedSkillName(par) {
  const zhTw = skillNameForLocale(par, 'zh-TW');
  return { en: skillNameForLocale(par, 'en'), 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
}

function localizedLabelWithSkill(code, par) {
  const base = localizedLabelFor(code);
  if (par === undefined) return base;
  const skillName = localizedSkillName(par);
  return {
    en: `${base.en} (${skillName.en})`,
    'zh-TW': `${base['zh-TW']} (${skillName['zh-TW']})`,
    'zh-CN': `${base['zh-CN']} (${skillName['zh-CN']})`,
  };
}

// Item/set names and base names: localestrings-chi.json is keyed by the exact
// English string used elsewhere in the source data (item `index` names verbatim,
// base item codes directly) — see vendor/d2data/README.md. ~95% coverage
// (verified); the miss is newer DLC content not yet in this localization
// snapshot, and falls back to the English text per the fallback policy.
function localizedItemName(englishName) {
  const zhTw = chi[englishName] ?? englishName;
  return { en: englishName, 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
}

function localizedBaseName(code, englishFallback) {
  const zhTw = chi[code] ?? englishFallback;
  return { en: englishFallback, 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
}

// type code (items.json .type) -> slot category. Every code observed across
// spawnable uniques+sets is mapped explicitly; an unmapped code is a hard error
// so a future data refresh can't silently mis-bucket items.
const TYPE_TO_SLOT = {
  helm: 'helms', circ: 'helms', phlm: 'helms', pelt: 'helms',
  tors: 'armors',
  shie: 'shields', ashd: 'shields', head: 'shields',
  belt: 'belts', boot: 'boots', glov: 'gloves',
  ring: 'rings', amul: 'amulets',
  scha: 'charms', mcha: 'charms', lcha: 'charms',
  jewl: 'jewels',
  swor: 'swords', knif: 'daggers', axe: 'axes', pole: 'polearms',
  spea: 'spears', aspe: 'spears',
  club: 'clubs', mace: 'maces', hamm: 'hammers',
  scep: 'scepters', staf: 'staves', orb: 'orbs', wand: 'wands',
  grim: 'grimoires', h2h2: 'katars',
  bow: 'bows', abow: 'bows', xbow: 'crossbows',
  jave: 'javelins', ajav: 'javelins',
  taxe: 'throwings', tkni: 'throwings',
};

function slotFor(code) {
  const type = items[code]?.type;
  const slot = TYPE_TO_SLOT[type];
  if (!slot) throw new Error(`Unmapped item type "${type}" for base code "${code}"`);
  return slot;
}

function gradeFor(code) {
  const base = items[code];
  if (base?.ultracode === code) return 'elite';
  if (base?.ubercode === code) return 'exceptional';
  return 'normal';
}

function baseFieldsFor(code) {
  const base = items[code];
  const englishBaseName = base?.name ?? code;
  return {
    baseName: localizedBaseName(code, englishBaseName),
    grade: gradeFor(code),
    slotCategory: slotFor(code),
    defense: base?.minac != null && base?.maxac != null
      ? { min: base.minac, max: base.maxac }
      : null,
    requiredStrength: base?.reqstr ?? null,
    durability: base?.durability ?? null,
  };
}

function extractProps(entry, count, prefixes = { code: 'prop', par: 'par', min: 'min', max: 'max' }) {
  const variable = [];
  const fixed = [];
  for (let n = 1; n <= count; n++) {
    const rawCode = entry[`${prefixes.code}${n}`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`${prefixes.par}${n}`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
    // Disambiguate the stat's identity key when the same generic code (e.g.
    // "skill", "charged", "skilltab") appears more than once on one item for
    // different skills/tabs — otherwise every such stat collapses onto one
    // object key, both in statPriority and in a logged find's stored roll
    // values, so a second skill's entered value silently overwrites the first's.
    const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
    const key = needsKeySuffix ? `${code}:${par}` : code;
    const min = entry[`${prefixes.min}${n}`];
    const max = entry[`${prefixes.max}${n}`];
    if (min !== undefined && max !== undefined) {
      if (min === max) fixed.push({ key, label, value: min });
      else variable.push({ key, label, min, max });
      continue;
    }
    // Some props (level-scaling stats like hp/lvl, dmg/lvl; also sock,
    // rep-dur, rep-quant) carry only a `par` field instead of min/max.
    // Surface these as a fixed entry rather than silently dropping the
    // stat line — dropping it made e.g. Harlequin Crest's Life/Mana
    // (Based on Character Level) and Windforce's scaling max damage
    // disappear entirely.
    if (par !== undefined) {
      fixed.push({ key, label, value: par });
    }
  }
  return { variable, fixed };
}

// Set-only bonus props unlocked by wearing multiple pieces of the set. Suffix letters
// (a, b, c, d) correspond to successive partial-bonus tiers; kept flat/informational
// here since they're display-only context, not something a find is logged against.
function extractSetBonuses(entry) {
  const bonuses = [];
  for (const suffix of ['a', 'b', 'c', 'd']) {
    for (let n = 1; n <= 5; n++) {
      const rawCode = entry[`aprop${n}${suffix}`];
      if (!rawCode) continue;
      const code = CODE_ALIASES[rawCode] ?? rawCode;
      const par = entry[`apar${n}${suffix}`];
      const isSkillRef = SKILL_REF_PROPS.has(code);
      const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
      const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
      const key = needsKeySuffix ? `${code}:${par}` : code;
      const min = entry[`amin${n}${suffix}`];
      const max = entry[`amax${n}${suffix}`];
      if (min !== undefined && max !== undefined) {
        bonuses.push({ key, label, min, max });
        continue;
      }
      // Same par-only case as extractProps (level-scaling bonuses like
      // att/lvl, ac/lvl) — surface as a fixed min===max entry rather than
      // silently dropping the bonus line.
      if (par !== undefined) {
        bonuses.push({ key, label, min: par, max: par });
      }
    }
  }
  return bonuses;
}

const uniquesOut = Object.entries(uniqueItems)
  .filter(([, v]) => v.spawnable === 1)
  .map(([id, v]) => {
    const { variable, fixed } = extractProps(v, 10, { code: 'prop', par: 'par', min: 'min', max: 'max' });
    return {
      id: `unique-${id}`,
      code: v.code,
      name: localizedItemName(v.index),
      kind: 'unique',
      setName: null,
      levelReq: v['lvl req'] ?? 0,
      ...baseFieldsFor(v.code),
      invFile: v.invfile || items[v.code]?.invfile || '',
      stats: variable,
      fixedStats: fixed,
      setBonuses: [],
      statPriority: variable.map(s => s.key),
    };
  });

const setsOut = Object.entries(setItemsRaw)
  .filter(([, v]) => v.spawnable === 1)
  .map(([, v]) => {
    const { variable, fixed } = extractProps(v, 7, { code: 'prop', par: 'par', min: 'min', max: 'max' });
    return {
      id: `set-${v['*ID']}`,
      code: v.item,
      name: localizedItemName(v.index),
      kind: 'set',
      setName: v.set ? localizedItemName(v.set) : null,
      levelReq: v['lvl req'] ?? 0,
      ...baseFieldsFor(v.item),
      invFile: v.invfile || items[v.item]?.invfile || '',
      stats: variable,
      fixedStats: fixed,
      setBonuses: extractSetBonuses(v),
      statPriority: variable.map(s => s.key),
    };
  });

function damageFor(entry) {
  const oneHand = entry.mindam != null && entry.maxdam != null
    ? { min: entry.mindam, max: entry.maxdam }
    : null;
  const twoHand = entry['2handmindam'] != null && entry['2handmaxdam'] != null
    ? { min: entry['2handmindam'], max: entry['2handmaxdam'] }
    : null;
  return { oneHandDamage: oneHand, twoHandDamage: twoHand };
}

function baseGradeFor(code) {
  const entry = items[code];
  if (!entry) return null;
  return {
    name: localizedBaseName(code, entry.name ?? code),
    ...damageFor(entry),
    levelReq: entry.levelreq ?? null,
    requiredStrength: entry.reqstr ?? null,
    requiredDexterity: entry.reqdex ?? null,
    durability: entry.durability ?? null,
    sockets: entry.gemsockets ?? null,
    qlvl: entry.level ?? null,
  };
}

const basesFullOut = Object.entries(items)
  .filter(([code, v]) => v.normcode === code && TYPE_TO_SLOT[v.type])
  .map(([code, v]) => ({
    id: `base-${code}`,
    slotCategory: TYPE_TO_SLOT[v.type],
    grades: {
      normal: baseGradeFor(code),
      exceptional: v.ubercode && v.ubercode !== code ? baseGradeFor(v.ubercode) : null,
      elite: v.ultracode && v.ultracode !== code ? baseGradeFor(v.ultracode) : null,
    },
  }));

writeFileSync(join(OUT, 'bases-full.json'), JSON.stringify(basesFullOut, null, 2));
console.log(`Wrote ${basesFullOut.length} base item lines -> data/bases-full.json`);

writeFileSync(join(OUT, 'uniques.json'), JSON.stringify(uniquesOut, null, 2));
writeFileSync(join(OUT, 'sets.json'), JSON.stringify(setsOut, null, 2));

console.log(`Wrote ${uniquesOut.length} unique items -> data/uniques.json`);
console.log(`Wrote ${setsOut.length} set items -> data/sets.json`);

// Runewords: the vendored runes.json's `complete === 1` entries are the source of
// truth for which runewords exist and their full effect stats — it includes real
// current runewords (e.g. Vigilance, Ritual, Void, Authority, Coven, and Hustle's
// armor/weapon split) that the older hand-curated data/runewords.json lacks, that
// file having been built earlier for the Appraiser's narrower needs. levelReq/
// ladderOnly aren't present in runes.json at all (the closest proxy, each
// component rune's own drop level, isn't the same thing as a curated character
// level requirement), so those two fields are cross-referenced from the curated
// file by exact name match, read-only. A small number of names don't match
// exactly (apostrophe/case/suffix differences, net-new runewords, the Hustle
// split) — those fall back to levelReq: 0 / ladderOnly: false, the same
// graceful-fallback convention used elsewhere in this script (e.g. untranslated
// labels falling back to English) rather than hand-built alias tables.
const runesData = JSON.parse(readFileSync(join(VENDOR, 'runes.json'), 'utf8'));
const runewordsCurated = JSON.parse(readFileSync(join(OUT, 'runewords.json'), 'utf8'));

function itemTypesFor(itype) {
  const slot = TYPE_TO_SLOT[itype];
  return [slot ?? itype];
}

const runewordsFullOut = Object.entries(runesData)
  .filter(([, v]) => v.complete === 1)
  .map(([name, v]) => {
    const runeNames = v['*RunesUsed'].match(/[A-Z][a-z]+/g) ?? [];
    const { variable, fixed } = extractProps(v, 7, { code: 'T1Code', par: 'T1Param', min: 'T1Min', max: 'T1Max' });
    const curated = runewordsCurated.find(r => r.name === name);
    return {
      id: `runeword-${v.Name}`,
      name: localizedItemName(name),
      runes: runeNames,
      sockets: runeNames.length,
      itemTypes: itemTypesFor(v.itype1),
      levelReq: curated?.level ?? 0,
      ladderOnly: curated?.ladderOnly ?? false,
      stats: variable,
      fixedStats: fixed,
    };
  });

writeFileSync(join(OUT, 'runewords-full.json'), JSON.stringify(runewordsFullOut, null, 2));
console.log(`Wrote ${runewordsFullOut.length} runewords -> data/runewords-full.json`);

const itemTypesData = JSON.parse(readFileSync(join(VENDOR, 'itemtypes.json'), 'utf8'));

// d2r.world's 17-row table. Each maps to one itemtypes.json key, EXCEPT "Other Weapons"
// (see below). Individually-named rows are capped by the real max `gemsockets` seen
// across items.json for that type — the raw MaxSockets3 ceiling in itemtypes.json is a
// template value some categories never actually reach (confirmed: type "tors" has a
// ceiling of 6 but no real body armor base exceeds gemsockets: 4 — matches d2r.world's
// published "Armors: 3 4 4", not the raw "3 4 6"). "Other Weapons" is left as the raw
// itemtypes.json ceiling for the "swor" (Sword) key, uncorrected — matching d2r.world's
// own coarse catch-all row, which does not individually correct every remaining weapon
// type either (verified: club/mace individually cap lower than swor's 3/4/6, but
// d2r.world's single "Other Weapons" row still shows 3/4/6).
const MAX_SOCKETS_ROWS = [
  ['Circlets', 'circ'],
  ['Barbarian Helms', 'phlm'],
  ['Druid Helms', 'pelt'],
  ['Helms', 'helm'],
  ['Shrunken Heads', 'head'],
  ['Paladin Shields', 'ashd'],
  ['Shields', 'shie'],
  ['Armors', 'tors'],
  ['Necromancer Wands', 'wand'],
  ['Daggers', 'knif'],
  ['Assassin Katars', 'h2h2'],
  ['Sorceress Orbs', 'orb'],
  ['Amazon Bows', 'abow'],
  ['Scepters', 'scep'],
  ['Axes', 'axe'],
  ['Staves', 'staf'],
  ['Grimoires', 'grim'],
];

const MAX_SOCKETS_LABELS_ZH_TW = {
  'Circlets': '冠飾', 'Barbarian Helms': '蠻族頭盔', 'Druid Helms': '德魯伊頭盔',
  'Helms': '頭盔', 'Shrunken Heads': '縮頭', 'Paladin Shields': '聖騎士盾牌',
  'Shields': '盾牌', 'Armors': '盔甲', 'Necromancer Wands': '死靈法師魔杖',
  'Daggers': '匕首', 'Assassin Katars': '刺客拳刃', 'Sorceress Orbs': '女巫法球',
  'Amazon Bows': '亞馬遜弓', 'Scepters': '權杖', 'Axes': '斧頭', 'Staves': '法杖',
  'Grimoires': '魔法書',
};

function realMaxGemsockets(typeKey) {
  const values = Object.values(items)
    .filter(v => v.type === typeKey)
    .map(v => v.gemsockets ?? 0);
  return values.length ? Math.max(...values) : Infinity;
}

const maxSocketsOut = MAX_SOCKETS_ROWS.map(([label, typeKey]) => {
  const t = itemTypesData[typeKey];
  const cap = realMaxGemsockets(typeKey);
  return {
    itemType: {
      en: label,
      'zh-TW': MAX_SOCKETS_LABELS_ZH_TW[label],
      'zh-CN': toZhCn(MAX_SOCKETS_LABELS_ZH_TW[label]),
    },
    ilvl1to25: Math.min(t.MaxSockets1, cap),
    ilvl26to40: Math.min(t.MaxSockets2, cap),
    ilvl41plus: Math.min(t.MaxSockets3, cap),
  };
});

// "Other Weapons" catch-all: raw ceiling from the generic Sword type, uncorrected.
const swordType = itemTypesData['swor'];
maxSocketsOut.push({
  itemType: { en: 'Other Weapons', 'zh-TW': '其他武器', 'zh-CN': toZhCn('其他武器') },
  ilvl1to25: swordType.MaxSockets1,
  ilvl26to40: swordType.MaxSockets2,
  ilvl41plus: swordType.MaxSockets3,
});

writeFileSync(join(OUT, 'max-sockets.json'), JSON.stringify(maxSocketsOut, null, 2));
console.log(`Wrote ${maxSocketsOut.length} max-sockets rows -> data/max-sockets.json`);
