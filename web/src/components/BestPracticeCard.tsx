import type { BestPractice } from '../types/bestPractice';

interface BestPracticeCardProps {
  practice: BestPractice;
}

export function BestPracticeCard({ practice }: BestPracticeCardProps) {
  return (
    <article
      id={`practice-${practice.slug}`}
      className="practice-card"
      data-testid={`practice-${practice.slug}`}
    >
      <h2 className="practice-card__title">
        <span className="practice-card__id">{practice.id}.</span>{' '}
        {practice.title}
      </h2>
      <span className="practice-card__category">{practice.category}</span>
      <p className="practice-card__description">
        <strong>Practice:</strong> {practice.description}
      </p>
      <p className="practice-card__rationale">
        <strong>Why it matters:</strong> {practice.rationale}
      </p>
    </article>
  );
}
