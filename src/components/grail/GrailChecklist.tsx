'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getAllGrailItems, type GrailItem } from '@/lib/grail/catalog';
import { listFinds, type FindRecord } from '@/lib/grail/findsApi';
import { getErrorMessage } from '@/lib/grail/errors';
import AuthGate from './AuthGate';
import GrailItemCard from './GrailItemCard';
import GrailItemDetail from './GrailItemDetail';
import LogFindForm from './LogFindForm';

const CATEGORIES: GrailItem['category'][] = ['weapons', 'armor', 'other'];
const CATEGORY_LABEL_KEYS: Record<GrailItem['category'], 'categoryWeapons' | 'categoryArmor' | 'categoryOther'> = {
  weapons: 'categoryWeapons',
  armor: 'categoryArmor',
  other: 'categoryOther',
};

function GrailChecklistInner() {
  const t = useTranslations('Grail');
  const [finds, setFinds] = useState<FindRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GrailItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const items = getAllGrailItems();

  function refresh() {
    listFinds()
      .then(setFinds)
      .catch(e => setError(getErrorMessage(e)));
  }

  useEffect(() => {
    refresh();
  }, []);

  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!finds) return <p className="text-zinc-500 text-sm">{t('loadingCollection')}</p>;

  const findsById = new Map<string, FindRecord[]>();
  for (const f of finds) {
    const list = findsById.get(f.itemId) ?? [];
    list.push(f);
    findsById.set(f.itemId, list);
  }

  const foundCount = items.filter(i => (findsById.get(i.id)?.length ?? 0) > 0).length;

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-zinc-400">
        {t('progressCount', { found: foundCount, total: items.length })}
      </p>
      <button
        onClick={() => setShowForm(true)}
        className="self-start px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
      >
        {t('logFind')}
      </button>
      {CATEGORIES.map(category => {
        const categoryItems = items.filter(i => i.category === category);
        const categoryFound = categoryItems.filter(
          i => (findsById.get(i.id)?.length ?? 0) > 0
        ).length;
        return (
          <section key={category}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              {t(CATEGORY_LABEL_KEYS[category])} ({categoryFound}/{categoryItems.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {categoryItems.map(item => (
                <GrailItemCard
                  key={item.id}
                  item={item}
                  finds={findsById.get(item.id) ?? []}
                  onClick={() => setSelected(item)}
                />
              ))}
            </div>
          </section>
        );
      })}
      {selected && (
        <GrailItemDetail
          item={selected}
          finds={findsById.get(selected.id) ?? []}
          onClose={() => setSelected(null)}
        />
      )}
      {showForm && (
        <LogFindForm
          onSaved={() => { setShowForm(false); refresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
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
