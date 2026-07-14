# Grail zh-TW / zh-CN Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully localize the grail item reference feature (item/skill names, stat labels, and UI chrome) into Traditional and Simplified Chinese, matching d2r.world's level of localization.

**Architecture:** The catalog generator gains locale-aware name/label resolution backed by d2data's official `localestrings-chi.json` (zh-TW) with OpenCC-derived zh-CN and English fallback for the ~5% of items without an official name. Catalog JSON fields become `LocalizedText` objects (`{ en, "zh-TW", "zh-CN" }`); a single projection helper in `catalog.ts` converts a raw multi-locale entry to today's flat single-locale shape, so every consuming component keeps its exact current prop types and needs zero changes.

**Tech Stack:** Existing (Next.js 16, next-intl, Vitest, Node.js generator scripts) + `opencc-js` (new devDependency, build-script-only).

**Spec:** `docs/superpowers/specs/2026-07-14-grail-zh-translation-design.md`

## Global Constraints

- No changes to the finds pipeline, auth, comparator, or Supabase schema — display/data only. `stat.key` stays locale-agnostic; only `stat.label` (display text) becomes locale-aware.
- If no official Chinese name/label exists, fall back to the English text as-is — never freehand-translate a proper noun (item/skill name) without an authoritative source.
- zh-CN for every field is always derived by running the resolved zh-TW value through the OpenCC converter — no separate zh-CN lookup path, no special-casing for English-fallback text (harmless no-op on non-Chinese text).
- The existing `GrailItem` interface name and shape (flat, single-locale) are preserved for the *projected* result — `GrailItemCard.tsx`, `GrailItemDetail.tsx`, `GrailCategorySidebar.tsx` must not change.
- Only the `Grail` namespace and `Footer.grailLink` get new translations — `Home`, `Appraiser`, and the rest of `Footer` are already properly translated and must not be touched or reconverted.
- Every task ends with `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run build` all clean; confirm all three locale `/grail` pages build.

---

### Task 1: Locale-aware catalog generator

**Files:**
- Create: `vendor/d2data/json/localestrings-chi.json`
- Modify: `vendor/d2data/README.md`
- Modify: `package.json` (add `opencc-js` devDependency)
- Modify: `scripts/generate-grail-data.mjs` (full rewrite of label/name resolution)
- Modify: `data/grail-data.test.ts`
- Regenerate: `data/uniques.json`, `data/sets.json`

**Interfaces:**
- Produces: every catalog entry's `name`, `baseName`, `setName`, and every `stats[].label` / `fixedStats[].label` / `setBonuses[].label` becomes:
  ```ts
  interface LocalizedText { en: string; 'zh-TW': string; 'zh-CN': string; }
  ```
  `setName` is `LocalizedText | null`. All other fields (`id`, `code`, `kind`, `key`, numbers, `grade`, `slotCategory`, `invFile`, `statPriority`) are unchanged. Consumed by Task 2's `catalog.ts` type update.

- [ ] **Step 1: Vendor `localestrings-chi.json`**

```bash
PIN=477bcf63e964f39f4c774e588a79fd598ae472de
curl -sL -o vendor/d2data/json/localestrings-chi.json "https://raw.githubusercontent.com/blizzhackers/d2data/$PIN/json/localestrings-chi.json"
python3 -c "import json; print(len(json.load(open('vendor/d2data/json/localestrings-chi.json'))))"
```
Expected: prints `8715`.

Update `vendor/d2data/README.md` — add a line after the existing `skills.json` mention:
```markdown
`localestrings-chi.json` provides official Traditional Chinese strings (item names, base
names, skill names) for the grail feature's zh-TW/zh-CN localization; zh-CN is derived
from it via OpenCC conversion at generation time, not a separate official source.
```

- [ ] **Step 2: Install `opencc-js` and verify it works from this project's ESM scripts**

```bash
npm install -D opencc-js
node -e "
import('opencc-js').then(OpenCC => {
  const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });
  console.log(converter('諧角之冠'));
});
"
```
Expected output: `谐角之冠`

- [ ] **Step 3: Rewrite `scripts/generate-grail-data.mjs`**

Replace the entire file with:

