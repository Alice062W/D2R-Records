import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const mockUseGrailAuth = vi.fn();
vi.mock('./useGrailAuth', () => ({ useGrailAuth: () => mockUseGrailAuth() }));

const mockListOwnedItems = vi.fn();
const mockAddOwnedItem = vi.fn();
const mockRemoveOwnedItem = vi.fn();
vi.mock('./ownedItemsApi', () => ({
  listOwnedItems: () => mockListOwnedItems(),
  addOwnedItem: (id: string, kind: string) => mockAddOwnedItem(id, kind),
  removeOwnedItem: (id: string) => mockRemoveOwnedItem(id),
}));

describe('useOwnedItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes an empty set and does not call the API when signed out', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: null, loading: false });
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ownedIds.size).toBe(0);
    expect(mockListOwnedItems).not.toHaveBeenCalled();
  });

  it('fetches owned items once signed in and exposes them as a Set of itemIds', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockListOwnedItems.mockResolvedValue([
      { itemId: 'unique-1', kind: 'unique' },
      { itemId: 'set-69', kind: 'set' },
    ]);
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ownedIds).toEqual(new Set(['unique-1', 'set-69']));
  });

  it('toggle optimistically adds an unowned item, then calls addOwnedItem', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockListOwnedItems.mockResolvedValue([]);
    mockAddOwnedItem.mockResolvedValue(undefined);
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.toggle('unique-1', 'unique'));
    expect(result.current.ownedIds.has('unique-1')).toBe(true); // optimistic
    await waitFor(() => expect(mockAddOwnedItem).toHaveBeenCalledWith('unique-1', 'unique'));
  });

  it('toggle optimistically removes an owned item, then calls removeOwnedItem', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockListOwnedItems.mockResolvedValue([{ itemId: 'unique-1', kind: 'unique' }]);
    mockRemoveOwnedItem.mockResolvedValue(undefined);
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.ownedIds.has('unique-1')).toBe(true));

    act(() => result.current.toggle('unique-1', 'unique'));
    expect(result.current.ownedIds.has('unique-1')).toBe(false); // optimistic
    await waitFor(() => expect(mockRemoveOwnedItem).toHaveBeenCalledWith('unique-1'));
  });

  it('reverts the optimistic update and sets an error message when the API call fails', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockListOwnedItems.mockResolvedValue([]);
    mockAddOwnedItem.mockRejectedValue(new Error('network down'));
    const { useOwnedItems } = await import('./useOwnedItems');
    const { result } = renderHook(() => useOwnedItems());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.toggle('unique-1', 'unique'));
    expect(result.current.ownedIds.has('unique-1')).toBe(true); // optimistic
    await waitFor(() => expect(result.current.ownedIds.has('unique-1')).toBe(false)); // reverted
    expect(result.current.error).toBe('network down');
  });
});
