'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ItemStatCard from './ItemStatCard';
import type { GrailItem, GrailStat } from '@/lib/grail/catalog';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

const OWNED_FILTERS = ['all', 'collected', 'missing'] as const;
type OwnedFilter = (typeof OWNED_FILTERS)[number];

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
  const tGrail = useTranslations('Grail');
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const { userId, ownedIds } = useOwnedItems();

  const visiblePieces = !userId || ownedFilter === 'all'
    ? pieces
    : pieces.filter(p => (ownedFilter === 'collected' ? ownedIds.has(p.id) : !ownedIds.has(p.id)));

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-gold text-ink-950 font-semibold'
        : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
    }`;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-2xl font-bold text-[#22ff55]">{setName}</h2>

      {userId && (
        <div className="flex gap-2">
          {OWNED_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setOwnedFilter(f)}
              aria-pressed={ownedFilter === f}
              className={pill(ownedFilter === f)}
            >
              {tGrail(`filter${f.charAt(0).toUpperCase()}${f.slice(1)}` as 'filterAll' | 'filterCollected' | 'filterMissing')}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {visiblePieces.map(piece => <ItemStatCard key={piece.id} item={piece} />)}
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
                      {s.composed ? s.label : (
                        <>
                          {s.label}: {s.min === s.max ? s.min : `${s.min}–${s.max}`}
                          {s.min !== s.max && <> <span aria-hidden="true">🎲</span></>}
                        </>
                      )}
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
              {s.composed ? s.label : (
                <>
                  {s.label}: {s.min === s.max ? s.min : `${s.min}–${s.max}`}
                  {s.min !== s.max && <> <span aria-hidden="true">🎲</span></>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
