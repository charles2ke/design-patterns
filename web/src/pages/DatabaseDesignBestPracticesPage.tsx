import { Header } from '../components/Header';

const bestPractices = [
  {
    title: 'Model around real business entities',
    description:
      'Start with clear entities, relationships, and ownership rules so data maps to the domain and stays understandable.',
  },
  {
    title: 'Normalize first, denormalize with evidence',
    description:
      'Use normalization to avoid duplicate facts, then denormalize only when profiling proves a specific query bottleneck.',
  },
  {
    title: 'Define constraints close to the data',
    description:
      'Enforce primary keys, foreign keys, unique constraints, and check constraints in the database to protect integrity.',
  },
  {
    title: 'Design indexes for real query patterns',
    description:
      'Create indexes based on frequent filters, joins, and sort operations; monitor index usage to remove dead weight.',
  },
  {
    title: 'Plan for auditing and lifecycle changes',
    description:
      'Include created/updated metadata, soft-delete strategies, and schema migration paths from the beginning.',
  },
];

export function DatabaseDesignBestPracticesPage() {
  return (
    <main className="database-design-page">
      <Header
        title="Database Design Best Practices"
        subtitle="Practical guidelines for building scalable, maintainable, and reliable data models."
      />
      <p>
        <a
          className="page-link"
          href="./"
          aria-label="Back to design patterns index"
        >
          Back to Design Patterns Index
        </a>
      </p>
      <section aria-label="Database design best practices">
        <ol className="database-design-page__list">
          {bestPractices.map((practice) => (
            <li key={practice.title} className="database-design-page__item">
              <h2>{practice.title}</h2>
              <p>{practice.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
