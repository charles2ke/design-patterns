import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SystemDesignQuestion } from '../types/system-design';
import {
  filterSystemDesignQuestions,
  toCompanyFilter,
  toDifficultyFilter,
  type CompanyFilter,
  type DifficultyFilter,
} from '../utils/filterSystemDesignQuestions';
import {
  buildSystemDesignHash,
  isSystemDesignHash,
  parseSystemDesignFilters,
} from '../routes';

export interface UseSystemDesignFiltersResult {
  difficulty: DifficultyFilter;
  company: CompanyFilter;
  visibleQuestions: SystemDesignQuestion[];
  setDifficulty: (difficulty: DifficultyFilter) => void;
  setCompany: (company: CompanyFilter) => void;
  reset: () => void;
}

interface Filters {
  difficulty: DifficultyFilter;
  company: CompanyFilter;
}

function filtersFromHash(hash: string): Filters {
  const parsed = parseSystemDesignFilters(hash);
  return {
    difficulty: toDifficultyFilter(parsed.difficulty),
    company: toCompanyFilter(parsed.company),
  };
}

/**
 * Owns the difficulty/company filters of the system design page and mirrors
 * them in the URL hash so filtered views can be shared and survive a reload.
 */
export function useSystemDesignFilters(
  source: readonly SystemDesignQuestion[],
): UseSystemDesignFiltersResult {
  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromHash(window.location.hash),
  );

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash;
      // Leaving the page (or jumping to an in-page anchor) is not a filter change.
      if (!isSystemDesignHash(hash)) {
        return;
      }
      setFilters(filtersFromHash(hash));
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const apply = useCallback((update: (current: Filters) => Filters) => {
    setFilters((current) => {
      const next = update(current);
      // replaceState keeps the view shareable without adding a history entry per click.
      window.history.replaceState(null, '', buildSystemDesignHash(next));
      return next;
    });
  }, []);

  const setDifficulty = useCallback(
    (difficulty: DifficultyFilter) => apply((current) => ({ ...current, difficulty })),
    [apply],
  );

  const setCompany = useCallback(
    (company: CompanyFilter) => apply((current) => ({ ...current, company })),
    [apply],
  );

  const reset = useCallback(
    () => apply(() => ({ difficulty: 'All', company: 'All' })),
    [apply],
  );

  const visibleQuestions = useMemo(
    () => filterSystemDesignQuestions(source, filters.difficulty, filters.company),
    [source, filters],
  );

  return {
    difficulty: filters.difficulty,
    company: filters.company,
    visibleQuestions,
    setDifficulty,
    setCompany,
    reset,
  };
}
