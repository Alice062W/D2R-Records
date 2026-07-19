import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined; // undefined = not yet resolved

// Never throws. Pages that don't need auth (the Unique/Set/Runeword reference
// pages) must keep rendering normally even when Supabase isn't configured —
// only the features that actually need it (checkboxes, the /grail page)
// degrade to "signed out" behavior instead.
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — Grail sign-in and owned-item tracking are disabled. See plans/grail-tracker-implementation.md "External setup".'
    );
    cached = null;
    return cached;
  }
  cached = createClient(supabaseUrl, supabaseAnonKey);
  return cached;
}
