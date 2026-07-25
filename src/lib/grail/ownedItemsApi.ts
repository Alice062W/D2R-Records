import { getSupabase } from './supabaseClient';

export interface OwnedItem {
  itemId: string;
  kind: 'unique' | 'set' | 'runeword';
}

interface OwnedItemRow {
  item_id: string;
  kind: 'unique' | 'set' | 'runeword';
}

export async function listOwnedItems(): Promise<OwnedItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('owned_items')
    .select('item_id, kind')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as OwnedItemRow[]).map(row => ({ itemId: row.item_id, kind: row.kind }));
}

export async function addOwnedItem(itemId: string, kind: OwnedItem['kind']): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not signed in');
  const { error } = await supabase.from('owned_items').insert({ user_id: userId, item_id: itemId, kind });
  if (error) throw error;
}

export async function removeOwnedItem(itemId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not signed in');
  const { error } = await supabase.from('owned_items').delete().eq('user_id', userId).eq('item_id', itemId);
  if (error) throw error;
}
