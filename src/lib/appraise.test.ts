import { describe, it, expect } from 'vitest';
import { appraise } from './appraise';

describe('appraise()', () => {
  it('5-socket Phase Blade (non-eth) → Tier 1 (matches Grief)', () => {
    const result = appraise({ baseCode: '7cr', sockets: 5, ethereal: false, ilvl: 60 });
    expect(result.tier).toBe(1);
    expect(result.verdict).toBe('keep');
    expect(result.matchedRunewords.some(r => r.name === 'Grief')).toBe(true);
  });

  it('3-socket Dusk Shroud (non-eth, ilvl 65) → Tier 1 (matches Enigma)', () => {
    const result = appraise({ baseCode: 'uui', sockets: 3, ethereal: false, ilvl: 65 });
    expect(result.tier).toBe(1);
    expect(result.verdict).toBe('keep');
    expect(result.matchedRunewords.some(r => r.name === 'Enigma')).toBe(true);
  });

  it('4-socket Dusk Shroud (eth) → Tier 1 with eth merc note (Fortitude merc)', () => {
    const result = appraise({ baseCode: 'uui', sockets: 4, ethereal: true, ilvl: 65 });
    expect(result.tier).toBe(1);
    expect(result.verdict).toBe('keep');
    expect(result.matchedRunewords.some(r => r.name === 'Fortitude')).toBe(true);
    expect(result.ethNote).toContain('mercenary');
  });

  it('4-socket Giant Thresher (eth) → Tier 1 (Infinity merc BIS)', () => {
    const result = appraise({ baseCode: '7wc', sockets: 4, ethereal: true, ilvl: 70 });
    expect(result.tier).toBe(1);
    expect(result.matchedRunewords.some(r => r.name === 'Infinity')).toBe(true);
    expect(result.ethNote).toContain('mercenary');
  });

  it('4-socket Monarch (non-eth) → Tier 2 (Spirit)', () => {
    const result = appraise({ baseCode: 'ums', sockets: 4, ethereal: false, ilvl: 55 });
    expect(result.tier).toBeLessThanOrEqual(2);
    expect(result.verdict).toBe('keep');
    expect(result.matchedRunewords.some(r => r.name === 'Spirit')).toBe(true);
  });

  it('1-socket item with no matching runewords → Tier 4 (Dump)', () => {
    const result = appraise({ baseCode: 'uui', sockets: 1, ethereal: false, ilvl: 65 });
    expect(result.tier).toBe(4);
    expect(result.verdict).toBe('dump');
    expect(result.matchedRunewords).toHaveLength(0);
  });

  it('unknown base code → Tier 4 (Dump) with socket note', () => {
    const result = appraise({ baseCode: 'xxx', sockets: 4, ethereal: false, ilvl: 50 });
    expect(result.tier).toBe(4);
    expect(result.verdict).toBe('dump');
  });

  it('ilvl too low for max sockets → socketNote warning', () => {
    const result = appraise({ baseCode: 'uui', sockets: 4, ethereal: false, ilvl: 10 });
    expect(result.socketNote).toBeTruthy();
    expect(result.socketNote).toContain('ilvl');
  });
});
