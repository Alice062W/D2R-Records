'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import runes from '../../../../../data/runes.json';
import RuneMap from '@/components/items/RuneMap';
import RuneList from '@/components/items/RuneList';
import CollectionSummaryBar from '@/components/items/CollectionSummaryBar';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

const ALL_RUNE_IDS = runes.map(r => r.id);
const OWNED_FILTERS = ['all', 'collected', 'missing'] as const;
type OwnedFilter = (typeof OWNED_FILTERS)[number];

export default function RunesPage() {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const locale = useLocale() as 'en' | 'zh-TW' | 'zh-CN';
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const { userId, ownedIds } = useOwnedItems();

  let filtered = runes;
  if (userId && ownedFilter !== 'all') {
    filtered = filtered.filter(r =>
      ownedFilter === 'collected' ? ownedIds.has(r.id) : !ownedIds.has(r.id)
    );
  }

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm font-cinzel transition-colors ${
      active
        ? 'bg-gold text-ink-950 font-semibold'
        : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
    }`;
  }

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('runesPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('runesPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <CollectionSummaryBar itemIds={ALL_RUNE_IDS} />
          {userId && (
            <div className="flex flex-wrap gap-2">
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
        </div>
        <RuneMap runes={runes} locale={locale} />
        <RuneList runes={filtered} locale={locale} />
      </div>
    </main>
  );
}
