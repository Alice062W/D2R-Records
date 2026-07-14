import { describe, it, expect } from 'vitest';
import uniques from './uniques.json';
import sets from './sets.json';
import basesFull from './bases-full.json';
import runewordsFull from './runewords-full.json';
import { getCategoriesForKind, SLOT_ORDER } from '@/lib/grail/catalog';

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

  it('preserves SLOT_ORDER ordering', () => {
    const setCategories = getCategoriesForKind('set');
    const expectedOrder = SLOT_ORDER.filter(s => setCategories.includes(s));
    expect(setCategories).toEqual(expectedOrder);
  });
});
