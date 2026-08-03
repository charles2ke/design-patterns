import { useCallback, useMemo, useState } from 'react';
import type { Pattern } from '../types/pattern';
import {
  filterPatterns,
  type CategoryFilter,
} from '../utils/filterPatterns';

export interface UsePatternFilterResult {
  query: string;
  category: CategoryFilter;
  visiblePatterns: Pattern[];
  setQuery: (query: string) => void;
  setCategory: (category: CategoryFilter) => void;
  reset: () => void;
}

/** Owns the search/filter state of the index page. */
export function usePatternFilter(source: Pattern[]): UsePatternFilterResult {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');

  const visiblePatterns = useMemo(
    () => filterPatterns(source, query, category),
    [source, query, category],
  );

  const reset = useCallback(() => {
    setQuery('');
    setCategory('All');
  }, []);

  return { query, category, visiblePatterns, setQuery, setCategory, reset };
}
