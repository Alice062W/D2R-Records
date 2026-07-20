import { describe, it, expect } from 'vitest';
import { getCategoriesForKind, getItemIdsByCategory, getAllGrailItems, getItemsForSetWeaponsCategory } from './catalog';

describe('getCategoriesForKind', () => {
  it("combines all weapon-type categories (melee, ranged, and grimoires) into 'weapons' for sets only", () => {
    const setCats = getCategoriesForKind('set');
    expect(setCats).toContain('weapons');
    for (const weaponCat of ['swords', 'daggers', 'axes', 'polearms', 'spears', 'clubs', 'maces', 'hammers', 'scepters', 'staves', 'orbs', 'wands', 'katars', 'grimoires', 'bows', 'crossbows', 'javelins', 'throwings']) {
      expect(setCats).not.toContain(weaponCat);
    }
  });

  it('keeps individual weapon-type categories for uniques (unchanged)', () => {
    const uniqueCats = getCategoriesForKind('unique');
    expect(uniqueCats).toContain('swords');
    expect(uniqueCats).toContain('axes');
    expect(uniqueCats).not.toContain('weapons');
  });
});

describe('getItemIdsByCategory', () => {
  it('has one entry per category returned by getCategoriesForKind, and every id belongs to a real item of that kind', () => {
    for (const kind of ['unique', 'set'] as const) {
      const categories = getCategoriesForKind(kind);
      const byCategory = getItemIdsByCategory(kind);
      expect(Object.keys(byCategory).sort()).toEqual([...categories].sort());
      for (const category of categories) {
        expect(byCategory[category].length).toBeGreaterThan(0);
      }
    }
  });

  it('the total item count across all unique categories matches the full unique item count', () => {
    const byCategory = getItemIdsByCategory('unique');
    const total = Object.values(byCategory).reduce((sum, ids) => sum + ids.length, 0);
    const realTotal = getAllGrailItems().filter(i => i.kind === 'unique').length;
    expect(total).toBe(realTotal);
  });

  it("the 'weapons' bucket for sets matches getItemsForSetWeaponsCategory() exactly", () => {
    const byCategory = getItemIdsByCategory('set');
    const expectedIds = getItemsForSetWeaponsCategory().map(i => i.id).sort();
    expect(byCategory.weapons.sort()).toEqual(expectedIds);
  });

  it('a non-weapons set category (e.g. helms) matches a direct slotCategory filter', () => {
    const byCategory = getItemIdsByCategory('set');
    const expectedIds = getAllGrailItems()
      .filter(i => i.kind === 'set' && i.slotCategory === 'helms')
      .map(i => i.id)
      .sort();
    expect(byCategory.helms.sort()).toEqual(expectedIds);
  });
});
