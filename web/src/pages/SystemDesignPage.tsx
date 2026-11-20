import { EmptyState } from '../components/EmptyState';
import { FilterButtonGroup } from '../components/FilterButtonGroup';
import { Header } from '../components/Header';
import { SystemDesignQuestionCard } from '../components/SystemDesignQuestionCard';
import {
  DIFFICULTY_DESCRIPTIONS,
  ESTIMATION_CHEAT_SHEET,
  INTERVIEW_FRAMEWORK,
  systemDesignQuestions,
} from '../data/system-design-questions';
import { useSystemDesignFilters } from '../hooks/useSystemDesignFilters';
import { INTERVIEW_QUESTIONS_HASH } from '../routes';
import {
  SYSTEM_DESIGN_DIFFICULTIES,
  type SystemDesignQuestion,
} from '../types/system-design';
import { COMPANY_FILTERS, DIFFICULTY_FILTERS } from '../utils/filterSystemDesignQuestions';

interface SystemDesignPageProps {
  source?: readonly SystemDesignQuestion[];
}

export function SystemDesignPage({ source = systemDesignQuestions }: SystemDesignPageProps) {
  const { difficulty, company, visibleQuestions, setDifficulty, setCompany, reset } =
    useSystemDesignFilters(source);

  const levels = SYSTEM_DESIGN_DIFFICULTIES.map((level) => ({
    level,
    questions: visibleQuestions.filter((question) => question.difficulty === level),
  })).filter(({ questions }) => questions.length > 0);

  return (
    <main className="system-design-page">
      <Header
        title="System Design Interview Questions"
        subtitle="Frequently reported system design prompts from Google, Amazon, Microsoft, Meta, OpenAI, Anthropic, Apple and other companies, grouped by difficulty with detailed solutions."
      />
      <section className="system-design-page__section" aria-labelledby="system-design-how-to">
        <h2 id="system-design-how-to">How to use this page</h2>
        <p>
          Pick a question, give yourself 45 minutes and design it out loud before opening the
          solution. Each solution follows the same steps as a real interview: requirements,
          estimates, API and data model, architecture, deep dives, trade-offs, failure modes, a
          small piece of reference code and the follow-up questions interviewers tend to ask.
        </p>
        <p className="system-design-page__note">
          <strong>About the company tags:</strong> companies do not publish their interview
          questions. The tags show where candidates have publicly reported a prompt, or a close
          variant, in interview write-ups and prep communities. Prompts vary by team and change
          over time, so treat the tags as a guide, not a guarantee.
        </p>
        <p>
          Looking for design-pattern questions instead? See the{' '}
          <a href={INTERVIEW_QUESTIONS_HASH}>Interview Questions</a> page.
        </p>
      </section>
      <div className="system-design-page__guides">
        <section
          className="system-design-page__section"
          aria-labelledby="system-design-framework"
        >
          <h2 id="system-design-framework">A 45-minute answer framework</h2>
          <ol className="system-design-page__framework">
            {INTERVIEW_FRAMEWORK.map(({ step, minutes, goal }) => (
              <li key={step}>
                <strong>{step}</strong>{' '}
                <span className="system-design-page__minutes">({minutes})</span>: {goal}
              </li>
            ))}
          </ol>
        </section>
        <section
          className="system-design-page__section"
          aria-labelledby="system-design-estimates"
        >
          <h2 id="system-design-estimates">Estimation cheat sheet</h2>
          <ul>
            {ESTIMATION_CHEAT_SHEET.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>
      <div className="system-design-page__filters">
        <FilterButtonGroup
          label="Difficulty"
          options={DIFFICULTY_FILTERS}
          value={difficulty}
          onChange={setDifficulty}
        />
        <FilterButtonGroup
          label="Company"
          options={COMPANY_FILTERS}
          value={company}
          onChange={setCompany}
        />
      </div>
      <p className="system-design-page__count" role="status">
        Showing {visibleQuestions.length} of {source.length} questions
      </p>
      {levels.length === 0 ? (
        <EmptyState onReset={reset} message="No questions match your filters." />
      ) : (
        levels.map(({ level, questions }) => (
          <section
            key={level}
            className="system-design-page__section"
            aria-labelledby={`system-design-level-${level.toLowerCase()}`}
          >
            <h2 id={`system-design-level-${level.toLowerCase()}`}>{level}</h2>
            <p className="system-design-page__level-description">
              {questions.length} {questions.length === 1 ? 'question' : 'questions'}.{' '}
              {DIFFICULTY_DESCRIPTIONS[level]}
            </p>
            {questions.map((question) => (
              <SystemDesignQuestionCard key={question.slug} question={question} />
            ))}
          </section>
        ))
      )}
    </main>
  );
}
