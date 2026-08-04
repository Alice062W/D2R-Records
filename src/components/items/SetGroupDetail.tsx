'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ItemStatCard from './ItemStatCard';
import type { GrailItem } from '@/lib/grail/catalog';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

const OWNED_FILTERS = ['all', 'collected', 'missing'] as const;
type OwnedFilter = (typeof OWNED_FILTERS)[number];

// Set-group summary bonuses are display-only here (no per-find roll
// tracking, unlike ItemStatCard/GrailItemDetail's item-level properties) --
// just a code+label pair.
interface SummaryProperty {
  code: string;
  label: string;
}

export default function SetGroupDetail({
  setName,
  pieces,
  partialBonuses,
  fullSetBonus,
}: {
  setName: string;
  pieces: GrailItem[];
  partialBonuses: { piecesRequired: number; properties: SummaryProperty[] }[];
  fullSetBonus: SummaryProperty[];
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

      {/* Shared across every piece of this set (not per-item) -- shown once
          here rather than repeated on each ItemStatCard below. Partial and
          Full sit side by side on wide screens to save vertical space, and
          stack (one per row) on narrow/mobile screens. */}
      <div className="bg-panel border border-panel-border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-parchment-bright mb-3">{t('setPartialBonusLabel')}</h3>
          <div className="flex flex-col gap-2">
            {partialBonuses.map(p => (
              <div key={p.piecesRequired} className="text-sm">
                <span className="text-muted">
                  <span>{p.piecesRequired}</span> {t('setPiecesRequiredLabel')}:{' '}
                </span>
                <span>
                  {p.properties.map((prop, i) => (
                    <span key={`${prop.code}-${i}`}>
                      {i > 0 && ', '}
                      <span className="text-[#fff818]">{prop.label}</span>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-parchment-bright mb-3">{t('setFullBonusLabel')}</h3>
          <div className="flex flex-col gap-1 text-sm">
            {fullSetBonus.map((prop, i) => (
              <div key={`${prop.code}-${i}`} className="text-[#22ff55]">{prop.label}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visiblePieces.map(piece => (
          <ItemStatCard key={piece.id} item={piece} showSharedSetBonuses={false} />
        ))}
      </div>
    </div>
  );
}
