'use client';

import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { bestFind } from '@/lib/grail/bestCopy';

export default function GrailItemCard({
  item,
  finds,
  onClick,
}: {
  item: GrailItem;
  finds: FindRecord[];
  onClick: () => void;
}) {
  const t = useTranslations('Grail');
  const found = finds.length > 0;
  const best = found ? bestFind(finds, item.statPriority) : null;
  const topStat = best && item.statPriority[0]
    ? item.stats.find(s => s.key === item.statPriority[0])
    : undefined;
  const topValue = best && topStat ? best.statValues[topStat.key] : undefined;

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
        found
          ? 'border-amber-500/50 bg-zinc-900 hover:border-amber-400'
          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
      }`}
    >
      <div className={`font-semibold text-sm ${found ? 'text-zinc-100' : 'text-zinc-600'}`}>
        {item.name}
      </div>
      {found && (
        <div className="text-xs text-zinc-400 mt-1">
          {finds.length === 1 ? t('copiesOne') : t('copiesMany', { count: finds.length })}
          {topStat && topValue !== undefined && (
            <> · {t('bestLabel', { stat: topStat.label, value: topValue })}</>
          )}
        </div>
      )}
    </button>
  );
}
