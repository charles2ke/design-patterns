import { Header } from '../components/Header';
import { CodeExamples } from '../components/CodeExamples';
import { patterns as allPatterns } from '../data/patterns';
import { findPatternDetail } from '../data/pattern-details';
import { findPatternExample } from '../data/pattern-examples';
import { patternDetailHash } from '../routes';
import type { Pattern } from '../types/pattern';

interface PatternDetailPageProps {
  slug: string;
  /** Injectable for tests; defaults to the full GoF catalog. */
  source?: Pattern[];
}

interface ListSectionProps {
  title: string;
  items: string[];
  className: string;
}

function ListSection({ title, items, className }: ListSectionProps) {
  const headingId = `${className}-title`;

  return (
    <section className="pattern-detail__section" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <ul className={className}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function PatternDetailPage({
  slug,
  source = allPatterns,
}: PatternDetailPageProps) {
  const pattern = source.find((candidate) => candidate.slug === slug);
  const detail = pattern ? findPatternDetail(pattern.slug) : undefined;

  if (!pattern || !detail) {
    return (
      <main className="pattern-detail">
        <Header
          title="Pattern not found"
          subtitle="That pattern is not part of the Gang of Four catalog."
        />
        <a className="page-link" href="#/">
          Back to all patterns
        </a>
      </main>
    );
  }

  const example = findPatternExample(pattern.slug);
  const related = detail.related
    .map((relatedSlug) => source.find((item) => item.slug === relatedSlug))
    .filter((item): item is Pattern => item !== undefined);

  return (
    <main className="pattern-detail">
      <a className="page-link" href="#/">
        Back to all patterns
      </a>
      <Header title={pattern.name} subtitle={pattern.intent} />
      <p className="pattern-detail__category">{pattern.category}</p>

      <section
        className="pattern-detail__section"
        aria-labelledby="pattern-detail-usage-title"
      >
        <h2 id="pattern-detail-usage-title">When to use it</h2>
        <p>
          <strong>Use when:</strong> {pattern.useWhen}
        </p>
        <p>
          <strong>Avoid when:</strong> {detail.whenNotToUse}
        </p>
        <p>
          <strong>Real world:</strong> {detail.realWorld}
        </p>
      </section>

      <section
        className="pattern-detail__section"
        aria-labelledby="pattern-detail-flow-title"
      >
        <h2 id="pattern-detail-flow-title">Visual flow</h2>
        <ol className="pattern-flow">
          {pattern.flow.map((step, index) => (
            <li className="pattern-flow__step" key={`${index}-${step}`}>
              <div className="pattern-flow__content">
                <span className="pattern-flow__marker" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="pattern-detail__section"
        aria-labelledby="pattern-detail-participants-title"
      >
        <h2 id="pattern-detail-participants-title">Participants</h2>
        <dl className="pattern-detail__participants">
          {detail.participants.map((participant) => (
            <div key={participant.name}>
              <dt>{participant.name}</dt>
              <dd>{participant.role}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="pattern-detail__trade-offs">
        <ListSection
          title="Benefits"
          items={detail.pros}
          className="pattern-detail__pros"
        />
        <ListSection
          title="Costs"
          items={detail.cons}
          className="pattern-detail__cons"
        />
      </div>

      <ListSection
        title="Common pitfalls"
        items={detail.pitfalls}
        className="pattern-detail__pitfalls"
      />

      {example ? (
        <section
          className="pattern-detail__section"
          aria-labelledby="pattern-detail-examples-title"
        >
          <h2 id="pattern-detail-examples-title">Code examples</h2>
          <CodeExamples example={example} />
        </section>
      ) : null}

      <section
        className="pattern-detail__section"
        aria-labelledby="pattern-detail-related-title"
      >
        <h2 id="pattern-detail-related-title">Related patterns</h2>
        <ul className="pattern-detail__related">
          {related.map((item) => (
            <li key={item.slug}>
              <a className="page-link" href={patternDetailHash(item.slug)}>
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
