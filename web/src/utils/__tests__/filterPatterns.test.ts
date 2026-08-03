import { describe, expect, it } from 'vitest';
import {
  countByCategory,
  filterPatterns,
  matchesQuery,
} from '../filterPatterns';
import type { Pattern } from '../../types/pattern';

const sample: Pattern[] = [
  {
    id: 1,
    slug: 'singleton',
    name: 'Singleton',
    category: 'Creational',
    intent: 'Ensure a class has only one instance.',
    useWhen: 'You need shared configuration.',
  },
  {
    id: 2,
    slug: 'adapter',
    name: 'Adapter',
    category: 'Structural',
    intent: 'Convert one interface into another.',
    useWhen: 'Integrating incompatible interfaces.',
  },
  {
    id: 3,
    slug: 'observer',
    name: 'Observer',
    category: 'Behavioral',
    intent: 'Notify observers of state changes.',
    useWhen: 'Event-driven updates are needed.',
  },
];

describe('matchesQuery', () => {
  it('matches everything for an empty or whitespace query', () => {
    expect(matchesQuery(sample[0], '')).toBe(true);
    expect(matchesQuery(sample[0], '   ')).toBe(true);
  });

  it('matches on name case-insensitively', () => {
    expect(matchesQuery(sample[0], 'sINGleton')).toBe(true);
  });

  it('matches on intent, usage and category', () => {
    expect(matchesQuery(sample[1], 'convert one interface')).toBe(true);
    expect(matchesQuery(sample[2], 'event-driven')).toBe(true);
    expect(matchesQuery(sample[2], 'behavioral')).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(matchesQuery(sample[0], 'kubernetes')).toBe(false);
  });
});

describe('filterPatterns', () => {
  it('returns all patterns for the default filters', () => {
    expect(filterPatterns(sample, '', 'All')).toHaveLength(3);
  });

  it('filters by category', () => {
    expect(filterPatterns(sample, '', 'Structural')).toEqual([sample[1]]);
  });

  it('combines category and query filters', () => {
    expect(filterPatterns(sample, 'observer', 'Behavioral')).toEqual([
      sample[2],
    ]);
    expect(filterPatterns(sample, 'observer', 'Creational')).toEqual([]);
  });
});

describe('countByCategory', () => {
  it('counts patterns per category', () => {
    expect(countByCategory(sample)).toEqual({
      Creational: 1,
      Structural: 1,
      Behavioral: 1,
    });
  });

  it('returns zeroes for an empty list', () => {
    expect(countByCategory([])).toEqual({
      Creational: 0,
      Structural: 0,
      Behavioral: 0,
    });
  });
});
