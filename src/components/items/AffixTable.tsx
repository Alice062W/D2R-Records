// src/components/items/AffixTable.tsx
'use client';

import { useTranslations } from 'next-intl';
import type { Affix, AffixGroup } from '@/lib/grail/affixCatalog';
import { groupAffixesByExclusivity } from '@/lib/grail/affixCatalog';
import { formatAffixStatText } from '@/lib/grail/formatAffixTemplate';

function AffixRow({ affix }: { affix: Affix }) {
  const t = useTranslations('Items');
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm border-b border-panel-border last:border-b-0 gap-3">
      <span className="text-[#cbb87f] font-semibold">{affix.name}</span>
      <span className="text-muted text-xs whitespace-nowrap">{t('affixAlvlLabel')} {affix.alvl}</span>
      <div className="text-[#8080f3] text-right flex flex-col">
        {affix.stats.map((stat, i) => (
          <span key={`${stat.key}-${i}`}>{formatAffixStatText(stat)}</span>
        ))}
      </div>
    </div>
  );
}

function AffixGroupBox({ group }: { group: AffixGroup }) {
  return (
    <div className="bg-panel-alt border border-panel-border rounded-xl overflow-hidden">
      <h4 className="px-4 py-2 text-sm font-bold text-gold-bright font-cinzel border-b border-panel-border">
        {group.headerText}
      </h4>
      <div className="flex flex-col">
        {group.affixes.map((a, i) => (
          <AffixRow key={`${a.name}-${a.alvl}-${i}`} affix={a} />
        ))}
      </div>
    </div>
  );
}

function AffixSection({ title, affixes }: { title: string; affixes: Affix[] }) {
  if (affixes.length === 0) return null;
  const groups = groupAffixesByExclusivity(affixes);
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-parchment-bright">{title}</h3>
      <div className="flex flex-col gap-3">
        {groups.map((g, i) => (
          <AffixGroupBox key={`${g.headerAffix.name}-${g.headerAffix.alvl}-${i}`} group={g} />
        ))}
      </div>
    </div>
  );
}

export default function AffixTable({ prefixes, suffixes }: { prefixes: Affix[]; suffixes: Affix[] }) {
  const t = useTranslations('Items');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
      <AffixSection title={t('affixPrefixesLabel')} affixes={prefixes} />
      <AffixSection title={t('affixSuffixesLabel')} affixes={suffixes} />
    </div>
  );
}