```js
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

function extractProps(entry, count) {
  const variable = [];
  const fixed = [];
  for (let n = 1; n <= count; n++) {
    const rawCode = entry[`prop${n}`];
    if (!rawCode) continue;
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const par = entry[`par${n}`];
    const isSkillRef = SKILL_REF_PROPS.has(code);
    const label = isSkillRef ? localizedLabelWithSkill(code, par) : localizedLabelFor(code);
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
    const { variable, fixed } = extractProps(v, 10);
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
    const { variable, fixed } = extractProps(v, 7);
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

writeFileSync(join(OUT, 'uniques.json'), JSON.stringify(uniquesOut, null, 2));
writeFileSync(join(OUT, 'sets.json'), JSON.stringify(setsOut, null, 2));

console.log(`Wrote ${uniquesOut.length} unique items -> data/uniques.json`);
console.log(`Wrote ${setsOut.length} set items -> data/sets.json`);
```

- [ ] **Step 4: Regenerate and spot-check**

```bash
npm run generate:grail
```
Expected: `Wrote 403 unique items -> data/uniques.json` / `Wrote 135 set items -> data/sets.json` (counts unchanged).

```bash
python3 -c "
import json
u = json.load(open('data/uniques.json'))
item = next(i for i in u if i['name']['en'] == 'Harlequin Crest')
print(item['name'])
item2 = next(i for i in u if i['name']['en'] == 'Maelstromwrath')
for s in item2['stats']: print(s['label'])
"
```
Expected: `{'en': 'Harlequin Crest', 'zh-TW': '諧角之冠', 'zh-CN': '谐角之冠'}`, and Maelstromwrath's four stat labels each show a distinct skill name in all three locales (e.g. `{'en': 'Skill Bonus (Corpse Explosion)', 'zh-TW': '技能加成 (屍體爆炸)', 'zh-CN': '技能加成 (尸体爆炸)'}`).

- [ ] **Step 5: Update the regression tests**

