import { describe, it, expect } from 'vitest';
import { ALVL85_AREAS } from './alvl85Areas';

describe('ALVL85_AREAS', () => {
  it('has exactly 32 area entries, matching d2r.world', () => {
    expect(ALVL85_AREAS.length).toBe(32);
  });

  it("resolves the two distinct 'Night Lord' monsters correctly (Undead in Ruined Temple, Animal in Infernal Pit)", () => {
    const ruinedTemple = ALVL85_AREAS.find(a => a.areaName === 'Ruined Temple')!;
    const nightLordUndead = ruinedTemple.monsters.find(m => m.name === 'Night Lord')!;
    expect(nightLordUndead.type).toBe('undead');
    expect(nightLordUndead.immunities).toEqual([{ element: 'cold', value: 120, starred: true }]);

    const infernalPit = ALVL85_AREAS.find(a => a.areaName === 'Infernal Pit')!;
    const nightLordAnimal = infernalPit.monsters.find(m => m.name === 'Night Lord')!;
    expect(nightLordAnimal.type).toBe('animal');
    expect(nightLordAnimal.immunities).toEqual([{ element: 'lightning', value: 100, starred: false }]);
  });

  it('includes The Worldstone Chamber with no monsters (d2r.world shows no monster list for it)', () => {
    const chamber = ALVL85_AREAS.find(a => a.areaName === 'The Worldstone Chamber')!;
    expect(chamber).toBeDefined();
    expect(chamber.monsters).toEqual([]);
  });
});
