import { describe, it, expect } from 'vitest';
import { BASE_PATH } from './basePath';

describe('BASE_PATH', () => {
  it('is empty in the local/test environment (no GITHUB_ACTIONS env var set)', () => {
    expect(BASE_PATH).toBe('');
  });
});
