// src/lib/grail/affixCatalog.ts
import magicAffixesFull from '../../../data/magic-affixes.json';
import type { Locale } from './catalog';
import { formatAffixStatText } from './formatAffixTemplate';

export type AffixKind = 'magic' | 'rare';

export interface AffixStat {
  key: string;
  label: string;
  template: string | null;
  min: number;
  max: number;
  isSkillRef: boolean;
  signed?: boolean;
}

export interface Affix {
  name: string;
  alvl: number;
  group: number;
  stats: AffixStat[];
  itemTypes: string[];
}

export interface AffixGroup {
  headerAffix: Affix;
  headerText: string;
  affixes: Affix[];
}

export function getAffixCategories(kind: AffixKind): string[] {
  const relevant = kind === 'rare' ? magicAffixesFull.filter(a => a.rareEligible) : magicAffixesFull;
  const categories = new Set<string>();
  for (const a of relevant) for (const t of a.itemTypes) categories.add(t);
  return Array.from(categories).sort();
}

export function getAffixesForCategory(
  kind: AffixKind,
  category: string,
  locale: Locale
): { prefixes: Affix[]; suffixes: Affix[] } {
  const relevant = magicAffixesFull.filter(
    a => a.itemTypes.includes(category) && (kind === 'magic' || a.rareEligible)
  );
  const toAffix = (a: (typeof magicAffixesFull)[number]): Affix => ({
    name: a.name[locale],
    alvl: a.alvl,
    group: a.group,
    itemTypes: a.itemTypes,
    stats: a.stats.map(s => ({
      key: s.key,
      label: s.label[locale],
      // English-only fallback templates (e.g. dmg%/indestruct) only have
      // an `en` key -- fall back to that rather than losing the template
      // entirely for zh-TW/zh-CN readers.
      template: (s.template as Record<string, string> | null)?.[locale]
        ?? (s.template as Record<string, string> | null)?.en
        ?? null,
      min: s.min,
      max: s.max,
      isSkillRef: s.isSkillRef,
      signed: (s as { signed?: boolean }).signed,
    })),
  });
  return {
    prefixes: relevant.filter(a => a.kind === 'prefix').map(toAffix),
    suffixes: relevant.filter(a => a.kind === 'suffix').map(toAffix),
  };
}

// Buckets a flat affix list by their shared `group` (mutual-exclusivity)
// field -- affixes sharing a group id can never both roll on the same
// item. Every affix belongs to some group (verified: none are 0 in the
// data), including singleton groups of 1. Each group's `headerAffix` is
// its own highest-alvl member; `headerText` is that affix's name plus its
// first stat's formatted text evaluated at its own max value (a compact
// label, not a full multi-stat list, even for multi-stat header affixes).
// Groups are sorted by header alvl descending (highest-level first).
export function groupAffixesByExclusivity(affixes: Affix[]): AffixGroup[] {
  const byGroup = new Map<number, Affix[]>();
  for (const a of affixes) {
    const list = byGroup.get(a.group);
    if (list) list.push(a);
    else byGroup.set(a.group, [a]);
  }
  const groups: AffixGroup[] = [];
  for (const members of byGroup.values()) {
    const sorted = [...members].sort((a, b) => b.alvl - a.alvl);
    const headerAffix = sorted[0];
    const headerStat = headerAffix.stats[0];
    const headerText = headerStat
      ? `${headerAffix.name} — ${formatAffixStatText({ ...headerStat, min: headerStat.max, max: headerStat.max })}`
      : headerAffix.name;
    groups.push({ headerAffix, headerText, affixes: sorted });
  }
  return groups.sort((a, b) => b.headerAffix.alvl - a.headerAffix.alvl);
}
