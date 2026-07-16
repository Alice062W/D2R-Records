'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import categoryIcons from '../../../data/category-icons.json';

function CategoryIcon({ category }: { category: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  const invFile = (categoryIcons as Record<string, string>)[category];
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/items/inv/${invFile}.png`}
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
}: {
  categories: string[];
  basePath: string;
}) {
  const tGrail = useTranslations('Grail');
  const tAffix = useTranslations('AffixCategories');

  function labelFor(category: string) {
    const grailKey = `slot_${category}`;
    return tGrail.has(grailKey) ? tGrail(grailKey) : tAffix(category);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
      {categories.map(category => (
        <Link
          key={category}
          href={`${basePath}/${category}`}
          className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300 transition-colors"
        >
          <CategoryIcon category={category} />
          {labelFor(category)}
        </Link>
      ))}
    </div>
  );
}
