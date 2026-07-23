'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useGrailAuth } from './useGrailAuth';
import { getProfile, upsertProfile, type Profile } from './profileApi';
import { getErrorMessage } from './errors';

// Shared module-level store, same reasoning as useOwnedItems: AccountButton
// (top nav) and the profile page's avatar picker both read avatarChoice —
// without a shared store, picking a new avatar on the profile page
// wouldn't update the nav icon until a full reload.
interface Store {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  fetchedForUserId: string | null;
}

let store: Store = { profile: null, loading: false, error: null, fetchedForUserId: null };
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

const SERVER_SNAPSHOT: Store = { profile: null, loading: false, error: null, fetchedForUserId: null };
function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function ensureFetched(userId: string) {
  if (store.fetchedForUserId === userId) return;
  setStore({ loading: true, error: null, fetchedForUserId: userId });
  getProfile()
    .then(profile => setStore({ profile }))
    .catch(e => setStore({ error: getErrorMessage(e) }))
    .finally(() => setStore({ loading: false }));
}

export function useProfile() {
  const { userId, loading: authLoading } = useGrailAuth();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      if (store.fetchedForUserId !== null) {
        setStore({ profile: null, loading: false, error: null, fetchedForUserId: null });
      }
      return;
    }
    ensureFetched(userId);
  }, [userId, authLoading]);

  const save = useCallback(async (patch: Partial<Profile>) => {
    const next: Profile = {
      battletag: store.profile?.battletag ?? null,
      avatarChoice: store.profile?.avatarChoice ?? null,
      server: store.profile?.server ?? null,
      gameMode: store.profile?.gameMode ?? null,
      platform: store.profile?.platform ?? null,
      seasonal: store.profile?.seasonal ?? null,
      ...patch,
    };
    const previous = store.profile;
    setStore({ error: null, profile: next });
    try {
      await upsertProfile(next);
    } catch (e) {
      setStore({ error: getErrorMessage(e), profile: previous });
      throw e;
    }
  }, []);

  return {
    userId,
    loading: authLoading || snapshot.loading,
    profile: snapshot.profile,
    save,
    error: snapshot.error,
  };
}
