'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getAllGrailItems, SLOT_ORDER, sortItemsForDisplay, type GrailItem } from '@/lib/grail/catalog';
import { listFinds, type FindRecord } from '@/lib/grail/findsApi';
import { getErrorMessage } from '@/lib/grail/errors';
import AuthGate from './AuthGate';
import GrailItemCard from './GrailItemCard';
import GrailItemDetail from './GrailItemDetail';
import LogFindForm from './LogFindForm';

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
      <nav className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 py-2 -mx-4 px-4 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {SLOT_ORDER.map(slot => (
          <a key={slot} href={`#slot-${slot}`} className="text-zinc-400 hover:text-amber-300 transition-colors">
            {t(`slot_${slot}`)}
          </a>
        ))}
      </nav>
      {SLOT_ORDER.map(slot => {
        const slotItems = sortItemsForDisplay(items.filter(i => i.slotCategory === slot));
        if (slotItems.length === 0) return null;
        const slotFound = slotItems.filter(i => (findsById.get(i.id)?.length ?? 0) > 0).length;
        return (
          <section key={slot} id={`slot-${slot}`} className="scroll-mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              {t(`slot_${slot}`)} ({slotFound}/{slotItems.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {slotItems.map(item => (
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
