import { describe, it, expect } from 'vitest';
import { LEVEL_UP_GUIDE } from './levelUpGuide';

describe('LEVEL_UP_GUIDE', () => {
  it('has exactly 14 entries matching d2r.world exactly', () => {
    expect(LEVEL_UP_GUIDE).toEqual([
      { clvlMin: 1, clvlMax: 11, difficulty: 'normal', act: 1 },
      { clvlMin: 12, clvlMax: 18, difficulty: 'normal', act: 2 },
      { clvlMin: 19, clvlMax: 23, difficulty: 'normal', act: 3 },
      { clvlMin: 24, clvlMax: 31, difficulty: 'normal', act: 4 },
      { clvlMin: 32, clvlMax: 36, difficulty: 'normal', act: 5 },
      { clvlMin: 37, clvlMax: 43, difficulty: 'nightmare', act: 1 },
      { clvlMin: 44, clvlMax: 48, difficulty: 'nightmare', act: 2 },
      { clvlMin: 49, clvlMax: 52, difficulty: 'nightmare', act: 3 },
      { clvlMin: 53, clvlMax: 62, difficulty: 'nightmare', act: 4 },
      { clvlMin: 63, clvlMax: 73, difficulty: 'hell', act: 1 },
      { clvlMin: 74, clvlMax: 80, difficulty: 'hell', act: 2 },
      { clvlMin: 81, clvlMax: 83, difficulty: 'hell', act: 3 },
      { clvlMin: 83, clvlMax: 94, difficulty: 'hell', act: 4 },
      { clvlMin: 95, clvlMax: 99, difficulty: 'hell', act: 5 },
    ]);
  });
});
