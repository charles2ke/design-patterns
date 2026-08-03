
import { describe, expect, it } from 'vitest';
import {
  countByCategory,
  filterPatterns,
  matchesQuery,
  patterns,
  type Pattern,
} from './index.js';

describe('design-patterns-catalog', () => {
  it('exports all 23 patterns', () => {
    expect(patterns).toHaveLength(23);
  });

  it('filters by query and category', () => {
    expect(
      filterPatterns(patterns, 'global access', 'Creational').map(
        (pattern: Pattern) => pattern.slug,
      ),
    ).toEqual(['singleton']);
  });

  it('matches queries case-insensitively', () => {
    expect(matchesQuery(patterns[18], 'PUB/SUB')).toBe(true);
  });

  it('counts patterns by category', () => {
    expect(countByCategory(patterns)).toEqual({
      Creational: 5,
      Structural: 7,
      Behavioral: 11,
    });
  });
});
