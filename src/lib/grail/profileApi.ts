import { getSupabase } from './supabaseClient';

export interface Profile {
  battletag: string | null;
  avatarChoice: string | null;
}

interface ProfileRow {
  battletag: string | null;
  avatar_choice: string | null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('battletag, avatar_choice')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as ProfileRow;
  return { battletag: row.battletag, avatarChoice: row.avatar_choice };
}

export async function upsertProfile(profile: Profile): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not signed in');
  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    battletag: profile.battletag,
    avatar_choice: profile.avatarChoice,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
