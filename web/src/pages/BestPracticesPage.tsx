import { bestPractices as allPractices } from '../data/bestPractices';
import { BestPracticeCard } from '../components/BestPracticeCard';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import {
  BEST_PRACTICE_CATEGORIES,
  useBestPracticeFilter,
  type BestPracticeCategoryFilter,
} from '../hooks/useBestPracticeFilter';
import type { BestPractice } from '../types/bestPractice';

interface BestPracticesPageProps {
  /** Injectable for tests; defaults to the full best-practices catalog. */
  source?: BestPractice[];
}

export function BestPracticesPage({ source = allPractices }: BestPracticesPageProps) {
  const { query, category, visiblePractices, setQuery, setCategory, reset } =
    useBestPracticeFilter(source);

  const filterOptions: BestPracticeCategoryFilter[] = ['All', ...BEST_PRACTICE_CATEGORIES];

  return (
    <main className="best-practices-page">
      <Header
        title="AI-First Best Practices"
        subtitle="12 practices for building software in an AI-assisted world."
      />
      <SearchBar value={query} onChange={setQuery} />
      <nav className="category-filter" aria-label="Filter by category">
        {filterOptions.map((option) => (
          <button
            key={option}
            type="button"
            className="category-filter__button"
            aria-pressed={option === category}
            onClick={() => setCategory(option)}
          >
            {option}
          </button>
        ))}
      </nav>
      <p className="best-practices-page__count" role="status">
        Showing {visiblePractices.length} of {source.length} practices
      </p>
      {visiblePractices.length > 0 ? (
        <div className="practice-list">
          {visiblePractices.map((practice) => (
            <BestPracticeCard key={practice.id} practice={practice} />
          ))}
        </div>
      ) : (
        <EmptyState onReset={reset} message="No practices match your filters." />
      )}
    </main>
  );
}
