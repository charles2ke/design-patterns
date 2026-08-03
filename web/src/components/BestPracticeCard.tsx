import type { BestPractice } from '../types/best-practice';

interface BestPracticeCardProps {
  practice: BestPractice;
}

export function BestPracticeCard({ practice }: BestPracticeCardProps) {
  return (
    <article
      id={`practice-${practice.slug}`}
      className="best-practice-card"
      data-testid={`practice-${practice.slug}`}
    >
      <h2 className="best-practice-card__title">
        <span className="best-practice-card__id">{practice.id}.</span>{' '}
        {practice.title}
      </h2>
      <span className="best-practice-card__category">{practice.category}</span>
      <p className="best-practice-card__summary">
        <strong>What:</strong> {practice.summary}
      </p>
      <p className="best-practice-card__why">
        <strong>Why:</strong> {practice.why}
      </p>
    </article>
  );
}
