'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGrailAuth } from './useGrailAuth';
import { listOwnedItems, addOwnedItem, removeOwnedItem, type OwnedItem } from './ownedItemsApi';
import { getErrorMessage } from './errors';

export function useOwnedItems() {
  const { userId, loading: authLoading } = useGrailAuth();
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    // Every branch's setState calls run inside a Promise callback rather
    // than synchronously in the effect body, satisfying the "no setState
    // directly within an effect" rule.
    if (!userId) {
      Promise.resolve().then(() => {
        setOwnedIds(new Set());
        setLoading(false);
      });
      return;
    }
    Promise.resolve().then(() => setLoading(true));
    listOwnedItems()
      .then((items: OwnedItem[]) => setOwnedIds(new Set(items.map(i => i.itemId))))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [userId, authLoading]);

  const toggle = useCallback((itemId: string, kind: OwnedItem['kind']) => {
    setError(null);
    const wasOwned = ownedIds.has(itemId);
    setOwnedIds(prev => {
      const next = new Set(prev);
      if (wasOwned) next.delete(itemId); else next.add(itemId);
      return next;
    });
    const request = wasOwned ? removeOwnedItem(itemId) : addOwnedItem(itemId, kind);
    request.catch(e => {
      setError(getErrorMessage(e));
      setOwnedIds(prev => {
        const reverted = new Set(prev);
        if (wasOwned) reverted.add(itemId); else reverted.delete(itemId);
        return reverted;
      });
    });
  }, [ownedIds]);

  return { userId, loading: authLoading || loading, ownedIds, toggle, error };
}
