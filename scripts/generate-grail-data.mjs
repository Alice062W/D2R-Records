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
  'att-undead': 'Attack Rating vs. Undead', 'att-demon': 'Attack Rating vs. Demons',
  crush: 'Crushing Blow %', deadly: 'Deadly Strike %', openwounds: 'Open Wounds %',
  thorns: 'Attacker Takes Damage', ease: 'Requirements %',
  'res-fire': 'Fire Resist %', 'res-cold': 'Cold Resist %', 'res-ltng': 'Lightning Resist %',
  'res-pois': 'Poison Resist %', 'res-all': 'All Resistances', 'res-mag': 'Magic Resist %',
  'res-fire-max': 'Maximum Fire Resist %', 'res-cold-max': 'Maximum Cold Resist %',
  'res-ltng-max': 'Maximum Lightning Resist %', 'res-pois-max': 'Maximum Poison Resist %',
  'res-pois-len': 'Poison Length Reduced %',
  'red-dmg': 'Damage Reduced', 'red-dmg%': 'Damage Reduced %', 'red-mag': 'Magic Damage Reduced',
  lifesteal: 'Life Steal %', manasteal: 'Mana Steal %',
  regen: 'Replenish Life', 'regen-mana': 'Mana Regenerated %', 'regen-stam': 'Stamina Regenerated %',
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
  // Not real D2 stat codes — invented keys for the Renewed-charm affix pools
  // (RENEWED_CHARM_POOLS below), hand-transcribed from d2r.world since this
  // "enemy resistance reduced" effect isn't in this vendor snapshot at all.
  'enemy-res-cold%': 'Enemy Cold Resist %', 'enemy-res-fire%': 'Enemy Fire Resist %',
  'enemy-res-ltng%': 'Enemy Lightning Resist %', 'enemy-res-pois%': 'Enemy Poison Resist %',
  'enemy-res-mag%': 'Enemy Magic Resist %', 'enemy-res-phys%': 'Enemy Physical Resist %',
  light: 'Light Radius', 'half-freeze': 'Half Freeze Duration',
  freeze: 'Hit Freezes Target', nofreeze: 'Cannot Be Frozen',
  howl: 'Hit Causes Monster to Flee %', stupidity: 'Hit Blinds Target',
  'abs-ltng': 'Lightning Absorb',
  slow: 'Slower Target %', sock: 'Sockets', dur: 'Durability %', indestruct: 'Indestructible',
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
  'att-und': 'Attack Rating vs. Undead',
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
  'att-undead': '對不死系攻擊等級', 'att-demon': '對惡魔攻擊等級',
  crush: '破碎打擊 %', deadly: '致命一擊 %', openwounds: '撕裂傷口 %',
  thorns: '攻擊者承受傷害', ease: '需求 %',
  'res-fire': '火焰抗性 %', 'res-cold': '冷凍抗性 %', 'res-ltng': '閃電抗性 %',
  'res-pois': '毒素抗性 %', 'res-all': '全抗性', 'res-mag': '魔法抗性 %',
  'res-fire-max': '最大火焰抗性 %', 'res-cold-max': '最大冷凍抗性 %',
  'res-ltng-max': '最大閃電抗性 %', 'res-pois-max': '最大毒素抗性 %',
  'res-pois-len': '減少毒素持續時間 %',
  'red-dmg': '減少傷害', 'red-dmg%': '減少傷害 %', 'red-mag': '減少魔法傷害',
  lifesteal: '生命竊取 %', manasteal: '魔力竊取 %',
  regen: '補充生命值', 'regen-mana': '魔力回復 %', 'regen-stam': '耐力回復 %',
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
  'enemy-res-cold%': '敵人冷凍抗性 %', 'enemy-res-fire%': '敵人火焰抗性 %',
  'enemy-res-ltng%': '敵人電擊抗性 %', 'enemy-res-pois%': '敵人毒素抗性 %',
  'enemy-res-mag%': '敵人魔法抗性 %', 'enemy-res-phys%': '敵人物理傷害抗性 %',
  light: '光環半徑', 'half-freeze': '減半冰凍持續時間',
  freeze: '擊中冰凍目標', nofreeze: '不會被冰凍',
  howl: '擊中使怪物逃跑 %', stupidity: '擊中致盲目標',
  'abs-ltng': '閃電吸收',
  slow: '減緩目標速度 %', sock: '插槽數', dur: '耐久度 %', indestruct: '不可破壞',
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
  'att-und': '對不死系攻擊等級',
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
  'ama', 'ass', 'bar', 'dru', 'nec', 'pal', 'sor',
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

// vendor/d2data's uniqueitems.json/setitems.json `index`/`set` fields (the
// English names themselves) contain outright typos in ~90 entries (e.g.
// "Fechmars Axe" for the real "Axe of Fechmar", "The Chieftan" for "The
// Chieftain") — confirmed against d2r.world's en-US pages this session.
// Corrected here rather than in the vendored snapshot itself, mirroring
// RUNE_NAME_ALIASES below for the same class of vendor-data typo.
const ITEM_ENGLISH_NAME_ALIASES = {
  'Aldur\'s Gauntlet': "Aldur's Rhythm", 'Angelical Raiment': "Angelic Raiment",
  'Cutthroat1': "Bartuc's Cut-Throat", 'War Bonnet': "Biggin's Bonnet",
  'Ironward': "Astreon's Iron Ward", 'Irices Shard': 'Spectral Shard', 'Mindrend': 'Skull Splitter',
  'Rimeraven': 'Raven Claw',
  'PreCrafted Cold Rupture': 'Latent Cold Rupture', 'PreCrafted Flame Rift': 'Latent Flame Rift',
  'PreCrafted Crack of the Heavens': 'Latent Crack of the Heavens', 'PreCrafted Rotting Fissure': 'Latent Rotting Fissure',
  'PreCrafted Bone Break': 'Latent Bone Break', 'PreCrafted Black Cleft': 'Latent Black Cleft',
  'Crafted Cold Rupture': 'Renewed Cold Rupture', 'Crafted Flame Rift': 'Renewed Flame Rift',
  'Crafted Crack of the Heavens': 'Renewed Crack of the Heavens', 'Crafted Rotting Fissure': 'Renewed Rotting Fissure',
  'Crafted Bone Break': 'Renewed Bone Break', 'Crafted Black Cleft': 'Renewed Black Cleft',
  'Ars Al\'Diablolos': "Ars Al'Diabolos", 'Berserker\'s Garb': "Berserker's Arsenal",
  'Blinkbats Form': "Blinkbat's Form", 'Bloodraven\'s Charge': "Blood Raven's Charge", 'Bonesob': "Bonesnap",
  'Bul Katho\'s Wedding Band': "Bul-Kathos' Wedding Band", 'Cerebus': "Cerebus' Bite",
  'Cow King\'s Hoofs': "Cow King's Hooves", 'Culwens Point': "Culwen's Point",
  'Darkforge Spawn': "Darkforce Spawn", 'Deathcleaver': "Death Cleaver", 'Deaths\'s Web': "Death's Web",
  'Demonlimb': "Demon Limb", 'Dimoaks Hew': "Dimoak's Hew", 'Djinnslayer': "Djinn Slayer",
  'Doomspittle': "Doomslinger", 'Earthshifter': "Earth Shifter", 'Eschuta\'s temper': "Eschuta's Temper",
  'Fathom': "Death's Fathom", 'Fechmars Axe': "Axe of Fechmar", 'Giantskull': "Giant Skull",
  'Gloomstrap': "Gloom's Trap", 'Godstrike Arch': "Goldstrike Arch", 'Gorerider': "Gore Rider",
  'Griswolds Edge': "Griswold's Edge", 'Griswolds\'s Redemption': "Griswold's Redemption",
  'Gutsiphon': "Gut Siphon", 'Haemosu\'s Adament': "Haemosu's Adamant",
  'Headhunter\'s Glory': "Head Hunter's Glory", 'Heaven\'s Taebaek': "Taebaek's Glory",
  'Hwanin\'s Seal': "Hwanin's Blessing", 'Ironpelt': "Iron Pelt", 'Iros Torch': "Torch of Iro",
  'Jadetalon': "Jade Talon", 'Kerke\'s Sanctuary': "Gerke's Sanctuary", 'Kinemils Awl': "Kinemil's Awl",
  'Krintizs Skewer': "Skewer of Krintiz", 'Lavagout': "Lava Gout", 'Lazarus Spire': "Spire of Lazarus",
  'Lenyms Cord': "Lenymo", 'Maelstromwrath': "Maelstrom", 'McAuley\'s Folly': "Sander's Folly",
  'McAuley\'s Paragon': "Sander's Paragon", 'McAuley\'s Riprap': "Sander's Riprap",
  'McAuley\'s Superstition': "Sander's Superstition", 'McAuley\'s Taboo': "Sander's Taboo",
  'Mosers Blessed Circle': "Moser's Blessed Circle", 'Naj\'s Ancient Set': "Naj's Ancient Vestige",
  'Peasent Crown': "Peasant Crown", 'Pompe\'s Wrath': "Pompeii's Wrath", 'Pus Spiter': "Pus Spitter",
  'Que-Hegan\'s Wisdon': "Que-Hegan's Wisdom", 'Radimant\'s Sphere': "Radament's Sphere",
  'Razoredge': "Razor's Edge", 'Rixots Keen': "Rixot's Keen", 'Runemaster': "Rune Master",
  'Shadowdancer': "Shadow Dancer", 'Shadowkiller': "Shadow Killer",
  'Skin of the Flayerd One': "Skin of the Flayed One", 'Skullcollector': "Skull Collector",
  'Souldrain': "Soul Drainer", 'Spiritforge': "Spirit Forge", 'Spiritkeeper': "Spirit Keeper",
  'Steel Carapice': "Steel Carapace", 'Steelpillar': "Steel Pillar", 'Steelshade': "Steel Shade",
  'Tal Rasha\'s Fire-Spun Cloth': "Tal Rasha's Fine-Spun Cloth",
  'Tal Rasha\'s Howling Wind': "Tal Rasha's Guardianship", 'The Atlantian': "The Atlantean",
  'The Chieftan': "The Chieftain", 'The Generals Tan Do Li Ga': "The General's Tan Do Li Ga",
  'The Humongous': "Humongous", 'The Minataur': "The Minotaur", 'The Reedeemer': "The Redeemer",
  'Thudergod\'s Vigor': "Thundergod's Vigor", 'Umes Lament': "Ume's Lament", 'Valkiry Wing': "Valkyrie Wing",
  'Vampiregaze': "Vampire Gaze", 'Venomsward': "Venom Ward", 'Verdugo\'s Hearty Cord': "Verdungo's Hearty Cord",
  'Victors Silk': "Silks of the Victor", 'Wartraveler': "War Traveler", 'Whichwild String': "Witchwild String",
  'Wihtstan\'s Guard': "Sigon's Guard", 'Wisp': "Wisp Projector", 'Wraithflight': "Wraith Flight",
};
function correctEnglishName(raw) {
  return ITEM_ENGLISH_NAME_ALIASES[raw] ?? raw;
}

