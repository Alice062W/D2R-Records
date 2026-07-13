'use client';

import { useEffect, useState } from 'react';
import { getAllGrailItems, type GrailItem } from '@/lib/grail/catalog';
import { listFinds, type FindRecord } from '@/lib/grail/findsApi';
import AuthGate from './AuthGate';
import GrailItemCard from './GrailItemCard';

const CATEGORIES: GrailItem['category'][] = ['weapons', 'armor', 'other'];
const CATEGORY_LABELS: Record<GrailItem['category'], string> = {
  weapons: 'Weapons',
  armor: 'Armor',
  other: 'Other',
};

function GrailChecklistInner() {
  const [finds, setFinds] = useState<FindRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GrailItem | null>(null);
  const items = getAllGrailItems();

  useEffect(() => {
    listFinds()
      .then(setFinds)
      .catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!finds) return <p className="text-zinc-500 text-sm">Loading your collection…</p>;

  const findsByCode = new Map<string, FindRecord[]>();
  for (const f of finds) {
    const list = findsByCode.get(f.itemCode) ?? [];
    list.push(f);
    findsByCode.set(f.itemCode, list);
  }

  const foundCount = items.filter(i => (findsByCode.get(i.code)?.length ?? 0) > 0).length;

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-zinc-400">
        {foundCount} / {items.length} items found
      </p>
      {CATEGORIES.map(category => {
        const categoryItems = items.filter(i => i.category === category);
        const categoryFound = categoryItems.filter(
          i => (findsByCode.get(i.code)?.length ?? 0) > 0
        ).length;
        return (
          <section key={category}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              {CATEGORY_LABELS[category]} ({categoryFound}/{categoryItems.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {categoryItems.map(item => (
                <GrailItemCard
                  key={item.id}
                  item={item}
                  finds={findsByCode.get(item.code) ?? []}
                  onClick={() => setSelected(item)}
                />
              ))}
            </div>
          </section>
        );
      })}
      {selected && (
        <ItemDetailPlaceholder item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// Replaced by the real component in Task 7; kept here so Task 6 is independently
// testable/mountable before Task 7 lands.
function ItemDetailPlaceholder({ item, onClose }: { item: GrailItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <p className="text-zinc-100 font-semibold">{item.name}</p>
        <p className="text-zinc-500 text-sm mt-2">Detail view coming in Task 7.</p>
      </div>
    </div>
  );
}

export default function GrailChecklist() {
  return (
    <AuthGate>
      <GrailChecklistInner />
    </AuthGate>
  );
}
