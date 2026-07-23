import { getSupabase } from './supabaseClient';

export type Server = 'us' | 'europe' | 'asia' | 'china';
export type GameMode = 'hardcore' | 'softcore';
export type Platform = 'pc' | 'ps' | 'xbox' | 'ns';

export interface Profile {
  battletag: string | null;
  avatarChoice: string | null;
  server: Server | null;
  gameMode: GameMode | null;
  platform: Platform | null;
  seasonal: boolean | null;
}

interface ProfileRow {
  battletag: string | null;
  avatar_choice: string | null;
  server: Server | null;
  game_mode: GameMode | null;
  platform: Platform | null;
  seasonal: boolean | null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('battletag, avatar_choice, server, game_mode, platform, seasonal')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as ProfileRow;
  return {
    battletag: row.battletag,
    avatarChoice: row.avatar_choice,
    server: row.server,
    gameMode: row.game_mode,
    platform: row.platform,
    seasonal: row.seasonal,
  };
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
    server: profile.server,
    game_mode: profile.gameMode,
    platform: profile.platform,
    seasonal: profile.seasonal,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
