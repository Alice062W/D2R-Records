'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import runewordsFull from '../../../../../data/runewords-full.json';
import RunewordFilters from '@/components/items/RunewordFilters';
import RunewordList from '@/components/items/RunewordList';
import CollectionBadge from '@/components/items/CollectionBadge';
import CollectionSummaryBar from '@/components/items/CollectionSummaryBar';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

const ALL_ITEM_TYPES = Array.from(new Set(runewordsFull.flatMap(rw => rw.itemTypes))).sort();
const ALL_RUNEWORD_IDS = runewordsFull.map(rw => rw.id);
const OWNED_FILTERS = ['all', 'collected', 'missing'] as const;
type OwnedFilter = (typeof OWNED_FILTERS)[number];
const SORT_OPTIONS = ['default', 'ownedFirst', 'missingFirst'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function RunewordsPage() {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const locale = useLocale() as 'en' | 'zh-TW' | 'zh-CN';
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeSockets, setActiveSockets] = useState<number | null>(null);
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const { userId, ownedIds } = useOwnedItems();

  // The current type+socket combination, before the owned filter is
  // applied — this is what the status box below reports progress for,
  // independent of whether the visible list is further narrowed to
  // Collected/Missing.
  const combinationItems = runewordsFull.filter(rw =>
    (!activeType || rw.itemTypes.includes(activeType)) &&
    (!activeSockets || rw.sockets === activeSockets)
  );
  const combinationOwnedCount = combinationItems.filter(rw => ownedIds.has(rw.id)).length;
  const combinationLabel = [
    activeType ? tGrail(`slot_${activeType}` as never) : null,
    activeSockets ? `${activeSockets} ${t('runewordsSocketsLabel')}` : null,
  ].filter(Boolean).join(' · ') || t('runewordsCombinationAllLabel');

  let filtered = combinationItems;
  if (userId && ownedFilter !== 'all') {
    filtered = filtered.filter(rw =>
      ownedFilter === 'collected' ? ownedIds.has(rw.id) : !ownedIds.has(rw.id)
    );
  }
  if (userId && sortOption !== 'default') {
    filtered = [...filtered].sort((a, b) => {
      const aOwned = ownedIds.has(a.id) ? 1 : 0;
      const bOwned = ownedIds.has(b.id) ? 1 : 0;
      return sortOption === 'ownedFirst' ? bOwned - aOwned : aOwned - bOwned;
    });
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
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('runewordsPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('runewordsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <CollectionSummaryBar itemIds={ALL_RUNEWORD_IDS} />
        <RunewordFilters
          itemTypes={ALL_ITEM_TYPES}
          activeType={activeType}
          onTypeChange={setActiveType}
          activeSockets={activeSockets}
          onSocketsChange={setActiveSockets}
        />
        {userId && (
          <div className="bg-panel border border-panel-border rounded-xl p-4 flex items-center justify-between gap-3">
            <span className="text-sm font-cinzel text-parchment-bright">{combinationLabel}</span>
            <CollectionBadge owned={combinationOwnedCount} total={combinationItems.length} />
          </div>
        )}
        {userId && (
          <div className="flex flex-wrap items-center gap-3">
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
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              aria-label={tGrail('sortDefault')}
              className="px-3 py-1.5 rounded-lg text-sm bg-panel border border-panel-border text-parchment"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {tGrail(`sort${opt.charAt(0).toUpperCase()}${opt.slice(1)}` as 'sortDefault' | 'sortOwnedFirst' | 'sortMissingFirst')}
                </option>
              ))}
            </select>
          </div>
        )}
        <RunewordList runewords={filtered} locale={locale} />
      </div>
    </main>
  );
}