// vendor/d2data's chi[] table is a general game-string dump and is stale or
// inconsistent for a large share of Unique/Set item and set names (e.g. it
// held two different spellings of "Civerb's Ward" in the same file). Verified
// directly against d2r.world's own zh-TW pages this session (scraped every
// Unique category and every Set page, matched entries by the English name
// shown in parentheses next to each Chinese name) rather than translated by
// hand. Covers unique item names, set piece names, and set names — all three
// flow through localizedItemName below. zh-CN is still derived via toZhCn().
const ITEM_NAME_OVERRIDES = {
  'Aldur\'s Advance': "艾爾多的進擊", 'Alma Negra': "黑魂", 'Andariel\'s Visage': "安達莉爾的面貌", 'Angelic Halo': "天使的光暈",
  'Angelic Wings': "天使的翅膀", 'Annihilus': "滅絕", 'Arcanna\'s Sign': "阿卡娜的符印", 'Arcanna\'s Tricks': "阿卡娜的詭計",
  'Arctic Binding': "北極捆索", 'Arctic Gear': "北極裝備", 'Arm of King Leoric': "李奧瑞克王的手骨",
  'Ars Dul\'Mephistos': "杜墨菲斯托斯學術", 'Ars Tor\'Baalos': "托巴爾羅斯學術", 'Athena\'s Wrath': "雅典娜之怒", 'Azurewrath': "碧藍怒火",
  'Bane\'s Authority': "貝恩的權威", 'Bane\'s Garments': "貝恩的衣裝", 'Bane\'s Oathmaker': "貝恩的立誓者",
  'Bane\'s Wraithskin': "貝恩的靈膚", 'Berserker\'s Hatchet': "狂戰士手斧", 'Berserker\'s Hauberk': "狂戰士鎖子甲",
  'Berserker\'s Headgear': "狂戰士頭盔", 'Bing Sz Wang': "冰之王", 'Blackhorn\'s Face': "黑荊角面具",
  'Blackleach Blade': "黑蛭長刀", 'Blacktongue': "黑舌", 'Bladebuckle': "刀鋒扣帶", 'Blastbark': "爆裂咆哮",
  'Bloodletter': "放血者", 'Bloodpact Shard': "血誓碎片", 'Bloodrise': "血升", 'Bloodthief': "血賊", 'Boneshade': "骸骨陰影",
  'Boneslayer Blade': "斬骨者之斧", 'Brainhew': "劈腦", 'Bul-Kathos\' Children': "布爾凱索的子嗣",
  'Bul-Kathos\' Sacred Charge': "布爾凱索的神聖職責", 'Buriza-Do Kyanon': "暴雪砲弩", 'Butcher\'s Pupil': "屠夫的徒弟",
  'Bverrit Keep': "布雷維特要塞", 'Carin Shard': "凱林碎片", 'Cathan\'s Mesh': "卡珊的網衣", 'Cathan\'s Rule': "卡珊的尺杖",
  'Cathan\'s Traps': "卡珊的衣著", 'Chromatic Ire': "炫彩之怒", 'Civerb\'s Cudgel': "克維雷布的短棍", 'Civerb\'s Icon': "克維雷布的聖像",
  'Civerb\'s Vestments': "克維雷布的法衣", 'Civerb\'s Ward': "克維雷布的防護", 'Cleglaw\'s Brace': "克雷德勞的防備",
  'Cleglaw\'s Claw': "克雷德勞之爪", 'Cleglaw\'s Pincers': "克雷德勞之鉗", 'Cleglaw\'s Tooth': "克雷德勞之牙", 'Cliffkiller': "懸崖殺手",
  'Coif of Glory': "光榮罩盔", 'Corpsemourn': "屍慟", 'Cow King\'s Hide': "牛王之皮", 'Cow King\'s Horns': "牛王之角",
  'Cow King\'s Leathers': "牛王皮甲", 'Crainte Vomir': "恐懼之嘔", 'Credendum': "守信條", 'Crow Caw': "鴉啼",
  'Crown of Ages': "歲月之冠", 'Crushflange': "碎擊釘錘", 'Dangoon\'s Teaching': "檀君的教導", 'Darkglow': "暗光",
  'Death\'s Guard': "死亡之護", 'Deathbit': "死亡尖鑽", 'Demon Machine': "惡魔機弩", 'Demon\'s Arch': "惡魔之拱",
  'Demonhorn\'s Edge': "惡魔角尖", 'Doombringer': "末日使者", 'Dracul\'s Grasp': "德古拉之握", 'Dreadfang': "懼牙",
  'Duriel\'s Shell': "都瑞爾之殼", 'Eaglehorn': "鷹角弓", 'Earthshaker': "震地者", 'Endlesshail': "無盡冰雹",
  'Entropy Locket': "無序墜盒", 'Ethereal Edge': "無形之刃", 'Felloak': "魔橡樹", 'Flamebellow': "火嚎", 'Fleshrender': "血肉撕裂者",
  'Frostwind': "霜風", 'Gheed\'s Fortune': "基德的財運", 'Gheed\'s Wager': "基德的賭注", 'Ghostflame': "鬼火",
  'Ghoulhide': "食屍鬼之皮", 'Gimmershred': "吉默削斧", 'Ginther\'s Rift': "金瑟的裂隙", 'Gleamscythe': "閃耀鐮刀",
  'Goblin Toe': "哥布林腳趾", 'Goldskin': "黃金之膚", 'Goldwrap': "黃金裹腰", 'Goreshovel': "血鍬", 'Gravepalm': "墓穴手掌",
  'Greyform': "灰暮之形", 'Griffon\'s Eye': "獅鷲之眼", 'Grim\'s Burning Dead': "懼焰亡靈", 'Griswold\'s Heart': "格里斯瓦德之心",
  'Griswold\'s Honor': "格里斯瓦德的榮耀", 'Griswold\'s Legacy': "格里斯瓦德的傳奇", 'Griswold\'s Valor': "格里斯瓦德的勇氣",
  'Guardian Naga': "那伽守護者", 'Halaberd\'s Reign': "海拉柏德的國度", 'Hand of Blessed Light': "聖光之手", 'Heart Carver': "刨心者",
  'Heaven\'s Brethren': "天堂的同胞", 'Hellcast': "地獄擲弩", 'Hellclap': "地獄轟鳴", 'Hellmouth': "地獄之口", 'Hellrack': "地獄刑具",
  'Hellslayer': "地獄殺戮者", 'Hexfire': "妖火", 'Homunculus': "魔胎", 'Hone Sundan': "骨寸斷",
  'Horazon\'s Countenance': "赫拉森的面容", 'Horazon\'s Dominion': "赫拉森的統治", 'Horazon\'s Hold': "赫拉森的掌控",
  'Horazon\'s Legacy': "赫拉森的傳承", 'Horazon\'s Secrets': "赫拉森的秘密", 'Horazon\'s Splendor': "赫拉森的輝煌",
  'Horizon\'s Tornado': "地平線的龍捲風", 'Hsarus\' Defense': "海沙魯的鐵禦", 'Hsarus\' Iron Fist': "海沙魯的鐵拳",
  'Hsarus\' Iron Heel': "海沙魯的鐵跟", 'Hsarus\' Iron Stay': "海沙魯的鐵扣", 'Husoldal Evo': "血肉吞食者",
  'Hwanin\'s Justice': "桓因的制裁", 'Hwanin\'s Majesty': "桓因的威嚴", 'Hwanin\'s Refuge': "桓因的庇佑",
  'Hwanin\'s Splendor': "桓因的光輝", 'Iceblink': "冰晶", 'Ichorsting': "膿毒之刺", 'Immortal King\'s Detail': "不朽之王的扈從",
  'Immortal King\'s Forge': "不朽之王的熔爐", 'Infernal Cranium': "煉獄頭骨", 'Infernal Sign': "煉獄符印",
  'Infernal Tools': "煉獄器具", 'Infernal Torch': "煉獄火炬", 'Iratha\'s Coil': "依雷撒的盤頂", 'Iratha\'s Cord': "依雷撒的腰繩",
  'Iratha\'s Cuff': "依雷撒的袖銬", 'Iratha\'s Finery': "依雷撒的華服", 'Isenhart\'s Armory': "依森哈特的軍械",
  'Isenhart\'s Case': "依森哈特的外殼", 'Isenhart\'s Horns': "依森哈特的角盔", 'Isenhart\'s Lightbrand': "依森哈特的光之烙鐵",
  'Isenhart\'s Parry': "依森哈特的招架", 'Jalal\'s Mane': "加爾的鬃毛", 'Knell Striker': "喪鐘敲擊者", 'Langer Briser': "蘭古布利薩",
  'Laying of Hands': "按手禮", 'Leadcrow': "鉛烏鴉", 'Leviathan': "利維坦", 'Lycander\'s Aim': "萊坎德的準頭",
  'Lycander\'s Flank': "萊坎德的側翼", 'M\'avina\'s Caster': "馬維娜的強弓", 'Manald Heal': "瑪那德的治療",
  'Mang Song\'s Lesson': "曼宋的教誨", 'Measured Wrath': "審慎之怒", 'Messerschmidt\'s Reaver': "梅希斯密特之劫掠者",
  'Milabrega\'s Diadem': "米拉伯佳權冠", 'Milabrega\'s Regalia': "米拉伯佳戰裝", 'Milabrega\'s Robe': "米拉伯佳外袍",
  'Milabrega\'s Rod': "米拉伯佳節杖", 'Moonfall': "月落", 'Naj\'s Circlet': "娜吉的頭環", 'Naj\'s Light Plate': "娜吉的輕鎧",
  'Naj\'s Puzzler': "娜吉的解謎杖", 'Natalya\'s Mark': "娜塔亞的印記", 'Nature\'s Peace': "自然祥和", 'Nord\'s Tenderizer': "北地肉鎚",
  'Nosferatu\'s Coil': "吸血鬼王之圈", 'Ondal\'s Almighty': "溫達的全靈", 'Ondal\'s Wisdom': "溫達的智慧", 'Opalvein': "蛋白石脈",
  'Ormus\' Robes': "奧瑪斯之袍", 'Pierre Tombale Couant': "墓石長戟", 'Pluckeye': "奪人目", 'Rakescar': "耙痕",
  'Rattlecage': "震骨", 'Ravenlore': "掠鴉之王", 'Razorswitch': "剃刀杖", 'Razortine': "剃刀叉", 'Ripsaw': "齒鋸",
  'Rite of Passage': "入門式", 'Rockfleece': "石羊毛", 'Rockstopper': "石禦", 'Rusthandle': "鏽蝕把手",
  'Sazabi\'s Cobalt Redeemer': "沙薩比的救贖鈷劍", 'Sazabi\'s Ghost Liberator': "沙薩比的解靈框體",
  'Sazabi\'s Grand Tribute': "沙薩比的崇高禮讚", 'Sazabi\'s Mental Sheath': "沙薩比的精神護罩", 'Shadowfang': "暗影之牙",
  'Shaftstop': "箭止", 'Sigon\'s Complete Steel': "西剛的全套鋼甲", 'Sigon\'s Sabot': "西剛的硬靴", 'Sigon\'s Shelter': "西剛的庇護",
  'Sigon\'s Visor': "西剛的護面", 'Sigon\'s Wrap': "西剛的裹腰", 'Skullder\'s Ire': "斯寇德的憤怒", 'Sling': "投索",
  'Snowclash': "冰雪交織", 'Soul Harvest': "靈魂收割者", 'Soulflay': "剝魂", 'Sparking Mail': "電光之甲", 'Spike Thorn': "尖刺荊棘",
  'Spire of Honor': "榮耀尖塔", 'Stealskull': "盜竊顱盔", 'Steelclash': "鋼鐵衝擊", 'Steeldriver': "打鋼鎚", 'Stoneraven': "石鴉",
  'Stormguild': "風暴同盟", 'Stormlash': "暴風之鞭", 'Stoutnail': "特粗鐵釘", 'Suicide Branch': "自殘枝椏",
  'Swordback Hold': "劍棘之盾", 'Tal Rasha\'s Adjudication': "塔拉夏的判決", 'Tal Rasha\'s Horadric Crest': "塔拉夏的赫拉迪姆之冠",
  'Tal Rasha\'s Lidless Eye': "塔拉夏的警惕之眼", 'Tal Rasha\'s Wrappings': "塔拉夏的外袍", 'Tancred\'s Battlegear': "坦克雷的戰裝",
  'Tancred\'s Crowbill': "坦克雷的鴉嘴鎬", 'Tancred\'s Hobnails': "坦克雷的釘靴", 'Tancred\'s Skull': "坦克雷的顱骨",
  'Tearhaunch': "裂臀", 'Telling of Beads': "誦唸珠", 'Templar\'s Might': "聖堂騎士之力", 'The Battlebranch': "戰鬥枝椏",
  'The Dragon Chang': "龍槍", 'The Eye of Etlich': "艾利曲之眼", 'The Gavel of Pain': "痛苦之槌",
  'The Gladiator\'s Bane': "鬥士之禍", 'The Gnasher': "噬咬者", 'The Grandfather': "高祖", 'The Grim Reaper': "猙獰奪魂者",
  'The Impaler': "刺穿者", 'The Iron Jang Bong': "鐵長棒", 'The Jade Tan Do': "玉匕", 'The Oculus': "核瞳",
  'The Patriarch': "尊父", 'The Reaper\'s Toll': "死神喪鐘", 'The Rising Sun': "旭日東升", 'The Scalper': "頭皮剝斧",
  'The Tannr Gorerod': "坦納血杖", 'The Vile Husk': "兇邪軀殼", 'The Ward': "庇護結界", 'Thunderstroke': "雷霆之擊",
  'Todesfaelle Flamme': "死落之火", 'Trang-Oul\'s Claws': "塔格奧之爪", 'Trang-Oul\'s Girth': "塔格奧之腹",
  'Trang-Oul\'s Guise': "塔格奧之容", 'Treads of Cthon': "凱松的足靴", 'Twitchthroe': "抽動掙扎", 'Tyrael\'s Might': "泰瑞爾之力",
  'Venom Grip': "劇毒之握", 'Vidala\'s Barb': "維達拉的倒刺", 'Vidala\'s Fetlock': "維達拉的足距", 'Vidala\'s Snare': "維達拉的圈套",
  'Viperfork': "蛇魔叉", 'Wall of the Eyeless': "無眼者之牆", 'Widowmaker': "絕命", 'Witherstring': "凋萎之弦",
  'Wizendraw': "凋謝弓弦", 'Woestave': "悲哀護杖", 'Wormskull': "蠕蟲頭骨", 'Wraithstep': "怨靈步伐",
  // Chinese names for the corrected (post-ITEM_ENGLISH_NAME_ALIASES) forms above.
  'Astreon\'s Iron Ward': "愛斯特龍的鐵衛", 'Bartuc\'s Cut-Throat': "霸圖克的割喉爪", 'Biggin\'s Bonnet': "畢格因的軟帽",
  'Raven Claw': "掠鴉之爪", 'Skull Splitter': "劈顱斧", 'Spectral Shard': "虹彩裂片",
  'Latent Cold Rupture': "潛伏冰寒裂縫", 'Latent Flame Rift': "潛伏火焰裂隙",
  'Latent Crack of the Heavens': "潛伏天堂裂擊", 'Latent Rotting Fissure': "潛伏腐敗裂痕",
  'Latent Bone Break': "潛伏分筋裂骨", 'Latent Black Cleft': "潛伏漆黑裂口",
  'Renewed Cold Rupture': "新生冰寒裂縫", 'Renewed Flame Rift': "新生火焰裂隙",
  'Renewed Crack of the Heavens': "新生天堂裂擊", 'Renewed Rotting Fissure': "新生腐敗裂痕",
  'Renewed Bone Break': "新生分筋裂骨", 'Renewed Black Cleft': "新生漆黑裂口",
  'Aldur\'s Rhythm': "艾爾多的律動", 'Angelic Raiment': "天使的衣裝", 'Ars Al\'Diabolos': "艾迪亞布羅斯學術",
  'Axe of Fechmar': "費屈瑪之斧", 'Berserker\'s Arsenal': "狂戰士的武裝", 'Blinkbat\'s Form': "閃蝠之軀",
  'Blood Raven\'s Charge': "血鴉之擊", 'Bonesnap': "碎骨", 'Bul-Kathos\' Wedding Band': "布爾凱索的婚戒",
  'Cerebus\' Bite': "地獄犬之咬", 'Cow King\'s Hooves': "牛王之蹄", 'Culwen\'s Point': "庫爾溫的尖刃", 'Darkforce Spawn': "魔力肇生",
  'Death Cleaver': "死亡劈斧", 'Death\'s Fathom': "死亡深度", 'Death\'s Web': "死亡之網", 'Demon Limb': "惡魔肢體",
  'Dimoak\'s Hew': "迪馬克的砍刀", 'Djinn Slayer': "巨靈殺手", 'Doomslinger': "毀滅投索", 'Earth Shifter': "撼地者",
  'Eschuta\'s Temper': "艾斯屈塔的憤怒", 'Gerke\'s Sanctuary': "基爾克的聖堂", 'Giant Skull': "巨大顱骨", 'Gloom\'s Trap': "陰影陷阱",
  'Goldstrike Arch': "金擊之拱", 'Gore Rider': "蝕肉騎士", 'Griswold\'s Edge': "格里斯瓦德之刃",
  'Griswold\'s Redemption': "格里斯瓦德的救贖", 'Gut Siphon': "內臟吸管", 'Haemosu\'s Adamant': "解慕漱的堅決",
  'Head Hunter\'s Glory': "獵頭者的榮耀", 'Humongous': "巨無霸", 'Hwanin\'s Blessing': "桓因的祝福", 'Iron Pelt': "鋼鐵獸皮",
  'Jade Talon': "碧玉爪", 'Kinemil\'s Awl': "金麥爾的鑽錐", 'Lava Gout': "熔岩之痛", 'Lenymo': "雷尼摩", 'Maelstrom': "漩渦",
  'Moser\'s Blessed Circle': "摩瑟的祝福之圓", 'Naj\'s Ancient Vestige': "娜吉的上古遺物", 'Peasant Crown': "農夫王冠",
  'Pompeii\'s Wrath': "龐貝之怒", 'Pus Spitter': "吐膿毒弩", 'Que-Hegan\'s Wisdom': "教宗的智慧",
  'Radament\'s Sphere': "羅達門特的領域", 'Razor\'s Edge': "剃刀銳斧", 'Rixot\'s Keen': "瑞克塞斯的利刃", 'Rune Master': "符文大師",
  'Sander\'s Folly': "山德的愚行", 'Sander\'s Paragon': "山德的模範", 'Sander\'s Riprap': "山德的碎石",
  'Sander\'s Superstition': "山德的迷信", 'Sander\'s Taboo': "山德的禁忌", 'Shadow Dancer': "影舞者", 'Shadow Killer': "影殺者",
  'Sigon\'s Guard': "西剛的守護", 'Silks of the Victor': "勝利者的絲綢", 'Skewer of Krintiz': "克里維茲的肉叉",
  'Skin of the Flayed One': "剝皮者之皮", 'Skull Collector': "骷髏收集者", 'Soul Drainer': "吸魂者",
  'Spire of Lazarus': "拉撒雷茲之杖", 'Spirit Forge': "靈魂熔爐", 'Spirit Keeper': "魂靈守衛者", 'Steel Carapace': "鋼鐵甲殼",
  'Steel Pillar': "鋼鐵之柱", 'Steel Shade': "鋼影", 'Taebaek\'s Glory': "太白山的榮光",
  'Tal Rasha\'s Fine-Spun Cloth': "塔拉夏的精織腰布", 'Tal Rasha\'s Guardianship': "塔拉夏的守護", 'The Atlantean': "亞特蘭提恩",
  'The Chieftain': "酋長", 'The General\'s Tan Do Li Ga': "將軍的連枷", 'The Minotaur': "牛頭怪", 'The Redeemer': "懺悔者",
  'Thundergod\'s Vigor': "雷神之力", 'Torch of Iro': "伊洛的火炬", 'Ume\'s Lament': "梅花嘆", 'Valkyrie Wing': "女武神之翼",
  'Vampire Gaze': "吸血鬼的凝視", 'Venom Ward': "毒之守禦", 'Verdungo\'s Hearty Cord': "伐頓戈的強韌腰索", 'War Traveler': "戰爭旅者",
  'Wisp Projector': "鬼火投射者", 'Witchwild String': "狂巫之弦", 'Wraith Flight': "死靈夜翔",
};

