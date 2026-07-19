import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(),
  auth: { getSession: vi.fn() },
};

vi.mock('./supabaseClient', () => ({ getSupabase: () => mockSupabase }));

describe('ownedItemsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listOwnedItems maps rows to camelCase OwnedItem objects', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ item_id: 'unique-1', kind: 'unique' }, { item_id: 'runeword-Runeword1', kind: 'runeword' }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    mockSupabase.from.mockReturnValue({ select });

    const { listOwnedItems } = await import('./ownedItemsApi');
    const result = await listOwnedItems();

    expect(mockSupabase.from).toHaveBeenCalledWith('owned_items');
    expect(result).toEqual([
      { itemId: 'unique-1', kind: 'unique' },
      { itemId: 'runeword-Runeword1', kind: 'runeword' },
    ]);
  });

  it('listOwnedItems throws the Supabase error when the query fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    mockSupabase.from.mockReturnValue({ select: vi.fn().mockReturnValue({ order }) });
    const { listOwnedItems } = await import('./ownedItemsApi');
    await expect(listOwnedItems()).rejects.toEqual({ message: 'boom' });
  });

  it('addOwnedItem inserts a row with the current user id', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({ insert });

    const { addOwnedItem } = await import('./ownedItemsApi');
    await addOwnedItem('set-69', 'set');

    expect(mockSupabase.from).toHaveBeenCalledWith('owned_items');
    expect(insert).toHaveBeenCalledWith({ user_id: 'user-1', item_id: 'set-69', kind: 'set' });
  });

  it('addOwnedItem throws when not signed in', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    const { addOwnedItem } = await import('./ownedItemsApi');
    await expect(addOwnedItem('set-69', 'set')).rejects.toThrow('Not signed in');
  });

  it('removeOwnedItem deletes by user id and item id', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    const eqItem = vi.fn().mockResolvedValue({ error: null });
    const eqUser = vi.fn().mockReturnValue({ eq: eqItem });
    const del = vi.fn().mockReturnValue({ eq: eqUser });
    mockSupabase.from.mockReturnValue({ delete: del });

    const { removeOwnedItem } = await import('./ownedItemsApi');
    await removeOwnedItem('unique-42');

    expect(mockSupabase.from).toHaveBeenCalledWith('owned_items');
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user-1');
    expect(eqItem).toHaveBeenCalledWith('item_id', 'unique-42');
  });

  it('all three functions no-op / return empty when Supabase is unconfigured', async () => {
    vi.doMock('./supabaseClient', () => ({ getSupabase: () => null }));
    vi.resetModules();
    const { listOwnedItems, addOwnedItem, removeOwnedItem } = await import('./ownedItemsApi');
    await expect(listOwnedItems()).resolves.toEqual([]);
    await expect(addOwnedItem('unique-1', 'unique')).resolves.toBeUndefined();
    await expect(removeOwnedItem('unique-1')).resolves.toBeUndefined();
  });
});
