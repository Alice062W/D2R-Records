'use client';

import { useTranslations } from 'next-intl';

export default function BaseSubCategoryTabs({
  subCategories,
  selected,
  onSelect,
}: {
  subCategories: string[];
  selected: string | null;
  onSelect: (subCategory: string | null) => void;
}) {
  const t = useTranslations('Items');
  const options = [null, ...subCategories];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt ?? 'all'}
          onClick={() => onSelect(opt)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            selected === opt
              ? 'border-amber-400 text-amber-300 bg-zinc-800'
              : 'border-zinc-700 text-zinc-300 hover:border-amber-400 hover:text-amber-300'
          }`}
        >
          {t(`baseSubTab_${opt ?? 'all'}`)}
        </button>
      ))}
    </div>
  );
}
