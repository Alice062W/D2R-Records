import { describe, it, expect } from 'vitest';
import { ALVL85_AREAS } from './alvl85Areas';

describe('ALVL85_AREAS', () => {
  it('has exactly 32 area entries, matching d2r.world', () => {
    expect(ALVL85_AREAS.length).toBe(32);
  });

  it("resolves the two distinct 'Night Lord' monsters correctly (Undead in Ruined Temple, Animal in Infernal Pit)", () => {
    const ruinedTemple = ALVL85_AREAS.find(a => a.areaName.en === 'Ruined Temple')!;
    const nightLordUndead = ruinedTemple.monsters.find(m => m.name.en === 'Night Lord')!;
    expect(nightLordUndead.type).toBe('undead');
    expect(nightLordUndead.immunities).toEqual([{ element: 'cold', value: 120, starred: true }]);

    const infernalPit = ALVL85_AREAS.find(a => a.areaName.en === 'Infernal Pit')!;
    const nightLordAnimal = infernalPit.monsters.find(m => m.name.en === 'Night Lord')!;
    expect(nightLordAnimal.type).toBe('animal');
    expect(nightLordAnimal.immunities).toEqual([{ element: 'lightning', value: 100, starred: false }]);
  });

  it('includes The Worldstone Chamber with no monsters (d2r.world shows no monster list for it)', () => {
    const chamber = ALVL85_AREAS.find(a => a.areaName.en === 'The Worldstone Chamber')!;
    expect(chamber).toBeDefined();
    expect(chamber.monsters).toEqual([]);
  });

  it('every area and monster name is localized for zh-TW and zh-CN (not falling back to English)', () => {
    for (const area of ALVL85_AREAS) {
      expect(area.areaName['zh-TW']).not.toBe('');
      expect(area.areaName['zh-CN']).not.toBe('');
      for (const monster of area.monsters) {
        expect(monster.name['zh-TW']).not.toBe('');
        expect(monster.name['zh-CN']).not.toBe('');
      }
    }
  });

  it("the two 'Night Lord' monsters resolve to different d2r.world translations (same English name, different underlying monster)", () => {
    const ruinedTemple = ALVL85_AREAS.find(a => a.areaName.en === 'Ruined Temple')!;
    const infernalPit = ALVL85_AREAS.find(a => a.areaName.en === 'Infernal Pit')!;
    const undeadNightLord = ruinedTemple.monsters.find(m => m.name.en === 'Night Lord')!;
    const animalNightLord = infernalPit.monsters.find(m => m.name.en === 'Night Lord')!;
    expect(undeadNightLord.name['zh-TW']).toBe('暗夜鬼爵');
    expect(animalNightLord.name['zh-TW']).toBe('夜族統領');
    expect(undeadNightLord.name['zh-TW']).not.toBe(animalNightLord.name['zh-TW']);
  });
});
