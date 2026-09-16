export const BEST_PRACTICES_HASH = '#/best-practices';
export const QUIZ_HASH = '#/quiz';
export const BACKEND_BEST_PRACTICES_HASH = '#/best-practices/backend';
export const DATABASE_DESIGN_BEST_PRACTICES_HASH =
  '#/best-practices/database-design';
export const AI_FIRST_BEST_PRACTICES_HASH = '#/best-practices/ai-first';
export const SOLID_PRINCIPLES_HASH = '#/best-practices/solid-principles';
export const ALGORITHMS_DATA_STRUCTURES_HASH = '#/algorithms-data-structures';
export const ALGORITHMS_QUIZ_HASH = '#/quiz/algorithms-data-structures';
export const BEST_PRACTICES_QUIZ_HASH = '#/quiz/best-practices';
export const PATTERNS_HASH = '#/patterns';

/** Hash for a single pattern's detail page. */
export function patternDetailHash(slug: string): string {
  return `${PATTERNS_HASH}/${slug}`;
}

/** Extracts the pattern slug from a detail page hash, if present. */
export function patternSlugFromHash(hash: string): string | null {
  if (!hash.startsWith(`${PATTERNS_HASH}/`)) {
    return null;
  }
  const slug = hash.slice(`${PATTERNS_HASH}/`.length).split('?')[0];
  return slug === '' ? null : slug;
}

export interface IndexFilters {
  query: string;
  category: string;
}

/** Reads the deep-linkable search/category filters from the index hash. */
export function parseIndexFilters(hash: string): IndexFilters {
  const queryStart = hash.indexOf('?');
  const params = new URLSearchParams(
    queryStart === -1 ? '' : hash.slice(queryStart + 1),
  );
  return {
    query: params.get('q') ?? '',
    category: params.get('category') ?? 'All',
  };
}

/** Builds an index hash that restores the given filters when opened. */
export function buildIndexHash(filters: IndexFilters): string {
  const params = new URLSearchParams();
  if (filters.query.trim() !== '') {
    params.set('q', filters.query);
  }
  if (filters.category !== 'All') {
    params.set('category', filters.category);
  }
  const search = params.toString();
  return search === '' ? '#/' : `#/?${search}`;
}
