'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useGrailAuth } from './useGrailAuth';
import { listOwnedItems, addOwnedItem, removeOwnedItem, type OwnedItem } from './ownedItemsApi';
import { getErrorMessage } from './errors';

// Every component that renders an item card or a filter bar calls
// useOwnedItems() independently — a checkbox on ItemStatCard and the
// Collected/Missing filter on its parent CategoryItemList are two separate
// call sites on the same page. If each call site kept its own local
// useState, toggling a checkbox would only update that one card's copy of
// the data; the filter's copy (fetched once on its own mount) would never
// find out, so a just-checked item would silently fail to show up under
// "Collected" until a full page reload. This module-level store is shared
// by every useOwnedItems() call on the page, so a toggle anywhere is
// immediately visible everywhere.
interface Store {
  ownedIds: Set<string>;
  loading: boolean;
  error: string | null;
  fetchedForUserId: string | null;
}

let store: Store = { ownedIds: new Set(), loading: false, error: null, fetchedForUserId: null };
const listeners = new Set<() => void>();

function setStore(patch: Partial<Store>) {
  store = { ...store, ...patch };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return store;
}

// Static, stable object (not `store`, which mutates) — the server has no
// session/data to prerender with anyway, so this just needs to match the
// pre-fetch client state to avoid a hydration mismatch.
const SERVER_SNAPSHOT: Store = { ownedIds: new Set(), loading: false, error: null, fetchedForUserId: null };
function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function ensureFetched(userId: string) {
  if (store.fetchedForUserId === userId) return; // already loaded/loading for this user
  setStore({ loading: true, error: null, fetchedForUserId: userId });
  listOwnedItems()
    .then((items: OwnedItem[]) => setStore({ ownedIds: new Set(items.map(i => i.itemId)) }))
    .catch(e => setStore({ error: getErrorMessage(e) }))
    .finally(() => setStore({ loading: false }));
}

export function useOwnedItems() {
  const { userId, loading: authLoading } = useGrailAuth();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      if (store.fetchedForUserId !== null) {
        setStore({ ownedIds: new Set(), loading: false, error: null, fetchedForUserId: null });
      }
      return;
    }
    ensureFetched(userId);
  }, [userId, authLoading]);

  const toggle = useCallback((itemId: string, kind: OwnedItem['kind']) => {
    setStore({ error: null });
    const wasOwned = store.ownedIds.has(itemId);
    const optimistic = new Set(store.ownedIds);
    if (wasOwned) optimistic.delete(itemId); else optimistic.add(itemId);
    setStore({ ownedIds: optimistic });

    const request = wasOwned ? removeOwnedItem(itemId) : addOwnedItem(itemId, kind);
    request.catch(e => {
      const reverted = new Set(store.ownedIds);
      if (wasOwned) reverted.add(itemId); else reverted.delete(itemId);
      setStore({ error: getErrorMessage(e), ownedIds: reverted });
    });
  }, []);

  return {
    userId,
    loading: authLoading || snapshot.loading,
    ownedIds: snapshot.ownedIds,
    toggle,
    error: snapshot.error,
  };
}
