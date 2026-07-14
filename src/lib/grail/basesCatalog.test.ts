import { describe, it, expect } from 'vitest';
import { getBaseCategories, getBaseLinesForCategory } from './basesCatalog';

describe('basesCatalog', () => {
  it('returns categories present in bases-full.json, in SLOT_ORDER', () => {
    const categories = getBaseCategories();
    expect(categories).toContain('axes');
    expect(categories).toContain('helms');
    expect(categories).not.toContain('charms'); // base items have no charm bases
  });

  it('getBaseLinesForCategory returns localized lines for the given category', () => {
    const axesLines = getBaseLinesForCategory('axes', 'en');
    const handAxeLine = axesLines.find(l => l.grades.normal?.name === 'Hand Axe');
    expect(handAxeLine).toBeTruthy();
    expect(handAxeLine!.grades.exceptional?.name).toBe('Hatchet');
    expect(handAxeLine!.grades.elite?.name).toBe('Tomahawk');
  });

  it('localizes names for zh-TW', () => {
    const axesLines = getBaseLinesForCategory('axes', 'zh-TW');
    const handAxeLine = axesLines.find(l => l.grades.normal?.name === '手斧');
    expect(handAxeLine).toBeTruthy();
  });
});
