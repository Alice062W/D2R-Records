import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('./supabaseClient', () => ({ getSupabase: () => null }));

describe('useGrailAuth', () => {
  it('resolves userId: null, loading: false when Supabase is unconfigured, without throwing', async () => {
    const { useGrailAuth } = await import('./useGrailAuth');
    const { result } = renderHook(() => useGrailAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userId).toBeNull();
  });
});
