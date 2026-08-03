import { patterns as allPatterns } from '../data/patterns';
import { CategoryFilterBar } from '../components/CategoryFilterBar';
import { Header } from '../components/Header';
import { PatternList } from '../components/PatternList';
import { SearchBar } from '../components/SearchBar';
import { TableOfContents } from '../components/TableOfContents';
import { usePatternFilter } from '../hooks/usePatternFilter';
import { BACKEND_BEST_PRACTICES_HASH } from '../routes';
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
        title="Design Patterns Index"
        subtitle="The 23 Gang of Four patterns every engineer should know."
      />
      <p>
        <a
          className="page-link"
          href="./database-design-best-practices"
          aria-label="Open database design best practices page"
        >
          Database Design Best Practices
        </a>
      </p>
      <p>
        <a
          className="page-link"
          href={BACKEND_BEST_PRACTICES_HASH}
          aria-label="Open backend code best practices page"
        >
          Backend Code Best Practices
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
