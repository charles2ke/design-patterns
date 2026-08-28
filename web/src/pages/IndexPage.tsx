import { patterns as allPatterns } from '../data/patterns';
import { CategoryFilterBar } from '../components/CategoryFilterBar';
import { Header } from '../components/Header';
import { PatternList } from '../components/PatternList';
import { SearchBar } from '../components/SearchBar';
import { TableOfContents } from '../components/TableOfContents';
import { usePatternFilter } from '../hooks/usePatternFilter';
import type { Pattern } from '../types/pattern';

interface IndexPageProps {
  /** Injectable for tests; defaults to the full GoF catalog. */
  source?: Pattern[];
}

export function IndexPage({ source = allPatterns }: IndexPageProps) {
  const { query, category, visiblePatterns, setQuery, setCategory, reset } =
    usePatternFilter(source);

  return (
    <main className="index-page">
      <Header
        title="Design Bible"
        subtitle="Design patterns, best practices, and a quiz for engineers."
      />
      <p>
        <a
          className="page-link"
          href="#/best-practices"
          aria-label="Open best practices tab"
        >
          Best Practices
        </a>{' '}
        <a
          className="page-link"
          href="#/algorithms-data-structures"
          aria-label="Open algorithms and data structures tab"
        >
          Algorithms &amp; Data Structures
        </a>
      </p>
      <TableOfContents patterns={visiblePatterns} />
      <SearchBar value={query} onChange={setQuery} />
      <CategoryFilterBar value={category} onChange={setCategory} />
      <p className="index-page__count" role="status">
        Showing {visiblePatterns.length} of {source.length} patterns
      </p>
      <PatternList patterns={visiblePatterns} onReset={reset} />
    </main>
  );
}
