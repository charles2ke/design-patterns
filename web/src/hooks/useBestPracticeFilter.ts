import { useCallback, useMemo, useState } from 'react';
import type { BestPractice, BestPracticeCategory } from '../types/bestPractice';
import { BEST_PRACTICE_CATEGORIES } from '../types/bestPractice';

export type BestPracticeCategoryFilter = BestPracticeCategory | 'All';

export interface UseBestPracticeFilterResult {
  query: string;
  category: BestPracticeCategoryFilter;
  visiblePractices: BestPractice[];
  setQuery: (query: string) => void;
  setCategory: (category: BestPracticeCategoryFilter) => void;
  reset: () => void;
}

function matchesPracticeQuery(practice: BestPractice, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return true;
  }
  return [
    practice.title,
    practice.description,
    practice.rationale,
    practice.category,
  ].some((field) => field.toLowerCase().includes(needle));
}

/** Owns the search/filter state of the best practices page. */
export function useBestPracticeFilter(
  source: BestPractice[],
): UseBestPracticeFilterResult {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BestPracticeCategoryFilter>('All');

  const visiblePractices = useMemo(
    () =>
      source.filter(
        (practice) =>
          (category === 'All' || practice.category === category) &&
          matchesPracticeQuery(practice, query),
      ),
    [source, query, category],
  );

  const reset = useCallback(() => {
    setQuery('');
    setCategory('All');
  }, []);

  return { query, category, visiblePractices, setQuery, setCategory, reset };
}

export { BEST_PRACTICE_CATEGORIES };
