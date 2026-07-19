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

      <div className="bg-panel border border-panel-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-parchment-bright mb-3">{t('setPartialBonusLabel')}</h3>
        <div className="flex flex-col gap-2">
          {partialBonuses.map(p => (
            <div key={p.piecesRequired} className="text-sm">
              <span className="text-muted">
                <span>{p.piecesRequired}</span> {t('setPiecesRequiredLabel')}:{' '}
              </span>
              <span>
                {p.stats.map((s, i) => (
                  <span key={s.key}>
                    {i > 0 && ', '}
                    <span className={s.isSkillRef ? 'text-[#ff4a69]' : s.min === s.max ? 'text-[#22ff55]' : 'text-[#fff818]'}>
                      {s.label}: {s.min === s.max ? s.min : `${s.min}–${s.max}`}
                      {s.min !== s.max && <> <span aria-hidden="true">🎲</span></>}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-parchment-bright mt-5 mb-3">{t('setFullBonusLabel')}</h3>
        <div className="flex flex-col gap-1 text-sm">
          {fullSetBonuses.map(s => (
            <div key={s.key} className={s.isSkillRef ? 'text-[#ff4a69]' : s.min === s.max ? 'text-[#22ff55]' : 'text-[#fff818]'}>
              {s.label}: {s.min === s.max ? s.min : `${s.min}–${s.max}`}
              {s.min !== s.max && <> <span aria-hidden="true">🎲</span></>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
