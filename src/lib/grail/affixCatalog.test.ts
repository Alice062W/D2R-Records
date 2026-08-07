import { describe, it, expect } from 'vitest';
import { getAffixCategories, getAffixesForCategory, groupAffixesByExclusivity } from './affixCatalog';

describe('affixCatalog', () => {
  it('magic categories include the real granular item-type slugs found in the data', () => {
    const categories = getAffixCategories('magic');
    expect(categories).toContain('helms');
    expect(categories).toContain('rings');
  });

  it('rare categories are a subset of (or equal to) magic categories for the same itype set', () => {
    const magicCats = getAffixCategories('magic');
    const rareCats = getAffixCategories('rare');
    for (const cat of rareCats) expect(magicCats).toContain(cat);
  });

  it('getAffixesForCategory returns prefixes and suffixes for rings', () => {
    const { prefixes, suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    expect(prefixes.some(p => p.name === 'Fortuitous')).toBe(true);
    expect(suffixes.length).toBeGreaterThan(0);
  });

  it('rare-kind filtering excludes non-rare-eligible affixes', () => {
    const { prefixes: magicPrefixes } = getAffixesForCategory('magic', 'rings', 'en');
    const { prefixes: rarePrefixes } = getAffixesForCategory('rare', 'rings', 'en');
    expect(rarePrefixes.length).toBeLessThanOrEqual(magicPrefixes.length);
  });

  it('getAffixesForCategory returns the full stats array and group, not a flattened single stat', () => {
    const { prefixes } = getAffixesForCategory('magic', 'rings', 'en');
    const rugged = prefixes.find(p => p.name === 'Rugged');
    expect(rugged).toBeDefined();
    expect(typeof rugged!.group).toBe('number');
    expect(Array.isArray(rugged!.stats)).toBe(true);
    expect(rugged!.stats.length).toBeGreaterThan(0);
    expect(rugged!.stats[0]).toHaveProperty('template');
    expect(rugged!.stats[0]).toHaveProperty('label');
  });

  it('groupAffixesByExclusivity buckets affixes sharing a group id together', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const health = suffixes.find(s => s.name === 'of Health');
    const protection = suffixes.find(s => s.name === 'of Protection');
    expect(health).toBeDefined();
    expect(protection).toBeDefined();
    expect(health!.group).toBe(protection!.group);

    const groups = groupAffixesByExclusivity(suffixes);
    const sharedGroup = groups.find(g => g.affixes.some(a => a.name === 'of Health'));
    expect(sharedGroup).toBeDefined();
    expect(sharedGroup!.affixes.map(a => a.name)).toEqual(expect.arrayContaining(['of Health', 'of Protection']));
  });

  it('groupAffixesByExclusivity uses the highest-alvl member as the group header', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    const sharedGroup = groups.find(g => g.affixes.some(a => a.name === 'of Health'))!;
    // "of Protection" (alvl 18) outranks "of Health" (alvl 7).
    expect(sharedGroup.headerAffix.name).toBe('of Protection');
    expect(sharedGroup.headerText).toContain('of Protection');
  });

  it('groupAffixesByExclusivity sorts groups by their header alvl descending', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i - 1].headerAffix.alvl).toBeGreaterThanOrEqual(groups[i].headerAffix.alvl);
    }
  });
});
