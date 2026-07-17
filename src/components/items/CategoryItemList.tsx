'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import ItemStatCard from './ItemStatCard';

const GRADES = ['normal', 'exceptional', 'elite'] as const;

export default function CategoryItemList({ items }: { items: GrailItem[] }) {
  const t = useTranslations('Grail');
  const [activeGrade, setActiveGrade] = useState<GrailItem['grade'] | null>(null);

  const gradesPresent = GRADES.filter(g => items.some(i => i.grade === g));
  const activeItems = activeGrade ? items.filter(i => i.grade === activeGrade) : items;

  return (
    <div className="flex flex-col gap-6 w-full">
      {gradesPresent.length > 1 && (
        <div className="flex gap-2">
          {gradesPresent.map(grade => (
            <button
              key={grade}
              onClick={() => setActiveGrade(g => (g === grade ? null : grade))}
              aria-pressed={activeGrade === grade}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeGrade === grade
                  ? 'bg-gold text-ink-950 font-semibold'
                  : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
              }`}
            >
              {t(`grade_${grade}`)}
            </button>
          ))}
        </div>
      )}
      {activeItems.map(item => <ItemStatCard key={item.id} item={item} />)}
    </div>
  );
}
