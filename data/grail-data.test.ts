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

describe('bases-full.json', () => {
  it('groups Hand Axe / Hatchet / Tomahawk into one axes line with all 3 grades', () => {
    const line = basesFull.find(l => l.grades.normal?.name.en === 'Hand Axe')!;
    expect(line).toBeTruthy();
    expect(line.slotCategory).toBe('axes');
    expect(line.grades.normal!.name.en).toBe('Hand Axe');
    expect(line.grades.exceptional!.name.en).toBe('Hatchet');
    expect(line.grades.elite!.name.en).toBe('Tomahawk');
    expect(line.grades.elite!.levelReq).toBe(40);
    expect(line.grades.elite!.requiredStrength).toBe(125);
  });

  it('handles a 1h-only weapon (no twoHandDamage) and records oneHandDamage', () => {
    const line = basesFull.find(l => l.grades.normal?.name.en === 'Hand Axe')!;
    expect(line.grades.normal!.oneHandDamage).toEqual({ min: 3, max: 6 });
    expect(line.grades.normal!.twoHandDamage).toBeNull();
  });

  it('handles a 2h-only weapon (no oneHandDamage) and records twoHandDamage', () => {
    const line = basesFull.find(l => l.grades.normal?.name.en === 'Large Axe')!;
    expect(line.grades.normal!.oneHandDamage).toBeNull();
    expect(line.grades.normal!.twoHandDamage).toEqual({ min: 6, max: 13 });
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
  it('has 99 entries, matching every complete===1 entry in vendored runes.json (more than the 93 in the older curated runewords.json, which predates Vigilance/Ritual/Void/Authority/Coven/Hustle-split)', () => {
    expect(runewordsFull.length).toBe(99);
  });

  it('Enigma has the correct runes, sockets, and a non-empty stat list', () => {
    const enigma = runewordsFull.find(r => r.name.en === 'Enigma')!;
    expect(enigma).toBeTruthy();
    expect(enigma.runes).toEqual(['Jah', 'Ith', 'Ber']);
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
  it('returns all 28 SLOT_ORDER categories for uniques', () => {
    expect(getCategoriesForKind('unique')).toEqual([...SLOT_ORDER]);
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

  it('El has the correct weapon/armor-helm/shield stats and no recipe', () => {
    const el = runesData.find(r => r.name.en === 'El')!;
    expect(el.levelReq).toBe(11);
    expect(el.weaponStats.map(s => s.key)).toEqual(['light', 'att']);
    expect(el.armorHelmStats.map(s => s.key)).toEqual(['light', 'ac']);
    expect(el.recipe).toBeNull();
  });

  it('Eld has a simple 3x-previous-rune recipe (no gem)', () => {
    const eld = runesData.find(r => r.name.en === 'Eld')!;
    expect(eld.recipe).toEqual({ runeName: 'El', count: 3, gemName: null });
  });

  it('Amn has a gem-inclusive recipe (the first one)', () => {
    const amn = runesData.find(r => r.name.en === 'Amn')!;
    expect(amn.recipe).toEqual({ runeName: 'Thul', count: 3, gemName: 'Chipped Topaz' });
  });

  it('Um has a 2x-count recipe (the first 2x tier)', () => {
    const um = runesData.find(r => r.name.en === 'Um')!;
    expect(um.recipe).toEqual({ runeName: 'Pul', count: 2, gemName: 'Flawed Diamond' });
  });

  it('every rune has a dropRate with a monster, difficulty, and percent', () => {
    for (const r of runesData) {
      expect(r.dropRate.monster.length).toBeGreaterThan(0);
      expect(['normal', 'nightmare', 'hell']).toContain(r.dropRate.difficulty);
      expect(r.dropRate.percent).toBeGreaterThan(0);
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
    expect(eld?.category).toBe('runeGemUpgrade');
  });

  it('classifies a known quest recipe correctly', () => {
    const cow = cubeRecipesData.find(r => r.description.en.includes('Secret Cow Level'));
    expect(cow?.category).toBe('quests');
  });

  it('classifies the Crafted Grand Charm entries correctly', () => {
    const charmRecipes = cubeRecipesData.filter(r => r.category === 'craftedGrandCharm');
    expect(charmRecipes.length).toBe(17);
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
    // cubemain.json id 64's 3 mods are all genuine ranges (min !== max):
    // gethit-skill (min:5, max:4), thorns (min:3, max:7), ac-miss (min:25, max:50).
    expect(helm.fixedProperties.length).toBe(0);
    expect(helm.variableProperties.length).toBe(3);
    expect(helm.additionalInputs.map(i => i.en)).toEqual(['Jewel', 'Ith Rune', 'Perfect Sapphire']);
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
  it('has exactly 34 entries (Warlord\'s Glory has zero spawnable pieces, correctly excluded)', () => {
    expect(setGroupsData.length).toBe(34);
    expect(setGroupsData.some((g: { setName: { en: string } }) => g.setName.en === "Warlord's Glory")).toBe(false);
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
    const byKey = Object.fromEntries(aldur.fullSetBonuses.map((b: { key: string; min: number; max: number }) => [b.key, b]));
    expect(byKey['res-all']).toMatchObject({ min: 50, max: 50 });
    expect(byKey['dru']).toMatchObject({ min: 3, max: 3 });
    expect(byKey['ac']).toMatchObject({ min: 150, max: 150 });
    expect(byKey['manasteal']).toMatchObject({ min: 10, max: 10 });
    expect(byKey['mana']).toMatchObject({ min: 150, max: 150 });
    expect(byKey['dmg%']).toMatchObject({ min: 350, max: 350 });
    // The "state"/"fullsetgeneric" cosmetic flag must not leak into the bonus list.
    expect(aldur.fullSetBonuses.some((b: { key: string }) => b.key === 'state')).toBe(false);
  });

  it("resolves Aldur's Watchtower's partial bonuses (2/3/4-piece tiers)", () => {
    const aldur = setGroupsData.find((g: { setName: { en: string } }) => g.setName.en === "Aldur's Watchtower")!;
    expect(aldur.partialBonuses.map((p: { piecesRequired: number }) => p.piecesRequired)).toEqual([2, 3, 4]);
    expect(aldur.partialBonuses[0].stats[0]).toMatchObject({ key: 'att%', min: 150, max: 150 });
    expect(aldur.partialBonuses[1].stats[0]).toMatchObject({ key: 'mag%', min: 50, max: 50 });
    expect(aldur.partialBonuses[2].stats[0]).toMatchObject({ key: 'lifesteal', min: 10, max: 10 });
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
