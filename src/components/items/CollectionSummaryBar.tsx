'use client';

import { useTranslations } from 'next-intl';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';
import CollectionBadge from './CollectionBadge';

// Aggregate "your collection: X/Y" shown at the top of a whole item-type
// landing page (Unique/Set/Runewords), independent of the per-category
// badges shown further down — signed out visitors see nothing.
export default function CollectionSummaryBar({ itemIds }: { itemIds: string[] }) {
  const t = useTranslations('Grail');
  const { userId, ownedIds } = useOwnedItems();
  if (!userId) return null;

  const owned = itemIds.filter(id => ownedIds.has(id)).length;
  return (
    <div className="w-full bg-panel border border-panel-border rounded-xl px-5 py-3 flex items-center justify-between gap-3">
      <span className="text-sm font-cinzel text-parchment-bright">{t('yourCollectionLabel')}</span>
      <CollectionBadge owned={owned} total={itemIds.length} />
    </div>
  );
}
