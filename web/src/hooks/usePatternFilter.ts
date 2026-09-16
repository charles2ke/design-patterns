import { useCallback, useEffect, useMemo, useState } from 'react';
import { PATTERN_CATEGORIES, type Pattern } from '../types/pattern';
import { filterPatterns, type CategoryFilter } from '../utils/filterPatterns';
import { buildIndexHash, isIndexHash, parseIndexFilters } from '../routes';

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
    const handler = () => {
      const hash = window.location.hash;
      // In-page anchors such as `#pattern-observer` are not filter URLs, so
      // jumping to a card must not wipe the active filters.
      if (!isIndexHash(hash)) {
        return;
      }
      setFilters(filtersFromHash(hash));
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // The updater form keeps batched calls composable instead of overwriting each
  // other with a stale render snapshot.
  const apply = useCallback((update: (current: Filters) => Filters) => {
    setFilters((current) => {
      const next = update(current);
      // replaceState keeps the view shareable without adding a history entry per keystroke.
      window.history.replaceState(null, '', buildIndexHash(next));
      return next;
    });
  }, []);

  const setQuery = useCallback(
    (query: string) => apply((current) => ({ ...current, query })),
    [apply],
  );

  const setCategory = useCallback(
    (category: CategoryFilter) => apply((current) => ({ ...current, category })),
    [apply],
  );

  const reset = useCallback(
    () => apply(() => ({ query: '', category: 'All' })),
    [apply],
  );

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
