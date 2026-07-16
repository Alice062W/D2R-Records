'use client';

import { useState, useMemo } from 'react';
import BaseItemTable from './BaseItemTable';
import BaseSubCategoryTabs from './BaseSubCategoryTabs';
import type { BaseLine } from '@/lib/grail/basesCatalog';

export default function BaseCategoryList({ lines }: { lines: BaseLine[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const subCategories = useMemo(
    () => Array.from(new Set(lines.map(l => l.subCategory).filter((s): s is string => s !== null))),
    [lines]
  );
  const visible = selected === null ? lines : lines.filter(l => l.subCategory === selected);

  return (
    <div className="flex flex-col gap-4">
      {subCategories.length > 0 && (
        <BaseSubCategoryTabs subCategories={subCategories} selected={selected} onSelect={setSelected} />
      )}
      <div className="flex flex-col gap-4">
        {visible.map(line => <BaseItemTable key={line.id} line={line} />)}
      </div>
    </div>
  );
}
