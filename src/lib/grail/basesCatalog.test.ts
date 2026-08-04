import { describe, it, expect } from 'vitest';
import { getBaseCategories, getBaseLinesForCategory } from './basesCatalog';

describe('basesCatalog', () => {
  it('returns non-weapon categories (incl. Grimoires) first, then weapon categories, excluding jewelry', () => {
    const categories = getBaseCategories();
    expect(categories).toContain('axes');
    expect(categories).toContain('helms');
    // Rings/amulets/charms/jewels are hidden on the base items page -- little
    // useful info there (no properties, just a name/icon).
    expect(categories).not.toContain('rings');
    expect(categories).not.toContain('amulets');
    expect(categories).not.toContain('charms');
    expect(categories).not.toContain('jewels');
    const firstSeven = categories.slice(0, 7);
    expect(firstSeven).toEqual(['helms', 'armors', 'shields', 'belts', 'boots', 'gloves', 'grimoires']);
    // Everything after the first 7 (non-weapon) slots must be a weapon slot.
    for (const slot of categories.slice(7)) {
      expect(['helms', 'armors', 'shields', 'belts', 'boots', 'gloves', 'grimoires']).not.toContain(slot);
    }
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
