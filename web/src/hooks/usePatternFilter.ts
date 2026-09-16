import { useCallback, useEffect, useMemo, useState } from 'react';
import { PATTERN_CATEGORIES, type Pattern } from '../types/pattern';
import { filterPatterns, type CategoryFilter } from '../utils/filterPatterns';
import { buildIndexHash, parseIndexFilters } from '../routes';

export interface UsePatternFilterResult {
  query: string;
  category: CategoryFilter;
  visiblePatterns: Pattern[];
  setQuery: (query: string) => void;
  setCategory: (category: CategoryFilter) => void;
  reset: () => void;
}

interface Filters {
  query: string;
  category: CategoryFilter;
}

function toCategoryFilter(value: string): CategoryFilter {
  return PATTERN_CATEGORIES.some((category) => category === value)
    ? (value as CategoryFilter)
    : 'All';
}

function filtersFromHash(hash: string): Filters {
  const parsed = parseIndexFilters(hash);
  return { query: parsed.query, category: toCategoryFilter(parsed.category) };
}

/**
 * Owns the search/filter state of the index page and mirrors it in the URL
 * hash so filtered views are shareable and survive a reload.
 */
export function usePatternFilter(source: Pattern[]): UsePatternFilterResult {
  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromHash(window.location.hash),
  );

  useEffect(() => {
    const handler = () => setFilters(filtersFromHash(window.location.hash));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const apply = useCallback((next: Filters) => {
    setFilters(next);
    // replaceState keeps the view shareable without adding a history entry per keystroke.
    window.history.replaceState(null, '', buildIndexHash(next));
  }, []);

  const setQuery = useCallback(
    (query: string) => apply({ ...filters, query }),
    [apply, filters],
  );

  const setCategory = useCallback(
    (category: CategoryFilter) => apply({ ...filters, category }),
    [apply, filters],
  );

  const reset = useCallback(() => apply({ query: '', category: 'All' }), [apply]);

  const visiblePatterns = useMemo(
    () => filterPatterns(source, filters.query, filters.category),
    [source, filters],
  );

  return {
    query: filters.query,
    category: filters.category,
    visiblePatterns,
    setQuery,
    setCategory,
    reset,
  };
}