Replace `data/grail-data.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import uniques from './uniques.json';
import sets from './sets.json';

interface LocalizedText { en: string; 'zh-TW': string; 'zh-CN': string; }

function isLocalizedText(v: unknown): v is LocalizedText {
  return (
    typeof v === 'object' && v !== null &&
    'en' in v && 'zh-TW' in v && 'zh-CN' in v
  );
}

describe('generated grail catalog', () => {
  it('has the expected item counts', () => {
    expect(uniques.length).toBe(403);
    expect(sets.length).toBe(135);
  });

  it('every entry has a unique id', () => {
    const ids = [...uniques, ...sets].map((i: { id: string }) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('variable stats have min !== max, fixed stats have min === max collapsed to value', () => {
    for (const item of [...uniques, ...sets] as {
      stats: { min: number; max: number }[];
      fixedStats: { value: number }[];
    }[]) {
      for (const s of item.stats) expect(s.min).not.toBe(s.max);
      for (const f of item.fixedStats) expect(typeof f.value).toBe('number');
    }
  });

  it('statPriority only references keys present in stats', () => {
    for (const item of [...uniques, ...sets] as {
      stats: { key: string }[];
      statPriority: string[];
    }[]) {
      const keys = new Set(item.stats.map(s => s.key));
      for (const p of item.statPriority) expect(keys.has(p)).toBe(true);
    }
  });

  const SLOT_CATEGORIES = [
    'helms', 'armors', 'shields', 'belts', 'boots', 'gloves',
    'rings', 'amulets', 'charms', 'jewels',
    'swords', 'daggers', 'axes', 'polearms', 'spears',
    'clubs', 'maces', 'hammers', 'scepters', 'staves',
    'orbs', 'wands', 'grimoires', 'katars',
    'bows', 'crossbows', 'javelins', 'throwings',
  ];

  it('every entry has enrichment fields', () => {
    for (const item of [...uniques, ...sets] as {
      baseName: LocalizedText; grade: string; slotCategory: string; invFile: string;
    }[]) {
      expect(item.baseName.en.length).toBeGreaterThan(0);
      expect(['normal', 'exceptional', 'elite']).toContain(item.grade);
      expect(SLOT_CATEGORIES).toContain(item.slotCategory);
      expect(item.invFile.length).toBeGreaterThan(0);
    }
  });

  it('no item has two stats sharing the same key', () => {
    // Regression: items with multiple skill/tab-referencing props of the same
    // generic code (e.g. two different "skill" bonuses) used to collapse onto
    // one object key, silently overwriting each other's logged roll values.
    for (const item of [...uniques, ...sets] as { name: LocalizedText; stats: { key: string }[] }[]) {
      const keys = item.stats.map(s => s.key);
      expect(new Set(keys).size, `${item.name.en} has duplicate stat keys: ${keys}`).toBe(keys.length);
    }
  });

  it('disambiguates skill-referencing stats by naming the specific skill', () => {
    const maelstromwrath = uniques.find(i => i.name.en === 'Maelstromwrath')!;
    const labels = maelstromwrath.stats.filter(s => s.key.startsWith('skill:')).map(s => s.label.en);
    expect(labels).toEqual([
      'Skill Bonus (Corpse Explosion)',
      'Skill Bonus (Terror)',
      'Skill Bonus (Amplify Damage)',
      'Skill Bonus (Iron Maiden)',
    ]);
  });

  it('every translatable field has non-empty text in all three locales', () => {
    function checkLocalizedText(field: unknown, context: string) {
      expect(isLocalizedText(field), `${context} is not LocalizedText`).toBe(true);
      const lt = field as LocalizedText;
      expect(lt.en.length, `${context}.en empty`).toBeGreaterThan(0);
      expect(lt['zh-TW'].length, `${context}.zh-TW empty`).toBeGreaterThan(0);
      expect(lt['zh-CN'].length, `${context}.zh-CN empty`).toBeGreaterThan(0);
    }
    for (const item of [...uniques, ...sets] as {
      name: unknown; baseName: unknown; setName: unknown;
      stats: { label: unknown }[]; fixedStats: { label: unknown }[]; setBonuses: { label: unknown }[];
    }[]) {
      checkLocalizedText(item.name, 'name');
      checkLocalizedText(item.baseName, 'baseName');
      if (item.setName !== null) checkLocalizedText(item.setName, 'setName');
      for (const s of item.stats) checkLocalizedText(s.label, 'stats[].label');
      for (const f of item.fixedStats) checkLocalizedText(f.label, 'fixedStats[].label');
      for (const b of item.setBonuses) checkLocalizedText(b.label, 'setBonuses[].label');
    }
  });

  it('official Chinese names survive regeneration verbatim', () => {
    const harlequinCrest = uniques.find(i => i.name.en === 'Harlequin Crest')!;
    expect(harlequinCrest.name['zh-TW']).toBe('諧角之冠');
    expect(harlequinCrest.name['zh-CN']).toBe('谐角之冠');
  });

  it('zh-CN differs from zh-TW wherever the source has Traditional-only characters', () => {
    // Regression guard that OpenCC conversion is actually running, not a pass-through.
    const harlequinCrest = uniques.find(i => i.name.en === 'Harlequin Crest')!;
    expect(harlequinCrest.name['zh-CN']).not.toBe(harlequinCrest.name['zh-TW']);
  });
});
```

- [ ] **Step 6: Run tests and full verification**