// Item/set names and base names: localestrings-chi.json is keyed by the exact
// English string used elsewhere in the source data (item `index` names verbatim,
// base item codes directly) — see vendor/d2data/README.md. ~95% coverage
// (verified); the miss is newer DLC content not yet in this localization
// snapshot, and falls back to the English text per the fallback policy.
function localizedItemName(rawEnglishName) {
  const englishName = correctEnglishName(rawEnglishName);
  const zhTw = ITEM_NAME_OVERRIDES[englishName] ?? chi[englishName] ?? chi[rawEnglishName] ?? englishName;
  return { en: englishName, 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
}

// cs2 ("Crafted Sunder Charm" — the Renewed-tier Metamorphic charm base) is
// visually and functionally the same Grand Charm as cm3, just under an
// internal placeholder name with no chi[] entry of its own — reuse cm3's.
const BASE_CODE_ALIASES = { cs2: 'cm3' };

function localizedBaseName(code, englishFallback) {
  const lookupCode = BASE_CODE_ALIASES[code] ?? code;
  const englishName = BASE_CODE_ALIASES[code] ? (items[lookupCode]?.name ?? englishFallback) : englishFallback;
  const zhTw = chi[lookupCode] ?? englishName;
  return { en: englishName, 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
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
  scha: 'charms', mcha: 'charms', lcha: 'charms', csch: 'charms',
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

// D2 encodes a "poison damage over N seconds" tooltip line as three separate
// raw props (pois-min/pois-max/pois-len) rather than the single stat every
// display (including d2r.world) actually shows — pois-len is a frame count
// (25 frames/sec) and pois-min/pois-max are scaled by pois-len/256, not the
// literal displayed damage. Verified this session against Berserker's
// Arsenal's full-set bonus: raw pois-min=16 pois-max=32 pois-len=75 frames
// -> d2r.world shows "Adds 5-9 Poison Damage over 3 Seconds":
// round(16*75/256)=5, round(32*75/256)=9, 75/25=3s. Previously rendered as
// three confusing separate lines ("Poison Damage (Min): 16", "... (Max):
// 32", "Poison Duration: 75") with the raw, un-scaled numbers.
// Takes a `fixed` array (as produced by extractProps/extractSetBonuses/the
// FCode loop); returns { fixed, variable } with the three poison-DoT props
// removed from `fixed` and replaced by one proper ranged stat — routed to
// `variable` when min !== max, or folded back into `fixed` (as value) when
// they happen to be equal, matching this file's established fixed/variable
// split convention (see the "variable stats have min !== max" invariant).
function mergePoisonDamageOverTime(fixed) {
  const minEntry = fixed.find(s => s.key === 'pois-min');
  const maxEntry = fixed.find(s => s.key === 'pois-max');
  const lenEntry = fixed.find(s => s.key === 'pois-len');
  if (!minEntry || !maxEntry || !lenEntry) return { fixed, variable: [] };
  const frames = lenEntry.value;
  const seconds = Math.round(frames / 25);
  const min = Math.round(minEntry.value * frames / 256);
  const max = Math.round(maxEntry.value * frames / 256);
  const rest = fixed.filter(s => !['pois-min', 'pois-max', 'pois-len'].includes(s.key));
  const stat = { key: 'pois-dot', label: poisonDamageOverTimeLabel(seconds), isSkillRef: false };
  return min === max
    ? { fixed: [...rest, { ...stat, value: min }], variable: [] }
    : { fixed: rest, variable: [{ ...stat, min, max }] };
}

// Same merge, for the flat {key,label,min,max,isSkillRef} shape used by
// extractSetBonuses and the fullSetBonuses/partialBonuses loops (which never
// split into separate fixed/variable arrays — a min===max entry there is
// just a range whose ends happen to be equal).
function mergePoisonDamageOverTimeFlat(bonuses) {
  const minEntry = bonuses.find(s => s.key === 'pois-min');
  const maxEntry = bonuses.find(s => s.key === 'pois-max');
  const lenEntry = bonuses.find(s => s.key === 'pois-len');
  if (!minEntry || !maxEntry || !lenEntry) return bonuses;
  const frames = lenEntry.min;
  const seconds = Math.round(frames / 25);
  const min = Math.round(minEntry.min * frames / 256);
  const max = Math.round(maxEntry.min * frames / 256);
  const rest = bonuses.filter(s => !['pois-min', 'pois-max', 'pois-len'].includes(s.key));
  return [...rest, { key: 'pois-dot', label: poisonDamageOverTimeLabel(seconds), min, max, isSkillRef: false }];
}

function poisonDamageOverTimeLabel(seconds) {
  return {
    en: `Adds Poison Damage over ${seconds} Seconds`,
    'zh-TW': `增加毒素傷害，持續 ${seconds} 秒`,
    'zh-CN': `增加毒素伤害，持续 ${seconds} 秒`,
  };
}

// A second, distinct encoding of the same "poison damage over N seconds"
// mechanic mergePoisonDamageOverTime[Flat] above handles: a single dmg-pois
// prop carrying BOTH a `par` (duration in frames) AND its own min/max,
// rather than three separate pois-min/pois-max/pois-len props. Confirmed
// against d2r.world's Infernal Tools 2-piece bonus this session: vendor
// PCode2a=dmg-pois, PParam2a=80, PMin2a=PMax2a=25 -> d2r.world shows "+8
// poison damage over 3 seconds": round(25*80/256)=8, round(80/25)=3s — same
// value/256 scaling as the three-prop form, just packaged differently.
// Every dmg-pois occurrence in vendor data (~20 unique/set items) carries a
// par, so this always applies when the code matches, not just sometimes.
// vendor data stores "Enemy <Element> Resistance %" (pierce-fire/cold/ltng/
// pois/mag) as a positive magnitude, but it's a resistance PENALTY inflicted
// on the enemy — the existing zh-TW labels already say "降低敵方X抗性 %"
// (Reduce Enemy X Resistance %), and d2r.world displays it negative
// ("-3-5%"), but the raw positive number was shown as-is, reading backward
// (as if increasing the enemy's resistance). Confirmed against d2r.world's
// Rainbow Facet jewels this session. Negate at extraction so every caller
// gets the corrected sign for free.
const PIERCE_RESIST_CODES = new Set(['pierce-fire', 'pierce-cold', 'pierce-ltng', 'pierce-pois', 'pierce-mag']);
function negatePierceResist(code, min, max) {
  if (!PIERCE_RESIST_CODES.has(code) || min === undefined || max === undefined) return null;
  return { min: -max, max: -min };
}

function scaleDmgPoisWithPar(code, par, min, max) {
  if (code !== 'dmg-pois' || par === undefined || min === undefined || max === undefined) return null;
  const seconds = Math.round(par / 25);
  return { min: Math.round(min * par / 256), max: Math.round(max * par / 256), label: poisonDamageOverTimeLabel(seconds) };
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
    // "<Family>-Affix1".."Affix6" (e.g. "Gelid-Affix1") on the Renewed-tier
    // Metamorphic charms (Crafted Cold Rupture etc.) are NOT the charm's own
    // stats — they're min=max=1 boolean tags an unrelated cross-item tracking
    // system reads elsewhere in the game data. The charm's real bonus roll
    // (the "pick one of N affixes" pool d2r.world shows) isn't present
    // anywhere in this vendor snapshot, so there's nothing accurate to show
    // for it — surfaced instead as a plain-text note (RENEWED_CHARM_NOTE_IDS)
    // rather than rendering these meaningless raw codes.
    if (/^[A-Za-z]+-Affix\d$/.test(rawCode)) continue;
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
    let min = entry[`${prefixes.min}${n}`];
    let max = entry[`${prefixes.max}${n}`];
    const dmgPois = scaleDmgPoisWithPar(code, par, min, max);
    const effectiveLabel = dmgPois ? dmgPois.label : label;
    if (dmgPois) ({ min, max } = dmgPois);
    const pierceNeg = negatePierceResist(code, min, max);
    if (pierceNeg) ({ min, max } = pierceNeg);
    if (min !== undefined && max !== undefined) {
      if (min === max) fixed.push({ key, label: effectiveLabel, value: min, isSkillRef });
      else variable.push({ key, label: effectiveLabel, min, max, isSkillRef });
      continue;
    }
    // Some props (level-scaling stats like hp/lvl, dmg/lvl; also sock,
    // rep-dur, rep-quant) carry only a `par` field instead of min/max.
    // Surface these as a fixed entry rather than silently dropping the
    // stat line — dropping it made e.g. Harlequin Crest's Life/Mana
    // (Based on Character Level) and Windforce's scaling max damage
    // disappear entirely.
    if (par !== undefined) {
      fixed.push({ key, label, value: par, isSkillRef });
    }
  }
  const merged = mergePoisonDamageOverTime(fixed);
  return { variable: [...variable, ...merged.variable], fixed: merged.fixed };
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
      let min = entry[`amin${n}${suffix}`];
      let max = entry[`amax${n}${suffix}`];
      const dmgPois = scaleDmgPoisWithPar(code, par, min, max);
      const effectiveLabel = dmgPois ? dmgPois.label : label;
      if (dmgPois) ({ min, max } = dmgPois);
      if (min !== undefined && max !== undefined) {
        bonuses.push({ key, label: effectiveLabel, min, max, isSkillRef });
        continue;
      }
      // Same par-only case as extractProps (level-scaling bonuses like
      // att/lvl, ac/lvl) — surface as a fixed min===max entry rather than
      // silently dropping the bonus line.
      if (par !== undefined) {
        bonuses.push({ key, label, min: par, max: par, isSkillRef });
      }
    }
  }
  return mergePoisonDamageOverTimeFlat(bonuses);
}

// "Amulet of the Viper" (code vip) carries spawnable=1 but lvl/lvl req=0 and
// no real treasure-class placement — a vestigial leftover never actually
// reachable through normal drop tables. d2r.world's Unique Items catalog
// correctly omits it; excluded here to match.
const UNSPAWNABLE_UNIQUE_CODES = new Set(['vip']);

// The "Renewed" tier of the six Metamorphic charms (Crafted Cold Rupture,
// etc. — see ITEM_ENGLISH_NAME_ALIASES below) is spawnable: undefined in
// vendor data (obtained only via an in-game "renewal" recipe, not a normal
// drop), but they're real, current items d2r.world lists — included here by
// *ID despite the spawnable filter.
//
// Each one rolls one random option from 5 fixed pools on top of its base
// stats. That mechanic isn't represented anywhere in this vendor snapshot
// (the "-Affix" props skipped in extractProps above turned out to be an
// unrelated marker system, not the real pool) — hand-transcribed from
// d2r.world's zh-TW charms page this session instead, mirroring the existing
// RUNEWORD_NAME_OVERRIDES precedent for vendor gaps. Pools 2-5 are identical
// across all six charms; only pool 1 (the charm's own element) differs.
function pool(...options) {
  return { options: options.map(([key, min, max]) => ({ key, label: localizedLabelFor(key), min, max, isSkillRef: false })) };
}
const RENEWED_CHARM_SHARED_POOLS = [
  pool(['mag%', 14, 25], ['gold%', 20, 55]),
  pool(['hp', 10, 65], ['mana', 10, 75]),
  pool(['move1', 5, 10], ['balance1', 12, 24], ['all-stats', 3, 8]),
  pool(['red-mag', 5, 10], ['red-dmg', 5, 10]),
];
const RENEWED_CHARM_POOLS = {
  427: [pool(['extra-cold', 5, 15], ['enemy-res-cold%', -10, -5]), ...RENEWED_CHARM_SHARED_POOLS],
  433: [pool(['extra-fire', 5, 15], ['enemy-res-fire%', -10, -5]), ...RENEWED_CHARM_SHARED_POOLS],
  434: [pool(['extra-ltng', 5, 15], ['enemy-res-ltng%', -10, -5]), ...RENEWED_CHARM_SHARED_POOLS],
  435: [pool(['extra-pois', 5, 15], ['enemy-res-pois%', -10, -5]), ...RENEWED_CHARM_SHARED_POOLS],
  436: [pool(['dmg%', 75, 100], ['enemy-res-phys%', -10, -5]), ...RENEWED_CHARM_SHARED_POOLS],
  437: [pool(['extra-mag', 10, 15], ['enemy-res-mag%', -10, -5]), ...RENEWED_CHARM_SHARED_POOLS],
};
const RENEWED_CHARM_IDS = new Set(Object.keys(RENEWED_CHARM_POOLS));

const uniquesOut = Object.entries(uniqueItems)
  .filter(([id, v]) => (v.spawnable === 1 || RENEWED_CHARM_IDS.has(id)) && !UNSPAWNABLE_UNIQUE_CODES.has(v.code))
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
      note: null,
      statPools: RENEWED_CHARM_POOLS[id] ?? [],
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
      note: null,
      statPools: [],
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

