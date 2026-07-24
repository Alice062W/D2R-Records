'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Affix } from '@/lib/grail/affixCatalog';

interface AffixGroup {
  name: string;
  // Tiers sorted by alvl descending; tiers[0] is the max-tier shown collapsed
  // (matches d2r.world's "(Max) Magic Properties" collapsed-row behavior).
  tiers: Affix[];
}

function groupAffixes(affixes: Affix[]): AffixGroup[] {
  const byName = new Map<string, Affix[]>();
  for (const a of affixes) {
    const existing = byName.get(a.name);
    if (existing) existing.push(a);
    else byName.set(a.name, [a]);
  }
  return Array.from(byName.entries()).map(([name, tiers]) => ({
    name,
    tiers: [...tiers].sort((a, b) => b.alvl - a.alvl),
  }));
}

function AffixRow({ group }: { group: AffixGroup }) {
  const t = useTranslations('Items');
  const tCat = useTranslations('AffixCategories');
  const tGrail = useTranslations('Grail');
  const [expanded, setExpanded] = useState(false);
  const maxTier = group.tiers[0];
  const hasMultipleTiers = group.tiers.length > 1;
  // AffixCategories only holds the ambiguous/compound slugs (e.g.
  // "barbarianHelms") that have no equivalent elsewhere. The plain ones
  // (e.g. "rings", "boots") already have complete translations under
  // Grail's slot_* keys (used by the main category nav) — reuse those
  // instead of duplicating ~24 strings across 3 locales. Untranslated
  // slugs (shouldn't happen, but just in case) fall back to a
  // capitalized raw string rather than triggering a missing-message error.
  const categoryLabel = (it: string) => {
    if (tCat.has(it)) return tCat(it);
    const slotKey = `slot_${it}`;
    if (tGrail.has(slotKey)) return tGrail(slotKey as never);
    return it.charAt(0).toUpperCase() + it.slice(1);
  };

  return (
    <div className="bg-panel border border-panel-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => hasMultipleTiers && setExpanded(e => !e)}
        aria-expanded={hasMultipleTiers ? expanded : undefined}
        disabled={!hasMultipleTiers}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-left disabled:cursor-default enabled:hover:bg-panel-alt transition-colors"
      >
        <span className="flex items-center gap-2">
          {hasMultipleTiers ? (
            <span
              className="text-muted text-xs transition-transform inline-block"
              style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              aria-hidden="true"
            >
              ▶
            </span>
          ) : (
            <span className="w-3" aria-hidden="true" />
          )}
          <span className="text-[#cbb87f] font-semibold">{group.name}</span>
        </span>
        <span className="text-muted text-xs">
          {t('affixAlvlLabel')} {maxTier.alvl}
        </span>
        <span className="text-[#8080f3]">
          {maxTier.min}–{maxTier.max}
        </span>
      </button>
      {hasMultipleTiers && expanded && (
        <div className="flex flex-col border-t border-panel-border">
          {group.tiers.map((tier, i) => (
            <div
              key={`${tier.alvl}-${i}`}
              className="flex items-center justify-between px-4 py-2 pl-9 text-xs bg-panel-alt/50 border-b border-panel-border last:border-b-0"
            >
              <span className="text-muted truncate max-w-[45%]" title={tier.itemTypes.map(categoryLabel).join(', ')}>
                {tier.itemTypes.map(categoryLabel).join(', ')}
              </span>
              <span className="text-muted">
                {t('affixAlvlLabel')} {tier.alvl}
              </span>
              <span className="text-[#8080f3]">
                {tier.min}–{tier.max}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AffixSection({ title, affixes }: { title: string; affixes: Affix[] }) {
  if (affixes.length === 0) return null;
  const groups = groupAffixes(affixes);
  return (
    <div>
      <h3 className="text-lg font-semibold text-parchment-bright mb-2">{title}</h3>
      <div className="flex flex-col gap-1">
        {groups.map(group => (
          <AffixRow key={group.name} group={group} />
        ))}
      </div>
    </div>
  );
}

export default function AffixTable({ prefixes, suffixes }: { prefixes: Affix[]; suffixes: Affix[] }) {
  const t = useTranslations('Items');
  return (
    <div className="flex flex-col gap-6 w-full">
      <AffixSection title={t('affixPrefixesLabel')} affixes={prefixes} />
      <AffixSection title={t('affixSuffixesLabel')} affixes={suffixes} />
    </div>
  );
}
