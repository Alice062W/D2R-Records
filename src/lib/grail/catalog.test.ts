import { describe, it, expect } from 'vitest';
import { getCategoriesForKind } from './catalog';

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
