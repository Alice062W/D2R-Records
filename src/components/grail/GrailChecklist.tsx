// src/components/grail/GrailChecklist.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getAllGrailItems, sortItemsForDisplay, type GrailItem } from '@/lib/grail/catalog';
import { listFinds, type FindRecord } from '@/lib/grail/findsApi';
import { getErrorMessage } from '@/lib/grail/errors';
import AuthGate from './AuthGate';
import GrailCategorySidebar from './GrailCategorySidebar';
import GrailItemDetail from './GrailItemDetail';
import LogFindForm from './LogFindForm';

function GrailChecklistInner() {
  const t = useTranslations('Grail');
  const [finds, setFinds] = useState<FindRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
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
  const activeItems: GrailItem[] = activeSlot
    ? sortItemsForDisplay(items.filter(i => i.slotCategory === activeSlot))
    : [];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-zinc-400">
          {t('progressCount', { found: foundCount, total: items.length })}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
        >
          {t('logFind')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <GrailCategorySidebar
          items={items}
          findsById={findsById}
          activeSlot={activeSlot}
          onSelect={setActiveSlot}
        />

        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {!activeSlot ? (
            <p className="text-sm text-zinc-500">{t('selectCategoryPrompt')}</p>
          ) : (
            activeItems.map(item => (
              <GrailItemDetail
                key={item.id}
                item={item}
                finds={findsById.get(item.id) ?? []}
              />
            ))
          )}
        </div>
      </div>

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
