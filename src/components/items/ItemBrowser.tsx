'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getAllGrailItems, localizeGrailItem, sortItemsForDisplay, type GrailItem } from '@/lib/grail/catalog';
import ItemCategoryGrid from './ItemCategoryGrid';
import ItemStatCard from './ItemStatCard';

const GRADES = ['normal', 'exceptional', 'elite'] as const;

export default function ItemBrowser({ kind }: { kind: 'unique' | 'set' }) {
  const t = useTranslations('Grail');
  const locale = useLocale();
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [activeGrade, setActiveGrade] = useState<GrailItem['grade'] | null>(null);

  const items = getAllGrailItems()
    .filter(i => i.kind === kind)
    .map(i => localizeGrailItem(i, locale as 'en' | 'zh-TW' | 'zh-CN'));

  function handleSelectSlot(slot: string) {
    setActiveSlot(slot);
    setActiveGrade(null);
  }

  const slotItems: GrailItem[] = activeSlot
    ? sortItemsForDisplay(items.filter(i => i.slotCategory === activeSlot))
    : [];
  const gradesInSlot = GRADES.filter(g => slotItems.some(i => i.grade === g));
  const activeItems = activeGrade ? slotItems.filter(i => i.grade === activeGrade) : slotItems;

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <ItemCategoryGrid items={items} activeSlot={activeSlot} onSelect={handleSelectSlot} />

      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {!activeSlot ? (
          <p className="text-sm text-zinc-500">{t('selectCategoryPrompt')}</p>
        ) : (
          <>
            {gradesInSlot.length > 1 && (
              <div className="flex gap-2">
                {gradesInSlot.map(grade => (
                  <button
                    key={grade}
                    onClick={() => setActiveGrade(g => (g === grade ? null : grade))}
                    aria-pressed={activeGrade === grade}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeGrade === grade
                        ? 'bg-amber-500 text-zinc-950 font-semibold'
                        : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {t(`grade_${grade}`)}
                  </button>
                ))}
              </div>
            )}
            {activeItems.map(item => <ItemStatCard key={item.id} item={item} />)}
          </>
        )}
      </div>
    </div>
  );
}
