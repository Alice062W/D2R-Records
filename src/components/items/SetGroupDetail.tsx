'use client';

import { useTranslations } from 'next-intl';
import ItemStatCard from './ItemStatCard';
import type { GrailItem, GrailStat } from '@/lib/grail/catalog';

export default function SetGroupDetail({
  setName,
  pieces,
  partialBonuses,
  fullSetBonuses,
}: {
  setName: string;
  pieces: GrailItem[];
  partialBonuses: { piecesRequired: number; stats: GrailStat[] }[];
  fullSetBonuses: GrailStat[];
}) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-2xl font-bold text-[#22ff55]">{setName}</h2>

      <div className="flex flex-col gap-4">
        {pieces.map(piece => <ItemStatCard key={piece.id} item={piece} />)}
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-3">{t('setPartialBonusLabel')}</h3>
        <div className="flex flex-col gap-2">
          {partialBonuses.map(p => (
            <div key={p.piecesRequired} className="text-sm">
              <span className="text-zinc-500">
                <span>{p.piecesRequired}</span> {t('setPiecesRequiredLabel')}:{' '}
              </span>
              <span className="text-[#22ff55]">
                {p.stats.map(s => `${s.label}: ${s.min === s.max ? s.min : `${s.min}–${s.max}`}`).join(', ')}
              </span>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mt-5 mb-3">{t('setFullBonusLabel')}</h3>
        <div className="flex flex-col gap-1 text-sm text-[#22ff55]">
          {fullSetBonuses.map(s => (
            <div key={s.key}>{s.label}: {s.min === s.max ? s.min : `${s.min}–${s.max}`}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
