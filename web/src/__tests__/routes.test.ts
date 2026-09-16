import { describe, expect, it } from 'vitest';
import {
  buildIndexHash,
  isIndexHash,
  parseIndexFilters,
  patternDetailHash,
  patternSlugFromHash,
} from '../routes';

describe('routes', () => {
  it('builds detail hashes from slugs', () => {
    expect(patternDetailHash('observer')).toBe('#/patterns/observer');
  });

  it('reads slugs back from detail hashes', () => {
    expect(patternSlugFromHash('#/patterns/observer')).toBe('observer');
    expect(patternSlugFromHash('#/patterns/observer?from=index')).toBe(
      'observer',
    );
    expect(patternSlugFromHash('#/patterns/')).toBeNull();
    expect(patternSlugFromHash('#/quiz')).toBeNull();
  });

  it('parses index filters, falling back to defaults', () => {
    expect(parseIndexFilters('#/?q=proxy&category=Structural')).toEqual({
      query: 'proxy',
      category: 'Structural',
    });
    expect(parseIndexFilters('#/')).toEqual({ query: '', category: 'All' });
  });

  it('builds index hashes that omit default filters', () => {
    expect(buildIndexHash({ query: '', category: 'All' })).toBe('#/');
    expect(buildIndexHash({ query: '   ', category: 'All' })).toBe('#/');
    expect(buildIndexHash({ query: 'proxy', category: 'Structural' })).toBe(
      '#/?q=proxy&category=Structural',
    );
  });

  it('recognises only index hashes as filter URLs', () => {
    expect(isIndexHash('')).toBe(true);
    expect(isIndexHash('#')).toBe(true);
    expect(isIndexHash('#/')).toBe(true);
    expect(isIndexHash('#/?q=proxy')).toBe(true);
    expect(isIndexHash('#pattern-observer')).toBe(false);
    expect(isIndexHash('#/quiz')).toBe(false);
    expect(isIndexHash('#/patterns/observer')).toBe(false);
  });

  it('round-trips filters through the hash', () => {
    const filters = { query: 'lazy loading', category: 'Structural' };

    expect(parseIndexFilters(buildIndexHash(filters))).toEqual(filters);
  });
});
