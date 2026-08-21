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
      <div className="pattern-card__flow">
        <h3
          className="pattern-card__flow-title"
          id={`${pattern.slug}-flow-title`}
        >
          Visual flow
        </h3>
        {/* Preserve VoiceOver/Safari list semantics when list-style is removed. */}
        <ol
          className="pattern-flow"
          aria-labelledby={`${pattern.slug}-flow-title`}
          role="list"
        >
          {pattern.flow.map((step, index) => (
            <li className="pattern-flow__step" key={`${pattern.slug}-${index}`}>
              <span className="pattern-flow__marker" aria-hidden="true">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
