'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import ItemStatCard from './ItemStatCard';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

const GRADES = ['normal', 'exceptional', 'elite'] as const;
const OWNED_FILTERS = ['all', 'collected', 'missing'] as const;
type OwnedFilter = (typeof OWNED_FILTERS)[number];

export default function CategoryItemList({ items }: { items: GrailItem[] }) {
  const t = useTranslations('Grail');
  const [activeGrade, setActiveGrade] = useState<GrailItem['grade'] | null>(null);
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const { userId, ownedIds } = useOwnedItems();

  const gradesPresent = GRADES.filter(g => items.some(i => i.grade === g));
  let activeItems = activeGrade ? items.filter(i => i.grade === activeGrade) : items;
  if (userId && ownedFilter !== 'all') {
    activeItems = activeItems.filter(i =>
      ownedFilter === 'collected' ? ownedIds.has(i.id) : !ownedIds.has(i.id)
    );
  }

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-gold text-ink-950 font-semibold'
        : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
    }`;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {gradesPresent.length > 1 && (
        <div className="flex gap-2">
          {gradesPresent.map(grade => (
            <button
              key={grade}
              onClick={() => setActiveGrade(g => (g === grade ? null : grade))}
              aria-pressed={activeGrade === grade}
              className={pill(activeGrade === grade)}
            >
              {t(`grade_${grade}`)}
            </button>
          ))}
        </div>
      )}
      {userId && (
        <div className="flex gap-2">
          {OWNED_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setOwnedFilter(f)}
              aria-pressed={ownedFilter === f}
              className={pill(ownedFilter === f)}
            >
              {t(`filter${f.charAt(0).toUpperCase()}${f.slice(1)}` as 'filterAll' | 'filterCollected' | 'filterMissing')}
            </button>
          ))}
        </div>
      )}
      {activeItems.map(item => <ItemStatCard key={item.id} item={item} />)}
    </div>
  );
}
