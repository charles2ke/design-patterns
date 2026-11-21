import type { SystemDesignQuestion } from '../types/system-design';

interface SystemDesignQuestionCardProps {
  question: SystemDesignQuestion;
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function SystemDesignQuestionCard({ question }: SystemDesignQuestionCardProps) {
  const id = `system-design-${question.slug}`;
  const { requirements, architecture, code } = question;

  return (
    <article className="system-design-card" aria-labelledby={`${id}-title`}>
      <div className="system-design-card__header">
        <h3 id={`${id}-title`}>{question.title}</h3>
        <span
          className={`difficulty-badge difficulty-badge--${question.difficulty.toLowerCase()}`}
        >
          {question.difficulty}
        </span>
      </div>
      <div className="system-design-card__companies">
        <span id={`${id}-companies`} className="system-design-card__label">
          Reported at
        </span>
        <ul className="company-chips" aria-labelledby={`${id}-companies`}>
          {question.companies.map((company) => (
            <li key={company} className="company-chip">
              {company}
            </li>
          ))}
        </ul>
      </div>
      <p className="system-design-card__prompt">{question.prompt}</p>
      <h4>What interviewers look for</h4>
      <BulletList items={question.signals} />
      <details className="system-design-card__solution">
        <summary>Show detailed solution</summary>
        <section className="system-design-card__step">
          <h4>1. Requirements</h4>
          <h5>Functional</h5>
          <BulletList items={requirements.functional} />
          <h5>Non-functional</h5>
          <BulletList items={requirements.nonFunctional} />
          <h5>Out of scope</h5>
          <BulletList items={requirements.outOfScope} />
        </section>
        <section className="system-design-card__step">
          <h4>2. Back-of-the-envelope estimates</h4>
          <BulletList items={question.estimates} />
        </section>
        <section className="system-design-card__step">
          <h4>3. API</h4>
          <pre
            className="system-design-card__pre"
            tabIndex={0}
            role="region"
            aria-label={`${question.title}: API`}
          >
            <code>{question.api}</code>
          </pre>
        </section>
        <section className="system-design-card__step">
          <h4>4. Data model</h4>
          <pre
            className="system-design-card__pre"
            tabIndex={0}
            role="region"
            aria-label={`${question.title}: data model`}
          >
            <code>{question.dataModel}</code>
          </pre>
        </section>
        <section className="system-design-card__step">
          <h4>5. High-level architecture</h4>
          <pre
            className="system-design-card__pre system-design-card__diagram"
            tabIndex={0}
            role="img"
            aria-label={`${question.title}: architecture diagram, described by the request flow below`}
          >
            {architecture.diagram}
          </pre>
          <h5>Request flow</h5>
          <ol>
            {architecture.flow.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section className="system-design-card__step">
          <h4>6. Deep dives</h4>
          {question.deepDives.map((section) => (
            <div key={section.heading}>
              <h5>{section.heading}</h5>
              <BulletList items={section.points} />
            </div>
          ))}
        </section>
        <section className="system-design-card__step">
          <h4>7. Trade-offs</h4>
          <div
            className="system-design-card__table"
            tabIndex={0}
            role="region"
            aria-label={`${question.title}: trade-offs`}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Decision</th>
                  <th scope="col">Choice</th>
                  <th scope="col">Why</th>
                </tr>
              </thead>
              <tbody>
                {question.tradeOffs.map((tradeOff) => (
                  <tr key={tradeOff.decision}>
                    <th scope="row">{tradeOff.decision}</th>
                    <td>{tradeOff.choice}</td>
                    <td>{tradeOff.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="system-design-card__step">
          <h4>8. Failure modes</h4>
          <BulletList items={question.failureModes} />
        </section>
        <section className="system-design-card__step">
          <h4>9. Reference code</h4>
          <figure className="system-design-card__code">
            <figcaption>
              {code.label} <span className="system-design-card__language">({code.language})</span>
            </figcaption>
            <pre
              className="system-design-card__pre"
              tabIndex={0}
              role="region"
              aria-label={`${question.title}: ${code.label}`}
            >
              <code>{code.code}</code>
            </pre>
          </figure>
        </section>
        <section className="system-design-card__step">
          <h4>10. Follow-up questions</h4>
          <dl className="system-design-card__follow-ups">
            {question.followUps.map((followUp) => (
              <div key={followUp.question}>
                <dt>{followUp.question}</dt>
                <dd>{followUp.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </details>
    </article>
  );
}
