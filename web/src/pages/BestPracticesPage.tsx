<<<<<<< HEAD
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
=======
import { bestPractices as allPractices } from '../data/best-practices';
import { BestPracticeCard } from '../components/BestPracticeCard';
import { Header } from '../components/Header';
import type { BestPractice } from '../types/best-practice';
>>>>>>> origin/main

interface BestPracticesPageProps {
  /** Injectable for tests; defaults to the full best-practices catalog. */
  source?: BestPractice[];
}

export function BestPracticesPage({ source = allPractices }: BestPracticesPageProps) {
<<<<<<< HEAD
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
=======
  return (
    <main className="best-practices-page">
      <Header
        title="Front-End Best Practices"
        subtitle="Practical guidelines for building accessible, performant, and maintainable web applications."
      />
      <p className="best-practices-page__count" role="status">
        {source.length} best practices
      </p>
      <ul className="best-practice-list" aria-label="Best practices">
        {source.map((practice) => (
          <li key={practice.slug}>
            <BestPracticeCard practice={practice} />
          </li>
        ))}
      </ul>
>>>>>>> origin/main
    </main>
  );
}
