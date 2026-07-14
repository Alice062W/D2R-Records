'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { bestFind } from '@/lib/grail/bestCopy';

const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-amber-300',
  set: 'text-green-400',
};

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
  const [iconOk, setIconOk] = useState(true);
  const found = finds.length > 0;
  const best = found ? bestFind(finds, item.statPriority) : null;
  const topStat = best && item.statPriority[0]
    ? item.stats.find(s => s.key === item.statPriority[0])
    : undefined;
  const topValue = best && topStat ? best.statValues[topStat.key] : undefined;

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border p-3 transition-colors cursor-pointer flex gap-2 items-start ${
        found
          ? 'border-amber-500/50 bg-zinc-900 hover:border-amber-400'
          : 'border-zinc-800 bg-zinc-950 opacity-70 hover:opacity-100 hover:border-zinc-600'
      }`}
    >
      {iconOk && item.invFile && (
        // next/image (not a plain <img>) so the GitHub Pages basePath is applied,
        // same as the appraiser's icons; onError hides missing icons gracefully.
        <Image
          src={`/items/inv/${item.invFile}.png`}
          alt=""
          width={32}
          height={32}
          className="shrink-0 mt-0.5 object-contain"
          onError={() => setIconOk(false)}
        />
      )}
      <span>
        <span className={`block font-semibold text-sm ${found ? NAME_COLOR[item.kind] : 'text-zinc-500'}`}>
          {item.name}
        </span>
        <span className="block text-xs text-zinc-500">{item.baseName}</span>
        {found && (
          <span className="block text-xs text-zinc-400 mt-1">
            {finds.length === 1 ? t('copiesOne') : t('copiesMany', { count: finds.length })}
            {topStat && topValue !== undefined && (
              <> · {t('bestLabel', { stat: topStat.label, value: topValue })}</>
            )}
          </span>
        )}
      </span>
    </button>
  );
}
