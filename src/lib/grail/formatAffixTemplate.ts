import { signedRange, signedValue } from './formatStat';

// The only 4 printf-style placeholder shapes present anywhere in
// data/magic-affixes.json's stats[].template field (verified during the
// step-1 data work) -- checked longest/most-specific first so "%+d%"
// isn't matched by the shorter "%+d" check first.
const PLACEHOLDER_ORDER = ['%+d%', '%d%', '%+d', '%d'] as const;

export function substituteTemplate(template: string, min: number, max: number): string {
  for (const token of PLACEHOLDER_ORDER) {
    if (!template.includes(token)) continue;
    const hasPercent = token.endsWith('%');
    const signed = token.startsWith('%+d');
    const numberText = min === max
      ? (signed ? signedValue(min, true) : String(min))
      : (signed ? signedRange(min, max, true) : `${min}–${max}`);
    return template.replace(token, hasPercent ? `${numberText}%` : numberText);
  }
  return template;
}

export interface AffixStatLike {
  label: string;
  template: string | null;
  min: number;
  max: number;
  signed?: boolean;
}

// Real formatted stat text for one affix stat -- the template path when
// available (the common case, verified during step 1), falling back to
// "label: range" for the handful of stats with no resolved template
// (genuinely-unresolved codes, or skill-referencing compound stats which
// intentionally get template: null).
export function formatAffixStatText(stat: AffixStatLike): string {
  if (stat.template) return substituteTemplate(stat.template, stat.min, stat.max);
  const range = stat.min === stat.max
    ? signedValue(stat.min, stat.signed)
    : signedRange(stat.min, stat.max, stat.signed);
  return `${stat.label}: ${range}`;
}
