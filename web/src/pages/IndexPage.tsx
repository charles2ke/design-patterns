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
        title="Design Patterns Index"
        subtitle="The 23 Gang of Four patterns every engineer should know."
      />
      <nav className="page-nav" aria-label="Pages">
        <a className="page-nav__link" href="#backend-best-practices">
          Backend code best practices
        </a>
      </nav>
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
