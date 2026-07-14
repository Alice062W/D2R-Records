#!/usr/bin/env node
// scripts/generate-grail-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(__dirname, '..', 'vendor', 'd2data', 'json');
const OUT = join(__dirname, '..', 'data');

const uniqueItems = JSON.parse(readFileSync(join(VENDOR, 'uniqueitems.json'), 'utf8'));
const setItemsRaw = JSON.parse(readFileSync(join(VENDOR, 'setitems.json'), 'utf8'));
const items = JSON.parse(readFileSync(join(VENDOR, 'items.json'), 'utf8'));
const skills = JSON.parse(readFileSync(join(VENDOR, 'skills.json'), 'utf8'));

// Hand-curated labels for the most common stat codes (ranked by frequency across
// uniqueitems.json + setitems.json). Anything missing falls back to the raw code —
// functional, just less pretty. Extend as needed; cross-check wording against
// https://d2r.world/en-US when in doubt (reference only, do not copy their data).
const PROP_LABELS = {
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

function labelFor(code) {
  if (PROP_LABELS[code]) return PROP_LABELS[code];
  // "/lvl" suffix marks a stat whose magnitude scales with character level
  // (encoded in the source data via a `par` divisor rather than min/max).
  // Fall back to the base stat's label with a level-scaling qualifier so
  // these aren't indistinguishable from their flat counterparts.
  if (code.endsWith('/lvl')) {
    const base = code.slice(0, -4);
    return `${PROP_LABELS[base] ?? base} (Based on Character Level)`;
  }
  return code;
}

// Prop codes whose `par` field identifies a specific skill rather than being
// incidental (see extractProps). `par` is either a numeric skill id (looked up
// in vendor/d2data/json/skills.json) or already a literal skill-name string —
// both forms occur in the source data (verified: skill/oskill/charged/hit-skill/
// gethit-skill/death-skill/att-skill/levelup-skill, 255 occurrences across the
// full catalog, zero unresolvable numeric ids). Without this, every stat sharing
// one of these codes on the same item renders as an identical generic label
// (e.g. "Skill Bonus: 1-3" four times on Maelstromwrath instead of naming each
// of its four granted skills) — the specific skill is silently lost.
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

function skillNameFor(par) {
  const isNumeric = typeof par === 'number' || (typeof par === 'string' && /^-?\d+$/.test(par));
  if (!isNumeric) return String(par);
  return skills[String(par)]?.skill ?? String(par);
}

function labelWithSkill(code, par) {
  const base = labelFor(code);
  if (par === undefined) return base;
  return `${base} (${skillNameFor(par)})`;
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
  return {
    baseName: base?.name ?? code,
    grade: gradeFor(code),
    slotCategory: slotFor(code),
    defense: base?.minac != null && base?.maxac != null
      ? { min: base.minac, max: base.maxac }
      : null,
    requiredStrength: base?.reqstr ?? null,
    durability: base?.durability ?? null,
  };
}

function extractProps(entry, count) {
  const variable = [];
  const fixed = [];
  for (let n = 1; n <= count; n++) {
    const rawCode = entry[`prop${n}`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`par${n}`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const label = isSkillRef ? labelWithSkill(code, par) : labelFor(code);
    // Disambiguate the stat's identity key when the same generic code (e.g.
    // "skill", "charged", "skilltab") appears more than once on one item for
    // different skills/tabs — otherwise every such stat collapses onto one
    // object key, both in statPriority and in a logged find's stored roll
    // values, so a second skill's entered value silently overwrites the first's.
    const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
    const key = needsKeySuffix ? `${code}:${par}` : code;
    const min = entry[`min${n}`];
    const max = entry[`max${n}`];
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
      const label = isSkillRef ? labelWithSkill(code, par) : labelFor(code);
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
    const { variable, fixed } = extractProps(v, 10);
    return {
      id: `unique-${id}`,
      code: v.code,
      name: v.index,
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
    const { variable, fixed } = extractProps(v, 7);
    return {
      id: `set-${v['*ID']}`,
      code: v.item,
      name: v.index,
      kind: 'set',
      setName: v.set,
      levelReq: v['lvl req'] ?? 0,
      ...baseFieldsFor(v.item),
      invFile: v.invfile || items[v.item]?.invfile || '',
      stats: variable,
      fixedStats: fixed,
      setBonuses: extractSetBonuses(v),
      statPriority: variable.map(s => s.key),
    };
  });

writeFileSync(join(OUT, 'uniques.json'), JSON.stringify(uniquesOut, null, 2));
writeFileSync(join(OUT, 'sets.json'), JSON.stringify(setsOut, null, 2));

console.log(`Wrote ${uniquesOut.length} unique items -> data/uniques.json`);
console.log(`Wrote ${setsOut.length} set items -> data/sets.json`);
