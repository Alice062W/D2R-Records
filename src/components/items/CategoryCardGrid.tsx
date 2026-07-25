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

const COMPLETENESS_FILTERS = ['all', 'complete', 'partial', 'none'] as const;
type CompletenessFilter = (typeof COMPLETENESS_FILTERS)[number];
const SORT_OPTIONS = ['default', 'mostComplete', 'leastComplete'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function CategoryCardGrid({
  categories,
  basePath,
  itemIdsByCategory,
}: {
  categories: string[];
  basePath: string;
  // Only Unique/Set category grids pass this — Magic/Rare/Base categories
  // have no "owned" concept, so those grids render without badges/highlight
  // and without the sort/filter controls below.
  itemIdsByCategory?: Record<string, string[]>;
}) {
  const tGrail = useTranslations('Grail');
  const tAffix = useTranslations('AffixCategories');
  const { userId, ownedIds } = useOwnedItems();
  const [completenessFilter, setCompletenessFilter] = useState<CompletenessFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  function labelFor(category: string) {
    const grailKey = `slot_${category}`;
    return tGrail.has(grailKey) ? tGrail(grailKey) : tAffix(category);
  }

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-gold text-ink-950 font-semibold'
        : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
    }`;
  }

  const trackable = userId && !!itemIdsByCategory;

  let entries = categories.map(category => {
    const ids = itemIdsByCategory?.[category];
    const total = ids?.length ?? 0;
    const owned = ids ? ids.filter(id => ownedIds.has(id)).length : 0;
    const state: CompletenessFilter = total === 0 || owned === 0 ? 'none' : owned === total ? 'complete' : 'partial';
    const percent = total > 0 ? owned / total : 0;
    return { category, ids, total, owned, state, percent };
  });

  if (trackable && completenessFilter !== 'all') {
    entries = entries.filter(e => e.state === completenessFilter);
  }
  if (trackable && sortOption !== 'default') {
    entries = [...entries].sort((a, b) =>
      sortOption === 'mostComplete' ? b.percent - a.percent : a.percent - b.percent
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {trackable && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {COMPLETENESS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setCompletenessFilter(f)}
                aria-pressed={completenessFilter === f}
                className={pill(completenessFilter === f)}
              >
                {tGrail(`completenessFilter${f.charAt(0).toUpperCase()}${f.slice(1)}` as never)}
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
                {tGrail(`sort${opt.charAt(0).toUpperCase()}${opt.slice(1)}` as never)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
        {entries.map(({ category, ids, total, owned, state }) => (
          <Link
            key={category}
            href={`${basePath}/${category}`}
            className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border text-sm font-semibold font-cinzel text-parchment-bright hover:border-gold hover:text-gold-bright transition-colors ${
              userId && state === 'complete'
                ? 'bg-green-950/30 border-green-600/50'
                : userId && state === 'partial'
                  ? 'bg-amber-950/20 border-amber-600/40'
                  : 'bg-panel border-panel-border'
            }`}
          >
            <CategoryIcon category={category} />
            {labelFor(category)}
            {userId && ids && <CollectionBadge owned={owned} total={total} />}
          </Link>
        ))}
      </div>
    </div>
  );
}
