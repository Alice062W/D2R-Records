'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

export function useGrailAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  // Full Supabase User (name/email/avatar_url live in user.user_metadata
  // for Google OAuth) — exposed so components like AccountButton can show
  // a Google profile photo or initials without a second round trip.
  const [user, setUser] = useState<User | null>(null);
  // Lazy initializer: when Supabase isn't configured, "loading" is already
  // false and there's nothing to fetch — the effect below can skip entirely
  // for that case instead of calling setState synchronously in its body.
  const [loading, setLoading] = useState(() => getSupabase() !== null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return { userId, user, loading };
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
