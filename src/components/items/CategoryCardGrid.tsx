'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import categoryIcons from '../../../data/category-icons.json';
import { BASE_PATH } from '@/lib/basePath';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';
import CollectionBadge from './CollectionBadge';

function CategoryIcon({ category }: { category: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  const invFile = (categoryIcons as Record<string, string>)[category];
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-12 h-12 object-contain shrink-0"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function CategoryCardGrid({
  categories,
  basePath,
  itemIdsByCategory,
}: {
  categories: string[];
  basePath: string;
  // Only Unique/Set category grids pass this — Magic/Rare/Base categories
  // have no "owned" concept, so those grids render without badges/highlight.
  itemIdsByCategory?: Record<string, string[]>;
}) {
  const tGrail = useTranslations('Grail');
  const tAffix = useTranslations('AffixCategories');
  const { userId, ownedIds } = useOwnedItems();

  function labelFor(category: string) {
    const grailKey = `slot_${category}`;
    return tGrail.has(grailKey) ? tGrail(grailKey) : tAffix(category);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
      {categories.map(category => {
        const ids = itemIdsByCategory?.[category];
        const owned = ids ? ids.filter(id => ownedIds.has(id)).length : 0;
        const complete = userId && ids && ids.length > 0 && owned === ids.length;
        return (
          <Link
            key={category}
            href={`${basePath}/${category}`}
            className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border text-sm font-semibold font-cinzel text-parchment-bright hover:border-gold hover:text-gold-bright transition-colors ${
              complete ? 'bg-green-950/30 border-green-600/50' : 'bg-panel border-panel-border'
            }`}
          >
            <CategoryIcon category={category} />
            {labelFor(category)}
            {userId && ids && <CollectionBadge owned={owned} total={ids.length} />}
          </Link>
        );
      })}
    </div>
  );
}
