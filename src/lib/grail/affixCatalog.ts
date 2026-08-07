// src/lib/grail/affixCatalog.ts
import magicAffixesFull from '../../../data/magic-affixes.json';
import type { Locale } from './catalog';
import { formatAffixStatText } from './formatAffixTemplate';

export type AffixKind = 'magic' | 'rare';

export interface AffixStat {
  key: string;
  label: string;
  template: string | null;
  composedText?: string;
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
      composedText: (s.composedText as Record<string, string> | undefined)?.[locale]
        ?? (s.composedText as Record<string, string> | undefined)?.en,
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
// data), including singleton groups of 1.
//
// headerText computation (verified against 2 real cases): if every
// stat across every member is a simple (non-skill-referencing) stat,
// list each DISTINCT stat key's best (highest min/max) value across the
// whole group -- fixes both "of the Sun" (2 real, comparable stats, only
// the first was shown) and heterogeneous groups like the 3-element
// absorb family (fire/cold/lightning, same alvl, arbitrarily picking one
// as "the" representative made no sense since they're not comparable).
// If ANY member has a skill-referencing stat, use a general title (just
// the highest-alvl affix's own name, no computed value) -- "best value"
// is meaningless for a group of e.g. 213 different granted skills.
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
    const hasSkillRef = members.some(a => a.stats.some(s => s.isSkillRef));
    const headerText = hasSkillRef ? headerAffix.name : bestPropertiesHeaderText(members, headerAffix);
    groups.push({ headerAffix, headerText, affixes: sorted });
  }
  return groups.sort((a, b) => b.headerAffix.alvl - a.headerAffix.alvl);
}

// For a group of simple (non-skill-ref) affixes: find every distinct
// stat `key` used by ANY member, and for each key, the single highest
// min/max pair achieved by any member carrying that key -- format each
// via formatAffixStatText and join them. Falls back to just the header
// affix's name if it has no stats at all (shouldn't happen in practice).
function bestPropertiesHeaderText(members: Affix[], headerAffix: Affix): string {
  const bestByKey = new Map<string, AffixStat>();
  for (const affix of members) {
    for (const stat of affix.stats) {
      const existing = bestByKey.get(stat.key);
      if (!existing || stat.max > existing.max) bestByKey.set(stat.key, stat);
    }
  }
  if (bestByKey.size === 0) return headerAffix.name;
  const propertyTexts = Array.from(bestByKey.values()).map(stat => formatAffixStatText(stat));
  return `${headerAffix.name} — ${propertyTexts.join(', ')}`;
}
