// src/components/items/AffixTable.tsx
'use client';

import { useTranslations } from 'next-intl';
import type { Affix, AffixGroup } from '@/lib/grail/affixCatalog';
import { groupAffixesByExclusivity } from '@/lib/grail/affixCatalog';
import { formatAffixStatText } from '@/lib/grail/formatAffixTemplate';

// Magic-item affix values render in the classic magic-item blue; rare-item
// affix values render in the classic rare-item yellow -- matches the
// in-game item-text color convention for each quality.
const STAT_COLOR: Record<'magic' | 'rare', string> = {
  magic: 'text-[#8080f3]',
  rare: 'text-[#fff818]',
};

function AffixRow({ affix, kind }: { affix: Affix; kind: 'magic' | 'rare' }) {
  const t = useTranslations('Items');
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm border-b border-panel-border last:border-b-0 gap-3">
      <span className="text-[#cbb87f] font-semibold">{affix.name}</span>
      <span className="text-muted text-xs whitespace-nowrap">{t('affixAlvlLabel')} {affix.alvl}</span>
      <div className={`${STAT_COLOR[kind]} text-right flex flex-col`}>
        {affix.stats.map((stat, i) => {
          // A stat's min/max ARE the roll range -- no separate "is this
          // random" flag needed in the data, min !== max already means the
          // real item's value on drop is randomly rolled somewhere in that
          // range (min === max means a fixed, non-random value). Excludes
          // composed skill-referencing stats (e.g. "charged"): their min/
          // max are two INDEPENDENT parameters (charge count, skill level),
          // not a single rollable range, so a dice icon there would be
          // misleading.
          const isRandomRange = !stat.composedText && stat.min !== stat.max;
          return (
            <span key={`${stat.key}-${i}`} className="inline-flex items-center justify-end gap-1">
              {isRandomRange && (
                <span
                  role="img"
                  aria-label={t('affixRandomRangeTooltip')}
                  title={t('affixRandomRangeTooltip')}
                  className="text-xs opacity-70"
                >
                  🎲
                </span>
              )}
              {formatAffixStatText(stat)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function AffixGroupBox({ group, kind }: { group: AffixGroup; kind: 'magic' | 'rare' }) {
  return (
    <div className="bg-panel-alt border border-panel-border rounded-xl overflow-hidden">
      <h4 className="px-4 py-2 text-sm font-bold text-gold-bright font-cinzel border-b border-panel-border">
        {group.headerText}
      </h4>
      <div className="flex flex-col">
        {group.affixes.map((a, i) => (
          <AffixRow key={`${a.name}-${a.alvl}-${i}`} affix={a} kind={kind} />
        ))}
      </div>
    </div>
  );
}

function AffixSection({ title, affixes, kind }: { title: string; affixes: Affix[]; kind: 'magic' | 'rare' }) {
  const t = useTranslations('Items');
  if (affixes.length === 0) return null;
  const groups = groupAffixesByExclusivity(affixes, t('affixRandomSkillLabel'));
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-parchment-bright">{title}</h3>
      <div className="flex flex-col gap-3">
        {groups.map((g, i) => (
          <AffixGroupBox key={`${g.headerAffix.name}-${g.headerAffix.alvl}-${i}`} group={g} kind={kind} />
        ))}
      </div>
    </div>
  );
}

export default function AffixTable({ prefixes, suffixes, kind }: { prefixes: Affix[]; suffixes: Affix[]; kind: 'magic' | 'rare' }) {
  const t = useTranslations('Items');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
      <AffixSection title={t('affixPrefixesLabel')} affixes={prefixes} kind={kind} />
      <AffixSection title={t('affixSuffixesLabel')} affixes={suffixes} kind={kind} />
    </div>
  );
}
