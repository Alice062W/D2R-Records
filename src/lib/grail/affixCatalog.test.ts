import { describe, it, expect } from 'vitest';
import { getAffixCategories, getAffixesForCategory } from './affixCatalog';

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
});
