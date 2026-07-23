import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const mockUseGrailAuth = vi.fn();
vi.mock('./useGrailAuth', () => ({ useGrailAuth: () => mockUseGrailAuth() }));

const mockGetProfile = vi.fn();
const mockUpsertProfile = vi.fn();
vi.mock('./profileApi', () => ({
  getProfile: () => mockGetProfile(),
  upsertProfile: (profile: unknown) => mockUpsertProfile(profile),
}));

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Module-level shared store, same reasoning as useOwnedItems — reset
    // between tests so state doesn't leak.
    vi.resetModules();
  });

  it('exposes profile: null and does not call the API when signed out', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: null, loading: false });
    const { useProfile } = await import('./useProfile');
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toBeNull();
    expect(mockGetProfile).not.toHaveBeenCalled();
  });

  it('fetches the profile once signed in', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockGetProfile.mockResolvedValue({
      battletag: 'Player#1234', avatarChoice: '⚔️',
      server: 'us', gameMode: 'hardcore', platform: 'pc', seasonal: true,
    });
    const { useProfile } = await import('./useProfile');
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toEqual({
      battletag: 'Player#1234', avatarChoice: '⚔️',
      server: 'us', gameMode: 'hardcore', platform: 'pc', seasonal: true,
    });
  });

  it('save() optimistically updates the store, then calls upsertProfile with the merged patch', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockGetProfile.mockResolvedValue({
      battletag: null, avatarChoice: null, server: null, gameMode: null, platform: null, seasonal: null,
    });
    mockUpsertProfile.mockResolvedValue(undefined);
    const { useProfile } = await import('./useProfile');
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save({ avatarChoice: '🔥' });
    });

    const expected = {
      battletag: null, avatarChoice: '🔥', server: null, gameMode: null, platform: null, seasonal: null,
    };
    expect(result.current.profile).toEqual(expected);
    expect(mockUpsertProfile).toHaveBeenCalledWith(expected);
  });

  it('save() merges a game-settings patch (server/mode/platform/seasonal) onto the existing profile', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockGetProfile.mockResolvedValue({
      battletag: 'Player#1234', avatarChoice: null, server: null, gameMode: null, platform: null, seasonal: null,
    });
    mockUpsertProfile.mockResolvedValue(undefined);
    const { useProfile } = await import('./useProfile');
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save({ server: 'europe', gameMode: 'softcore', platform: 'ns', seasonal: false });
    });

    expect(result.current.profile).toEqual({
      battletag: 'Player#1234', avatarChoice: null,
      server: 'europe', gameMode: 'softcore', platform: 'ns', seasonal: false,
    });
  });

  it('reverts the profile and sets an error message when the API call fails', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockGetProfile.mockResolvedValue({ battletag: 'Old#1234', avatarChoice: null });
    mockUpsertProfile.mockRejectedValue(new Error('network down'));
    const { useProfile } = await import('./useProfile');
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.profile?.battletag).toBe('Old#1234'));

    await act(async () => {
      await expect(result.current.save({ battletag: 'New#5678' })).rejects.toThrow('network down');
    });

    expect(result.current.profile?.battletag).toBe('Old#1234'); // reverted
    expect(result.current.error).toBe('network down');
  });

  it('shares state across two independent hook instances (nav avatar + profile page)', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: 'user-1', loading: false });
    mockGetProfile.mockResolvedValue({ battletag: null, avatarChoice: null });
    mockUpsertProfile.mockResolvedValue(undefined);
    const { useProfile } = await import('./useProfile');

    const navHook = renderHook(() => useProfile());
    const pageHook = renderHook(() => useProfile());
    await waitFor(() => expect(navHook.result.current.loading).toBe(false));
    await waitFor(() => expect(pageHook.result.current.loading).toBe(false));

    await act(async () => {
      await pageHook.result.current.save({ avatarChoice: '🐺' });
    });

    expect(pageHook.result.current.profile?.avatarChoice).toBe('🐺');
    expect(navHook.result.current.profile?.avatarChoice).toBe('🐺');
  });
});