// Resolves a raw cubemain.json input/output field (e.g. `"rin,mag,pre=372"`, `axe`,
// `hst`) to one of this project's own already-extracted icon files in
// public/items/inv/ — never by downloading or embedding an image from elsewhere.
// Returns null for genuinely-unresolvable codes (broad supertypes, gem/potion
// quality-tier-only codes, quest/portal display names, and the dynamic
// usetype/useitem/any keywords) rather than guessing a representative icon.
const CUBE_TYPE_ALIASES = { shld: 'shie', rod: 'staf' };

function resolveIconFor(rawField) {
  if (!rawField) return null;
  const code = rawField.replace(/^"|"$/g, '').split(',')[0];
  // Check the type->slot mapping first: a handful of D2 item-type codes (e.g. "axe")
  // also happen to be the code of an actual craftable base item ("Axe" itself), so a
  // naive direct-lookup-first order would resolve a generic "Axe (Any)" cube input to
  // that one specific item's icon instead of the category's representative icon.
  const aliased = CUBE_TYPE_ALIASES[code] ?? code;
  const slot = TYPE_TO_SLOT[aliased];
  if (slot && categoryIconsOut[slot]) return categoryIconsOut[slot];
  if (items[code]?.invfile) return items[code].invfile;
  return null;
}

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
    const pieceIds = setsOut.filter(s => s.setName.en === correctEnglishName(v.name)).map(s => s.id);
    if (pieceIds.length === 0) return null; // e.g. Warlord's Glory: zero spawnable pieces

    // A partial-bonus tier whose piece count equals the set's total piece
    // count is mechanically unreachable in-game: reaching all pieces always
    // activates the Full Set bonus path instead of "partial(N)", so vendor
    // data's PCode{total}a field (when present) never actually applies to a
    // player and isn't shown on d2r.world either — verified against Aldur's
    // Watchtower this session, which carries an unused PCode4a: 'lifesteal'
    // (a 4-piece set) that neither displays in-game nor on d2r.world.
    // Each piece-count tier can carry more than one stat via suffix letters
    // a/b/c/d (same pattern as the per-item aprop{n}{suffix} partial bonus
    // fields extractSetBonuses reads) — not just 'a'. Confirmed against
    // d2r.world this session: Cathan's Traps' 2-piece tier grants BOTH
    // "Adds 15-20 fire damage" (PCode2a) and "Regenerate Mana 16%"
    // (PCode2b), but this loop previously only ever read suffix 'a',
    // silently dropping the 'b' stat on 9 sets across ~13 tiers.
    const partialBonuses = [2, 3, 4, 5].filter(n => n < pieceIds.length).flatMap(n => {
      const stats = ['a', 'b', 'c', 'd'].flatMap(suffix => {
        const rawCode = v[`PCode${n}${suffix}`];
        if (!rawCode) return [];
        const code = CODE_ALIASES[rawCode] ?? rawCode;
        const par = v[`PParam${n}${suffix}`];
        const isSkillRef = SKILL_REF_PROPS.has(code);
        const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
        const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(code)) && par !== undefined;
        const key = needsKeySuffix ? `${code}:${par}` : code;
        let min = v[`PMin${n}${suffix}`];
        let max = v[`PMax${n}${suffix}`];
        const dmgPois = scaleDmgPoisWithPar(code, par, min, max);
        const effectiveLabel = dmgPois ? dmgPois.label : label;
        if (dmgPois) ({ min, max } = dmgPois);
        if (min !== undefined && max !== undefined) {
          return [{ key, label: effectiveLabel, min, max, isSkillRef }];
        }
        // Same par-only case as extractProps/extractSetBonuses/fullSetBonuses
        // (level-scaling bonuses like dmg-ltng/lvl) — surface as a fixed
        // min===max entry rather than silently dropping the tier's stat.
        // Confirmed against d2r.world this session: Milabrega's Regalia's
        // 2-piece tier grants a dmg-ltng/lvl bonus (PCode2b, PParam2b=16,
        // no PMin2b/PMax2b) that this loop was dropping entirely.
        if (par !== undefined) {
          return [{ key, label: effectiveLabel, min: par, max: par, isSkillRef }];
        }
        return [];
      });
      if (stats.length === 0) return [];
      return [{ piecesRequired: n, stats }];
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
      let min = v[`FMin${n}`];
      let max = v[`FMax${n}`];
      const dmgPois = scaleDmgPoisWithPar(code, par, min, max);
      const effectiveLabel = dmgPois ? dmgPois.label : label;
      if (dmgPois) ({ min, max } = dmgPois);
      if (min !== undefined && max !== undefined) {
        fullSetBonuses.push({ key, label: effectiveLabel, min, max, isSkillRef });
        continue;
      }
      // Same par-only case as extractProps/extractSetBonuses (level-scaling
      // bonuses like dmg-cold/lvl) — surface as a fixed min===max entry
      // rather than silently dropping the bonus line. Confirmed against
      // d2r.world this session: Arctic Gear and Vidala's Rig both have an
      // FCode1 dmg-cold/lvl full-set bonus that this loop was dropping.
      if (par !== undefined) {
        fullSetBonuses.push({ key, label, min: par, max: par, isSkillRef });
      }
    }

    return {
      setName: localizedItemName(v.name),
      pieceIds,
      repInvFile: setsOut.find(s => s.id === pieceIds[0])?.invFile ?? '',
      partialBonuses,
      fullSetBonuses: mergePoisonDamageOverTimeFlat(fullSetBonuses),
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

// Rune names are transliterated, real Chinese strings in chi[] — but keyed by
// the rune's internal item CODE ("r01".."r33"), not by its English name
// ("El" isn't a chi[] key at all; chi["r01"] is "符文：艾爾" — "Rune: El").
// localizedItemName(name) was silently falling back to English for every
// rune across this whole file (the main Runes page, every runeword's rune
// list, and rune upgrade recipes) because it only ever looked up by name.
const RUNE_CODE_BY_NAME = Object.fromEntries(
  Object.values(items)
    .filter(v => typeof v.name === 'string' && v.name.endsWith(' Rune'))
    .map(v => [v.name.replace(/ Rune$/, ''), v.code])
);
function localizedRuneName(englishName) {
  const code = RUNE_CODE_BY_NAME[englishName];
  const raw = code ? chi[code] : undefined;
  const zhTw = raw ? raw.replace(/^符文：/, '') : englishName;
  return { en: englishName, 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
}

// Known vendor-data quirk: runes.json's "*RunesUsed" for Wealth is "LmKoTir" — an
// upstream typo missing the "u" in "Lum" (every other runeword spells it out
// correctly, e.g. Beast's "BerTirUmMalLum"). This pre-existing typo already
// produces runes: ['Lm', 'Ko', 'Tir'] for Wealth. Alias it here so the invFile
// lookup still resolves to the real Lum icon; the underlying rune-name typo
// itself is out of scope for this task.
const RUNE_NAME_ALIASES = { Lm: 'Lum' };

// vendor/d2data's chi[] table (a general game-string dump) is missing or
// wrong for most runeword names — many runeword-name strings just aren't in
// the vendored client snapshot, and a few resolve to an unrelated "X of Y"
// grammatical form used elsewhere in the game text. Verified directly against
// d2r.world's own zh-TW pages this session (fetched both the en-US and zh-TW
// /info/item/runewords pages, matched entries by their shared #slug anchor,
// e.g. #enigma -> "謎團" on the zh-TW page) rather than translated by hand.
// zh-CN is still derived via toZhCn() below, consistent with every other
// name in this file — d2r.world has no zh-CN edition to cross-check against.
const RUNEWORD_NAME_OVERRIDES = {
  "Ancients' Pledge": '先祖之契', Authority: '權威', Beast: '野獸', Black: '黑錘',
  Bone: '骸骨', Bramble: '刺藤', Brand: '烙印', 'Breath of the Dying': '死亡呼吸',
  Bulwark: '壁壘', 'Call to Arms': '戰爭召喚', 'Chains of Honor': '榮耀之鍊',
  Chaos: '混沌', Coven: '巫師會', Cure: '治癒', Death: '死神', Delirium: '精神錯亂',
  Destruction: '毀滅', Doom: '末日', Dragon: '飛龍', Dream: '夢境', Duress: '強制',
  Edge: '邊緣', Enigma: '謎團', Enlightenment: '教化', Eternity: '永恆', Exile: '流亡',
  Faith: '信心', Famine: '饑荒', 'Flickering Flame': '閃爍火焰', Fortitude: '剛毅',
  Fury: '狂怒', Gloom: '幽暗', Grief: '悔恨', Ground: '接地', 'Hand of Justice': '正義之手',
  Harmony: '和諧', 'Heart of the Oak': '橡樹之心', Hearth: '火爐', 'Holy Thunder': '神聖雷擊',
  Honor: '榮耀', Ice: '寒冰', Infinity: '無限', Insight: '靈光', "King's Grace": '王者的慈悲',
  Kingslayer: '弒王者', 'Last Wish': '最後遺願', Lawbringer: '執法者', Leaf: '葉子',
  Lionheart: '獅子心', Lore: '知識', Malice: '怨恨', Melody: '旋律', Memory: '記憶',
  Metamorphosis: '變化', Mist: '迷霧', Mosaic: '嵌飾', Myth: '神話', Nadir: '天底',
  Oath: '誓約', Obedience: '遵從', Obsession: '執念', Passion: '熱情', Pattern: '圖紋',
  Peace: '和平', Phoenix: '鳳凰', Plague: '瘟疫', Pride: '驕傲', Principle: '原則',
  Prudence: '謹慎', Radiance: '光輝', Rain: '降雨', Rhyme: '聲韻', Rift: '裂隙',
  Ritual: '儀式', Sanctuary: '聖堂', Silence: '寂靜', Smoke: '煙霧', Spirit: '精神',
  Splendor: '燦爛', Stealth: '隱密', Steel: '鋼鐵', Stone: '石塊', Strength: '力量',
  Temper: '和緩', Treachery: '背信', 'Unbending Will': '不屈意志', Venom: '劇毒',
  Vigilance: '戒慎', 'Voice of Reason': '理性之聲', Void: '虛無', Wealth: '財富',
  White: '蒼白', Wind: '輕風', Wisdom: '智慧', Wrath: '憤怒', Zephyr: '和風',
};
function localizedRunewordName(englishName) {
  const zhTw = RUNEWORD_NAME_OVERRIDES[englishName] ?? chi[englishName] ?? englishName;
  return { en: englishName, 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
}

// vendor/d2data's runes.json caps every runeword at 8 stat slots
// (T1Code1..T1Code8 — there is no T1Code9+ field in the source at all), but
// several current-patch runewords genuinely have more properties than that,
// and a handful of the 8-or-fewer ones have outright wrong values. Verified
// against d2r.world's en-US runewords page this session, item by item.
// RUNEWORD_STAT_OVERRIDES fully replaces (not merges) a runeword's stats
// list when present, since partial-merging against an 8-slot-capped source
// is more error-prone than just specifying the complete, correct list.
function rwStat(code, min, max, par) {
  const resolvedCode = CODE_ALIASES[code] ?? code;
  const isSkillRef = SKILL_REF_PROPS.has(resolvedCode);
  const label = isSkillRef ? localizedLabelWithSkill(resolvedCode, par) : localizedLabelFor(resolvedCode);
  const needsKeySuffix = (isSkillRef || KEY_ONLY_DISAMBIGUATE_PROPS.has(resolvedCode)) && par !== undefined;
  const key = needsKeySuffix ? `${resolvedCode}:${par}` : resolvedCode;
  return { key, label, min, max, isSkillRef };
}
// A few runewords grant a stat only when socketed into one of several
// allowed base-item types (e.g. Dragon's "Increase Maximum Mana 5%" applies
// only to Armor bases, not the Shields it can also go in) — d2r.world shows
// this as a "(X Only)" qualifier on the stat line. Appends the same
// qualifier (trilingual) to an rwStat()'s label.
const ITEM_TYPE_QUALIFIER_ZH = {
  'Armor Only': '僅限盔甲', 'Shields Only': '僅限盾牌', 'Helms Only': '僅限頭盔',
  'Body Armor Only': '僅限身體護甲', 'Weapons Only': '僅限武器',
};
function rwStatQualified(stat, qualifierEn) {
  const qualifierZh = ITEM_TYPE_QUALIFIER_ZH[qualifierEn];
  return {
    ...stat,
    label: {
      en: `${stat.label.en} (${qualifierEn})`,
      'zh-TW': `${stat.label['zh-TW']}（${qualifierZh}）`,
      'zh-CN': `${stat.label['zh-CN']}（${qualifierZh}）`,
    },
  };
}
// Verified complete, untruncated against d2r.world's en-US runewords page
// this session (name-by-name, cross-checked against vendor's own partial
// list to confirm every additional/corrected stat). Only runewords with a
// fully visible stat block (no screenshot cutoff) are included here —
// partially-captured ones are deliberately left on vendor data rather than
// guessed at.
const RUNEWORD_STAT_OVERRIDES = {
  Bone: [
    rwStat('gethit-skill', 15, 10, 'Bone Armor'),
    rwStat('hit-skill', 15, 10, 'Bone Spear'),
    rwStat('nec', 2, 2),
    rwStat('mana', 100, 150),
    rwStat('res-all', 30, 30),
    rwStat('red-dmg', 7, 7),
  ],
  Bramble: [
    rwStat('aura', 15, 21, 'Thorns'),
    rwStat('balance2', 50, 50),
    rwStat('extra-pois', 25, 50),
    rwStat('ac', 300, 300),
    rwStat('mana%', 5, 5),
    rwStat('regen-mana', 15, 15),
    rwStat('res-cold-max', 5, 5),
    rwStat('res-fire', 30, 30),
    rwStat('res-pois', 100, 100),
    rwStat('heal-kill', 13, 13),
    rwStat('charged', 33, 13, 'Spirit of Barbs'),
  ],
  Bulwark: [
    rwStat('balance2', 20, 20),
    rwStat('lifesteal', 4, 6),
    rwStat('ac%', 75, 100),
    rwStat('vit', 10, 10),
    rwStat('hp%', 5, 5),
    rwStat('regen', 30, 30),
    rwStat('red-dmg', 7, 7),
    rwStat('red-dmg%', 10, 15),
  ],
  'Chains of Honor': [
    rwStat('allskills', 2, 2),
    rwStat('dmg-demon', 200, 200),
    rwStat('dmg-undead', 100, 100),
    rwStat('lifesteal', 8, 8),
    rwStat('ac%', 70, 70),
    rwStat('str', 20, 20),
    rwStat('regen', 7, 7),
    rwStat('res-all', 65, 65),
    rwStat('red-dmg%', 8, 8),
    rwStat('mag%', 25, 25),
  ],
  Chaos: [
    rwStat('hit-skill', 9, 11, 'Frozen Orb'),
    rwStat('hit-skill', 11, 9, 'Charged Bolt'),
    rwStat('swing2', 35, 35),
    rwStat('dmg%', 290, 340),
    rwStat('dmg-mag', 216, 471),
    rwStat('openwounds', 25, 25),
    rwStat('oskill', 1, 1, 'Whirlwind'),
    rwStat('str', 10, 10),
    rwStat('demon-heal', 15, 15),
  ],
  'Crescent Moon': [
    // pierce-ltng is stored positive (35) in vendor data but displays negative
    // (a resistance penalty) — same convention fixed generically for
    // extractProps via negatePierceResist, but this manual override bypasses
    // that helper, so the sign is applied by hand here.
    rwStat('pierce-ltng', -35, -35),
    rwStat('ignore-ac', 1, 1),
    rwStat('dmg%', 180, 220),
    rwStat('abs-mag', 9, 11),
    rwStat('charged', 30, 18, 'Summon Spirit Wolf'),
    rwStat('hit-skill', 7, 13, 'Static Field'),
    rwStat('hit-skill', 10, 17, 'Chain Lightning'),
    rwStat('swing3', 20, 20),
    rwStat('openwounds', 25, 25),
    rwStat('mana-kill', 2, 2),
  ],
  Death: [
    rwStat('death-skill', 100, 44, 'Chain Lightning'),
    rwStat('att-skill', 25, 18, 'Glacial Spike'),
    rwStat('indestruct', 1, 1),
    rwStat('dmg%', 300, 385),
    rwStat('att%', 20, 20),
    rwStat('att', 50, 50),
    rwStat('dmg-ltng', 1, 50),
    rwStat('manasteal', 7, 7),
    rwStat('crush', 50, 50),
    rwStat('deadly/lvl', 4, 4),
    rwStat('light', 1, 1),
    rwStat('charged', 15, 22, 'Blood Golem'),
    rwStat('ease', -20, -20),
  ],
  Eternity: [
    rwStat('dmg%', 260, 310),
    rwStat('indestruct', 1, 1),
    rwStat('slow', 33, 33),
    rwStat('charged', 88, 8, 'Revive'),
    rwStat('regen', 16, 16),
    rwStat('regen-mana', 16, 16),
    rwStat('nofreeze', 1, 1),
    rwStat('dmg-min', 9, 9),
    rwStat('lifesteal', 7, 7),
    rwStat('crush', 20, 20),
    rwStat('stupidity', 1, 1),
    rwStat('mag%', 30, 30),
  ],
  Fury: [
    rwStat('dmg%', 209, 209),
    rwStat('swing2', 40, 40),
    rwStat('noheal', 1, 1),
    rwStat('openwounds', 66, 66),
    rwStat('lifesteal', 6, 6),
    rwStat('deadly', 33, 33),
    rwStat('skill', 5, 5, 'Frenzy'),
    rwStat('ignore-ac', 1, 1),
    rwStat('reduce-ac', 25, 25),
    rwStat('att%', 20, 20),
  ],
  Gloom: [
    rwStat('ac%', 200, 260),
    rwStat('res-all', 45, 45),
    rwStat('gethit-skill', 15, 3, 'Dim Vision'),
    rwStat('balance2', 10, 10),
    rwStat('dmg-to-mana', 5, 5),
    rwStat('light', -3, -3),
    rwStat('half-freeze', 1, 1),
    rwStat('str', 10, 10),
  ],
  Ground: [
    rwStat('balance1', 20, 20),
    rwStat('ac%', 75, 100),
    rwStat('vit', 10, 10),
    rwStat('hp%', 5, 5),
    rwStat('res-ltng', 40, 60),
    rwStat('abs-ltng%', 10, 15),
  ],
  'Hand of Justice': [
    rwStat('levelup-skill', 100, 36, 'Blaze'),
    rwStat('death-skill', 100, 48, 'Meteor'),
    rwStat('aura', 16, 16, 'Holy Fire'),
    rwStat('swing2', 33, 33),
    rwStat('dmg%', 280, 330),
    rwStat('ignore-ac', 1, 1),
    rwStat('lifesteal', 7, 7),
    rwStat('pierce-fire', -20, -20),
    rwStat('deadly', 20, 20),
    rwStat('stupidity', 1, 1),
    rwStat('freeze', 3, 3),
  ],
  Silence: [
    rwStat('dmg%', 200, 200),
    rwStat('dmg-undead', 75, 75),
    rwStat('ease', -20, -20),
    rwStat('swing2', 20, 20),
    rwStat('att-und', 50, 50),
    rwStat('allskills', 2, 2),
    rwStat('res-all', 75, 75),
    rwStat('balance2', 20, 20),
    rwStat('manasteal', 11, 11),
    rwStat('howl', 25, 25),
    rwStat('stupidity', 33, 33),
  ],
  Smoke: [
    rwStat('ac%', 75, 75),
    rwStat('ac-miss', 250, 250),
    rwStat('res-all', 50, 50),
    rwStat('balance2', 20, 20),
    rwStat('charged', 18, 6, 'Weaken'),
    rwStat('enr', 10, 10),
    rwStat('light', -1, -1),
  ],
  Ritual: [
    rwStat('gethit-skill', 13, 1, 'Sigil: Death'),
    rwStat('swing1', 20, 20),
    rwStat('dmg%', 200, 270),
    rwStat('att%', 200, 260),
    rwStat('dmg-demon', 150, 250),
    rwStat('heal-kill', 3, 5),
    rwStat('rip', 1, 1),
    rwStat('lifesteal', 7, 7),
  ],
  Sanctuary: [
    rwStat('balance2', 20, 20),
    rwStat('block2', 20, 20),
    rwStat('block', 20, 20),
    rwStat('ac%', 130, 160),
    rwStat('ac-miss', 250, 250),
    rwStat('dex', 20, 20),
    rwStat('res-all', 50, 70),
    rwStat('red-mag', 7, 7),
    rwStat('charged', 60, 12, 'Slow Missiles'),
  ],
  Rain: [
    rwStat('gethit-skill', 5, 15, 'Cyclone Armor'),
    rwStat('hit-skill', 5, 15, 'Twister'),
    rwStat('dru', 2, 2),
    rwStat('mana', 100, 150),
    rwStat('res-ltng', 30, 30),
    rwStat('red-mag', 7, 7),
    rwStat('dmg-to-mana', 15, 15),
  ],
  Rhyme: [
    rwStat('block', 20, 20),
    rwStat('block2', 40, 40),
    rwStat('res-all', 25, 25),
    rwStat('regen-mana', 15, 15),
    rwStat('nofreeze', 1, 1),
    rwStat('gold%', 50, 50),
    rwStat('mag%', 25, 25),
  ],
  Rift: [
    rwStat('hit-skill', 20, 16, 'Tornado'),
    rwStat('att-skill', 16, 21, 'Frozen Orb'),
    rwStat('att%', 20, 20),
    rwStat('dmg-mag', 160, 250),
    rwStat('dmg-fire', 60, 180),
    rwStat('all-stats', 5, 10),
    rwStat('dex', 10, 10),
    rwStat('dmg-to-mana', 38, 38),
    rwStat('gold%', 75, 75),
    rwStat('charged', 40, 15, 'Iron Maiden'),
  ],
  Prudence: [
    rwStat('balance2', 25, 25),
    rwStat('ac%', 140, 170),
    rwStat('res-all', 25, 35),
    rwStat('red-dmg', 3, 3),
    rwStat('red-mag', 17, 17),
    rwStat('mana-kill', 2, 2),
    rwStat('light', 1, 1),
    rwStat('rep-dur', 25, 25),
  ],
  Radiance: [
    rwStat('ac%', 75, 75),
    rwStat('ac-miss', 30, 30),
    rwStat('enr', 10, 10),
    rwStat('vit', 10, 10),
    rwStat('dmg-to-mana', 15, 15),
    rwStat('red-mag', 3, 3),
    rwStat('mana', 33, 33),
    rwStat('red-dmg', 7, 7),
    rwStat('light', 5, 5),
  ],
  Plague: [
    rwStat('gethit-skill', 20, 12, 'Lower Resist'),
    rwStat('hit-skill', 25, 15, 'Poison Nova'),
    rwStat('aura', 13, 17, 'Cleansing'),
    rwStat('allskills', 1, 2),
    rwStat('swing2', 20, 20),
    rwStat('dmg%', 220, 320),
    rwStat('pierce-pois', -23, -23),
    rwStat('deadly/lvl', 3, 3),
    rwStat('openwounds', 25, 25),
    rwStat('freeze', 3, 3),
  ],
  Pride: [
    rwStat('gethit-skill', 25, 17, 'Fire Wall'),
    rwStat('aura', 16, 20, 'Concentration'),
    rwStat('att%', 260, 300),
    rwStat('dmg-demon/lvl', 8, 8),
    rwStat('dmg-ltng', 50, 280),
    rwStat('deadly', 20, 20),
    rwStat('stupidity', 1, 1),
    rwStat('freeze', 3, 3),
    rwStat('vit', 10, 10),
    rwStat('regen', 8, 8),
    rwStat('gold%/lvl', 15, 15),
  ],
  Principle: [
    rwStat('hit-skill', 100, 5, 'Holy Bolt'),
    rwStat('pal', 2, 2),
    rwStat('dmg-undead', 50, 50),
    rwStat('hp', 100, 150),
    rwStat('stamdrain', -15, -15),
    rwStat('res-pois-max', 5, 5),
    rwStat('res-fire', 30, 30),
  ],
  Phoenix: [
    rwStat('dmg%', 350, 400),
    rwStat('levelup-skill', 100, 40, 'Blaze'),
    rwStat('hit-skill', 40, 22, 'Firestorm'),
    rwStat('abs-fire', 15, 21),
    rwStat('aura', 10, 15, 'Redemption'),
    rwStat('ac-miss', 350, 400),
    rwStat('pierce-fire', -28, -28),
    rwStatQualified(rwStat('hp', 50, 50), 'Shields Only'),
    rwStatQualified(rwStat('res-ltng-max', 5, 5), 'Shields Only'),
    rwStatQualified(rwStat('res-fire-max', 10, 10), 'Shields Only'),
    rwStatQualified(rwStat('ignore-ac', 1, 1), 'Weapons Only'),
    rwStatQualified(rwStat('manasteal', 14, 14), 'Weapons Only'),
    rwStatQualified(rwStat('deadly', 20, 20), 'Weapons Only'),
  ],
  Passion: [
    rwStat('swing2', 25, 25),
    rwStat('dmg%', 160, 210),
    rwStat('att%', 50, 80),
    rwStat('dmg-undead', 75, 75),
    rwStat('att-und', 50, 50),
    rwStat('dmg-ltng', 1, 50),
    rwStat('oskill', 1, 1, 'Berserk'),
    rwStat('oskill', 1, 1, 'Zeal'),
    rwStat('stupidity', 10, 10),
    rwStat('howl', 25, 25),
    rwStat('gold%', 75, 75),
    rwStat('charged', 12, 3, 'Heart of Wolverine'),
  ],
  Pattern: [
    rwStat('block2', 30, 30),
    rwStat('dmg%', 40, 80),
    rwStat('att%', 10, 10),
    rwStat('dmg-fire', 12, 32),
    rwStat('dmg-ltng', 1, 50),
    rwStat('dmg-cold', 3, 14),
    { key: 'pois-dot', label: poisonDamageOverTimeLabel(5), min: 75, max: 75, isSkillRef: false },
    rwStat('str', 6, 6),
    rwStat('dex', 6, 6),
    rwStat('res-all', 15, 15),
  ],
  Peace: [
    rwStat('gethit-skill', 4, 5, 'Slow Missiles'),
    rwStat('hit-skill', 2, 15, 'Valkyrie'),
    rwStat('ama', 2, 2),
    rwStat('balance2', 20, 20),
    rwStat('oskill', 2, 2, 'Critical Strike'),
    rwStat('res-cold', 30, 30),
    rwStat('thorns', 14, 14),
  ],
  Obedience: [
    rwStat('kill-skill', 30, 21, 'Enchant'),
    rwStat('balance3', 40, 40),
    rwStat('dmg%', 370, 370),
    rwStat('reduce-ac', 25, 25),
    rwStat('dmg-cold', 3, 14),
    rwStat('pierce-fire', -25, -25),
    rwStat('crush', 40, 40),
    rwStat('ac', 200, 300),
    rwStat('str', 10, 10),
    rwStat('dex', 10, 10),
    rwStat('res-all', 20, 30),
    rwStat('ease', -20, -20),
  ],
  Obsession: [
    rwStat('indestruct', 1, 1),
    rwStat('gethit-skill', 24, 10, 'Weaken'),
    rwStat('allskills', 4, 4),
    rwStat('cast3', 65, 65),
    rwStat('balance3', 60, 60),
    rwStat('knock', 1, 1),
    rwStat('vit', 10, 10),
    rwStat('enr', 10, 10),
    rwStat('hp%', 15, 25),
    rwStat('regen-mana', 15, 30),
    rwStat('res-all', 60, 70),
    rwStat('gold%', 75, 75),
    rwStat('mag%', 30, 30),
  ],
  Nadir: [
    rwStat('ac%', 50, 50),
    rwStat('ac', 10, 10),
    rwStat('ac-miss', 30, 30),
    rwStat('charged', 9, 13, 'Cloak of Shadows'),
    rwStat('mana-kill', 2, 2),
    rwStat('str', 5, 5),
    rwStat('gold%', -33, -33),
    rwStat('light', -3, -3),
  ],
  Oath: [
    rwStat('hit-skill', 30, 20, 'Bone Spirit'),
    rwStat('indestruct', 1, 1),
    rwStat('swing1', 50, 50),
    rwStat('dmg%', 210, 340),
    rwStat('dmg-demon', 75, 75),
    rwStat('att-demon', 100, 100),
    rwStat('noheal', 1, 1),
    rwStat('enr', 10, 10),
    rwStat('abs-mag', 10, 15),
    rwStat('charged', 20, 16, 'Heart of Wolverine'),
    rwStat('charged', 14, 17, 'Iron Golem'),
  ],
  Mosaic: [
    rwStat('charge-noconsume', 50, 50),
    rwStat('skilltab', 2, 2, 20),
    rwStat('swing2', 20, 20),
    rwStat('dmg%', 200, 250),
    rwStat('att%', 20, 20),
    rwStat('lifesteal', 7, 7),
    rwStat('extra-cold', 8, 15),
    rwStat('extra-ltng', 8, 15),
    rwStat('extra-fire', 8, 15),
    rwStat('noheal', 1, 1),
  ],
  Myth: [
    rwStat('gethit-skill', 3, 1, 'Howl'),
    rwStat('hit-skill', 10, 1, 'Taunt'),
    rwStat('bar', 2, 2),
    rwStat('ac-miss', 30, 30),
    rwStat('regen', 10, 10),
    rwStat('thorns', 14, 14),
    rwStat('ease', -15, -15),
  ],
  Mist: [
    rwStat('aura', 8, 12, 'Concentration'),
    rwStat('allskills', 3, 3),
    rwStat('swing2', 20, 20),
    rwStat('pierce', 100, 100),
    rwStat('dmg%', 325, 375),
    rwStat('dmg-max', 9, 9),
    rwStat('att%', 20, 20),
    rwStat('dmg-cold', 3, 14),
    rwStat('freeze', 3, 3),
    rwStat('vit', 24, 24),
    rwStat('res-all', 40, 40),
  ],
  Melody: [
    rwStat('dmg%', 50, 50),
    rwStat('dmg-undead', 300, 300),
    rwStat('skilltab', 3, 3, 0),
    rwStat('skill', 3, 3, 'Critical Strike'),
    rwStat('skill', 3, 3, 'Dodge'),
    rwStat('skill', 3, 3, 'Slow Missiles'),
    rwStat('swing2', 20, 20),
    rwStat('dex', 10, 10),
    rwStat('knock', 1, 1),
  ],
  Memory: [
    rwStat('sor', 3, 3),
    rwStat('cast2', 33, 33),
    rwStat('mana%', 20, 20),
    rwStat('skill', 3, 3, 'Energy Shield'),
    rwStat('skill', 2, 2, 'Static Field'),
    rwStat('enr', 10, 10),
    rwStat('vit', 10, 10),
    rwStat('dmg-min', 9, 9),
    rwStat('reduce-ac', 25, 25),
    rwStat('red-mag', 7, 7),
    rwStat('ac%', 50, 50),
  ],
  Lionheart: [
    rwStat('dmg%', 20, 20),
    rwStat('ease', -15, -15),
    rwStat('str', 25, 25),
    rwStat('enr', 10, 10),
    rwStat('vit', 20, 20),
    rwStat('dex', 15, 15),
    rwStat('hp', 50, 50),
    rwStat('res-all', 30, 30),
  ],
  Lore: [
    rwStat('allskills', 1, 1),
    rwStat('enr', 10, 10),
    rwStat('mana-kill', 2, 2),
    rwStat('res-ltng', 30, 30),
    rwStat('red-dmg', 7, 7),
    rwStat('light', 2, 2),
  ],
  Malice: [
    rwStat('dmg%', 33, 33),
    rwStat('dmg-max', 9, 9),
    rwStat('openwounds', 100, 100),
    rwStat('reduce-ac', 25, 25),
    rwStat('dmg-ac', -100, -100),
    rwStat('noheal', 1, 1),
    rwStat('att', 50, 50),
    rwStat('regen', -5, -5),
  ],
  Lawbringer: [
    rwStat('hit-skill', 20, 15, 'Decrepify'),
    rwStat('aura', 16, 18, 'Sanctuary'),
    rwStat('reduce-ac', 50, 50),
    rwStat('dmg-fire', 150, 210),
    rwStat('dmg-cold', 130, 180),
    rwStat('lifesteal', 7, 7),
    rwStat('rip', 1, 1),
    rwStat('ac-miss', 200, 250),
    rwStat('dex', 10, 10),
    rwStat('gold%', 75, 75),
  ],
  Leaf: [
    rwStat('dmg-fire', 5, 30),
    rwStat('fireskill', 3, 3),
    rwStat('skill', 3, 3, 'Fire Bolt'),
    rwStat('skill', 3, 3, 'Inferno'),
    rwStat('skill', 3, 3, 'Warmth'),
    rwStat('mana-kill', 2, 2),
    rwStat('ac/lvl', 16, 16),
    rwStat('res-cold', 33, 33),
  ],
  Kingslayer: [
    rwStat('swing2', 30, 30),
    rwStat('dmg%', 230, 270),
    rwStat('reduce-ac', 25, 25),
    rwStat('att%', 20, 20),
    rwStat('crush', 33, 33),
    rwStat('openwounds', 50, 50),
    rwStat('oskill', 1, 1, 'Vengeance'),
    rwStat('noheal', 1, 1),
    rwStat('str', 10, 10),
    rwStat('gold%', 40, 40),
  ],
  'Last Wish': [
    rwStat('gethit-skill', 6, 11, 'Fade'),
    rwStat('hit-skill', 10, 18, 'Life Tap'),
    rwStat('att-skill', 20, 20, 'Charged Bolt'),
    rwStat('aura', 17, 17, 'Might'),
    rwStat('dmg%', 330, 375),
    rwStat('ignore-ac', 1, 1),
    rwStat('crush', 60, 70),
    rwStat('noheal', 1, 1),
    rwStat('stupidity', 1, 1),
    rwStat('mag%/lvl', 4, 4),
  ],
  Insight: [
    rwStat('aura', 12, 17, 'Meditation'),
    rwStat('cast2', 35, 35),
    rwStat('dmg%', 200, 260),
    rwStat('dmg-min', 9, 9),
    rwStat('att%', 180, 250),
    rwStat('dmg-fire', 5, 30),
    { key: 'pois-dot', label: poisonDamageOverTimeLabel(5), min: 75, max: 75, isSkillRef: false },
    rwStat('oskill', 1, 6, 'Critical Strike'),
    rwStat('all-stats', 5, 5),
    rwStat('mana-kill', 2, 2),
    rwStat('mag%', 23, 23),
  ],
  "King's Grace": [
    rwStat('dmg%', 100, 100),
    rwStat('dmg-demon', 100, 100),
    rwStat('dmg-undead', 50, 50),
    rwStat('dmg-fire', 5, 30),
    rwStat('dmg-cold', 3, 14),
    rwStat('att', 150, 150),
    rwStat('att-demon', 100, 100),
    rwStat('att-undead', 100, 100),
    rwStat('lifesteal', 7, 7),
  ],
  Ice: [
    rwStat('levelup-skill', 100, 40, 'Blizzard'),
    rwStat('hit-skill', 25, 22, 'Frost Nova'),
    rwStat('aura', 18, 18, 'Holy Freeze'),
    rwStat('swing2', 20, 20),
    rwStat('dmg%', 140, 210),
    rwStat('ignore-ac', 1, 1),
    rwStat('extra-cold', 25, 30),
    rwStat('pierce-cold', -20, -20),
    rwStat('lifesteal', 7, 7),
    rwStat('deadly', 20, 20),
    rwStat('gold%/lvl', 25, 25),
  ],
  Infinity: [
    rwStat('kill-skill', 50, 20, 'Chain Lightning'),
    rwStat('aura', 12, 12, 'Conviction'),
    rwStat('move3', 35, 35),
    rwStat('dmg%', 255, 325),
    rwStat('pierce-ltng', -55, -45),
    rwStat('crush', 40, 40),
    rwStat('noheal', 1, 1),
    rwStat('vit/lvl', 4, 4),
    rwStat('mag%', 30, 30),
    rwStat('charged', 30, 21, 'Cyclone Armor'),
  ],
  Honor: [
    rwStat('dmg%', 160, 160),
    rwStat('dmg-min', 9, 9),
    rwStat('dmg-max', 9, 9),
    rwStat('deadly', 25, 25),
    rwStat('att', 250, 250),
    rwStat('allskills', 1, 1),
    rwStat('lifesteal', 7, 7),
    rwStat('regen', 10, 10),
    rwStat('str', 10, 10),
    rwStat('light', 1, 1),
    rwStat('mana-kill', 2, 2),
  ],
  Hearth: [
    rwStat('balance1', 20, 20),
    rwStat('ac%', 75, 100),
    rwStat('vit', 10, 10),
    rwStat('hp%', 5, 5),
    rwStat('res-cold', 40, 60),
    rwStat('abs-cold%', 10, 15),
    rwStat('nofreeze', 1, 1),
  ],
  'Holy Thunder': [
    rwStat('dmg%', 60, 60),
    rwStat('reduce-ac', 25, 25),
    rwStat('dmg-fire', 5, 30),
    rwStat('dmg-ltng', 21, 110),
    { key: 'pois-dot', label: poisonDamageOverTimeLabel(5), min: 75, max: 75, isSkillRef: false },
    rwStat('dmg-max', 10, 10),
    rwStat('res-ltng', 60, 60),
    rwStat('res-ltng-max', 5, 5),
    rwStat('skill', 3, 3, 'Holy Shock'),
    rwStat('charged', 60, 7, 'Chain Lightning'),
  ],
  Harmony: [
    rwStat('aura', 10, 10, 'Vigor'),
    rwStat('dmg%', 200, 275),
    rwStat('dmg-min', 9, 9),
    rwStat('dmg-max', 9, 9),
    rwStat('dmg-ltng', 55, 160),
    rwStat('dmg-fire', 55, 160),
    rwStat('dmg-cold', 55, 160),
    rwStat('oskill', 2, 6, 'Valkyrie'),
    rwStat('dex', 10, 10),
    rwStat('regen-mana', 20, 20),
    rwStat('mana-kill', 2, 2),
    rwStat('light', 2, 2),
    rwStat('charged', 25, 20, 'Revive'),
  ],
  'Heart of the Oak': [
    rwStat('allskills', 3, 3),
    rwStat('cast2', 40, 40),
    rwStat('dmg-demon', 75, 75),
    rwStat('att-demon', 100, 100),
    rwStat('dmg-cold', 3, 14),
    rwStat('manasteal', 7, 7),
    rwStat('dex', 10, 10),
    rwStat('regen', 20, 20),
    rwStat('mana%', 15, 15),
    rwStat('res-all', 30, 40),
    rwStat('charged', 25, 4, 'Oak Sage'),
    rwStat('charged', 60, 14, 'Raven'),
  ],
  Grief: [
    rwStat('hit-skill', 35, 15, 'Venom'),
    rwStat('swing3', 30, 40),
    rwStat('dmg', 340, 400),
    rwStat('ignore-ac', 1, 1),
    rwStat('reduce-ac', 25, 25),
    rwStat('dmg-demon/lvl', 15, 15),
    rwStat('dmg-fire', 5, 30),
    rwStat('pierce-pois', -25, -20),
    rwStat('deadly', 20, 20),
    rwStat('noheal', 1, 1),
    rwStat('mana-kill', 2, 2),
    rwStat('heal-kill', 10, 15),
  ],
  Fortitude: [
    rwStat('ac%', 200, 200),
    rwStat('dmg%', 300, 300),
    rwStat('cast3', 25, 25),
    rwStat('gethit-skill', 20, 15, 'Chilling Armor'),
    rwStat('dmg-to-mana', 12, 12),
    rwStat('hp/lvl', 8, 12),
    rwStat('res-all', 25, 30),
    rwStat('light', 1, 1),
    rwStatQualified(rwStat('red-dmg', 7, 7), 'Body Armor Only'),
    rwStatQualified(rwStat('ac', 15, 15), 'Body Armor Only'),
    rwStatQualified(rwStat('regen', 7, 7), 'Body Armor Only'),
    rwStatQualified(rwStat('res-ltng-max', 5, 5), 'Body Armor Only'),
    rwStatQualified(rwStat('dmg-min', 9, 9), 'Weapons Only'),
    rwStatQualified(rwStat('att', 50, 50), 'Weapons Only'),
    rwStatQualified(rwStat('howl', 25, 25), 'Weapons Only'),
    rwStatQualified(rwStat('deadly', 20, 20), 'Weapons Only'),
  ],
  Faith: [
    rwStat('dmg%', 330, 330),
    rwStat('att%', 300, 300),
    rwStat('dmg-fire', 120, 120),
    rwStat('res-all', 15, 15),
    rwStat('aura', 12, 15, 'Fanaticism'),
    rwStat('reanimate', 10, 10, 1),
    rwStat('allskills', 1, 2),
    rwStat('ignore-ac', 1, 1),
    rwStat('dmg-undead', 75, 75),
    rwStat('att-und', 50, 50),
    rwStat('gold%', 75, 75),
  ],
  Famine: [
    rwStat('dmg%', 320, 370),
    rwStat('lifesteal', 12, 12),
    rwStat('swing2', 30, 30),
    rwStat('noheal', 1, 1),
    rwStat('dmg-mag', 180, 200),
    rwStat('dmg-fire', 50, 200),
    rwStat('dmg-ltng', 51, 250),
    rwStat('dmg-cold', 50, 200),
    rwStat('ignore-ac', 1, 1),
    rwStat('str', 10, 10),
  ],
  'Flickering Flame': [
    rwStat('fireskill', 3, 3),
    rwStat('aura', 4, 8, 'Resist Fire'),
    rwStat('pierce-fire', -15, -10),
    rwStat('mana', 50, 75),
    rwStat('half-freeze', 1, 1),
    rwStat('res-pois-len', 50, 50),
    rwStat('ac%', 30, 30),
    rwStat('ac-miss', 30, 30),
    rwStat('res-fire-max', 5, 5),
  ],
  Exile: [
    rwStat('block2', 30, 30),
    rwStat('freeze', 1, 1),
    rwStat('ac%', 220, 260),
    rwStat('aura', 13, 16, 'Defiance'),
    rwStat('skilltab', 2, 2, 10),
    rwStat('hit-skill', 15, 5, 'Life Tap'),
    rwStat('rep-dur', 25, 25),
    rwStat('res-cold-max', 5, 5),
    rwStat('res-fire-max', 5, 5),
    rwStat('regen', 7, 7),
    rwStat('mag%', 25, 25),
  ],
  Enigma: [
    rwStat('ac', 750, 775),
    rwStat('heal-kill', 14, 14),
    rwStat('move2', 45, 45),
    rwStat('str/lvl', 6, 6),
    rwStat('allskills', 2, 2),
    rwStat('mag%/lvl', 8, 8),
    rwStat('oskill', 1, 1, 'Teleport'),
    rwStat('hp%', 5, 5),
    rwStat('red-dmg%', 8, 8),
    rwStat('dmg-to-mana', 15, 15),
  ],
  Enlightenment: [
    rwStat('hit-skill', 5, 15, 'Fire Ball'),
    rwStat('gethit-skill', 5, 15, 'Blaze'),
    rwStat('sor', 2, 2),
    rwStat('oskill', 1, 1, 'Warmth'),
    rwStat('ac%', 30, 30),
    rwStat('res-fire', 30, 30),
    rwStat('red-dmg', 7, 7),
  ],
  Duress: [
    rwStat('dmg-cold', 37, 133, 50),
    rwStat('dmg%', 10, 20),
    rwStat('ac%', 150, 200),
    rwStat('balance2', 40, 40),
    rwStat('openwounds', 33, 33),
    rwStat('crush', 15, 15),
    rwStat('stamdrain', -20, -20),
    rwStat('res-cold', 45, 45),
    rwStat('res-ltng', 15, 15),
    rwStat('res-fire', 15, 15),
    rwStat('res-pois', 15, 15),
  ],
  Edge: [
    rwStat('dmg-demon', 320, 380),
    rwStat('dmg-undead', 280, 280),
    rwStat('swing2', 35, 35),
    rwStat('noheal', 1, 1),
    rwStat('aura', 15, 15, 'Thorns'),
    rwStat('all-stats', 5, 10),
    rwStat('cheap', 15, 15),
    { key: 'pois-dot', label: poisonDamageOverTimeLabel(5), min: 75, max: 75, isSkillRef: false },
    rwStat('lifesteal', 7, 7),
    rwStat('mana-kill', 2, 2),
  ],
  Dragon: [
    rwStat('ac', 360, 360),
    rwStat('ac-miss', 230, 230),
    rwStat('str/lvl', 3, 3),
    rwStat('hit-skill', 12, 15, 'Hydra'),
    rwStat('gethit-skill', 20, 18, 'Venom'),
    rwStat('aura', 14, 14, 'Holy Fire'),
    rwStat('all-stats', 3, 5),
    rwStatQualified(rwStat('mana%', 5, 5), 'Armor Only'),
    rwStatQualified(rwStat('mana', 50, 50), 'Shields Only'),
    rwStat('res-ltng-max', 5, 5),
    rwStat('red-dmg', 7, 7),
  ],
  Dream: [
    rwStat('gethit-skill', 10, 15, 'Confuse'),
    rwStat('aura', 15, 15, 'Holy Shock'),
    rwStat('ac', 150, 220),
    rwStat('balance3', 20, 30),
    rwStat('mana/lvl', 5, 5),
    rwStat('res-all', 5, 20),
    rwStat('mag%', 12, 25),
    rwStat('ac%', 30, 30),
    rwStat('vit', 10, 10),
    rwStatQualified(rwStat('hp%', 5, 5), 'Helms Only'),
    rwStatQualified(rwStat('hp', 50, 50), 'Shields Only'),
  ],
  Delirium: [
    rwStat('gethit-skill', 1, 50, 'Delirium'),
    rwStat('gethit-skill', 6, 14, 'Mind Blast'),
    rwStat('gethit-skill', 14, 13, 'Terror'),
    rwStat('hit-skill', 11, 18, 'Confuse'),
    rwStat('allskills', 2, 2),
    rwStat('ac', 261, 261),
    rwStat('vit', 10, 10),
    rwStat('gold%', 50, 50),
    rwStat('mag%', 25, 25),
    rwStat('charged', 60, 17, 'Attract'),
  ],
  Destruction: [
    rwStat('dmg%', 350, 350),
    rwStat('dmg-mag', 100, 180),
    rwStat('hit-skill', 5, 23, 'Molten Boulder'),
    rwStat('death-skill', 100, 45, 'Meteor'),
    rwStat('att-skill', 15, 22, 'Nova'),
    rwStat('hit-skill', 23, 12, 'Volcano'),
    rwStat('noheal', 1, 1),
    rwStat('ignore-ac', 1, 1),
    rwStat('manasteal', 7, 7),
    rwStat('crush', 20, 20),
    rwStat('deadly', 20, 20),
    rwStat('dex', 10, 10),
  ],
  Doom: [
    rwStat('dmg%', 330, 370),
    rwStat('aura', 12, 12, 'Holy Freeze'),
    rwStat('swing2', 45, 45),
    rwStat('noheal', 1, 1),
    rwStat('pierce-cold', -60, -40),
    rwStat('allskills', 2, 2),
    rwStat('hit-skill', 5, 18, 'Volcano'),
    rwStat('deadly', 20, 20),
    rwStat('openwounds', 25, 25),
    rwStat('freeze', 3, 3),
    rwStat('ease', -20, -20),
  ],
  Coven: [
    rwStat('gethit-skill', 5, 10, 'Sigil: Lethargy'),
    rwStat('allskills', 1, 1),
    rwStat('cast1', 20, 20),
    rwStat('ac%', 30, 50),
    rwStat('heal-kill', 1, 5),
    rwStat('mag%', 26, 40),
    rwStat('res-fire', 30, 30),
    rwStat('vit', 10, 10),
  ],
  Cure: [
    rwStat('aura', 1, 1, 'Cleansing'),
    rwStat('balance2', 20, 20),
    rwStat('ac%', 75, 100),
    rwStat('vit', 10, 10),
    rwStat('hp%', 5, 5),
    rwStat('res-pois', 40, 60),
    rwStat('res-pois-len', 50, 50),
  ],
  'Call to Arms': [
    rwStat('allskills', 1, 1),
    rwStat('swing2', 40, 40),
    rwStat('dmg%', 250, 290),
    rwStat('dmg-fire', 5, 30),
    rwStat('lifesteal', 7, 7),
    rwStat('oskill', 2, 6, 'Battle Command'),
    rwStat('oskill', 1, 6, 'Battle Orders'),
    rwStat('oskill', 1, 4, 'Battle Cry'),
    rwStat('noheal', 1, 1),
    rwStat('regen', 12, 12),
    rwStat('mag%', 30, 30),
  ],
  Brand: [
    rwStat('gethit-skill', 35, 14, 'Amplify Damage'),
    rwStat('hit-skill', 100, 18, 'Bone Spear'),
    rwStat('dmg%', 260, 340),
    rwStat('ignore-ac', 1, 1),
    rwStat('att%', 20, 20),
    rwStat('dmg-demon', 280, 330),
    rwStat('deadly', 20, 20),
    rwStat('noheal', 1, 1),
    rwStat('knock', 1, 1),
    rwStat('explosivearrow', 15, 15),
  ],
  'Breath of the Dying': [
    rwStat('kill-skill', 50, 20, 'Poison Nova'),
    rwStat('indestruct', 1, 1),
    rwStat('swing2', 60, 60),
    rwStat('dmg%', 350, 400),
    rwStat('dmg-undead', 200, 200),
    rwStat('reduce-ac', 25, 25),
    rwStat('att', 50, 50),
    rwStat('att-und', 50, 50),
    rwStat('manasteal', 7, 7),
    rwStat('lifesteal', 12, 15),
    rwStat('noheal', 1, 1),
    rwStat('all-stats', 30, 30),
    rwStat('light', 1, 1),
    rwStat('ease', -20, -20),
  ],
};

const runewordsFullOut = Object.entries(runesData)
  .filter(([, v]) => v.complete === 1)
  .map(([name, v]) => {
    const runeNames = v['*RunesUsed'].match(/[A-Z][a-z]+/g) ?? [];
    const vendorExtracted = extractProps(v, 8, { code: 'T1Code', par: 'T1Param', min: 'T1Min', max: 'T1Max' });
    const override = RUNEWORD_STAT_OVERRIDES[name];
    const { variable, fixed } = override
      ? { variable: override.filter(s => s.min !== s.max), fixed: override.filter(s => s.min === s.max).map(s => ({ key: s.key, label: s.label, value: s.min, isSkillRef: s.isSkillRef })) }
      : vendorExtracted;
    const curated = runewordsCurated.find(r => normalizeRunewordName(r.name) === normalizeRunewordName(name));
    return {
      id: `runeword-${v.Name}`,
      name: localizedRunewordName(name),
      runes: runeNames.map(rn => localizedRuneName(RUNE_NAME_ALIASES[rn] ?? rn)),
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

// gems.json is keyed by internal code (e.g. "gcy"), but RUNE_RECIPES below is
// written against gem display names (e.g. "Chipped Topaz") for readability.
// Build a name -> code index so recipe gem names can resolve through the same
// chi[code] localization path item base names use, instead of staying English.
const GEM_NAME_TO_CODE = Object.fromEntries(
  Object.values(gemsData).map(g => [g.name, g.code])
);
function localizedGemName(englishName) {
  const code = GEM_NAME_TO_CODE[englishName];
  if (!code) throw new Error(`No gem code found for gem name "${englishName}"`);
  return localizedBaseName(code, englishName);
}

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
  Mal: { runeName: 'Um', count: 2, gemName: 'Topaz' },
  Ist: { runeName: 'Mal', count: 2, gemName: 'Amethyst' },
  Gul: { runeName: 'Ist', count: 2, gemName: 'Sapphire' },
  Vex: { runeName: 'Gul', count: 2, gemName: 'Ruby' },
  Ohm: { runeName: 'Vex', count: 2, gemName: 'Emerald' },
  Lo: { runeName: 'Ohm', count: 2, gemName: 'Diamond' },
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
      if (min === max) fixed.push({ key, label, value: min, isSkillRef });
      else variable.push({ key, label, min, max, isSkillRef });
      continue;
    }
    if (par !== undefined) {
      fixed.push({ key, label, value: par, isSkillRef });
    }
  }
  return [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, min: f.value, max: f.value, isSkillRef: f.isSkillRef }))];
}

