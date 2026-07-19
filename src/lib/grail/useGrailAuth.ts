'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from './supabaseClient';

export function useGrailAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  // Lazy initializer: when Supabase isn't configured, "loading" is already
  // false and there's nothing to fetch — the effect below can skip entirely
  // for that case instead of calling setState synchronously in its body.
  const [loading, setLoading] = useState(() => getSupabase() !== null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return { userId, loading };
}

export async function signInWithGoogle() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  });
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
