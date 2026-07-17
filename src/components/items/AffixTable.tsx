import { useTranslations } from 'next-intl';
import type { Affix } from '@/lib/grail/affixCatalog';

function AffixSection({ title, affixes }: { title: string; affixes: Affix[] }) {
  const t = useTranslations('Items');
  if (affixes.length === 0) return null;
  return (
    <div>
      <h3 className="text-lg font-semibold text-parchment-bright mb-2">{title}</h3>
      <div className="flex flex-col gap-1">
        {affixes.map((a, i) => (
          <div
            key={`${a.name}-${i}`}
            className="flex items-center justify-between bg-panel border border-panel-border rounded-lg px-4 py-2 text-sm"
          >
            <span className="text-[#cbb87f] font-semibold">{a.name}</span>
            <span className="text-muted text-xs">
              {t('affixAlvlLabel')} {a.alvl}
            </span>
            <span className="text-[#8080f3]">
              {a.min}–{a.max}
            </span>
          </div>
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