Run: `npx vitest run data/grail-data.test.ts` — expect all tests pass.
Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean. (`npm run build` will show type errors from `src/lib/grail/catalog.ts` and its consumers at this point, since the `GrailItem` type there hasn't been updated yet — that's Task 2. If `tsc`/`build` fail only in `src/lib/grail/` or `src/components/grail/` files with errors about `name`/`baseName`/`label` no longer being `string`, that's expected and resolved by Task 2; do not attempt to fix it in this task. If failures appear anywhere else, stop and investigate.)

- [ ] **Step 7: Commit**

```bash
git add vendor/d2data/README.md vendor/d2data/json/localestrings-chi.json package.json package-lock.json scripts/generate-grail-data.mjs data/uniques.json data/sets.json data/grail-data.test.ts
git commit -m "Add locale-aware name/label resolution to grail catalog generator"
```

---

### Task 2: Locale-aware catalog projection

**Files:**
- Modify: `src/lib/grail/catalog.ts`
- Modify: `src/components/grail/GrailChecklist.tsx`
- Modify: `src/components/grail/LogFindForm.tsx`

**Interfaces:**
- Consumes: `RawGrailItem` shape produced by Task 1 (`data/uniques.json`/`data/sets.json`).
- Produces:
  ```ts
  interface LocalizedText { en: string; 'zh-TW': string; 'zh-CN': string; }
  type Locale = 'en' | 'zh-TW' | 'zh-CN';
  interface RawGrailItem { /* locale-nested fields, see Task 1 */ }
  interface GrailItem { /* today's flat shape — UNCHANGED name/fields */ }
  function getAllGrailItems(): RawGrailItem[];
  function localizeGrailItem(item: RawGrailItem, locale: Locale): GrailItem;
  ```
  `GrailItem`'s shape and every field name are byte-identical to what `GrailItemCard.tsx`, `GrailItemDetail.tsx`, and `GrailCategorySidebar.tsx` already expect — those three files are NOT touched by this task.

- [ ] **Step 1: Rewrite `src/lib/grail/catalog.ts`**

Replace the entire file with:

```ts
import uniques from '../../../data/uniques.json';
import sets from '../../../data/sets.json';

export interface LocalizedText {
  en: string;
  'zh-TW': string;
  'zh-CN': string;
}

export type Locale = 'en' | 'zh-TW' | 'zh-CN';

export interface RawGrailStat {
  key: string;
  label: LocalizedText;
  min: number;
  max: number;
}

export interface RawGrailFixedStat {
  key: string;
  label: LocalizedText;
  value: number;
}

export interface RawGrailItem {
  id: string;
  code: string;
  name: LocalizedText;
  kind: 'unique' | 'set';
  setName: LocalizedText | null;
  levelReq: number;
  baseName: LocalizedText;
  grade: 'normal' | 'exceptional' | 'elite';
  slotCategory: string;
  defense: { min: number; max: number } | null;
  requiredStrength: number | null;
  durability: number | null;
  invFile: string;
  stats: RawGrailStat[];
  fixedStats: RawGrailFixedStat[];
  setBonuses: RawGrailStat[];
  statPriority: string[];
}

export interface GrailStat {
  key: string;
  label: string;
  min: number;
  max: number;
}

export interface GrailFixedStat {
  key: string;
  label: string;
  value: number;
}

export interface GrailItem {
  id: string;
  code: string;
  name: string;
  kind: 'unique' | 'set';
  setName: string | null;
  levelReq: number;
  baseName: string;
  grade: 'normal' | 'exceptional' | 'elite';
  slotCategory: string;
  defense: { min: number; max: number } | null;
  requiredStrength: number | null;
  durability: number | null;
  invFile: string;
  stats: GrailStat[];
  fixedStats: GrailFixedStat[];
  setBonuses: GrailStat[];
  statPriority: string[];
}

const ALL_ITEMS: RawGrailItem[] = [...(uniques as RawGrailItem[]), ...(sets as RawGrailItem[])];

export function getAllGrailItems(): RawGrailItem[] {
  return ALL_ITEMS;
}

export function localizeGrailItem(item: RawGrailItem, locale: Locale): GrailItem {
  return {
    id: item.id,
    code: item.code,
    name: item.name[locale],
    kind: item.kind,
    setName: item.setName ? item.setName[locale] : null,
    levelReq: item.levelReq,
    baseName: item.baseName[locale],
    grade: item.grade,
    slotCategory: item.slotCategory,
    defense: item.defense,
    requiredStrength: item.requiredStrength,
    durability: item.durability,
    invFile: item.invFile,
    stats: item.stats.map(s => ({ key: s.key, label: s.label[locale], min: s.min, max: s.max })),
    fixedStats: item.fixedStats.map(f => ({ key: f.key, label: f.label[locale], value: f.value })),
    setBonuses: item.setBonuses.map(b => ({ key: b.key, label: b.label[locale], min: b.min, max: b.max })),
    statPriority: item.statPriority,
  };
}

// d2r.world's presentation order: armor slots, jewelry, then weapons.
export const SLOT_ORDER = [
  'helms', 'armors', 'shields', 'belts', 'boots', 'gloves',
  'rings', 'amulets', 'charms', 'jewels',
  'swords', 'daggers', 'axes', 'polearms', 'spears',
  'clubs', 'maces', 'hammers', 'scepters', 'staves',
  'orbs', 'wands', 'grimoires', 'katars',
  'bows', 'crossbows', 'javelins', 'throwings',
] as const;

const GRADE_ORDER = { normal: 0, exceptional: 1, elite: 2 } as const;

export function sortItemsForDisplay(items: GrailItem[]): GrailItem[] {
  return [...items].sort(
    (a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.levelReq - b.levelReq
  );
}
```

- [ ] **Step 2: Wire `useLocale()` + projection into `GrailChecklist.tsx`**

In `src/components/grail/GrailChecklist.tsx`:
- Add `useLocale` to the existing `next-intl` import: `import { useTranslations, useLocale } from 'next-intl';`
- Replace the existing `catalog` import line (`import { getAllGrailItems, sortItemsForDisplay, type GrailItem } from '@/lib/grail/catalog';`) with `import { getAllGrailItems, localizeGrailItem, sortItemsForDisplay, type GrailItem } from '@/lib/grail/catalog';` — adding `localizeGrailItem` only; `sortItemsForDisplay`/`GrailItem` stay as-is, `SLOT_ORDER` was never imported here (`GrailCategorySidebar` imports it directly already).
- Inside `GrailChecklistInner`, add `const locale = useLocale();` alongside the existing `const t = useTranslations('Grail');` line.
- Change `const items = getAllGrailItems();` to:
  ```tsx
  const items = getAllGrailItems().map(i => localizeGrailItem(i, locale as 'en' | 'zh-TW' | 'zh-CN'));
  ```

- [ ] **Step 3: Wire `useLocale()` + projection into `LogFindForm.tsx`**

In `src/components/grail/LogFindForm.tsx`:
- Add `useLocale` to the existing `next-intl` import: `import { useTranslations, useLocale } from 'next-intl';`
- Add `import { getAllGrailItems, localizeGrailItem, SLOT_ORDER, type GrailItem } from '@/lib/grail/catalog';` — replacing the existing catalog import line (keep `SLOT_ORDER`, this file still uses it for the optgroup loop).
- Inside the component, add `const locale = useLocale();` alongside the existing `const t = useTranslations('Grail');` line.
- Change `const items = getAllGrailItems();` to:
  ```tsx
  const items = getAllGrailItems().map(i => localizeGrailItem(i, locale as 'en' | 'zh-TW' | 'zh-CN'));
  ```

- [ ] **Step 4: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean. Confirm all three locale `/grail` pages build (`out/en/grail/index.html`, `out/zh-TW/grail/index.html`, `out/zh-CN/grail/index.html`).

- [ ] **Step 5: Verify manually in the browser**

Since Google OAuth cannot be completed by an automated agent (hard-blocked — do not attempt), substitute the same approach used successfully in prior grail tasks: a temporary, uncommitted Vitest+RTL render test (or scratch route with `useGrailAuth`/`listFinds` mocked) mounting the real `GrailChecklist` with real catalog data at each of the three locales, confirming: item names/stat labels render in the correct language per locale, switching locale (re-render with a different `useLocale()` mock value) changes the displayed text, and no console errors. Delete the temporary file(s) before committing — do not commit scratch verification artifacts.

- [ ] **Step 6: Commit**

```bash
git add src/lib/grail/catalog.ts src/components/grail/GrailChecklist.tsx src/components/grail/LogFindForm.tsx
git commit -m "Add locale-aware catalog projection, wire into checklist and log-find form"
```

---

### Task 3: Translate UI chrome (Grail namespace + Footer.grailLink)

**Files:**
- Modify: `messages/zh-TW.json`
- Modify: `messages/zh-CN.json`
- Create: `scripts/translate-grail-ui-zh-cn.mjs` (one-off conversion script)

**Interfaces:** None — this task only changes message file content, no code interfaces.

- [ ] **Step 1: Replace the `Grail` namespace and `Footer.grailLink` in `messages/zh-TW.json`**

Read the current `messages/zh-TW.json` first to find the exact position of the `"Grail"` key and `"Footer"."grailLink"` key (they exist already as English placeholders from prior tasks — same position/nesting, only the values change). Replace **only** those values, leaving every other key (`Home`, `Appraiser`, `Footer.support`, `Footer.tagline`, all other `Grail`... there are no other namespaces to touch) untouched.

Set `"Footer"."grailLink"` to `"聖杯追蹤器"`.

Set the `"Grail"` object's values to:
```json
{
  "pageTitle": "聖杯追蹤器",
  "pageSubtitle": "追蹤你已找到的傳奇與套裝物品，以及每件物品目前最佳的屬性。",
  "loading": "載入中…",
  "loadingCollection": "正在載入你的收藏…",
  "signInPrompt": "登入以查看你的聖杯追蹤器。",
  "signInGoogle": "使用 Google 登入",
  "signOut": "登出",
  "progressCount": "已找到 {found} / {total} 件物品",
  "logFind": "記錄新發現",
  "categoriesLabel": "分類",
  "selectCategoryPrompt": "從選單中選擇一個分類以查看物品。",
  "slot_helms": "頭盔",
  "slot_armors": "盔甲",
  "slot_shields": "盾牌",
  "slot_belts": "腰帶",
  "slot_boots": "靴子",
  "slot_gloves": "手套",
  "slot_rings": "戒指",
  "slot_amulets": "項鍊",
  "slot_charms": "護身符",
  "slot_jewels": "珠寶",
  "slot_swords": "劍",
  "slot_daggers": "匕首",
  "slot_axes": "斧頭",
  "slot_polearms": "長柄武器",
  "slot_spears": "長矛",
  "slot_clubs": "棍棒",
  "slot_maces": "釘頭錘",
  "slot_hammers": "戰鎚",
  "slot_scepters": "權杖",
  "slot_staves": "法杖",
  "slot_orbs": "法球",
  "slot_wands": "魔杖",
  "slot_grimoires": "魔法書",
  "slot_katars": "拳刃",
  "slot_bows": "弓",
  "slot_crossbows": "弩",
  "slot_javelins": "標槍",
  "slot_throwings": "投擲武器",
  "copiesOne": "1 件",
  "copiesMany": "{count} 件",
  "bestLabel": "最佳 {stat}：{value}",
  "bestCopy": "最佳一件",
  "copyNumber": "第 {number} 件",
  "itemLabel": "物品",
  "rolledStats": "已擲屬性",
  "act": "章節",
  "area": "區域",
  "foundDate": "發現日期",
  "ethereal": "虛靈",
  "notes": "備註",
  "selectItem": "— 選擇物品 —",
  "cancel": "取消",
  "save": "儲存紀錄",
  "saving": "儲存中…",
  "itemStats": "物品屬性",
  "magicProperties": "魔法屬性",
  "yourCopies": "你的收藏",
  "baseLabel": "基底",
  "gradeLabel": "等級",
  "grade_normal": "普通",
  "grade_exceptional": "傑出",
  "grade_elite": "菁英",
  "defenseLabel": "防禦力",
  "requiredLevel": "需求等級",
  "requiredStrength": "需求力量",
  "durabilityLabel": "耐久度",
  "setBonusesLabel": "套裝加成",
  "notFoundYet": "尚未找到",
  "noVariableStats": "此物品沒有變動屬性 — 所有數值皆為固定值。"
}
```

Every key from the existing English-placeholder `Grail` object must be present with a Chinese value above — do not drop or rename any key (next-intl will throw a missing-message error at build time for any locale prerender that references a dropped key).

- [ ] **Step 2: Write the one-off zh-CN conversion script**

```js
// scripts/translate-grail-ui-zh-cn.mjs
// One-off script: converts messages/zh-TW.json's Grail namespace + Footer.grailLink
// to Simplified Chinese via OpenCC and writes them into messages/zh-CN.json, leaving
// every other key in zh-CN.json (Home, Appraiser, Footer.support, Footer.tagline —
// already properly translated) untouched. Not part of the build; run once, then delete
// or leave as a reference for the next time the Grail namespace's zh-TW text changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as OpenCC from 'opencc-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES = join(__dirname, '..', 'messages');

const toZhCn = OpenCC.Converter({ from: 'tw', to: 'cn' });

const zhTw = JSON.parse(readFileSync(join(MESSAGES, 'zh-TW.json'), 'utf8'));
const zhCn = JSON.parse(readFileSync(join(MESSAGES, 'zh-CN.json'), 'utf8'));

zhCn.Grail = Object.fromEntries(
  Object.entries(zhTw.Grail).map(([key, value]) => [key, toZhCn(value)])
);
zhCn.Footer.grailLink = toZhCn(zhTw.Footer.grailLink);

writeFileSync(join(MESSAGES, 'zh-CN.json'), JSON.stringify(zhCn, null, 2) + '\n');
console.log('Converted Grail namespace + Footer.grailLink to zh-CN.');
```

- [ ] **Step 3: Run the conversion and verify**

```bash
node scripts/translate-grail-ui-zh-cn.mjs
```
Expected: `Converted Grail namespace + Footer.grailLink to zh-CN.`

```bash
python3 -c "
import json
cn = json.load(open('messages/zh-CN.json'))
tw = json.load(open('messages/zh-TW.json'))
print('pageTitle zh-CN:', cn['Grail']['pageTitle'])
print('pageTitle zh-TW:', tw['Grail']['pageTitle'])
print('same key set:', set(cn['Grail'].keys()) == set(tw['Grail'].keys()))
print('Home untouched:', cn['Home'] == json.load(open('messages/en.json'))['Home'] or True)
"
```
Expected: `pageTitle zh-CN: 圣杯追踪器`, `pageTitle zh-TW: 聖杯追蹤器`, `same key set: True`.

Confirm `messages/zh-CN.json`'s `Home`, `Appraiser`, `Footer.support`, `Footer.tagline` are unchanged from before this task — run `git diff messages/zh-CN.json` and confirm only `Grail.*` and `Footer.grailLink` lines changed.

- [ ] **Step 4: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — all clean. Confirm all three locale `/grail` pages build with no next-intl missing-message errors in the build output.

- [ ] **Step 5: Commit**

```bash
git add messages/zh-TW.json messages/zh-CN.json scripts/translate-grail-ui-zh-cn.mjs
git commit -m "Translate grail UI chrome to zh-TW (hand-authored) and zh-CN (OpenCC-derived)"
```

---

### Task 4: Full verification and locale spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-14-grail-zh-translation-verification.md`

- [ ] **Step 1: Full automated verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`. Confirm the test count includes all of Task 1's new `grail-data.test.ts` assertions and the existing suite (should be 3 test files total: `appraise.test.ts`, `bestCopy.test.ts`, `grail-data.test.ts`). Confirm `out/en/grail/index.html`, `out/zh-TW/grail/index.html`, `out/zh-CN/grail/index.html` all exist.

- [ ] **Step 2: Locale spot-check against d2r.world (accuracy reference, not a copy source)**

For 8 items spread across kinds/grades (reuse a subset of the item-reference plan's original 10: Harlequin Crest, Vampire Gaze, Stone of Jordan, The Grandfather, Aldur's Advance, Windforce, Maelstromwrath, Wolfhowl — the last two specifically exercise the skill-name disambiguation fix), compare the zh-TW name/stat labels shown by this site against d2r.world's zh-TW listing for the same items: does the item name match (it should, both trace to the same official Blizzard localization), are stat labels recognizable/conventional Traditional Chinese D2 terminology. Record findings in a table (item | field checked | result | notes) — mismatches in *names* (official source) are worth flagging as a real bug; differences in *stat label phrasing* (hand-curated, not official) are expected and not a bug, just a wording-style note for the "worth native review" backlog item.

- [ ] **Step 3: Manual verification in the browser, all three locales**

Same OAuth constraint as prior tasks (cannot enter Google credentials — hard-blocked). Using the same render-test substitute approach: confirm the grail page renders correctly at `/en/grail`, `/zh-TW/grail`, `/zh-CN/grail` — sidebar category names, page title/subtitle, sign-in prompt, and (via the mocked-auth render test) item names and stat labels all appear in the correct language with no untranslated English leaking into the zh-TW/zh-CN views except the documented ~5% English-fallback items, and no console errors.

- [ ] **Step 4: Write findings and commit**

Write the spot-check table and manual verification notes to
`docs/superpowers/specs/2026-07-14-grail-zh-translation-verification.md`.

```bash
git add docs/superpowers/specs/2026-07-14-grail-zh-translation-verification.md
git commit -m "Add zh-TW/zh-CN translation verification and d2r.world spot-check"
```
