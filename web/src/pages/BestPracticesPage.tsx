import { bestPractices as allPractices } from '../data/best-practices';
import { BestPracticeCard } from '../components/BestPracticeCard';
import { Header } from '../components/Header';
import type { BestPractice } from '../types/best-practice';

interface BestPracticesPageProps {
  /** Injectable for tests; defaults to the full best-practices catalog. */
  source?: BestPractice[];
}

export function BestPracticesPage({ source = allPractices }: BestPracticesPageProps) {
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
    </main>
  );
}
