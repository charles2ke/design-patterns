import { Header } from '../components/Header';
import {
  INTERVIEW_CATEGORIES,
  interviewQuestions,
  type InterviewQuestion,
} from '../data/interview-questions';

function QuestionCard({ question, index }: { question: InterviewQuestion; index: number }) {
  const headingId = `interview-${question.slug}`;

  return (
    <article className="interview-page__question" aria-labelledby={headingId}>
      <h3 id={headingId}>
        {index + 1}. {question.title}
      </h3>
      <p className="interview-page__prompt">{question.question}</p>
      <p className="interview-page__why">
        <strong>Why it is tough:</strong> {question.whyItIsHard}
      </p>
      <details className="interview-page__solution">
        <summary>Show complete solution</summary>
        {question.solution.map((section) => (
          <div key={section.heading} className="interview-page__solution-section">
            <h4>{section.heading}</h4>
            <ul>
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
        <figure className="interview-page__example">
          <figcaption className="interview-page__example-label">
            {question.code.label}
          </figcaption>
          <pre>
            <code>{question.code.code}</code>
          </pre>
        </figure>
        <h4>Likely follow-up questions</h4>
        <ul>
          {question.followUps.map((followUp) => (
            <li key={followUp}>{followUp}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

export function InterviewQuestionsPage() {
  return (
    <main className="interview-page">
      <Header
        title="Tough Interview Questions"
        subtitle="The hardest design pattern and system design questions asked in senior engineering interviews, with complete worked solutions."
      />
      <section className="interview-page__section">
        <h2>How to use this page</h2>
        <p>
          Read each question and sketch your own answer first — talk through requirements,
          trade-offs and failure modes out loud as you would in an interview. Then expand the
          solution to compare it with a complete reference answer, a working code sample and the
          follow-up questions interviewers typically ask next.
        </p>
      </section>
      {INTERVIEW_CATEGORIES.map((category) => (
        <section key={category} className="interview-page__section">
          <h2>{category} questions</h2>
          {interviewQuestions
            .filter((question) => question.category === category)
            .map((question, index) => (
              <QuestionCard key={question.slug} question={question} index={index} />
            ))}
        </section>
      ))}
    </main>
  );
}
