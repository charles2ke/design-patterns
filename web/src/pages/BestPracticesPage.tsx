import { useEffect, useMemo, useState } from 'react';
import { bestPractices as allPractices } from '../data/best-practices';
import { AiFirstBestPracticesPage } from './AiFirstBestPracticesPage';
import { BackendBestPracticesPage } from './BackendBestPracticesPage';
import { BestPracticeCard } from '../components/BestPracticeCard';
import { DatabaseDesignBestPracticesPage } from './DatabaseDesignBestPracticesPage';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import {
  AI_FIRST_BEST_PRACTICES_HASH,
  BACKEND_BEST_PRACTICES_HASH,
  DATABASE_DESIGN_BEST_PRACTICES_HASH,
} from '../routes';
import type { BestPractice } from '../types/best-practice';

type BestPracticesSection = 'front-end' | 'backend' | 'database-design' | 'ai-first';

function sectionFromHash(hash: string): BestPracticesSection {
  if (hash === BACKEND_BEST_PRACTICES_HASH) return 'backend';
  if (hash === DATABASE_DESIGN_BEST_PRACTICES_HASH) return 'database-design';
  if (hash === AI_FIRST_BEST_PRACTICES_HASH) return 'ai-first';
  return 'front-end';
}

const SECTIONS: Array<{ id: BestPracticesSection; label: string; hash: string }> = [
  { id: 'front-end', label: 'Front-End', hash: '#/best-practices' },
  { id: 'backend', label: 'Backend', hash: BACKEND_BEST_PRACTICES_HASH },
  {
    id: 'database-design',
    label: 'Database Design',
    hash: DATABASE_DESIGN_BEST_PRACTICES_HASH,
  },
  { id: 'ai-first', label: 'AI First', hash: AI_FIRST_BEST_PRACTICES_HASH },
];

interface BestPracticesPageProps {
  /** Injectable for tests; defaults to the full best-practices catalog. */
  source?: BestPractice[];
}

function FrontEndBestPractices({ source }: { source: BestPractice[] }) {
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
    <>
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
    </>
  );
}

export function BestPracticesPage({ source = allPractices }: BestPracticesPageProps) {
  const [section, setSection] = useState<BestPracticesSection>(() =>
    sectionFromHash(window.location.hash),
  );

  useEffect(() => {
    const handler = () => setSection(sectionFromHash(window.location.hash));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <main className="best-practices-page">
      <nav className="best-practices-subnav" aria-label="Best practices categories">
        {SECTIONS.map((item) => (
          <a
            key={item.id}
            href={item.hash}
            className="best-practices-subnav__link"
            aria-current={section === item.id ? 'page' : undefined}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </a>
        ))}
      </nav>
      {section === 'front-end' && <FrontEndBestPractices source={source} />}
      {section === 'backend' && <BackendBestPracticesPage />}
      {section === 'database-design' && <DatabaseDesignBestPracticesPage />}
      {section === 'ai-first' && <AiFirstBestPracticesPage />}
    </main>
  );
}
