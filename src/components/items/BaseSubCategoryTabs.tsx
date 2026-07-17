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
          className={`px-3 py-1.5 rounded-lg text-sm font-cinzel border transition-colors ${
            selected === opt
              ? 'border-gold text-gold-bright bg-panel-alt'
              : 'border-panel-border text-parchment hover:border-gold hover:text-gold-bright'
          }`}
        >
          {t(`baseSubTab_${opt ?? 'all'}`)}
        </button>
      ))}
    </div>
  );
}
