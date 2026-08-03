import type { Pattern } from '../types/pattern';

interface PatternCardProps {
  pattern: Pattern;
}

export function PatternCard({ pattern }: PatternCardProps) {
  return (
    <article
      id={`pattern-${pattern.slug}`}
      className="pattern-card"
      data-testid={`pattern-${pattern.slug}`}
    >
      <h2 className="pattern-card__title">
        <span className="pattern-card__id">{pattern.id}.</span> {pattern.name}
      </h2>
      <span className="pattern-card__category">{pattern.category}</span>
      <p className="pattern-card__intent">
        <strong>Intent:</strong> {pattern.intent}
      </p>
      <p className="pattern-card__use-when">
        <strong>Use when:</strong> {pattern.useWhen}
      </p>
    </article>
  );
}
