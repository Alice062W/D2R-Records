import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { AURAS } from './auras';

describe('AURAS', () => {
  it('has exactly 20 entries', () => {
    expect(AURAS.length).toBe(20);
  });

  it('Might has the correct clean facts (verified against vendor/d2data/json/skills.json)', () => {
    const might = AURAS.find(a => a.id === 'might')!;
    expect(might.reqLevel).toBe(1);
    expect(might.radiusBase).toBe(16);
    expect(might.radiusPerLevel).toBe(2);
    expect(might.manaCost).toBe(1);
  });

  it('Conviction has a zero radiusPerLevel (fixed radius, verified against source)', () => {
    const conviction = AURAS.find(a => a.id === 'conviction')!;
    expect(conviction.radiusBase).toBe(20);
    expect(conviction.radiusPerLevel).toBe(0);
  });

  it('every aura has a matching icon and visual file in public/skills/', () => {
    for (const aura of AURAS) {
      expect(existsSync(join(process.cwd(), 'public/skills/icons', `${aura.id}.png`))).toBe(true);
      expect(existsSync(join(process.cwd(), 'public/skills/visuals', `${aura.id}.png`))).toBe(true);
    }
  });
});
