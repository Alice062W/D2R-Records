// src/lib/grail/formatAffixTemplate.ts
import { signedRange, signedValue } from './formatStat';

// The 4 printf-style numeric placeholder shapes used across
// data/magic-affixes.json's stats[].template field, plus the "+#%"/"#%"/
// "#" shape used by the properties.txt Tooltip-sourced English-only
// fallback templates (currently just "dmg%"). Checked longest/most-
// specific first so e.g. "%+d%" isn't matched by the shorter "%+d"
// check first.
const PLACEHOLDER_ORDER = ['%+d%', '%d%', '%+d', '%d', '+#%', '#%', '#'] as const;

// Templates use printf-style "%%" to mean one literal "%" character (e.g.
// "Cold Resist %+d%%" means "Cold Resist +N%", not "+N%%") -- verified
// against 31 distinct templates in the dataset, all following this exact
// escape pattern. substituteTemplate previously matched "%+d%"/"%d%" as
// a single 4-character token, leaving the second "%" of the escape
// un-consumed and producing a doubled "%%" in the output. Fix: substitute
// the numeric placeholder first, then collapse any remaining "%%" to "%".
export function substituteTemplate(template: string, min: number, max: number): string {
  for (const token of PLACEHOLDER_ORDER) {
    if (!template.includes(token)) continue;
    const hasPercent = token.endsWith('%');
    const signed = token.startsWith('%+d') || token.startsWith('+#');
    const numberText = min === max
      ? (signed ? signedValue(min, true) : String(min))
      : (signed ? signedRange(min, max, true) : `${min}–${max}`);
    const substituted = template.replace(token, hasPercent ? `${numberText}%` : numberText);
    return substituted.replace(/%%/g, '%');
  }
  return template;
}

export interface AffixStatLike {
  label: string;
  template: string | null;
  min: number;
  max: number;
  signed?: boolean;
  composedText?: string;
}

// Real formatted stat text for one affix stat. Priority: a fully-composed
// sentence (skill-referencing stats like "Chance to Cast" -- 3+
// independent values, composed once at generation time, see
// generate-grail-data.mjs's composedSkillRefText) > a substituted
// template (the common case) > "label: range" fallback for stats with
// neither (genuinely-unresolved codes).
export function formatAffixStatText(stat: AffixStatLike): string {
  if (stat.composedText) return stat.composedText;
  if (stat.template) return substituteTemplate(stat.template, stat.min, stat.max);
  const range = stat.min === stat.max
    ? signedValue(stat.min, stat.signed)
    : signedRange(stat.min, stat.max, stat.signed);
  return `${stat.label}: ${range}`;
}
