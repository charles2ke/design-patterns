import type { Pattern, PatternCategory } from '../types/pattern';

export type CategoryFilter = PatternCategory | 'All';

/** Case-insensitive match of the query against a pattern's text fields. */
export function matchesQuery(pattern: Pattern, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return true;
  }
  return [pattern.name, pattern.intent, pattern.useWhen, pattern.category].some(
    (field) => field.toLowerCase().includes(needle),
  );
}

/** Filters patterns by category and free-text query. */
export function filterPatterns(
  source: Pattern[],
  query: string,
  category: CategoryFilter,
): Pattern[] {
  return source.filter(
    (pattern) =>
      (category === 'All' || pattern.category === category) &&
      matchesQuery(pattern, query),
  );
}

/** Counts how many patterns belong to each category. */
export function countByCategory(
  source: Pattern[],
): Record<PatternCategory, number> {
  return source.reduce(
    (acc, pattern) => {
      acc[pattern.category] += 1;
      return acc;
    },
    { Creational: 0, Structural: 0, Behavioral: 0 } as Record<
      PatternCategory,
      number
    >,
  );
}
