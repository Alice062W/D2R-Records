#!/usr/bin/env node
// scripts/generate-grail-data.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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
  'ac-hth': 'Defense vs. Melee',
  'ac/lvl': 'Defense per Level', 'ignore-ac': 'Ignore Target Defense',
  'dmg-ac': 'Damage Reduces Target Defense', 'reduce-ac': 'Reduce Target Defense %',
  'dmg%': 'Enhanced Damage %', 'dmg-min': 'Minimum Damage', 'dmg-max': 'Maximum Damage',
  'dmg-norm': 'Damage', 'dmg-fire': 'Fire Damage', 'dmg-cold': 'Cold Damage',
  'dmg-ltng': 'Lightning Damage', 'dmg-pois': 'Poison Damage', 'dmg-undead': 'Damage to Undead',
  'dmg-demon': 'Damage to Demons',
  att: 'Attack Rating', 'att%': 'Attack Rating %', 'att-skill': 'Attack Rating (skill)',
  'att-undead': 'Attack Rating vs. Undead %', 'att-demon': 'Attack Rating vs. Demons %',
  crush: 'Crushing Blow %', deadly: 'Deadly Strike %', openwounds: 'Open Wounds %',
  thorns: 'Attacker Takes Damage', ease: 'Requirements %',
  'res-fire': 'Fire Resist %', 'res-cold': 'Cold Resist %', 'res-ltng': 'Lightning Resist %',
  'res-pois': 'Poison Resist %', 'res-all': 'All Resistances', 'res-mag': 'Magic Resist %',
  'res-fire-max': 'Maximum Fire Resist %', 'res-cold-max': 'Maximum Cold Resist %',
  'res-ltng-max': 'Maximum Lightning Resist %', 'res-pois-max': 'Maximum Poison Resist %',
  'res-pois-len': 'Poison Length Reduced %',
  'red-dmg': 'Damage Reduced', 'red-dmg%': 'Damage Reduced %', 'red-mag': 'Magic Damage Reduced',
  lifesteal: 'Life Steal %', manasteal: 'Mana Steal %',
  regen: 'Life Regenerated %', 'regen-mana': 'Mana Regenerated %', 'regen-stam': 'Stamina Regenerated %',
  'mana-kill': 'Mana after Kill', 'demon-heal': 'Life after Demon Kill', noheal: 'Prevent Monster Heal',
  block: 'Increased Chance of Blocking %', block2: 'Faster Block Rate',
  balance1: 'Faster Hit Recovery', balance2: 'Faster Hit Recovery', balance3: 'Faster Hit Recovery',
  swing1: 'Faster Attack Rate', swing2: 'Faster Attack Rate', swing3: 'Faster Attack Rate',
  cast1: 'Faster Cast Rate', cast2: 'Faster Cast Rate', cast3: 'Faster Cast Rate',
  move1: 'Faster Run/Walk %', move2: 'Faster Run/Walk %', move3: 'Faster Run/Walk %',
  stamdrain: 'Slower Stamina Drain %',
  'pierce-fire': 'Enemy Fire Resistance %', 'pierce-ltng': 'Enemy Lightning Resistance %',
  'pierce-cold': 'Enemy Cold Resistance %', 'pierce-pois': 'Enemy Poison Resistance %', 'pierce-mag': 'Enemy Magic Resistance %',
  'extra-cold': 'Cold Skill Damage %', 'extra-fire': 'Fire Skill Damage %',
  'extra-ltng': 'Lightning Skill Damage %', 'extra-mag': 'Magic Skill Damage %', 'extra-pois': 'Poison Skill Damage %',
  light: 'Light Radius', 'half-freeze': 'Half Freeze Duration',
  freeze: 'Hit Freezes Target', nofreeze: 'Cannot Be Frozen',
  howl: 'Hit Causes Monster to Flee %', stupidity: 'Hit Blinds Target',
  'abs-ltng': 'Lightning Absorb',
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
  // Property-label audit (comprehensive), round 2: codes confirmed via itemstatcost.json
  // Stat-name matches and/or d2r.world spot-checks (see docs/superpowers/specs/
  // 2026-07-16-property-label-audit-design.md and the task-1 report for the full
  // evidence trail per code). `pierce` (item_pierce, "% Piercing Attack" on
  // Buriza-Do Kyanon) is distinct from the already-mapped `ignore-ac` ("Ignore
  // Target's Defense") — verified they're different raw codes on different items.
  pierce: 'Piercing Attack %',
  'pierce-immunity-cold': 'Monster Cold Immunity is Sundered',
  'pierce-immunity-fire': 'Monster Fire Immunity is Sundered',
  'pierce-immunity-light': 'Monster Lightning Immunity is Sundered',
  'pierce-immunity-poison': 'Monster Poison Immunity is Sundered',
  'pierce-immunity-damage': 'Monster Physical Immunity is Sundered',
  'pierce-immunity-magic': 'Monster Magic Immunity is Sundered',
  'abs-ltng%': 'Lightning Absorb %', 'abs-cold%': 'Cold Absorb %', 'abs-fire%': 'Fire Absorb %',
  'abs-mag': 'Magic Absorb',
  'res-all-max': 'Maximum All Resistances %',
  'light-thorns': 'Attacker Takes Lightning Damage',
  block3: 'Faster Block Rate',
  magicarrow: 'Fires Magic Arrows', explosivearrow: 'Fires Explosive Arrows or Bolts',
  'heal-kill': 'Life after each Kill',
  // dmg-mag confirmed on Azurewrath/Ginther's Rift/Lightsabre etc. as "Adds X-Y
  // Magic Damage" (a flat magic-damage-add stat, distinct from `abs-mag`/`extra-mag`).
  'dmg-mag': 'Magic Damage',
  // dmg-elem (item Hellrack: par references an internal element-index, not a
  // skill id) renders on d2r.world as "Adds X-Y [Fire/Cold/Lightning] Damage"
  // where the element is rolled at generation time — distinct from dmg-mag and
  // the fixed per-element dmg-fire/dmg-cold/dmg-ltng codes.
  'dmg-elem': 'Adds Random Elemental Damage',
  fireskill: 'Fire Skills',
  // "cheap" confirmed via d2r.world (Gheed's Fortune): "-% Extra Gold from
  // Monsters" is the separate `gold%` code; this is the distinct "Reduces all
  // Vendor Prices" stat.
  cheap: 'Reduces all Vendor Prices %',
  // "rip" confirmed via d2r.world (Nature's Peace, Tyrael's Might): exact in-game
  // wording is "Slain Monsters Rest in Peace" (prevents corpse-based skills like
  // Corpse Explosion/Revive from using the body).
  rip: 'Slain Monsters Rest in Peace',
  reanimate: 'Chance to Reanimate as Monster %',
  'charge-noconsume': 'Chance to Not Consume Charges %',
  'all-stats': 'All Attributes',
  addxp: 'Experience Gained %',
  // "randclassskill" (Hellfire Torch) grants a level to one random skill from
  // ANY class; "skill-rand" (Ormus' Robes) grants a level to one random skill
  // from the item's own restricted class — two distinct real mechanics,
  // confirmed via d2r.world wording ("+ to Random Character Class Skill Levels"
  // vs. "+ to a Random Sorceress Skill (Sorceress Only)").
  randclassskill: 'Random Character Class Skill Levels',
  'skill-rand': 'Random Class Skill Levels',
  // "magdam-rand" (Opalvein) rolls one of several elemental-skill-damage-%/
  // enhanced-damage-% mods at generation time (d2r.world shows it as a "One of
  // the following:" block) — distinct from the fixed `dmg-mag`.
  'magdam-rand': 'Random Elemental/Enhanced Damage %',
  // "skilltab-war" only appears in this project's vendored data on a
  // custom-class ("Warlock Only") item (Wraithstep) shown on d2r.world as a
  // random one-of-several skill-tab roll — same unconfirmable-specific-tab-name
  // situation as `skilltab` itself, so it shares that generic label and the
  // same key-disambiguation treatment (see KEY_ONLY_DISAMBIGUATE_PROPS below)
  // rather than guessing a tab name.
  'skilltab-war': 'Skill Tab Bonus',
  // att-und/dmg-und are short-form aliases of att-undead/dmg-undead used
  // specifically in the "/lvl" (per-level-scaling) shape, e.g. Boneslayer
  // Blade's "att-und/lvl" — confirmed same raw meaning via itemstatcost.json's
  // undead-related Stat family and the item's sibling "dmg-und/lvl" entry.
  'att-und': 'Attack Rating vs. Undead %',
  'dmg-und': 'Damage to Undead',
  // aura/kill-skill are skill-referencing base labels (see SKILL_REF_PROPS below);
  // localizedLabelWithSkill appends "(<Skill/Aura Name>)" to this base text.
  aura: 'Aura Level',
  'kill-skill': 'Chance to Cast on Kill %',
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
  'ac-hth': '對抗近戰攻擊防禦力',
  'ac/lvl': '每等級防禦力', 'ignore-ac': '無視目標防禦力',
  'dmg-ac': '傷害降低目標防禦力', 'reduce-ac': '降低目標防禦力 %',
  'dmg%': '強化傷害 %', 'dmg-min': '最小傷害', 'dmg-max': '最大傷害',
  'dmg-norm': '傷害', 'dmg-fire': '火焰傷害', 'dmg-cold': '冷凍傷害',
  'dmg-ltng': '閃電傷害', 'dmg-pois': '毒素傷害', 'dmg-undead': '對不死系傷害',
  'dmg-demon': '對惡魔傷害',
  att: '攻擊等級', 'att%': '攻擊等級 %', 'att-skill': '攻擊等級（技能）',
  'att-undead': '對不死系攻擊等級 %', 'att-demon': '對惡魔攻擊等級 %',
  crush: '破碎打擊 %', deadly: '致命一擊 %', openwounds: '撕裂傷口 %',
  thorns: '攻擊者承受傷害', ease: '需求 %',
  'res-fire': '火焰抗性 %', 'res-cold': '冷凍抗性 %', 'res-ltng': '閃電抗性 %',
  'res-pois': '毒素抗性 %', 'res-all': '全抗性', 'res-mag': '魔法抗性 %',
  'res-fire-max': '最大火焰抗性 %', 'res-cold-max': '最大冷凍抗性 %',
  'res-ltng-max': '最大閃電抗性 %', 'res-pois-max': '最大毒素抗性 %',
  'res-pois-len': '減少毒素持續時間 %',
  'red-dmg': '減少傷害', 'red-dmg%': '減少傷害 %', 'red-mag': '減少魔法傷害',
  lifesteal: '生命竊取 %', manasteal: '魔力竊取 %',
  regen: '生命回復 %', 'regen-mana': '魔力回復 %', 'regen-stam': '耐力回復 %',
  'mana-kill': '擊殺後恢復魔力值', 'demon-heal': '擊殺惡魔後恢復生命值', noheal: '防止怪物治療',
  block: '格擋機率 %', block2: '加快格擋速度',
  balance1: '加快恢復速度', balance2: '加快恢復速度', balance3: '加快恢復速度',
  swing1: '加快攻擊速度', swing2: '加快攻擊速度', swing3: '加快攻擊速度',
  cast1: '加快施法速度', cast2: '加快施法速度', cast3: '加快施法速度',
  move1: '加快跑走速度 %', move2: '加快跑走速度 %', move3: '加快跑走速度 %',
  stamdrain: '減緩耐力消耗 %',
  'pierce-fire': '降低敵方火焰抗性 %', 'pierce-ltng': '降低敵方閃電抗性 %',
  'pierce-cold': '降低敵方冷凍抗性 %', 'pierce-pois': '降低敵方毒素抗性 %', 'pierce-mag': '降低敵方魔法抗性 %',
  'extra-cold': '冷凍技能傷害 %', 'extra-fire': '火焰技能傷害 %',
  'extra-ltng': '閃電技能傷害 %', 'extra-mag': '魔法技能傷害 %', 'extra-pois': '毒素技能傷害 %',
  light: '光環半徑', 'half-freeze': '減半冰凍持續時間',
  freeze: '擊中冰凍目標', nofreeze: '不會被冰凍',
  howl: '擊中使怪物逃跑 %', stupidity: '擊中致盲目標',
  'abs-ltng': '閃電吸收',
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
  pierce: '穿透攻擊 %',
  'pierce-immunity-cold': '解除怪物冷凍免疫',
  'pierce-immunity-fire': '解除怪物火焰免疫',
  'pierce-immunity-light': '解除怪物閃電免疫',
  'pierce-immunity-poison': '解除怪物毒素免疫',
  'pierce-immunity-damage': '解除怪物物理免疫',
  'pierce-immunity-magic': '解除怪物魔法免疫',
  'abs-ltng%': '閃電吸收 %', 'abs-cold%': '冷凍吸收 %', 'abs-fire%': '火焰吸收 %',
  'abs-mag': '魔法吸收',
  'res-all-max': '最大全抗性 %',
  'light-thorns': '攻擊者承受閃電傷害',
  block3: '加快格擋速度',
  magicarrow: '發射魔法箭', explosivearrow: '發射爆炸箭矢',
  'heal-kill': '擊殺後恢復生命值',
  'dmg-mag': '魔法傷害',
  'dmg-elem': '隨機元素傷害',
  fireskill: '火焰技能加成',
  cheap: '降低商店價格 %',
  rip: '擊殺的怪物將安息',
  reanimate: '復活成怪物機率 %',
  'charge-noconsume': '有機率不消耗充能次數 %',
  'all-stats': '全部屬性',
  addxp: '增加經驗值 %',
  randclassskill: '隨機職業技能加成',
  'skill-rand': '隨機本職業技能加成',
  'magdam-rand': '隨機元素/強化傷害 %',
  'skilltab-war': '技能列加成',
  'att-und': '對不死系攻擊等級 %',
  'dmg-und': '對不死系傷害',
  aura: '光環等級',
  'kill-skill': '擊殺時觸發機率',
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
// `aura` and `kill-skill` were confirmed skill/aura-referencing during the
// comprehensive property-label audit: Azurewrath's `aura` par is the literal
// string "Sanctuary" (a Paladin aura name) and Executioner's Justice's
// `kill-skill` par is the literal string "Decrepify" — the same
// literal-skill-name shape SKILL_REF_PROPS already handles for skill/oskill
// (verified directly against vendor/d2data/json/uniqueitems.json).
const SKILL_REF_PROPS = new Set([
  'skill', 'oskill', 'charged', 'hit-skill', 'gethit-skill',
  'death-skill', 'att-skill', 'levelup-skill', 'aura', 'kill-skill',
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
// `skilltab-war` shares `skilltab`'s unconfirmable-specific-tab-name problem
// (its only known vendored occurrence, Wraithstep, shows a random one-of-several
// tab roll on d2r.world with no single resolvable tab name) — same treatment.
const KEY_ONLY_DISAMBIGUATE_PROPS = new Set(['skilltab', 'skilltab-war']);

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
  grim: 'grimoires', h2h: 'katars', h2h2: 'katars',
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
    // "ethereal" is not a real granted magic property — itemstatcost.json has no
    // matching Stat entry at all (unlike every other code here), and the vendored
    // uniqueitems.json rows carrying it (e.g. Ethereal Edge) always pair it with
    // `indestruct` as a min=max=1 flag, matching D2's actual mechanic where
    // ethereal-ness is a separate item-quality bit, not a min/max-scored magic
    // stat. Showing "Ethereal: 1" as a property line would be misleading, so it's
    // excluded here rather than given a (necessarily made-up) label.
    if (rawCode === 'ethereal') continue;
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

const HELM_SUB_CATEGORY = { helm: null, circ: 'circlet', phlm: 'barbarian', pelt: 'druid' };
const SHIELD_SUB_CATEGORY = { shie: null, ashd: 'paladin', head: 'shrunkenHeads' };

function subCategoryFor(rawType) {
  if (rawType in HELM_SUB_CATEGORY) return HELM_SUB_CATEGORY[rawType];
  if (rawType in SHIELD_SUB_CATEGORY) return SHIELD_SUB_CATEGORY[rawType];
  return null;
}

const basesFullOut = Object.entries(items)
  .filter(([code, v]) => v.normcode === code && TYPE_TO_SLOT[v.type])
  .map(([code, v]) => ({
    id: `base-${code}`,
    slotCategory: TYPE_TO_SLOT[v.type],
    subCategory: subCategoryFor(v.type),
    invFile: v.invfile ?? '',
    grades: {
      normal: baseGradeFor(code),
      exceptional: v.ubercode && v.ubercode !== code ? baseGradeFor(v.ubercode) : null,
      elite: v.ultracode && v.ultracode !== code ? baseGradeFor(v.ultracode) : null,
    },
  }));

writeFileSync(join(OUT, 'bases-full.json'), JSON.stringify(basesFullOut, null, 2));
console.log(`Wrote ${basesFullOut.length} base item lines -> data/bases-full.json`);

// Mirrors src/lib/grail/catalog.ts's SLOT_ORDER export. This script is a plain .mjs
// file and cannot import the TypeScript export directly, so it duplicates the
// constant here (as it already does for other catalog-adjacent constants like
// TYPE_TO_SLOT) — keep this in sync with SLOT_ORDER if that list ever changes.
const SLOT_ORDER = [
  'helms', 'armors', 'shields', 'belts', 'boots', 'gloves',
  'rings', 'amulets', 'charms', 'jewels',
  'swords', 'daggers', 'axes', 'polearms', 'spears',
  'clubs', 'maces', 'hammers', 'scepters', 'staves',
  'orbs', 'wands', 'grimoires', 'katars',
  'bows', 'crossbows', 'javelins', 'throwings',
];

// A small number of SLOT_ORDER categories have no graded (normal/exceptional/elite)
// entry in bases-full.json at all (rings/amulets/charms/jewels aren't tiered gear), and
// katars need a different lookup (their D2 item *type* code is "h2h", which collides
// with Assassin claims' generic type used elsewhere) — resolved via this explicit map
// of { slotCategory: representative item code } instead of the bases-full.json lookup
// used for every other category.
const CATEGORY_ICON_CODE_OVERRIDES = {
  rings: 'rin',
  amulets: 'amu',
  charms: 'cm1', // Small Charm — representative of the charms category
  jewels: 'jew',
  katars: 'ktr',
};

const categoryIconsOut = {};
for (const category of SLOT_ORDER) {
  let code = CATEGORY_ICON_CODE_OVERRIDES[category];
  if (!code) {
    const rep = basesFullOut.find(b => b.slotCategory === category);
    if (!rep) throw new Error(`No representative base item found for category "${category}"`);
    code = rep.id.replace('base-', '');
  }
  const item = items[code];
  if (!item || !item.invfile) throw new Error(`No invfile found for category "${category}" (code "${code}")`);
  const iconPath = join(__dirname, '..', 'public', 'items', 'inv', `${item.invfile}.png`);
  if (!existsSync(iconPath)) throw new Error(`Icon file missing for category "${category}": ${item.invfile}.png`);
  categoryIconsOut[category] = item.invfile;
}

// Every code below independently verified against vendor/d2data/json/items.json during
// plan-writing (type, name, invfile, and on-disk PNG presence all confirmed) — not
// guessed. Note amazonSpears/amazonBows/amazonJavelins reuse item codes am3/am1/am5
// (Maiden Spear/Stag Bow/Maiden Javelin) rather than the raw type codes themselves
// (aspe/abow/ajav are D2 item TYPES, not individual item codes with their own invfile).
const MAGIC_ONLY_CATEGORY_ICON_CODES = {
  circlets: 'ci0', barbarianHelms: 'ba1', druidHelms: 'dr1',
  paladinShields: 'pa1', shrunkenHeads: 'ne1',
  smallCharms: 'cm1', largeCharms: 'cm2', grandCharms: 'cm3',
  amazonSpears: 'am3', amazonBows: 'am1', amazonJavelins: 'am5',
  throwingAxes: 'tax', throwingKnives: 'tkf', assassinKatars: 'ktr',
};

for (const [slug, code] of Object.entries(MAGIC_ONLY_CATEGORY_ICON_CODES)) {
  const item = items[code];
  if (!item || !item.invfile) throw new Error(`No invfile found for magic-only category "${slug}" (code "${code}")`);
  const iconPath = join(__dirname, '..', 'public', 'items', 'inv', `${item.invfile}.png`);
  if (!existsSync(iconPath)) throw new Error(`Icon file missing for magic-only category "${slug}": ${item.invfile}.png`);
  categoryIconsOut[slug] = item.invfile;
}

writeFileSync(join(OUT, 'category-icons.json'), JSON.stringify(categoryIconsOut, null, 2));
console.log(`Wrote ${Object.keys(categoryIconsOut).length} category icons -> data/category-icons.json`);

writeFileSync(join(OUT, 'uniques.json'), JSON.stringify(uniquesOut, null, 2));
writeFileSync(join(OUT, 'sets.json'), JSON.stringify(setsOut, null, 2));

console.log(`Wrote ${uniquesOut.length} unique items -> data/uniques.json`);
console.log(`Wrote ${setsOut.length} set items -> data/sets.json`);

const setsFullData = JSON.parse(readFileSync(join(VENDOR, 'sets.json'), 'utf8'));

// The set-level partial-bonus fields are PCode{n}a/PMin{n}a/PMax{n}a where {n} IS the
// piece-count tier itself (2,3,4,5), not a sequential 1..N counter — so this doesn't fit
// the usual extractProps-style `{prefix}{n}` loop pattern and gets a direct per-tier
// extraction instead.
const setGroupsOut = Object.values(setsFullData)
  .map(v => {
    const pieceIds = setsOut.filter(s => s.setName.en === v.name).map(s => s.id);
    if (pieceIds.length === 0) return null; // e.g. Warlord's Glory: zero spawnable pieces

    const partialBonuses = [2, 3, 4, 5].flatMap(n => {
      const rawCode = v[`PCode${n}a`];
      if (!rawCode) return [];
      const code = CODE_ALIASES[rawCode] ?? rawCode;
      const par = v[`PParam${n}a`];
      const isSkillRef = SKILL_REF_PROPS.has(code);
      const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
      const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
      const key = needsKeySuffix ? `${code}:${par}` : code;
      const min = v[`PMin${n}a`];
      const max = v[`PMax${n}a`];
      if (min === undefined || max === undefined) return [];
      return [{ piecesRequired: n, stats: [{ key, label, min, max }] }];
    });

    const fullSetBonuses = [];
    for (let n = 1; n <= 8; n++) {
      const rawCode = v[`FCode${n}`];
      if (!rawCode || rawCode === 'state') continue;
      const code = CODE_ALIASES[rawCode] ?? rawCode;
      const par = v[`FParam${n}`];
      const isSkillRef = SKILL_REF_PROPS.has(code);
      const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
      const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
      const key = needsKeySuffix ? `${code}:${par}` : code;
      const min = v[`FMin${n}`];
      const max = v[`FMax${n}`];
      if (min === undefined || max === undefined) continue;
      fullSetBonuses.push({ key, label, min, max });
    }

    return {
      setName: localizedItemName(v.name),
      pieceIds,
      repInvFile: setsOut.find(s => s.id === pieceIds[0])?.invFile ?? '',
      partialBonuses,
      fullSetBonuses,
    };
  })
  .filter(Boolean);

writeFileSync(join(OUT, 'set-groups.json'), JSON.stringify(setGroupsOut, null, 2));
console.log(`Wrote ${setGroupsOut.length} set groups -> data/set-groups.json`);

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

// Normalizes a runeword name for cross-referencing between the generated
// runes.json-derived names and the hand-curated data/runewords.json names,
// which sometimes differ in apostrophe style, case, or carry a trailing
// " (ClassName)" disambiguation suffix (e.g. "Bone" vs "Bone (Necromancer)").
function normalizeRunewordName(name) {
  return name
    .replace(/\s*\([^)]*\)\s*$/, '') // strip trailing " (ClassName)" suffix
    .replace(/'/g, '')                // strip apostrophes (handles Ancients'/Ancient's mismatch)
    .trim()
    .toLowerCase();
}

// A rune name (e.g. "Jah") -> its real invFile (e.g. "invrJah"), derived directly
// from items.json's "<Name> Rune" entries — independent of RUNE_ORDER (defined later
// in this file) so this can be computed before runewordsFullOut needs it.
const RUNE_INVFILE_BY_NAME = Object.fromEntries(
  Object.values(items)
    .filter(v => typeof v.name === 'string' && v.name.endsWith(' Rune'))
    .map(v => [v.name.replace(/ Rune$/, ''), v.invfile])
);

// Known vendor-data quirk: runes.json's "*RunesUsed" for Wealth is "LmKoTir" — an
// upstream typo missing the "u" in "Lum" (every other runeword spells it out
// correctly, e.g. Beast's "BerTirUmMalLum"). This pre-existing typo already
// produces runes: ['Lm', 'Ko', 'Tir'] for Wealth. Alias it here so the invFile
// lookup still resolves to the real Lum icon; the underlying rune-name typo
// itself is out of scope for this task.
const RUNE_NAME_ALIASES = { Lm: 'Lum' };

const runewordsFullOut = Object.entries(runesData)
  .filter(([, v]) => v.complete === 1)
  .map(([name, v]) => {
    const runeNames = v['*RunesUsed'].match(/[A-Z][a-z]+/g) ?? [];
    const { variable, fixed } = extractProps(v, 7, { code: 'T1Code', par: 'T1Param', min: 'T1Min', max: 'T1Max' });
    const curated = runewordsCurated.find(r => normalizeRunewordName(r.name) === normalizeRunewordName(name));
    return {
      id: `runeword-${v.Name}`,
      name: localizedItemName(name),
      runes: runeNames,
      runeInvFiles: runeNames.map(rn => RUNE_INVFILE_BY_NAME[RUNE_NAME_ALIASES[rn] ?? rn] ?? ''),
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

const gemsData = JSON.parse(readFileSync(join(VENDOR, 'gems.json'), 'utf8'));

// Order and level requirements verified directly against vendor/d2data/json/gems.json
// this session (each rune's own `name`/mod fields), not hardcoded from memory.
const RUNE_ORDER = [
  'El', 'Eld', 'Tir', 'Nef', 'Eth', 'Ith', 'Tal', 'Ral', 'Ort', 'Thul',
  'Amn', 'Sol', 'Shael', 'Dol', 'Hel', 'Io', 'Lum', 'Ko', 'Fal', 'Lem',
  'Pul', 'Um', 'Mal', 'Ist', 'Gul', 'Vex', 'Ohm', 'Lo', 'Sur', 'Ber',
  'Jah', 'Cham', 'Zod',
];

// Upgrade recipes read directly from cubemain.json's own description field (entries
// 51-59 and 100-122) rather than assumed from the "always 3x previous" folk rule —
// the count changes to 2x starting at Um (entry 111), and gem-inclusive recipes start
// at Amn (entry 100). See Task 3 for cubemain.json's generic recipe parsing; this
// table is Runes-specific because the Runes page shows the recipe inline per-rune
// rather than as a separate recipe-list entry.
const RUNE_RECIPES = {
  Eld: { runeName: 'El', count: 3, gemName: null },
  Tir: { runeName: 'Eld', count: 3, gemName: null },
  Nef: { runeName: 'Tir', count: 3, gemName: null },
  Eth: { runeName: 'Nef', count: 3, gemName: null },
  Ith: { runeName: 'Eth', count: 3, gemName: null },
  Tal: { runeName: 'Ith', count: 3, gemName: null },
  Ral: { runeName: 'Tal', count: 3, gemName: null },
  Ort: { runeName: 'Ral', count: 3, gemName: null },
  Thul: { runeName: 'Ort', count: 3, gemName: null },
  Amn: { runeName: 'Thul', count: 3, gemName: 'Chipped Topaz' },
  Sol: { runeName: 'Amn', count: 3, gemName: 'Chipped Amethyst' },
  Shael: { runeName: 'Sol', count: 3, gemName: 'Chipped Sapphire' },
  Dol: { runeName: 'Shael', count: 3, gemName: 'Chipped Ruby' },
  Hel: { runeName: 'Dol', count: 3, gemName: 'Chipped Emerald' },
  Io: { runeName: 'Hel', count: 3, gemName: 'Chipped Diamond' },
  Lum: { runeName: 'Io', count: 3, gemName: 'Flawed Topaz' },
  Ko: { runeName: 'Lum', count: 3, gemName: 'Flawed Amethyst' },
  Fal: { runeName: 'Ko', count: 3, gemName: 'Flawed Sapphire' },
  Lem: { runeName: 'Fal', count: 3, gemName: 'Flawed Ruby' },
  Pul: { runeName: 'Lem', count: 3, gemName: 'Flawed Emerald' },
  Um: { runeName: 'Pul', count: 2, gemName: 'Flawed Diamond' },
  Mal: { runeName: 'Um', count: 2, gemName: 'Standard Topaz' },
  Ist: { runeName: 'Mal', count: 2, gemName: 'Standard Amethyst' },
  Gul: { runeName: 'Ist', count: 2, gemName: 'Standard Sapphire' },
  Vex: { runeName: 'Gul', count: 2, gemName: 'Standard Ruby' },
  Ohm: { runeName: 'Vex', count: 2, gemName: 'Standard Emerald' },
  Lo: { runeName: 'Ohm', count: 2, gemName: 'Standard Diamond' },
  Sur: { runeName: 'Lo', count: 2, gemName: 'Flawless Topaz' },
  Ber: { runeName: 'Sur', count: 2, gemName: 'Flawless Amethyst' },
  Jah: { runeName: 'Ber', count: 2, gemName: 'Flawless Sapphire' },
  Cham: { runeName: 'Jah', count: 2, gemName: 'Flawless Ruby' },
  Zod: { runeName: 'Cham', count: 2, gemName: 'Flawless Emerald' },
};

// Drop-rate facts (monster, difficulty, percent) hand-transcribed from d2r.world's
// published Runes page (https://d2r.world/en-US/info/item/runes) per explicit user
// direction this session: these are deterministic outputs of Blizzard's own
// treasure-class tables (game-mechanic facts, not creative content), and computing
// them ourselves would require implementing a full treasure-class probability-cascade
// engine against treasureclassex.json/tcprecalc.json — out of scope for this pass. If
// that calculator is ever built, replace this hand-transcribed table with its output.
const RUNE_DROP_RATES = {
  El: { monster: 'The Countess', difficulty: 'normal', percent: 4.3 },
  Eld: { monster: 'The Countess', difficulty: 'normal', percent: 2.87 },
  Tir: { monster: 'The Countess', difficulty: 'normal', percent: 10.75 },
  Nef: { monster: 'The Countess', difficulty: 'normal', percent: 7.17 },
  Eth: { monster: 'The Countess', difficulty: 'normal', percent: 15.05 },
  Ith: { monster: 'The Countess', difficulty: 'normal', percent: 10.03 },
  Tal: { monster: 'The Countess', difficulty: 'normal', percent: 21.5 },
  Ral: { monster: 'The Countess', difficulty: 'normal', percent: 14.33 },
  Ort: { monster: 'The Countess', difficulty: 'nightmare', percent: 21.5 },
  Thul: { monster: 'The Countess', difficulty: 'nightmare', percent: 14.33 },
  Amn: { monster: 'The Countess', difficulty: 'nightmare', percent: 16.61 },
  Sol: { monster: 'The Countess', difficulty: 'nightmare', percent: 11.08 },
  Shael: { monster: 'The Countess', difficulty: 'nightmare', percent: 9.97 },
  Dol: { monster: 'The Countess', difficulty: 'nightmare', percent: 6.65 },
  Hel: { monster: 'The Countess', difficulty: 'nightmare', percent: 5.54 },
  Io: { monster: 'The Countess', difficulty: 'nightmare', percent: 3.69 },
  Lum: { monster: 'The Countess', difficulty: 'hell', percent: 2.92 },
  Ko: { monster: 'The Countess', difficulty: 'hell', percent: 1.95 },
  Fal: { monster: 'The Countess', difficulty: 'hell', percent: 1.5 },
  Lem: { monster: 'The Countess', difficulty: 'hell', percent: 1.0 },
  Pul: { monster: 'The Countess', difficulty: 'hell', percent: 0.76 },
  Um: { monster: 'The Countess', difficulty: 'hell', percent: 0.51 },
  Mal: { monster: 'The Countess', difficulty: 'hell', percent: 0.52 },
  Ist: { monster: 'The Countess', difficulty: 'hell', percent: 0.35 },
  Gul: { monster: 'Council Member', difficulty: 'hell', percent: 0.0048 },
  Vex: { monster: 'Council Member', difficulty: 'hell', percent: 0.0032 },
  Ohm: { monster: 'Council Member', difficulty: 'hell', percent: 0.0033 },
  Lo: { monster: 'Council Member', difficulty: 'hell', percent: 0.0022 },
  Sur: { monster: 'Council Member', difficulty: 'hell', percent: 0.0025 },
  Ber: { monster: 'Council Member', difficulty: 'hell', percent: 0.0017 },
  Jah: { monster: 'Council Member', difficulty: 'hell', percent: 0.0018 },
  Cham: { monster: 'Council Member', difficulty: 'hell', percent: 0.0012 },
  Zod: { monster: 'Nihlathak', difficulty: 'hell', percent: 0.00047 },
};

// Rune mod fields in gems.json are named "<prefix><n><suffix>" (e.g.
// "weaponMod1Code", "weaponMod2Min") — the slot number sits *between* the prefix
// and the field suffix, unlike the "<prefix><suffix><n>" pattern extractProps()
// expects elsewhere in this file (e.g. "T1Code1"). So this reuses the same
// code-alias/localization/key-disambiguation logic as extractProps() but with the
// slot number in the right place for gems.json's column layout.
function runeStatsFor(entry, prefix) {
  const variable = [];
  const fixed = [];
  for (let n = 1; n <= 3; n++) {
    const rawCode = entry[`${prefix}${n}Code`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`${prefix}${n}Param`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
    const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
    const key = needsKeySuffix ? `${code}:${par}` : code;
    const min = entry[`${prefix}${n}Min`];
    const max = entry[`${prefix}${n}Max`];
    if (min !== undefined && max !== undefined) {
      if (min === max) fixed.push({ key, label, value: min });
      else variable.push({ key, label, min, max });
      continue;
    }
    if (par !== undefined) {
      fixed.push({ key, label, value: par });
    }
  }
  return [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, min: f.value, max: f.value }))];
}

const runesOut = RUNE_ORDER.map((name, i) => {
  const entry = Object.values(gemsData).find(v => v.name === `${name} Rune`);
  // gems.json has no level-requirement field for runes; that lives on the
  // corresponding items.json entry (matched by rune code, e.g. "r01").
  const itemEntry = Object.values(items).find(v => v.code === entry.code);
  return {
    id: `rune-${entry.code}`,
    number: i + 1,
    name: localizedItemName(name),
    levelReq: itemEntry?.levelreq ?? 0,
    invFile: itemEntry?.invfile ?? '',
    weaponStats: runeStatsFor(entry, 'weaponMod'),
    armorHelmStats: runeStatsFor(entry, 'helmMod'),
    shieldStats: runeStatsFor(entry, 'shieldMod'),
    recipe: RUNE_RECIPES[name] ?? null,
    dropRate: RUNE_DROP_RATES[name],
  };
});

writeFileSync(join(OUT, 'runes.json'), JSON.stringify(runesOut, null, 2));
console.log(`Wrote ${runesOut.length} runes -> data/runes.json`);

// Cube Recipes and Crafted Items: cubemain.json's craft-recipe entries (ids
// 64-99) use "mod N"/"mod N param"/"mod N min"/"mod N max" field names, where the
// index N is inserted in the *middle* of the field name, not appended at the end.
// extractProps() only supports the "<prefix><n>" (suffix-at-end) shape used by
// every other vendored file, so it cannot be reused here as-is (verified directly
// against vendor/d2data/json/cubemain.json ids 64-99 this session) — hence the
// small local extraction function below instead of duplicating extractProps.
function extractCraftModProps(entry, count) {
  const variable = [];
  const fixed = [];
  for (let n = 1; n <= count; n++) {
    const rawCode = entry[`mod ${n}`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`mod ${n} param`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
    const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
    const key = needsKeySuffix ? `${code}:${par}` : code;
    // Same fixed/variable split as extractProps: a mod with an equal min/max
    // is a single fixed value; a genuine range (e.g. Hit Power Helm's
    // "gethit-skill" mod has min:5, max:4) must be preserved as a range
    // rather than collapsed to one of its endpoints.
    const min = entry[`mod ${n} min`];
    const max = entry[`mod ${n} max`];
    if (min !== undefined && max !== undefined) {
      if (min === max) fixed.push({ key, label, value: min });
      else variable.push({ key, label, min, max });
      continue;
    }
    if (par !== undefined) {
      fixed.push({ key, label, value: par });
    }
  }
  return { variable, fixed };
}

const cubeMainData = JSON.parse(readFileSync(join(VENDOR, 'cubemain.json'), 'utf8'));

// Hand-classified against d2r.world's 9 Cube Recipes categories (no category field
// exists in the source data — see the design spec's Background section). Keys are
// cubemain.json's own object keys (its numeric string ids). Spot-checked against
// the vendored file's `description` text this session.
const RECIPE_CATEGORY = {};
for (const id of [23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,
                   51,52,53,54,55,56,57,58,59,100,101,102,103,104,105,106,107,108,109,110,111,112,113,
                   114,115,116,117,118,119,120,121,122]) {
  RECIPE_CATEGORY[id] = 'runeGemUpgrade';
}
for (const id of [0,1,2,148,149,150,165,177,189,201,213,225,226]) RECIPE_CATEGORY[id] = 'quests';
for (const id of [3,4,5,11,12,20,21,22]) RECIPE_CATEGORY[id] = 'consumables';
for (const id of [15,16,123,124,125,126,141,147]) RECIPE_CATEGORY[id] = 'sockets';
for (const id of [127,128,129,130,131,132,133,134,135,136,151,152,153,154]) RECIPE_CATEGORY[id] = 'itemUpgrade';
for (const id of [137,138,139,140]) RECIPE_CATEGORY[id] = 'itemRepair';
for (const id of [60,61,62,63]) RECIPE_CATEGORY[id] = 'magicItemRerolls';
for (const id of [6,7,8,9,10,13,14,17,18,19]) RECIPE_CATEGORY[id] = 'magicItemCreation';
for (const id of [163,164,174,175,176,186,187,188,198,199,200,210,211,212,222,223,224]) {
  RECIPE_CATEGORY[id] = 'craftedGrandCharm';
}

const CRAFT_RECIPE_IDS = new Set(Array.from({ length: 36 }, (_, i) => 64 + i)); // 64-99

const cubeRecipesOut = Object.entries(cubeMainData)
  .filter(([id, v]) => (v.enabled === 1 || RECIPE_CATEGORY[id] === 'craftedGrandCharm') && !CRAFT_RECIPE_IDS.has(Number(id)))
  .map(([id, v]) => ({
    id: `recipe-${id}`,
    description: localizedItemName(v.description),
    category: RECIPE_CATEGORY[id] ?? (() => { throw new Error(`Unclassified cube recipe id ${id}: "${v.description}"`); })(),
  }));

writeFileSync(join(OUT, 'cube-recipes.json'), JSON.stringify(cubeRecipesOut, null, 2));
console.log(`Wrote ${cubeRecipesOut.length} cube recipes -> data/cube-recipes.json`);

const CRAFT_FAMILY_BY_ID = {
  64: 'hitPower', 65: 'hitPower', 66: 'hitPower', 67: 'hitPower', 68: 'hitPower',
  69: 'hitPower', 70: 'hitPower', 71: 'hitPower', 72: 'hitPower',
  73: 'blood', 74: 'blood', 75: 'blood', 76: 'blood', 77: 'blood',
  78: 'blood', 79: 'blood', 80: 'blood', 81: 'blood',
  82: 'caster', 83: 'caster', 84: 'caster', 85: 'caster', 86: 'caster',
  87: 'caster', 88: 'caster', 89: 'caster', 90: 'caster',
  91: 'safety', 92: 'safety', 93: 'safety', 94: 'safety', 95: 'safety',
  96: 'safety', 97: 'safety', 98: 'safety', 99: 'safety',
};

const craftedItemsOut = Object.entries(cubeMainData)
  .filter(([id]) => CRAFT_RECIPE_IDS.has(Number(id)))
  .map(([id, v]) => {
    const { variable, fixed } = extractCraftModProps(v, 3);
    // The craft recipe description is "<Magic Item Input> + 1 Jewel + <Rune> + <Gem> -> <Output Name>".
    // Split on " -> " for the output name, and on " + " for the input list.
    const [inputsPart, outputName] = v.description.split(' -> ');
    const inputParts = inputsPart.split(' + ').map(p => p.replace(/^\d+\s*/, ''));
    return {
      id: `craft-${id}`,
      name: localizedItemName(outputName),
      family: CRAFT_FAMILY_BY_ID[id],
      magicItemInput: localizedItemName(inputParts[0]),
      additionalInputs: inputParts.slice(1).map(localizedItemName),
      fixedProperties: fixed,
      variableProperties: variable,
    };
  });

writeFileSync(join(OUT, 'crafted-items.json'), JSON.stringify(craftedItemsOut, null, 2));
console.log(`Wrote ${craftedItemsOut.length} crafted items -> data/crafted-items.json`);

const magicPrefixData = JSON.parse(readFileSync(join(VENDOR, 'magicprefix.json'), 'utf8'));
const magicSuffixData = JSON.parse(readFileSync(join(VENDOR, 'magicsuffix.json'), 'utf8'));

// The real, final Magic/Rare category slugs this project shows, and the raw D2 item-type
// code each one is rooted at. Distinct from TYPE_TO_SLOT (used by uniques/sets/bases,
// which intentionally stays coarser) — this map is granular on purpose, splitting
// class-specific and size-specific variants that TYPE_TO_SLOT collapses.
const MAGIC_LEAF_SLUGS = {
  helm: 'helms', circ: 'circlets', phlm: 'barbarianHelms', pelt: 'druidHelms',
  tors: 'armors',
  shie: 'shields', ashd: 'paladinShields', head: 'shrunkenHeads',
  belt: 'belts', boot: 'boots', glov: 'gloves',
  ring: 'rings', amul: 'amulets',
  scha: 'smallCharms', mcha: 'largeCharms', lcha: 'grandCharms',
  jewl: 'jewels',
  swor: 'swords', knif: 'daggers', axe: 'axes', pole: 'polearms',
  spea: 'spears', aspe: 'amazonSpears',
  club: 'clubs', mace: 'maces', hamm: 'hammers',
  scep: 'scepters', staf: 'staves', orb: 'orbs', wand: 'wands',
  grim: 'grimoires', h2h: 'assassinKatars',
  bow: 'bows', abow: 'amazonBows', xbow: 'crossbows',
  jave: 'javelins', ajav: 'amazonJavelins',
  taxe: 'throwingAxes', tkni: 'throwingKnives',
};

// Ancestor closure: for each leaf raw code above, walk itemtypes.json's Equiv1/Equiv2
// parent-links upward until no further parent exists, collecting every code reached
// along the way (including the leaf's own code). An affix restricted to any one of
// these ancestor codes (leaf-specific OR an abstract supertype like "weap"/"armo") is
// considered to apply to that leaf category — this is how a bare "weap"-restricted
// affix ends up expanded onto every real weapon category, matching d2r.world's actual
// per-category affix listings instead of one generic "Weapons" bucket.
function ancestorsOf(rawCode) {
  const seen = new Set([rawCode]);
  let frontier = [rawCode];
  while (frontier.length > 0) {
    const next = [];
    for (const code of frontier) {
      const entry = itemTypesData[code];
      for (const parent of [entry?.Equiv1, entry?.Equiv2]) {
        if (parent && !seen.has(parent)) {
          seen.add(parent);
          next.push(parent);
        }
      }
    }
    frontier = next;
  }
  return seen;
}

const LEAF_ANCESTORS = Object.fromEntries(
  Object.entries(MAGIC_LEAF_SLUGS).map(([rawCode, slug]) => [slug, ancestorsOf(rawCode)])
);

// magicprefix.json has 9 Sorceress-only prefixes (Burning, Blazing, Volcanic, Sparking,
// Charged, Powered, Chilling, Freezing, Glacial — ids 445-453) whose itype1 field is the
// literal string "staff" (double-f). itemtypes.json has no code "staff" at all — only
// "staf" (whose own ItemType label is "Staff"). Given each of those 9 entries also
// restricts to itype2 "orb" (the Sorceress's other class-specific weapon type), this is
// unambiguously a vendored-data typo for "staf", not a genuinely unmapped code. Alias it
// rather than letting a real category silently fall back to a raw, unresolved code.
const ITYPE_ALIASES = { staff: 'staf' };

function expandItypeToSlugs(rawItype) {
  const normalized = ITYPE_ALIASES[rawItype] ?? rawItype;
  const slugs = [];
  for (const [slug, ancestors] of Object.entries(LEAF_ANCESTORS)) {
    if (ancestors.has(normalized)) slugs.push(slug);
  }
  return slugs;
}

function itemTypesForAffix(entry) {
  const slugs = new Set();
  for (let n = 1; n <= 7; n++) {
    const itype = entry[`itype${n}`];
    if (!itype) continue;
    const expanded = expandItypeToSlugs(itype);
    if (expanded.length > 0) {
      for (const s of expanded) slugs.add(s);
    } else {
      // No leaf category's ancestor set reaches this code (e.g. "bar", a bare class
      // restriction never expressed via itype at all in practice, or any other
      // genuinely unmapped code) — fall back to the raw code itself, matching this
      // project's established "don't guess, surface the gap" convention.
      slugs.add(itype);
    }
  }
  const types = Array.from(slugs);
  // A handful of active suffixes (all Barbarian class-specific, e.g. "of
  // Howling") carry no itype{n} fields at all — their restriction is
  // expressed entirely via the `class` field instead. Fall back to that
  // rather than reporting an empty (nonsensical) item-type list.
  if (types.length === 0 && entry.class) types.push(entry.class);
  return types;
}

// magicprefix.json/magicsuffix.json use field names mod{n}code/mod{n}param/
// mod{n}min/mod{n}max — a number-then-suffix shape that extractProps (which builds
// keys as `${prefixText}${n}`, i.e. suffix-then-number, like prop1/par1) cannot
// directly express. Rather than force extractProps to fit, this is a small
// dedicated extraction loop for this one shape.
function extractMagicAffixStats(entry) {
  const variable = [];
  const fixed = [];
  for (let n = 1; n <= 3; n++) {
    const rawCode = entry[`mod${n}code`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`mod${n}param`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
    const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
    const key = needsKeySuffix ? `${code}:${par}` : code;
    const min = entry[`mod${n}min`];
    const max = entry[`mod${n}max`];
    if (min !== undefined && max !== undefined) {
      if (min === max) fixed.push({ key, label, value: min });
      else variable.push({ key, label, min, max });
      continue;
    }
    // Some mods (e.g. "sock" on Artificer's/Jeweler's, "ac/lvl" on Miocene)
    // carry only a `mod{n}param` field instead of min/max — same par-only
    // shape extractProps already handles for uniqueitems.json/setitems.json.
    // Without this fallback these affixes silently end up with zero stats.
    if (par !== undefined) {
      fixed.push({ key, label, value: par });
      continue;
    }
    // "of Ages" (suffix 404, mod1code "indestruct") has no min/max/param at
    // all — a bare boolean flag prop, unlike uniqueitems.json's indestruct
    // entries which always carry min1===max1===1. Surface it the same way
    // (value: 1) rather than silently dropping the affix's only stat.
    fixed.push({ key, label, value: 1 });
  }
  return { variable, fixed };
}

// alvl ("affix level") comes from the source data's `level` field, not
// `levelreq` (the character-level requirement to use the affix) — verified
// directly against the vendored files: "Fortuitous" (group 114) has a dead
// frequency:0 v0 entry with level:5/levelreq:3, and the active frequency:4 v1
// entry with level:12/levelreq:8. Using `levelreq` first (as an earlier draft
// of this generator step assumed) would silently report the wrong number here.
// magicprefix.json/magicsuffix.json's group-44 "charged"-mod entries are meant to
// grant "Level X <Skill> (Y Charges)" — but a subset of these (9 confirmed for the
// Barbarian class, e.g. "of Howling" id 621) have negative mod{n}min/mod{n}max
// values (e.g. -20 to -6), which is nonsensical for a charge count, AND are missing
// any itype restriction entirely (their valid, correctly-itype'd sibling entry, e.g.
// "of Howling" id 620 with itype1 "phlm", is a separate row). Confirmed against
// d2r.world directly: neither the malformed rows nor their valid siblings appear on
// any of its Magic Items category pages, so this whole group-44 negative-charge
// family is dead/non-functional data that d2r.world (and therefore this project)
// excludes entirely, rather than guessing a category for it.
function hasMalformedNegativeCharge(entry) {
  // Restrict to rows with no itype restriction at all (itype1..itype7 all absent) —
  // negative mod{n}min/mod{n}max on "charged" is actually the norm across the whole
  // group-44 family (verified against the vendored data: nearly every itype-bearing
  // "charged" row also has negative min/max, e.g. "of Frozen Orbs" id 549 with itype1
  // "knif"), so a negative-value check alone would wrongly exclude hundreds of valid,
  // itype-restricted affixes. The 9 confirmed-malformed Barbarian rows are uniquely
  // identifiable by ALSO having no itype fields whatsoever (their restriction is
  // expressed only via `class: "bar"`, which is what produces the raw "bar" fallback
  // category — see itemTypesForAffix).
  const hasAnyItype = [1, 2, 3, 4, 5, 6, 7].some(n => Boolean(entry[`itype${n}`]));
  if (hasAnyItype) return false;
  for (let n = 1; n <= 3; n++) {
    if (entry[`mod${n}code`] !== 'charged') continue;
    const min = entry[`mod${n}min`];
    const max = entry[`mod${n}max`];
    if (typeof min === 'number' && typeof max === 'number' && min < 0 && max < 0) {
      return true;
    }
  }
  return false;
}

function magicAffixesFrom(data, kind) {
  return Object.entries(data)
    .filter(([, v]) => (v.frequency ?? 0) > 0)
    .filter(([, v]) => !hasMalformedNegativeCharge(v))
    .map(([id, v]) => {
      const { variable, fixed } = extractMagicAffixStats(v);
      return {
        id: `${kind}-${id}`,
        // A handful of active (frequency > 0) affix rows carry no `Name` at all
        // (verified: magicprefix.json id 153, group 102, spawnable:0/frequency:4)
        // — a real gap in the source data, not something to drop silently since
        // the spec requires every frequency > 0 entry included.
        name: localizedItemName(v.Name ?? `Unnamed Affix ${id}`),
        kind,
        alvl: v.level ?? v.levelreq ?? 0,
        itemTypes: itemTypesForAffix(v),
        rareEligible: v.rare === 1,
        stats: [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, min: f.value, max: f.value }))],
      };
    });
}

const magicAffixesOut = [
  ...magicAffixesFrom(magicPrefixData, 'prefix'),
  ...magicAffixesFrom(magicSuffixData, 'suffix'),
];

writeFileSync(join(OUT, 'magic-affixes.json'), JSON.stringify(magicAffixesOut, null, 2));
console.log(`Wrote ${magicAffixesOut.length} magic/rare affixes -> data/magic-affixes.json`);

const levelsData = JSON.parse(readFileSync(join(VENDOR, 'levels.json'), 'utf8'));

// levels.json's *StringName is the internal D2 dev codename for this level, not the
// real in-game/player-facing name — a well-known exception (D2's own English game
// client shows "The Secret Cow Level", never "Moo Moo Farm"). The Chinese localization
// in localestrings-chi.json is keyed by the internal codename but already contains the
// correct player-facing translation ("秘密母牛關卡" = "Secret Cow Level"), so only the
// English override is needed here.
const AREA_NAME_OVERRIDES_EN = { 'Moo Moo Farm': 'The Secret Cow Level' };

const areaLevelsOut = Object.values(levelsData)
  .filter(v => v.Act !== undefined && v.Act >= 0 && v['*StringName'] && (v.MonLvlEx ?? 0) > 0)
  .sort((a, b) => a.Act - b.Act || a.Id - b.Id)
  .map(v => {
    const localized = localizedItemName(v['*StringName']);
    const enOverride = AREA_NAME_OVERRIDES_EN[v['*StringName']];
    return {
      id: v.Id,
      name: enOverride ? { ...localized, en: enOverride } : localized,
      act: v.Act,
      normal: v.MonLvlEx,
      nightmare: v['MonLvlEx(N)'],
      hell: v['MonLvlEx(H)'],
    };
  });

writeFileSync(join(OUT, 'area-levels.json'), JSON.stringify(areaLevelsOut, null, 2));
console.log(`Wrote ${areaLevelsOut.length} area levels -> data/area-levels.json`);
