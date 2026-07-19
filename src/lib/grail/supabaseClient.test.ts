import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

describe('getSupabase', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns null and warns, never throws, when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getSupabase } = await import('./supabaseClient');
    expect(() => getSupabase()).not.toThrow();
    expect(getSupabase()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns the same memoized client instance on repeated calls when configured', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    const { getSupabase } = await import('./supabaseClient');
    const a = getSupabase();
    const b = getSupabase();
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });
});
