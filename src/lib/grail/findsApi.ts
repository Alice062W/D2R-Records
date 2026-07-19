import { getSupabase } from './supabaseClient';

export interface FindRecord {
  id: string;
  itemCode: string;
  itemId: string;
  itemKind: 'unique' | 'set';
  statValues: Record<string, number>;
  ethereal: boolean;
  foundAct: string | null;
  foundArea: string | null;
  foundAt: string;
  notes: string | null;
  createdAt: string;
}

interface FindRow {
  id: string;
  item_code: string;
  item_id: string;
  item_kind: 'unique' | 'set';
  stat_values: Record<string, number>;
  ethereal: boolean;
  found_act: string | null;
  found_area: string | null;
  found_at: string;
  notes: string | null;
  created_at: string;
}

function rowToRecord(row: FindRow): FindRecord {
  return {
    id: row.id,
    itemCode: row.item_code,
    itemId: row.item_id,
    itemKind: row.item_kind,
    statValues: row.stat_values ?? {},
    ethereal: row.ethereal,
    foundAct: row.found_act,
    foundArea: row.found_area,
    foundAt: row.found_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function listFinds(): Promise<FindRecord[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Grail sign-in is not configured');
  const { data, error } = await supabase
    .from('finds')
    .select('id, item_code, item_id, item_kind, stat_values, ethereal, found_act, found_area, found_at, notes, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FindRow[]).map(rowToRecord);
}

export async function insertFind(input: {
  itemCode: string;
  itemId: string;
  itemKind: 'unique' | 'set';
  statValues: Record<string, number>;
  ethereal: boolean;
  foundAct: string;
  foundArea: string;
  foundAt: string;
  notes: string;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Grail sign-in is not configured');
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not signed in');
  const { error } = await supabase.from('finds').insert({
    user_id: userId,
    item_code: input.itemCode,
    item_id: input.itemId,
    item_kind: input.itemKind,
    stat_values: input.statValues,
    ethereal: input.ethereal,
    found_act: input.foundAct,
    found_area: input.foundArea,
    found_at: input.foundAt,
    notes: input.notes,
  });
  if (error) throw error;
}
