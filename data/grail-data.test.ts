import { describe, it, expect } from 'vitest';
import uniques from './uniques.json';
import sets from './sets.json';
import basesFull from './bases-full.json';
import runewordsFull from './runewords-full.json';
import cubeRecipesData from './cube-recipes.json';
import craftedItemsData from './crafted-items.json';
import magicAffixesData from './magic-affixes.json';
import categoryIcons from './category-icons.json';
import { getCategoriesForKind, SLOT_ORDER } from '@/lib/grail/catalog';
import { existsSync } from 'fs';
import { join } from 'path';
import setGroupsData from './set-groups.json';

interface LocalizedText { en: string; 'zh-TW': string; 'zh-CN': string; }

function isLocalizedText(v: unknown): v is LocalizedText {
  return (
    typeof v === 'object' && v !== null &&
    'en' in v && 'zh-TW' in v && 'zh-CN' in v
  );
}

describe('generated grail catalog', () => {
  it('has the expected item counts', () => {
    expect(uniques.length).toBe(417);
    expect(sets.length).toBe(140);
  });

  it('every entry has a unique id', () => {
    const ids = [...uniques, ...sets].map((i: { id: string }) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every variable property has min <= max', () => {
    // `variable: true` marks a stat a specific copy can roll differently
    // within [min, max] (used by the Grail find-tracking feature) -- for
    // those, min/max must bound a real ascending range. Non-variable
    // properties don't get this check: some (e.g. "Adds 1-40 Lightning
    // Damage") legitimately have min !== max, while "chance to cast"/charge
    // properties reuse min/max to carry chance%/skill-level or
    // current/max-charges pairs rather than a value range, so min > max
    // there is not a bug.
    for (const item of [...uniques, ...sets] as {
      properties: { min: number; max: number; variable: boolean }[];
    }[]) {
      for (const p of item.properties) {
        if (p.variable) expect(p.min).toBeLessThanOrEqual(p.max);
      }
    }
  });

  it('statPriority only references codes present in properties', () => {
    for (const item of [...uniques, ...sets] as {
      properties: { code: string }[];
      statPriority: string[];
    }[]) {
      const codes = new Set(item.properties.map(p => p.code));
      for (const p of item.statPriority) expect(codes.has(p)).toBe(true);
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
      properties: { label: unknown }[]; setFullBonus: { label: unknown }[]; setBonuses: { label: unknown }[];
    }[]) {
      checkLocalizedText(item.name, 'name');
      checkLocalizedText(item.baseName, 'baseName');
      if (item.setName !== null) checkLocalizedText(item.setName, 'setName');
      for (const p of item.properties) checkLocalizedText(p.label, 'properties[].label');
      for (const b of item.setFullBonus) checkLocalizedText(b.label, 'setFullBonus[].label');
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

describe('bases-full.json', () => {
  it('groups Hand Axe / Hatchet / Tomahawk into one axes line with all 3 grades', () => {
    const line = basesFull.find(l => l.grades.normal?.name.en === 'Hand Axe')!;
    expect(line).toBeTruthy();
    expect(line.slotCategory).toBe('axes');
    expect(line.grades.normal!.name.en).toBe('Hand Axe');
    expect(line.grades.exceptional!.name.en).toBe('Hatchet');
    expect(line.grades.elite!.name.en).toBe('Tomahawk');
    expect(line.grades.elite!.levelReq).toBe(40);
    expect(line.grades.elite!.statRows.find(r => r.code === 'requiredStrength')?.value).toBe(125);
  });

  it('handles a 1h-only weapon (no twoHandDamage) and records oneHandDamage', () => {
    const line = basesFull.find(l => l.grades.normal?.name.en === 'Hand Axe')!;
    expect(line.grades.normal!.statRows.find(r => r.code === 'oneHandDamage')).toEqual({ code: 'oneHandDamage', min: 3, max: 6 });
    expect(line.grades.normal!.statRows.find(r => r.code === 'twoHandDamage')).toBeUndefined();
  });

  it('handles a 2h-only weapon (no oneHandDamage) and records twoHandDamage', () => {
    const line = basesFull.find(l => l.grades.normal?.name.en === 'Large Axe')!;
    expect(line.grades.normal!.statRows.find(r => r.code === 'oneHandDamage')).toBeUndefined();
    expect(line.grades.normal!.statRows.find(r => r.code === 'twoHandDamage')).toEqual({ code: 'twoHandDamage', min: 6, max: 13 });
  });

  it('every line has a non-null normal grade', () => {
    expect(basesFull.every(l => l.grades.normal !== null)).toBe(true);
  });

  it('zh-TW names are non-empty for every present grade', () => {
    for (const line of basesFull) {
      for (const grade of Object.values(line.grades)) {
        if (grade) expect(grade.name['zh-TW']).not.toBe('');
      }
    }
  });

  it('includes katar base items (Katar, Wrist Blade, Hatchet Hands, Cestus, Claws)', () => {
    const katars = basesFull.filter((b: { slotCategory: string }) => b.slotCategory === 'katars');
    expect(katars.length).toBeGreaterThan(0);
    const names = katars.map((k: { grades: { normal: { name: { en: string } } | null } }) => k.grades.normal?.name.en);
    expect(names).toContain('Katar');
  });

  it('has a non-empty invFile matching a real file in public/items/inv for every line', () => {
    for (const line of basesFull) {
      expect(line.invFile).not.toBe('');
      expect(existsSync(join(process.cwd(), 'public/items/inv', `${line.invFile}.png`))).toBe(true);
    }
  });
});

describe('bases-full.json subCategory (Helms/Shields sub-tabs)', () => {
  it('tags each Helms-family item with the correct subCategory', () => {
    const byId = Object.fromEntries(basesFull.map((b: { id: string; subCategory: string | null }) => [b.id, b.subCategory]));
    expect(byId['base-cap']).toBeNull(); // Cap -> plain Helm
    expect(byId['base-ci0']).toBe('circlet'); // Circlet
    expect(byId['base-ba1']).toBe('barbarian'); // Jawbone Cap -> Barbarian Helm
    expect(byId['base-dr1']).toBe('druid'); // Wolf Head -> Druid Pelt
  });

  it('tags each Shields-family item with the correct subCategory', () => {
    const byId = Object.fromEntries(basesFull.map((b: { id: string; subCategory: string | null }) => [b.id, b.subCategory]));
    expect(byId['base-buc']).toBeNull(); // Buckler -> plain Shield
    expect(byId['base-pa1']).toBe('paladin'); // Targe -> Paladin Shield
    expect(byId['base-ne1']).toBe('shrunkenHeads'); // Preserved Head -> Shrunken Head
  });

  it('every non-Helms/Shields entry has subCategory null', () => {
    const others = basesFull.filter((b: { slotCategory: string }) => b.slotCategory !== 'helms' && b.slotCategory !== 'shields');
    expect(others.every((b: { subCategory: string | null }) => b.subCategory === null)).toBe(true);
  });
});

describe('runewords-full.json', () => {
  it('has 98 entries: every complete===1 entry in vendored runes.json, minus the "Hustle (armor)"/"Hustle (weapon)" pair which d2r.world displays as a single merged "Hysteria" runeword (more than the 93 in the older curated runewords.json, which predates Vigilance/Ritual/Void/Authority/Coven/Hustle-split)', () => {
    expect(runewordsFull.length).toBe(98);
  });

  it('Hysteria merges the vendor\'s split "Hustle (armor)"/"Hustle (weapon)" entries into one, with base-type-qualified stats for both halves', () => {
    const hysteria = runewordsFull.find(r => r.name.en === 'Hysteria')!;
    expect(hysteria).toBeTruthy();
    expect(hysteria.runes.map(r => r.en)).toEqual(['Shael', 'Ko', 'Eld']);
    expect(hysteria.itemTypes).toEqual(['armors', 'weap']);
    expect(hysteria.ladderOnly).toBe(true);
    const allLabels = hysteria.fixedStats.map(s => s.label.en).concat(hysteria.stats.map(s => s.label.en));
    expect(allLabels.some(l => l.includes('Body Armor Only'))).toBe(true);
    expect(allLabels.some(l => l.includes('Weapons Only'))).toBe(true);
  });

  it('Enigma has the correct runes, sockets, and a non-empty stat list', () => {
    const enigma = runewordsFull.find(r => r.name.en === 'Enigma')!;
    expect(enigma).toBeTruthy();
    expect(enigma.runes.map(r => r.en)).toEqual(['Jah', 'Ith', 'Ber']);
    expect(enigma.runes.map(r => r['zh-TW'])).toEqual(['喬', '伊司', '貝']);
    expect(enigma.sockets).toBe(3);
    expect(enigma.stats.length + enigma.fixedStats.length).toBeGreaterThan(0);
  });

  it('includes Vigilance, a real runeword missing from the older curated runewords.json', () => {
    expect(runewordsFull.find(r => r.name.en === 'Vigilance')).toBeTruthy();
  });

  it('every entry has a non-empty zh-TW name', () => {
    for (const rw of runewordsFull) {
      expect(rw.name['zh-TW']).not.toBe('');
    }
  });

  it('recovers levelReq for runewords with a name-format mismatch in the curated file', () => {
    const callToArms = runewordsFull.find(r => r.name.en === 'Call to Arms')!;
    expect(callToArms.levelReq).toBe(57);
    const bone = runewordsFull.find(r => r.name.en === 'Bone')!;
    expect(bone.levelReq).toBe(47);
  });

  it('still falls back gracefully for genuinely new runewords not in the curated file', () => {
    const vigilance = runewordsFull.find(r => r.name.en === 'Vigilance')!;
    expect(vigilance.levelReq).toBe(0);
  });

  it('has a runeInvFiles entry per rune, in the same order, for every runeword', () => {
    for (const rw of runewordsFull) {
      expect(rw.runeInvFiles.length).toBe(rw.runes.length);
      for (const invFile of rw.runeInvFiles) {
        expect(invFile).not.toBe('');
        expect(existsSync(join(process.cwd(), 'public/items/inv', `${invFile}.png`))).toBe(true);
      }
    }
  });

  it("Enigma's runeInvFiles resolve to the real Jah/Ith/Ber icon files, in order", () => {
    // Note: the vendored game data's invfile for the Jah rune is "invrJo" (not the
    // naively-expected "invrJah") — this is the same value data/runes.json already
    // uses (see Task 3), and it's the only Jah icon file that actually exists on
    // disk under public/items/inv.
    const enigma = runewordsFull.find(r => r.name.en === 'Enigma')!;
    expect(enigma.runeInvFiles).toEqual(['invrJo', 'invrIth', 'invrBer']);
  });
});

import maxSockets from './max-sockets.json';
import runesData from './runes.json';

describe('max-sockets.json', () => {
  it('has exactly 18 rows', () => {
    expect(maxSockets.length).toBe(18);
  });

  it('Axes row matches the known real values (4/5/6)', () => {
    const row = maxSockets.find(r => r.itemType.en === 'Axes')!;
    expect(row).toEqual({ itemType: row.itemType, ilvl1to25: 4, ilvl26to40: 5, ilvl41plus: 6 });
  });

  it('Armors row is capped by the actual max gemsockets (3/4/4, not the raw 3/4/6 ceiling)', () => {
    const row = maxSockets.find(r => r.itemType.en === 'Armors')!;
    expect(row).toEqual({ itemType: row.itemType, ilvl1to25: 3, ilvl26to40: 4, ilvl41plus: 4 });
  });

  it('Helms row matches the known real values (2/2/3)', () => {
    const row = maxSockets.find(r => r.itemType.en === 'Helms')!;
    expect(row).toEqual({ itemType: row.itemType, ilvl1to25: 2, ilvl26to40: 2, ilvl41plus: 3 });
  });
});

describe('getCategoriesForKind', () => {
  it('returns all SLOT_ORDER categories for uniques except grimoires, which is folded into shields to match d2r.world', () => {
    expect(getCategoriesForKind('unique')).toEqual(SLOT_ORDER.filter(slot => slot !== 'grimoires'));
  });

  it('returns a strict subset for sets, excluding categories with no set items', () => {
    const setCategories = getCategoriesForKind('set');
    expect(setCategories.length).toBeLessThan(SLOT_ORDER.length);
    expect(setCategories).toContain('boots');
    expect(setCategories).not.toContain('charms');
  });

  it('preserves SLOT_ORDER ordering for non-weapon categories, with weapons tile first', () => {
    const setCategories = getCategoriesForKind('set');
    const nonWeaponCategories = setCategories.filter(c => c !== 'weapons');
    const expectedOrder = SLOT_ORDER.filter(s => nonWeaponCategories.includes(s));
    expect(nonWeaponCategories).toEqual(expectedOrder);
    expect(setCategories[0]).toBe('weapons');
  });
});

describe('runes.json', () => {
  it('has exactly 33 runes in order 1-33', () => {
    expect(runesData.length).toBe(33);
    expect(runesData.map(r => r.number)).toEqual(Array.from({ length: 33 }, (_, i) => i + 1));
    expect(runesData[0].name.en).toBe('El');
    expect(runesData[32].name.en).toBe('Zod');
  });

  it('El has the correct weapon/helm/shield stats', () => {
    const el = runesData.find(r => r.name.en === 'El')!;
    expect(el.levelReq).toBe(11);
    expect(el.weaponStats.map(s => s.code)).toEqual(['att', 'light']);
    expect(el.helmStats.map(s => s.code)).toEqual(['ac', 'light']);
    expect(el.shieldStats.map(s => s.code)).toEqual(['ac', 'light']);
  });

  it('every rune name is localized (not falling back to English)', () => {
    for (const r of runesData) {
      expect(r.name['zh-TW']).not.toBe(r.name.en);
    }
  });

  it('zh-TW names are non-empty for every rune', () => {
    for (const r of runesData) {
      expect(r.name['zh-TW']).not.toBe('');
    }
  });

  it('has a non-empty invFile matching a real file in public/items/inv for every rune', () => {
    for (const rune of runesData) {
      expect(rune.invFile).not.toBe('');
      expect(existsSync(join(process.cwd(), 'public/items/inv', `${rune.invFile}.png`))).toBe(true);
    }
  });
});

describe('cube-recipes.json', () => {
  // NOTE: the plan's task brief documented this as "157 enabled + 17 Crafted Grand
  // Charm entries = 174", but that arithmetic double-counts: 157 is the total number
  // of `enabled:1` entries in cubemain.json *including* the 36 Hit Power/Blood/
  // Caster/Safety craft recipes (which are also enabled:1 but excluded here because
  // they belong only in crafted-items.json). The real total is
  // 157 (enabled) - 36 (excluded craft recipes) + 17 (Crafted Grand Charm) = 138,
  // confirmed by reading vendor/d2data/json/cubemain.json directly.
  it('has 138 entries (121 enabled non-craft + 17 Crafted Grand Charm entries)', () => {
    expect(cubeRecipesData.length).toBe(138);
  });

  it('does not include the 36 Hit Power/Blood/Caster/Safety craft recipes (those are crafted-items.json only)', () => {
    expect(cubeRecipesData.some(r => r.description.en.includes('Hit Power'))).toBe(false);
  });

  it('classifies a known rune-upgrade recipe correctly', () => {
    const eld = cubeRecipesData.find(r => r.description.en === '3 El Runes -> Eld Rune');
    expect(eld?.category).toBe('runeUpgrade');
  });

  it('classifies a known gem-upgrade recipe correctly (split out of the former runeGemUpgrade bucket)', () => {
    const flawedAmethyst = cubeRecipesData.find(r => r.description.en === '3 Chipped Amethysts -> Flawed Amethyst');
    expect(flawedAmethyst?.category).toBe('gemUpgrade');
  });

  it('classifies a known quest recipe correctly', () => {
    const cow = cubeRecipesData.find(r => r.description.en.includes('Secret Cow Level'));
    expect(cow?.category).toBe('quests');
  });

  it('classifies the Crafted Grand Charm entries correctly', () => {
    const charmRecipes = cubeRecipesData.filter(r => r.category === 'craftedGrandCharm');
    expect(charmRecipes.length).toBe(17);
  });

  it('resolves ingredientIcons and outputIcon for a simple 2-input recipe (Staff of Kings + Amulet of the Viper -> Horadric Staff)', () => {
    const r = cubeRecipesData.find(r => r.description.en === 'Staff of Kings + Amulet of the Viper -> Horadric Staff')!;
    expect(r.ingredientIcons).toEqual(['invmsf', 'invvip']);
    expect(r.outputIcon).toBe('invhst');
  });

  it('deduplicates and does NOT positionally match description segments for the Prismatic Amulet recipe (7 raw inputs, 2 description segments)', () => {
    const r = cubeRecipesData.find(r => r.description.en === '6 Perfect Gems (1 of each type) + 1 Magic Amulet -> Prismatic Amulet')!;
    expect(r.ingredientIcons).toEqual(['invamu', 'invgsve', 'invgsye', 'invgsbe', 'invgsge', 'invgsre', 'invgswe']);
    expect(r.outputIcon).toBe('invamu');
  });

  it('resolves an abstract item-type code to its category representative icon (Throwing Axe: Axe (Any) + Dagger (Any))', () => {
    const r = cubeRecipesData.find(r => r.description.en === '1 Axe (Any) + 1 Dagger (Any) -> Throwing Axe')!;
    expect(r.ingredientIcons).toEqual(['invhax', 'invdgr']);
    expect(r.outputIcon).toBe('invtax');
  });

  it('leaves outputIcon null for a quest/portal recipe with no real item code (Wirt\'s Leg -> Secret Cow Level portal)', () => {
    const r = cubeRecipesData.find(r => r.description.en === "Wirt's Leg + Tome of Town Portal -> Portal to The Secret Cow Level")!;
    expect(r.ingredientIcons).toEqual(['invleg', 'invbbk']);
    expect(r.outputIcon).toBeNull();
  });

  it('every resolved icon in every recipe corresponds to a real file in public/items/inv', () => {
    for (const r of cubeRecipesData) {
      for (const icon of r.ingredientIcons) {
        expect(existsSync(join(process.cwd(), 'public/items/inv', `${icon}.png`))).toBe(true);
      }
      if (r.outputIcon) {
        expect(existsSync(join(process.cwd(), 'public/items/inv', `${r.outputIcon}.png`))).toBe(true);
      }
    }
  });

  it('localizes a simple literal-name recipe description (Staff of Kings + Amulet of the Viper -> Horadric Staff)', () => {
    const r = cubeRecipesData.find(r => r.description.en === 'Staff of Kings + Amulet of the Viper -> Horadric Staff')!;
    expect(r.description['zh-TW']).toBe('國王之杖 + 蝮蛇護符 -> 赫拉迪克法杖');
  });

  it('localizes a quantity + qualifier + gem-tier recipe description (rejuvenation potion)', () => {
    const r = cubeRecipesData.find(r =>
      r.description.en === '3 Healing Potions (Any) + 3 Mana Potions (Any)  + 1 Chipped Gem (Any) -> Rejuvenation Potion'
    )!;
    expect(r.description['zh-TW']).not.toMatch(/[A-Za-z]{2,}/);
  });

  it('localizes a rune-upgrade recipe description (3 El Runes -> Eld Rune)', () => {
    const eld = cubeRecipesData.find(r => r.description.en === '3 El Runes -> Eld Rune')!;
    expect(eld.description['zh-TW']).toBe('3 艾爾符文 -> 艾德符文');
  });

  it('resolves a specific charm-size compound ("Grand Charm") to its own real translation, not the generic word for "Charm", and leaves the unverifiable "Breaching" prefix in English rather than guessing', () => {
    const r = cubeRecipesData.find(r => r.description.en.endsWith('-> Breaching Grand Charm'))!;
    expect(r.description['zh-TW']).toBe(
      '1 普爾符文 + 1 完美紫寶石 + 1 北方世界之石碎片 + 1 超大型護身符 -> Breaching 超大型護身符'
    );
  });

  it('every recipe description is present for all three locales (no undefined/empty strings)', () => {
    for (const r of cubeRecipesData) {
      expect(r.description.en.length).toBeGreaterThan(0);
      expect(r.description['zh-TW'].length).toBeGreaterThan(0);
      expect(r.description['zh-CN'].length).toBeGreaterThan(0);
    }
  });
});

describe('crafted-items.json', () => {
  it('has 36 entries, 9 per family', () => {
    expect(craftedItemsData.length).toBe(36);
    for (const family of ['hitPower', 'blood', 'caster', 'safety']) {
      expect(craftedItemsData.filter(c => c.family === family).length).toBe(9);
    }
  });

  it('Hit Power Helm has the correct fixed and variable properties', () => {
    const helm = craftedItemsData.find(c => c.name.en === 'Hit Power Helm')!;
    // cubemain.json id 64's gethit-skill mod (min:5, max:4) is chance%=5,
    // level=4 — not a genuine range — and composes into a single fixed
    // "chance to cast" sentence rather than a fake "5-4" range. thorns
    // (min:3, max:7) and ac-miss (min:25, max:50) are the two real ranges.
    expect(helm.fixedProperties.length).toBe(1);
    expect((helm.fixedProperties[0] as { composed?: boolean }).composed).toBe(true);
    expect(helm.fixedProperties[0].label.en).toBe('5% Chance to cast level 4 Frost Nova when struck');
    expect(helm.variableProperties.length).toBe(2);
    expect(helm.additionalInputs.map(i => i.en)).toEqual(['Jewel', 'Ith Rune', 'Perfect Sapphire']);
  });

  it('Hit Power Helm resolves magicItemInputIcon and additionalInputIcons in order (Jewel, Ith Rune, Perfect Sapphire)', () => {
    const helm = craftedItemsData.find(c => c.name.en === 'Hit Power Helm')!;
    expect(helm.magicItemInputIcon).toBe('invfhl');
    expect(helm.additionalInputIcons).toEqual(['invgswe', 'invrIth', 'invgsbe']);
  });

  it('every resolved icon across all crafted items corresponds to a real file in public/items/inv', () => {
    for (const c of craftedItemsData) {
      if (c.magicItemInputIcon) {
        expect(existsSync(join(process.cwd(), 'public/items/inv', `${c.magicItemInputIcon}.png`))).toBe(true);
      }
      for (const icon of c.additionalInputIcons) {
        if (icon) expect(existsSync(join(process.cwd(), 'public/items/inv', `${icon}.png`))).toBe(true);
      }
    }
  });
});

describe('magic-affixes.json', () => {
  it('includes both prefixes and suffixes', () => {
    expect(magicAffixesData.some(a => a.kind === 'prefix')).toBe(true);
    expect(magicAffixesData.some(a => a.kind === 'suffix')).toBe(true);
  });

  it('excludes frequency-0 (inactive) entries', () => {
    // "Fortuitous" v0 (group 114) has frequency:0 and should not appear; the active
    // v1 entry (frequency:4, alvl 12, no rare flag) should.
    const fortuitous = magicAffixesData.filter(a => a.name.en === 'Fortuitous');
    expect(fortuitous.length).toBeGreaterThan(0);
    expect(fortuitous.every(a => a.alvl !== 5)).toBe(true); // the dead v0 entry was alvl 5
  });

  it('marks rare-eligible affixes correctly', () => {
    const felicitous = magicAffixesData.find(a => a.name.en === 'Felicitous');
    expect(felicitous?.rareEligible).toBe(true);
  });

  it('every entry has at least one item type and one stat', () => {
    for (const a of magicAffixesData) {
      expect(a.itemTypes.length).toBeGreaterThan(0);
      expect(a.stats.length).toBeGreaterThan(0);
    }
  });

  it('excludes malformed negative-charge "charged" entries (e.g. the 9 broken Barbarian suffixes)', () => {
    const brokenNames = [
      'of Howling', 'of Potion Finding', 'of Taunting', 'of Shouting',
      'of Item Finding', 'of Battle Cry', 'of Battle Orders', 'of War Cry',
      'of Battle Command',
    ];
    for (const name of brokenNames) {
      const matches = magicAffixesData.filter(a => a.name.en === name);
      // Each of these names has a valid sibling entry (a different id) elsewhere in
      // the source data with a real item-type restriction (e.g. "of Howling" id 620,
      // itype1 "phlm") — only the malformed negative-charge id (e.g. 621) should be
      // gone, not every entry sharing that display name.
      expect(matches.every(a => !a.itemTypes.includes('bar'))).toBe(true);
    }
    // No entry anywhere should carry the raw, unmapped "bar" class-code fallback.
    expect(magicAffixesData.every(a => !a.itemTypes.includes('bar'))).toBe(true);
  });

  it('keeps valid itype-restricted "charged" entries even though their mod value is negative (e.g. Daggers\' "of Frozen Orbs")', () => {
    // magicsuffix.json id 549 ("of Frozen Orbs") has mod1code "charged" with
    // negative min/max (-20/-1), same as the malformed Barbarian rows — but it DOES
    // carry an itype restriction (itype1 "knif" -> daggers/throwingKnives), so per
    // hasMalformedNegativeCharge's scoping (missing itype is required, not just a
    // negative value) it must be kept, not excluded.
    const frozenOrbs = magicAffixesData.filter(a => a.name.en === 'of Frozen Orbs');
    expect(frozenOrbs.length).toBeGreaterThan(0);
    expect(frozenOrbs.some(a => a.itemTypes.includes('daggers'))).toBe(true);
  });
});

describe('property labels (no leaked raw codes)', () => {
  // Codes deliberately left unmapped in PROP_LABELS_EN/PROP_LABELS_ZH_TW because no
  // confidently-grounded label could be found (see scripts/generate-grail-data.mjs):
  // - "pierce-dmg": itemstatcost.json has a matching `item_pierce` stat, but its exact
  //   in-game wording (generic pierce vs. "damage penetrates resistance") could not be
  //   confirmed against d2r.world or sibling-code convention, so it's left as a raw-code
  //   fallback rather than guessed.
  // - "war": corresponds to `passive_warmth` in itemstatcost.json, which carries no
  //   descstrpos/descfunc — i.e. no confirmable in-game display text — so it's left
  //   unmapped rather than guessed.
  // - "bloody": appears only on `version: 0` (pre-expansion/classic) vendored
  //   uniqueitems.json rows (Swordback Hold, Gorefoot) alongside `openwounds` and
  //   `thorns`, has no matching Stat entry anywhere in itemstatcost.json, and
  //   doesn't appear at all on the current (expansion) d2r.world listings for
  //   either item — likely a superseded/renamed classic-era code with no
  //   confirmable modern wording, so it's left unmapped rather than guessed.
  const DELIBERATELY_UNMAPPED = new Set(['pierce-dmg', 'war', 'bloody']);

  // A stat whose `label.en` is identical to its own code (the part of `key` before any
  // ":"-disambiguator) and looks like a raw internal property code (lowercase,
  // hyphen-separated, optionally with a trailing "%") is a leaked-label bug: the
  // generator's PROP_LABELS_EN/PROP_LABELS_ZH_TW dictionaries are missing that code.
  function findLeakedRawCodes(data: unknown): Set<string> {
    const leaked = new Set<string>();
    function walk(node: unknown) {
      if (Array.isArray(node)) {
        for (const item of node) walk(item);
      } else if (node && typeof node === 'object') {
        const obj = node as Record<string, unknown>;
        const label = obj.label as { en?: unknown } | undefined;
        if (typeof obj.key === 'string' && label && typeof label.en === 'string') {
          const code = obj.key.split(':')[0];
          if (label.en === code && /^[a-z0-9]+(-[a-z0-9%]+)+$/.test(code)) {
            leaked.add(code);
          }
        }
        for (const value of Object.values(obj)) walk(value);
      }
    }
    walk(data);
    return leaked;
  }

  it('no generated data file has an unexpected leaked raw property code', () => {
    const leaked = new Set<string>();
    for (const data of [uniques, sets, basesFull, runewordsFull, runesData, craftedItemsData, cubeRecipesData, magicAffixesData]) {
      for (const code of findLeakedRawCodes(data)) leaked.add(code);
    }
    for (const code of leaked) {
      expect(DELIBERATELY_UNMAPPED.has(code)).toBe(true);
    }
  });
});

describe('category-icons.json', () => {
  it('has exactly one entry per SLOT_ORDER category', () => {
    for (const category of SLOT_ORDER) {
      expect(Object.keys(categoryIcons)).toContain(category);
    }
  });

  it('has a category-icons entry for every new granular Magic/Rare-only slug', () => {
    // These slugs (introduced by the ancestor-closure category expansion) have no
    // SLOT_ORDER/bases-full.json representative, so they need their own explicit
    // entries in category-icons.json rather than falling out of the SLOT_ORDER loop.
    const NEW_GRANULAR_SLUGS = [
      'circlets', 'barbarianHelms', 'druidHelms', 'paladinShields', 'shrunkenHeads',
      'smallCharms', 'largeCharms', 'grandCharms',
      'amazonSpears', 'amazonBows', 'amazonJavelins', 'assassinKatars',
      'throwingAxes', 'throwingKnives',
    ];
    const categories = new Set(
      magicAffixesData.flatMap((a: { itemTypes: string[] }) => a.itemTypes)
    );
    for (const slug of NEW_GRANULAR_SLUGS) {
      expect(categories.has(slug), `sanity check: "${slug}" should appear in magic-affixes.json`).toBe(true);
      expect(
        Object.prototype.hasOwnProperty.call(categoryIcons, slug),
        `category "${slug}" has no entry in category-icons.json`
      ).toBe(true);
    }
  });

  it('every invFile has a matching PNG in public/items/inv/', () => {
    for (const [category, invFile] of Object.entries(categoryIcons)) {
      const path = join(process.cwd(), 'public', 'items', 'inv', `${invFile}.png`);
      expect(existsSync(path), `missing icon for category "${category}": ${invFile}.png`).toBe(true);
    }
  });

  it('resolves the expected representative icon for a sample of categories', () => {
    expect(categoryIcons.axes).toBe('invhax');
    expect(categoryIcons.rings).toBe('invrin');
    expect(categoryIcons.amulets).toBe('invamu');
    expect(categoryIcons.charms).toBe('invchm');
    expect(categoryIcons.katars).toBe('invktr');
    expect(categoryIcons.jewels).toBe('invgswe');
  });
});

describe('isSkillRef on generated stats', () => {
  it("marks a known skill-granting runeword stat as isSkillRef (Enigma's Teleport charge)", () => {
    // Confirmed directly against data/runewords-full.json this session: Enigma's
    // fixedStats include "Skill Bonus (Teleport)" — a skill/oskill/charged-coded
    // stat (SKILL_REF_PROPS) — alongside plain stats like "Faster Run/Walk %".
    // "All Skills" is a separate "allskills" code, NOT in SKILL_REF_PROPS (it's a
    // flat bonus, not a specific-skill reference), so it stays isSkillRef: false —
    // don't assert it as skill-ref.
    const enigma = runewordsFull.find(r => r.name.en === 'Enigma')!;
    const skillStat = enigma.fixedStats.find(f => f.label.en === 'Skill Bonus (Teleport)')!;
    expect(skillStat.isSkillRef).toBe(true);
    const plainStat = enigma.fixedStats.find(f => f.label.en === 'Faster Run/Walk %')!;
    expect(plainStat.isSkillRef).toBe(false);
  });
});

describe('magic-affixes.json ancestor-closure category expansion', () => {
  it('expands a weapon-supertype-restricted affix onto every leaf weapon category', () => {
    // Any affix whose only restriction is the bare "weap" supertype code should appear
    // on every leaf weapon slug (swords, axes, bows, etc.) after expansion.
    const weapRestricted = magicAffixesData.filter((a: { itemTypes: string[] }) =>
      a.itemTypes.includes('swords') && a.itemTypes.includes('bows') && a.itemTypes.includes('axes')
    );
    expect(weapRestricted.length).toBeGreaterThan(0);
  });

  it('expands an Amazon-class-only restriction onto exactly the three Amazon weapon categories', () => {
    // NOTE: "of Slow Missiles" is not a unique name — magicsuffix.json id 476 has
    // itype1: 'amaz' (the one this test targets) and a SEPARATE id 477 also named
    // "of Slow Missiles" has itype1: 'glov' (Gloves) instead. Both become distinct
    // entries in magic-affixes.json (this project doesn't dedupe by name), so find the
    // specific one with 3 itemTypes, not just the first name match.
    const amazVariant = magicAffixesData.find(
      (a: { name: { en: string }; itemTypes: string[] }) =>
        a.name.en === 'of Slow Missiles' && a.itemTypes.length === 3
    );
    expect(amazVariant).toBeDefined();
    expect(amazVariant!.itemTypes.sort()).toEqual(['amazonBows', 'amazonJavelins', 'amazonSpears'].sort());
  });

  it('keeps class-specific weapon variants distinct from their base type', () => {
    const auricShieldOnly = magicAffixesData.filter((a: { itemTypes: string[] }) =>
      a.itemTypes.includes('paladinShields') && !a.itemTypes.includes('shields')
    );
    // A Paladin-Shield-only restriction should NOT also claim the generic "shields" slug
    // unless the affix separately also restricts to the base shie code.
    expect(auricShieldOnly.length).toBeGreaterThan(0);
  });

  it('resolves charm sizes into three distinct slugs', () => {
    const categories = new Set(magicAffixesData.flatMap((a: { itemTypes: string[] }) => a.itemTypes));
    expect(categories.has('smallCharms')).toBe(true);
    expect(categories.has('largeCharms')).toBe(true);
    expect(categories.has('grandCharms')).toBe(true);
    expect(categories.has('charms')).toBe(false);
  });

  it('leaves no unresolved generic codes, including the now-excluded "bar" fallback', () => {
    // "bar" used to be the one unresolved generic code left, produced only by the 9
    // malformed negative-charge Barbarian suffix rows (class "bar", no itype fields).
    // Those rows are now excluded entirely (see hasMalformedNegativeCharge in
    // scripts/generate-grail-data.mjs), so "bar" should no longer appear at all.
    const categories = new Set(magicAffixesData.flatMap((a: { itemTypes: string[] }) => a.itemTypes));
    const stillGeneric = ['amaz', 'armo', 'bar', 'blun', 'h2h', 'mele', 'miss', 'rod', 'shld', 'staff', 'thro', 'weap']
      .filter(code => categories.has(code));
    expect(stillGeneric).toEqual([]);
  });
});

describe('set-groups.json', () => {
  it('has exactly 35 entries', () => {
    expect(setGroupsData.length).toBe(35);
  });

  it('every entry has at least one piece id that exists in sets.json', () => {
    const setIds = new Set(sets.map((s: { id: string }) => s.id));
    for (const group of setGroupsData) {
      expect(group.pieceIds.length).toBeGreaterThan(0);
      for (const id of group.pieceIds) expect(setIds.has(id)).toBe(true);
    }
  });

  it("resolves Aldur's Watchtower's full-set bonus correctly", () => {
    const aldur = setGroupsData.find((g: { setName: { en: string } }) => g.setName.en === "Aldur's Watchtower")!;
    const byCode = Object.fromEntries(
      aldur.fullSetBonus.map((b: { code: string; min: number; max: number }) => [b.code, b])
    );
    expect(byCode['res-all']).toMatchObject({ min: 50, max: 50 });
    expect(byCode['dru']).toMatchObject({ min: 3, max: 3 });
    expect(byCode['ac']).toMatchObject({ min: 150, max: 150 });
    expect(byCode['manasteal']).toMatchObject({ min: 10, max: 10 });
    expect(byCode['mana']).toMatchObject({ min: 150, max: 150 });
    expect(byCode['dmg%']).toMatchObject({ min: 350, max: 350 });
  });

  it("resolves Aldur's Watchtower's partial bonuses", () => {
    const aldur = setGroupsData.find((g: { setName: { en: string } }) => g.setName.en === "Aldur's Watchtower")!;
    const tiers = aldur.partialBonuses.map((p: { piecesRequired: number }) => p.piecesRequired);
    expect(tiers).toContain(2);
    expect(tiers).toContain(3);
    const tier2 = aldur.partialBonuses.find((p: { piecesRequired: number }) => p.piecesRequired === 2)!;
    const tier3 = aldur.partialBonuses.find((p: { piecesRequired: number }) => p.piecesRequired === 3)!;
    expect(tier2.properties[0]).toMatchObject({ code: 'att%' });
    expect(tier3.properties[0]).toMatchObject({ code: 'mag%' });
  });

  it('has a non-empty repInvFile matching a real file in public/items/inv for every group', () => {
    for (const group of setGroupsData) {
      expect(group.repInvFile).not.toBe('');
      expect(existsSync(join(process.cwd(), 'public/items/inv', `${group.repInvFile}.png`))).toBe(true);
    }
  });
});

import areaLevelsData from './area-levels.json';

describe('area-levels.json', () => {
  it('has exactly 130 entries (138 total minus 8 administrative/town rows with MonLvlEx 0)', () => {
    expect(areaLevelsData.length).toBe(130);
  });

  it('excludes known town/administrative areas', () => {
    const names = areaLevelsData.map((a: { name: { en: string } }) => a.name.en);
    for (const town of ['Rogue Encampment', 'Forgotten Tower', 'Lut Gholein', 'Harem Level 1', 'Kurast Docktown', 'The Pandemonium Fortress', 'Harrogath']) {
      expect(names).not.toContain(town);
    }
  });

  it("resolves Dark Wood's levels correctly", () => {
    const darkWood = areaLevelsData.find((a: { name: { en: string } }) => a.name.en === 'Dark Wood')!;
    expect(darkWood).toMatchObject({ act: 0, normal: 5, nightmare: 38, hell: 68 });
    expect(darkWood.name['zh-TW']).not.toBe('');
  });

  it('overrides the internal dev codename "Moo Moo Farm" with the real player-facing English name', () => {
    expect(areaLevelsData.some((a: { name: { en: string } }) => a.name.en === 'Moo Moo Farm')).toBe(false);
    const cowLevel = areaLevelsData.find((a: { name: { en: string } }) => a.name.en === 'The Secret Cow Level')!;
    expect(cowLevel).toMatchObject({ act: 0, normal: 28, nightmare: 64, hell: 81 });
    expect(cowLevel.name['zh-TW']).toBe('秘密母牛關卡');
  });

  it('is ordered by act, ascending', () => {
    const acts = areaLevelsData.map((a: { act: number }) => a.act);
    for (let i = 1; i < acts.length; i++) expect(acts[i]).toBeGreaterThanOrEqual(acts[i - 1]);
  });
});