const runesOut = RUNE_ORDER.map((name, i) => {
  const entry = Object.values(gemsData).find(v => v.name === `${name} Rune`);
  // gems.json has no level-requirement field for runes; that lives on the
  // corresponding items.json entry (matched by rune code, e.g. "r01").
  const itemEntry = Object.values(items).find(v => v.code === entry.code);
  const rawRecipe = RUNE_RECIPES[name] ?? null;
  return {
    id: `rune-${entry.code}`,
    number: i + 1,
    name: localizedRuneName(name),
    levelReq: itemEntry?.levelreq ?? 0,
    invFile: itemEntry?.invfile ?? '',
    weaponStats: runeStatsFor(entry, 'weaponMod'),
    armorHelmStats: runeStatsFor(entry, 'helmMod'),
    shieldStats: runeStatsFor(entry, 'shieldMod'),
    recipe: rawRecipe && {
      ...rawRecipe,
      runeName: localizedRuneName(rawRecipe.runeName),
      gemName: rawRecipe.gemName ? localizedGemName(rawRecipe.gemName) : null,
    },
    // monster is a proper name that does have real chi[] entries (Council
    // Member, Nihlathak, The Countess all resolve), unlike gemName's raw
    // fallback risk above — localize it the same way item/gem names are.
    dropRate: { ...RUNE_DROP_RATES[name], monster: localizedItemName(RUNE_DROP_RATES[name].monster) },
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
      if (min === max) fixed.push({ key, label, value: min, isSkillRef });
      else variable.push({ key, label, min, max, isSkillRef });
      continue;
    }
    if (par !== undefined) {
      fixed.push({ key, label, value: par, isSkillRef });
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

// cubemain.json's `description` is a whole compound sentence ("3 Healing
// Potions (Any) + 1 Standard Gem (Any) -> Rejuvenation Potion"), never a
// literal chi[] key on its own — localizedItemName(v.description) always
// fell back to English for all 138 recipes. Decompose into individual
// ingredient/output phrases and localize each through the same code-based
// lookups already used elsewhere in this file (items.json name->code,
// GEM_NAME_TO_CODE, RUNE_CODE_BY_NAME), falling back to a small hand-checked
// override table for generic category/quality words and one-off compounds
// that have no single matching item-database entry.
const GENERAL_ITEM_NAME_TO_CODE = {};
for (const v of Object.values(items)) {
  if (typeof v.name !== 'string') continue;
  // Prefer a code that actually has a chi[] translation — items.json often
  // has several entries sharing a display name (e.g. "Healing Potion" on
  // both "hpo" and "hp3"), and only some of those codes are in chi[].
  const existing = GENERAL_ITEM_NAME_TO_CODE[v.name];
  if (existing === undefined || (!chi[existing] && chi[v.code])) {
    GENERAL_ITEM_NAME_TO_CODE[v.name] = v.code;
  }
}

// Verified against messages/zh-TW.json's existing slot_* labels (generic
// weapon/armor category words already translated and shown elsewhere on the
// site) plus direct chi[] spot-checks for quality/quantity qualifier words
// and the handful of compound recipe outputs/ingredients with no single
// item-database entry (colored rings are crafted-item outputs, Worldstone
// Shards/Stone of Jordan/cow-level portal are quest text, not lootable
// item names in this vendor snapshot).
const CUBE_RECIPE_WORD_OVERRIDES = {
  // generic base-type category words (singular), matching messages/zh-TW.json slot_*
  Dagger: '匕首', Ring: '戒指', Amulet: '項鍊', Belt: '腰帶', Staff: '法杖', Spear: '長矛',
  Shield: '盾牌', Weapon: '武器', Sword: '劍', Helm: '頭盔', Gloves: '手套', Boots: '靴子',
  Mace: '釘頭錘', Club: '棍棒', Scepter: '權杖', Javelin: '標槍', Javelins: '標槍',
  Crossbow: '弩', Bow: '弓', Jewel: '珠寶', Axe: '斧頭', Polearm: '長柄武器', Wand: '魔杖',
  Armor: '護甲', 'Torso Armor': '軀幹護甲', Charm: '護身符', Item: '物品',
  Gem: '寶石', Skull: '頭骨', Arrows: '箭矢', Bolts: '弩箭',
  // quality/rarity words
  Magic: '魔法', Rare: '稀有', Normal: '普通', Set: '套裝', Unique: '獨特',
  Exceptional: '優良', Elite: '精英', Socketed: '有插槽的', 'Low Quality': '低品質',
  'High Quality': '高品質', 'Fully Repaired': '完全修復的',
  'Fully Repaired and Recharged': '完全修復並充能的', 'Re-rolled Magic': '重新隨機的魔法',
  // gem tier prefixes (matches chi[]'s own wording, e.g. 碎裂的黃寶石 for Chipped Topaz)
  Chipped: '碎裂的', Flawed: '裂開的', Flawless: '無暇疵的', Perfect: '完美的', Standard: '',
  // qualifiers
  '(Any)': '(任一)', '(1 of each type)': '(各一種)',
  // one-off compounds without a single matching item-database entry
  'Cobalt Ring': '鈷藍戒指', 'Garnet Ring': '石榴石戒指', 'Coral Ring': '珊瑚戒指',
  'Jade Ring': '玉戒指', 'Prismatic Amulet': '虹光項鍊', 'Savage Polearm': '野蠻長柄武器',
  'Socketed Magic Weapon': '有插槽的魔法武器', 'Magic Shield of Spikes': '尖刺魔法盾牌',
  'Sword of the Leech': '水蛭之劍', 'Stone of Jordan': '約旦之石',
  'Western Worldstone Shard': '西方世界之石碎片', 'Eastern Worldstone Shard': '東方世界之石碎片',
  'Southern Worldstone Shard': '南方世界之石碎片', 'Deep Worldstone Shard': '深層世界之石碎片',
  'Northern Worldstone Shard': '北方世界之石碎片',
  'Portal to The Secret Cow Level': '通往秘密牛牛關的傳送門',
  'Portal to Colossal Summit': '通往巨神峰頂的傳送門',
  'Portal to Tristram (Pandemonium Finale)': '通往特里斯特姆的傳送門（萬魔終局）',
  'Add 1 Socket to Rare Item': '為稀有物品增加 1 個插槽',
  'Clear Sockets on Item': '清除物品上的插槽',
};

// items.json spells the dagger-class weapon "Kriss"; cubemain.json's recipe
// text spells it "Kris" — a real name mismatch between two vendor files, not
// a translation gap, so it's aliased here rather than added as a translated
// override (keeps it flowing through the same code-lookup path as everything else).
const RECIPE_PHRASE_ALIASES = { Kris: 'Kriss' };

function localizedRecipePhrase(rawPhrase) {
  const phrase = rawPhrase.trim();
  if (!phrase) return phrase;

  // Split off a leading quantity number (kept as-is — digits are locale-neutral).
  const qtyMatch = phrase.match(/^(\d+)\s+(.+)$/);
  const qtyPrefix = qtyMatch ? `${qtyMatch[1]} ` : '';
  let rest = qtyMatch ? qtyMatch[2] : phrase;

  // Split off a trailing "(Any)" / "(1 of each type)" qualifier and
  // translate it once, up front, so every branch below picks it up uniformly.
  const qualMatch = rest.match(/^(.+?)\s*(\((?:Any|1 of each type)\))$/);
  const rawQualifier = qualMatch ? qualMatch[2] : '';
  const qualifier = CUBE_RECIPE_WORD_OVERRIDES[rawQualifier] ?? rawQualifier;
  if (qualMatch) rest = qualMatch[1].trim();

  rest = RECIPE_PHRASE_ALIASES[rest] ?? rest;

  // A rune name, singular or plural ("El Rune" / "El Runes").
  const runeMatch = rest.match(/^(\w+) Runes?$/);
  if (runeMatch && RUNE_CODE_BY_NAME[runeMatch[1]]) {
    const runeZh = localizedRuneName(runeMatch[1])['zh-TW'];
    return qtyPrefix + runeZh + '符文' + qualifier;
  }

  // A specific gem/skull name, singular or plural, with a quality-tier prefix
  // ("Chipped Topaz" / "Chipped Topazes", "Perfect Skull" / "Perfect Skulls").
  // The mid tier has NO prefix in gems.json itself (it's just "Emerald", not
  // "Standard Emerald" — "Standard" is a word this recipe text adds), so that
  // tier looks up the bare color/type word instead.
  const gemMatch = rest.match(/^(Chipped|Flawed|Flawless|Perfect|Standard) (\w+)$/);
  if (gemMatch) {
    const [, tier, base] = gemMatch;
    // Plural forms: Rubies/Topazes/Sapphires/Amethysts/Diamonds/Skulls/Emeralds.
    const singularBases = [base, base.replace(/ies$/, 'y'), base.replace(/([sz])es$/, '$1'), base.replace(/s$/, '')];
    for (const base2 of singularBases) {
      const lookupName = tier === 'Standard' ? base2 : `${tier} ${base2}`;
      if (GEM_NAME_TO_CODE[lookupName]) return qtyPrefix + localizedGemName(lookupName)['zh-TW'] + qualifier;
    }
  }
  // "Standard/Chipped/... Gem" generic (no specific type) — not itself a gem
  // code, so build it from the tier-prefix override + the generic gem word.
  const genericGemMatch = rest.match(/^(Chipped|Flawed|Flawless|Perfect|Standard) Gems?$/);
  if (genericGemMatch) {
    return qtyPrefix + (CUBE_RECIPE_WORD_OVERRIDES[genericGemMatch[1]] ?? '') + '寶石' + qualifier;
  }

  // Exact literal match (quest items, named uniques, potions — anything with
  // a single real items.json entry), trying the plural-stripped form too.
  // A raw chi[rest] lookup is only trusted for 2+-word phrases — a single
  // English word risks matching an unrelated grammatical fragment elsewhere
  // in chi[]'s string dump (see the categoryPart guard below for a concrete
  // example: "Rift" alone resolves to an unrelated fragment, not the item
  // "Flame Rift"). GENERAL_ITEM_NAME_TO_CODE is matched against real,
  // complete item names regardless of word count, so it's not restricted.
  for (const candidate of [rest, rest.replace(/s$/, '')]) {
    if (candidate.includes(' ') && chi[candidate]) return qtyPrefix + chi[candidate] + qualifier;
    const code = GENERAL_ITEM_NAME_TO_CODE[candidate];
    if (code && chi[code]) return qtyPrefix + chi[code] + qualifier;
  }

  // Manual override, whole phrase.
  if (CUBE_RECIPE_WORD_OVERRIDES[rest]) return qtyPrefix + CUBE_RECIPE_WORD_OVERRIDES[rest] + qualifier;

  // Greedily consumes a word list left-to-right against a dictionary,
  // preferring the longest matching chunk at each position (so "Low
  // Quality" matches as one 2-word override, not "Low" + "Quality"
  // separately). Returns null if any word can't be resolved at all.
  function greedyTranslateWords(words, dict) {
    let i = 0;
    let out = '';
    while (i < words.length) {
      let matched = false;
      for (let len = Math.min(4, words.length - i); len >= 1; len--) {
        const chunk = words.slice(i, i + len).join(' ');
        if (dict[chunk] !== undefined) {
          out += dict[chunk];
          i += len;
          matched = true;
          break;
        }
      }
      if (!matched) return null;
    }
    return out;
  }

  // "<Quality word(s)> <Category word(s)>", e.g. "Exceptional Rare Armor",
  // "Normal Torso Armor", "Fully Repaired and Recharged Weapon", "High
  // Quality Rare Item". The category tail is tried as a full multi-word
  // item-database lookup first (so "Grand Charm" resolves to its own real
  // chi[] translation "超大型護身符", not just the generic "Charm" word).
  // Tries the widest possible category tail first (so "Grand Charm" is
  // checked as one unit — and wins its own specific chi[] translation —
  // before ever falling back to the single generic word "Charm").
  const words = rest.split(' ');
  let bestCategoryMatch = null; // widest resolvable category tail found so far
  for (let splitAt = 1; splitAt <= words.length - 1; splitAt++) {
    const qualityWords = words.slice(0, splitAt);
    const categoryPart = words.slice(splitAt).join(' ');
    // chi[] is a raw dump of every game string, including short fragments
    // used to build OTHER sentences elsewhere ("Rift" alone resolves to an
    // unrelated "X-of-" grammatical fragment, not the item "Flame Rift") —
    // a single English word matching it is a real false-positive risk, so
    // only trust a raw chi[]/item-code lookup here for 2+-word phrases
    // (specific enough to be an actual compound item name) and require a
    // single trailing word to come from the hand-vetted override table.
    let categoryZh;
    if (categoryPart.includes(' ')) {
      categoryZh = chi[categoryPart];
      if (categoryZh === undefined) {
        const code = GENERAL_ITEM_NAME_TO_CODE[categoryPart];
        if (code && chi[code]) categoryZh = chi[code];
      }
    }
    categoryZh ??= CUBE_RECIPE_WORD_OVERRIDES[categoryPart]
      ?? (categoryPart.endsWith('s') ? CUBE_RECIPE_WORD_OVERRIDES[categoryPart.slice(0, -1)] : undefined);
    if (categoryZh === undefined) continue;
    bestCategoryMatch ??= { qualityWords, categoryZh }; // first hit = widest, since splitAt grows
    const qualityZh = greedyTranslateWords(qualityWords, CUBE_RECIPE_WORD_OVERRIDES);
    if (qualityZh !== null) return qtyPrefix + qualityZh + categoryZh + qualifier;
  }

  // No quality-word translation covered the full prefix (e.g. "Breaching",
  // "Gelid" — modern charm-affix prefixes with no chi[] entry to verify
  // against, left in English rather than guessed) — fall back to the widest
  // category phrase that DID resolve, keeping its untranslated quality
  // words as literal English rather than losing the specific match
  // entirely (e.g. "Breaching Grand Charm" -> "Breaching 超大型護身符").
  if (bestCategoryMatch) {
    return qtyPrefix + bestCategoryMatch.qualityWords.join(' ') + ' ' + bestCategoryMatch.categoryZh + qualifier;
  }

  return qtyPrefix + rest + (rawQualifier ? ` ${rawQualifier}` : ''); // Unresolved — keep original English.
}

function localizedRecipeDescription(rawDescription) {
  const [inputsPart, outputPart] = rawDescription.split(/\s*->\s*/);
  const zhInputs = inputsPart.split(/\s*\+\s*/).map(localizedRecipePhrase).join(' + ');
  const zhOutput = outputPart !== undefined ? localizedRecipePhrase(outputPart) : undefined;
  const zhTw = zhOutput !== undefined ? `${zhInputs} -> ${zhOutput}` : zhInputs;
  return { en: rawDescription, 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
}

const cubeRecipesOut = Object.entries(cubeMainData)
  .filter(([id, v]) => (v.enabled === 1 || RECIPE_CATEGORY[id] === 'craftedGrandCharm') && !CRAFT_RECIPE_IDS.has(Number(id)))
  .map(([id, v]) => {
    const ingredientIcons = [];
    for (let n = 1; n <= 7; n++) {
      const icon = resolveIconFor(v[`input ${n}`]);
      if (icon && !ingredientIcons.includes(icon)) ingredientIcons.push(icon);
    }
    return {
      id: `recipe-${id}`,
      description: localizedRecipeDescription(v.description),
      category: RECIPE_CATEGORY[id] ?? (() => { throw new Error(`Unclassified cube recipe id ${id}: "${v.description}"`); })(),
      ingredientIcons,
      outputIcon: resolveIconFor(v.output),
    };
  });

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

// Crafted item output names (e.g. "Hit Power Helm") are synthetic labels this
// script builds from the cube recipe's family + base type, not literal game
// strings, so chi[] never has them. Verified against d2r.world's zh-TW crafted
// items page this session (each card shows the Chinese name with the English
// name in parentheses as a subtitle, e.g. "重擊系手工護身符 (Hit Power Amulet)");
// d2r.world calls the armor slot "Body Armor" where this project's own name
// just says "Body" (same item, matched by family + slot, not a different key).
const CRAFTED_ITEM_NAME_OVERRIDES = {
  'Blood Amulet': '血腥系手工護身符', 'Blood Belt': '血腥系手工腰帶', 'Blood Body': '血腥系手工護甲',
  'Blood Boots': '血腥系手工鞋子', 'Blood Gloves': '血腥系手工手套', 'Blood Helm': '血腥系手工頭盔',
  'Blood Ring': '血腥系手工戒指', 'Blood Shield': '血腥系手工盾牌', 'Blood Weapon': '血腥系手工武器',
  'Caster Amulet': '施法系手工護身符', 'Caster Belt': '施法系手工腰帶', 'Caster Body': '施法系手工護甲',
  'Caster Boots': '施法系手工鞋子', 'Caster Gloves': '施法系手工手套', 'Caster Helm': '施法系手工頭盔',
  'Caster Ring': '施法系手工戒指', 'Caster Shield': '施法系手工盾牌', 'Caster Weapon': '施法系手工武器',
  'Hit Power Amulet': '重擊系手工護身符', 'Hit Power Belt': '重擊系手工腰帶', 'Hit Power Body': '重擊系手工護甲',
  'Hit Power Boots': '重擊系手工鞋子', 'Hit Power Gloves': '重擊系手工手套', 'Hit Power Helm': '重擊系手工頭盔',
  'Hit Power Ring': '重擊系手工戒指', 'Hit Power Shield': '重擊系手工盾牌', 'Hit Power Weapon': '重擊系手工武器',
  'Safety Amulet': '防護系手工護身符', 'Safety Belt': '防護系手工腰帶', 'Safety Body': '防護系手工護甲',
  'Safety Boots': '防護系手工鞋子', 'Safety Gloves': '防護系手工手套', 'Safety Helm': '防護系手工頭盔',
  'Safety Ring': '防護系手工戒指', 'Safety Shield': '防護系手工盾牌', 'Safety Weapon': '防護系手工武器',
};
function localizedCraftedItemName(englishName) {
  const zhTw = CRAFTED_ITEM_NAME_OVERRIDES[englishName] ?? chi[englishName] ?? englishName;
  return { en: englishName, 'zh-TW': zhTw, 'zh-CN': toZhCn(zhTw) };
}

const craftedItemsOut = Object.entries(cubeMainData)
  .filter(([id]) => CRAFT_RECIPE_IDS.has(Number(id)))
  .map(([id, v]) => {
    const { variable, fixed } = extractCraftModProps(v, 3);
    // The craft recipe description is "<Magic Item Input> + 1 Jewel + <Rune> + <Gem> -> <Output Name>".
    // Split on " -> " for the output name, and on " + " for the input list.
    const [inputsPart, outputName] = v.description.split(' -> ');
    const inputParts = inputsPart.split(' + ').map(p => p.replace(/^\d+\s*/, ''));
    const rawInputs = [];
    for (let n = 1; n <= 7; n++) {
      if (v[`input ${n}`] === undefined) break;
      rawInputs.push(v[`input ${n}`]);
    }
    return {
      id: `craft-${id}`,
      name: localizedCraftedItemName(outputName),
      family: CRAFT_FAMILY_BY_ID[id],
      magicItemInput: localizedItemName(inputParts[0]),
      magicItemInputIcon: resolveIconFor(rawInputs[0]),
      additionalInputs: inputParts.slice(1).map(localizedItemName),
      additionalInputIcons: rawInputs.slice(1).map(resolveIconFor),
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
      if (min === max) fixed.push({ key, label, value: min, isSkillRef });
      else variable.push({ key, label, min, max, isSkillRef });
      continue;
    }
    // Some mods (e.g. "sock" on Artificer's/Jeweler's, "ac/lvl" on Miocene)
    // carry only a `mod{n}param` field instead of min/max — same par-only
    // shape extractProps already handles for uniqueitems.json/setitems.json.
    // Without this fallback these affixes silently end up with zero stats.
    if (par !== undefined) {
      fixed.push({ key, label, value: par, isSkillRef });
      continue;
    }
    // "of Ages" (suffix 404, mod1code "indestruct") has no min/max/param at
    // all — a bare boolean flag prop, unlike uniqueitems.json's indestruct
    // entries which always carry min1===max1===1. Surface it the same way
    // (value: 1) rather than silently dropping the affix's only stat.
    fixed.push({ key, label, value: 1, isSkillRef });
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
        stats: [...variable, ...fixed.map(f => ({ key: f.key, label: f.label, min: f.value, max: f.value, isSkillRef: f.isSkillRef }))],
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
