import { useMemo, useState } from 'react';
import { bestPractices as allPractices } from '../data/best-practices';
import { BestPracticeCard } from '../components/BestPracticeCard';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import type { BestPractice } from '../types/best-practice';

interface BestPracticesPageProps {
  /** Injectable for tests; defaults to the full best-practices catalog. */
  source?: BestPractice[];
}

export function BestPracticesPage({ source = allPractices }: BestPracticesPageProps) {
  const [query, setQuery] = useState('');

  const visiblePractices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return source;
    return source.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.summary.toLowerCase().includes(needle) ||
        p.why.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle),
    );
  }, [source, query]);

  return (
    <main className="best-practices-page">
      <Header
        title="Front-End Best Practices"
        subtitle="Practical guidelines for building accessible, performant, and maintainable web applications."
      />
      <SearchBar
        value={query}
        onChange={setQuery}
        label="Search practices"
        id="practice-search"
        placeholder="Search by title, category or keyword"
      />
      <p className="best-practices-page__count" role="status">
        {visiblePractices.length} of {source.length} best practices
      </p>
      {visiblePractices.length > 0 ? (
        <ul className="best-practice-list" aria-label="Best practices">
          {visiblePractices.map((practice) => (
            <li key={practice.slug}>
              <BestPracticeCard practice={practice} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState onReset={() => setQuery('')} message="No practices match your search." />
      )}
    </main>
  );
}
