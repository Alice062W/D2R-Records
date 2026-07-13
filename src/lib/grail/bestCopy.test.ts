import { describe, it, expect } from 'vitest';
import { compareFinds, bestFind, sortFindsByRank } from './bestCopy';

describe('compareFinds', () => {
  it('ranks the higher value of the top-priority stat first', () => {
    const a = { statValues: { str: 10 } };
    const b = { statValues: { str: 8 } };
    expect(compareFinds(a, b, ['str'])).toBeLessThan(0);
    expect(compareFinds(b, a, ['str'])).toBeGreaterThan(0);
  });

  it('falls back to the next-priority stat on a tie', () => {
    const a = { statValues: { str: 8, dex: 10 } };
    const b = { statValues: { str: 8, dex: 5 } };
    expect(compareFinds(a, b, ['str', 'dex'])).toBeLessThan(0);
  });

  it('ranks a copy missing the priority stat below one that has it', () => {
    const withStat = { statValues: { str: 5 } };
    const withoutStat = { statValues: {} };
    expect(compareFinds(withStat, withoutStat, ['str'])).toBeLessThan(0);
    expect(compareFinds(withoutStat, withStat, ['str'])).toBeGreaterThan(0);
  });

  it('returns 0 when both are missing every priority stat', () => {
    const a = { statValues: {} };
    const b = { statValues: {} };
    expect(compareFinds(a, b, ['str', 'dex'])).toBe(0);
  });
});

describe('bestFind', () => {
  it('returns null for an empty list', () => {
    expect(bestFind([], ['str'])).toBeNull();
  });

  it('returns the highest-ranked find', () => {
    const finds = [
      { statValues: { str: 5 } },
      { statValues: { str: 9 } },
      { statValues: { str: 7 } },
    ];
    expect(bestFind(finds, ['str'])?.statValues.str).toBe(9);
  });
});

describe('sortFindsByRank', () => {
  it('orders all copies best-first', () => {
    const finds = [
      { statValues: { str: 5 } },
      { statValues: { str: 9 } },
      { statValues: { str: 7 } },
    ];
    const sorted = sortFindsByRank(finds, ['str']);
    expect(sorted.map(f => f.statValues.str)).toEqual([9, 7, 5]);
  });
});
