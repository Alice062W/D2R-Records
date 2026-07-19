'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import runewordsFull from '../../../../../data/runewords-full.json';
import RunewordFilters from '@/components/items/RunewordFilters';
import RunewordList from '@/components/items/RunewordList';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

const ALL_ITEM_TYPES = Array.from(new Set(runewordsFull.flatMap(rw => rw.itemTypes))).sort();
const OWNED_FILTERS = ['all', 'collected', 'missing'] as const;
type OwnedFilter = (typeof OWNED_FILTERS)[number];

export default function RunewordsPage() {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const locale = useLocale() as 'en' | 'zh-TW' | 'zh-CN';
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeSockets, setActiveSockets] = useState<number | null>(null);
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const { userId, ownedIds } = useOwnedItems();

  let filtered = runewordsFull.filter(rw =>
    (!activeType || rw.itemTypes.includes(activeType)) &&
    (!activeSockets || rw.sockets === activeSockets)
  );
  if (userId && ownedFilter !== 'all') {
    filtered = filtered.filter(rw =>
      ownedFilter === 'collected' ? ownedIds.has(rw.id) : !ownedIds.has(rw.id)
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
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('runewordsPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('runewordsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <RunewordFilters
          itemTypes={ALL_ITEM_TYPES}
          activeType={activeType}
          onTypeChange={setActiveType}
          activeSockets={activeSockets}
          onSocketsChange={setActiveSockets}
        />
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
        <RunewordList runewords={filtered} locale={locale} />
      </div>
    </main>
  );
}
