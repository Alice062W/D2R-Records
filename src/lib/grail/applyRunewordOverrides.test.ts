// src/lib/grail/applyRunewordOverrides.test.ts
import { describe, it, expect } from 'vitest';
import { applyRunewordOverrides, type RunewordOverride, type RunewordStat } from './applyRunewordOverrides';

function stat(overrides: Partial<RunewordStat>): RunewordStat {
  return {
    code: 'ac',
    label: { en: 'Defense', 'zh-TW': '防禦', 'zh-CN': '防御' },
    min: 10,
    max: 10,
    variable: false,
    ...overrides,
  };
}

describe('applyRunewordOverrides', () => {
  it('leaves a runeword untouched when it has no override entry', () => {
    const runewords = [{ id: 'rw-1', stats: [stat({ code: 'ac' })] }];
    const result = applyRunewordOverrides(runewords, {});
    expect(result[0]).toBe(runewords[0]); // same reference -- no unnecessary copy
  });

  it('skips the _readme entry (a string array, not a real override)', () => {
    const runewords = [{ id: 'rw-1', stats: [stat({ code: 'ac' })] }];
    const result = applyRunewordOverrides(runewords, { _readme: ['some', 'notes'] });
    expect(result[0].stats).toEqual(runewords[0].stats);
  });

  it('adds new stats from addStats', () => {
    const runewords = [{ id: 'rw-1', stats: [stat({ code: 'ac' })] }];
    const override: RunewordOverride = {
      name: 'Test', verifiedAt: '2026-01-01', source: 'test',
      addStats: [stat({ code: 'vit', min: 10, max: 10 })],
    };
    const result = applyRunewordOverrides(runewords, { 'rw-1': override });
    expect(result[0].stats.map(s => s.code)).toEqual(['ac', 'vit']);
  });

  it('replaces an existing stat by code via replaceStats', () => {
    const runewords = [{ id: 'rw-1', stats: [stat({ code: 'mag%', min: 1, max: 15 })] }];
    const override: RunewordOverride = {
      name: 'Test', verifiedAt: '2026-01-01', source: 'test',
      replaceStats: [stat({ code: 'mag%', min: 26, max: 40 })],
    };
    const result = applyRunewordOverrides(runewords, { 'rw-1': override });
    expect(result[0].stats).toHaveLength(1);
    expect(result[0].stats[0]).toEqual({ min: 26, max: 40, code: 'mag%', label: expect.any(Object), variable: false });
  });

  it('removes stats listed in removeStatCodes', () => {
    const runewords = [{ id: 'rw-1', stats: [stat({ code: 'ac' }), stat({ code: 'vit' })] }];
    const override: RunewordOverride = {
      name: 'Test', verifiedAt: '2026-01-01', source: 'test',
      removeStatCodes: ['vit'],
    };
    const result = applyRunewordOverrides(runewords, { 'rw-1': override });
    expect(result[0].stats.map(s => s.code)).toEqual(['ac']);
  });

  it('only affects the runeword matching the override id', () => {
    const runewords = [
      { id: 'rw-1', stats: [stat({ code: 'ac' })] },
      { id: 'rw-2', stats: [stat({ code: 'vit' })] },
    ];
    const override: RunewordOverride = {
      name: 'Test', verifiedAt: '2026-01-01', source: 'test',
      addStats: [stat({ code: 'str' })],
    };
    const result = applyRunewordOverrides(runewords, { 'rw-1': override });
    expect(result[0].stats.map(s => s.code)).toEqual(['ac', 'str']);
    expect(result[1]).toBe(runewords[1]);
  });
});
