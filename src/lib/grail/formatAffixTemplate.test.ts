import { describe, it, expect } from 'vitest';
import { substituteTemplate, formatAffixStatText } from './formatAffixTemplate';

describe('substituteTemplate', () => {
  it('substitutes a %+d placeholder as a signed single value when min === max', () => {
    expect(substituteTemplate('%+d Defense', 5, 5)).toBe('+5 Defense');
  });

  it('substitutes a %+d placeholder as a signed range when min !== max', () => {
    expect(substituteTemplate('%+d Defense', 3, 5)).toBe('+3–5 Defense');
  });

  it('substitutes a %d placeholder as a plain range (no sign)', () => {
    expect(substituteTemplate('Damage Reduced by %d', 3, 5)).toBe('Damage Reduced by 3–5');
  });

  it('substitutes a %d placeholder as a plain single value when min === max', () => {
    expect(substituteTemplate('Damage Reduced by %d', 10, 10)).toBe('Damage Reduced by 10');
  });

  it('substitutes a %+d%% placeholder as a signed range with a trailing percent sign', () => {
    expect(substituteTemplate('%+d% Enhanced Damage', 20, 40)).toBe('+20–40% Enhanced Damage');
  });

  it('substitutes a %d%% placeholder as a plain range with a trailing percent sign', () => {
    expect(substituteTemplate('%d% Chance to Cast', 5, 5)).toBe('5% Chance to Cast');
  });

  it('returns the template unchanged when it has no recognized placeholder', () => {
    expect(substituteTemplate('Indestructible', 1, 1)).toBe('Indestructible');
  });

  it('substitutes a +#% placeholder (the dmg% English-only fallback template) as a signed range', () => {
    expect(substituteTemplate('+#% Enhanced Damage', 10, 20)).toBe('+10–20% Enhanced Damage');
  });

  it('substitutes a +#% placeholder as a signed single value when min === max', () => {
    expect(substituteTemplate('+#% Enhanced Damage', 15, 15)).toBe('+15% Enhanced Damage');
  });
});

describe('formatAffixStatText', () => {
  it('uses the template when present', () => {
    const text = formatAffixStatText({ label: 'Defense', template: '%+d Defense', min: 3, max: 5 });
    expect(text).toBe('+3–5 Defense');
  });

  it('falls back to "label: range" when template is null, applying signed if set', () => {
    const text = formatAffixStatText({ label: 'Maximum Damage', template: null, min: 1, max: 2, signed: true });
    expect(text).toBe('Maximum Damage: +1–2');
  });

  it('falls back to "label: value" (no range) when min === max and template is null', () => {
    const text = formatAffixStatText({ label: 'Sockets', template: null, min: 1, max: 1 });
    expect(text).toBe('Sockets: 1');
  });
});
