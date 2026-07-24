import magicAffixesFull from '../../../data/magic-affixes.json';
import type { Locale } from './catalog';

export type AffixKind = 'magic' | 'rare';

export interface Affix {
  name: string;
  alvl: number;
  min: number;
  max: number;
  itemTypes: string[];
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
  const toAffix = (a: (typeof magicAffixesFull)[number]): Affix => {
    const stat = a.stats[0];
    return {
      name: a.name[locale],
      alvl: a.alvl,
      min: stat?.min ?? 0,
      max: stat?.max ?? 0,
      itemTypes: a.itemTypes,
    };
  };
  return {
    prefixes: relevant.filter(a => a.kind === 'prefix').map(toAffix),
    suffixes: relevant.filter(a => a.kind === 'suffix').map(toAffix),
  };
}
