'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import runewordsFull from '../../../../../data/runewords-full.json';
import RunewordFilters from '@/components/items/RunewordFilters';
import RunewordList from '@/components/items/RunewordList';

const ALL_ITEM_TYPES = Array.from(new Set(runewordsFull.flatMap(rw => rw.itemTypes))).sort();

export default function RunewordsPage() {
  const t = useTranslations('Items');
  const locale = useLocale() as 'en' | 'zh-TW' | 'zh-CN';
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeSockets, setActiveSockets] = useState<number | null>(null);

  const filtered = runewordsFull.filter(rw =>
    (!activeType || rw.itemTypes.includes(activeType)) &&
    (!activeSockets || rw.sockets === activeSockets)
  );

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('runewordsPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('runewordsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <RunewordFilters
          itemTypes={ALL_ITEM_TYPES}
          activeType={activeType}
          onTypeChange={setActiveType}
          activeSockets={activeSockets}
          onSocketsChange={setActiveSockets}
        />
        <RunewordList runewords={filtered} locale={locale} />
      </div>
    </main>
  );
}
