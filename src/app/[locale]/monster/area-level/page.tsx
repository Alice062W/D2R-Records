'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import areaLevels from '../../../../../data/area-levels.json';
import AreaLevelTable from '@/components/items/AreaLevelTable';

const ACT_KEYS = ['areaLevelAct1', 'areaLevelAct2', 'areaLevelAct3', 'areaLevelAct4', 'areaLevelAct5'] as const;

export default function AreaLevelPage() {
  const t = useTranslations('Items');
  const [selectedAct, setSelectedAct] = useState(0);
  const areasForAct = areaLevels.filter(a => a.act === selectedAct);

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('areaLevelPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('areaLevelPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {ACT_KEYS.map((key, i) => (
            <button
              key={key}
              onClick={() => setSelectedAct(i)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                selectedAct === i
                  ? 'border-amber-400 text-amber-300 bg-zinc-800'
                  : 'border-zinc-700 text-zinc-300 hover:border-amber-400 hover:text-amber-300'
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
        <AreaLevelTable areas={areasForAct} />
      </div>
    </main>
  );
}
