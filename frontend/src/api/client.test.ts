import { describe, it, expect } from 'vitest';
import { getWordDownloadUrl } from './client';

describe('API client', () => {
  it('getWordDownloadUrl should return correct URL', () => {
    expect(getWordDownloadUrl(1)).toBe('/api/rows/1/word');
    expect(getWordDownloadUrl(42)).toBe('/api/rows/42/word');
    expect(getWordDownloadUrl(999)).toBe('/api/rows/999/word');
  });
});
