import { useMemo, useState } from 'react';
import { Header } from '../components/Header';

interface QuizOption {
  id: string;
  label: string;
}

interface QuizQuestion {
  id: number;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt:
      'Which pattern ensures only one object instance exists and provides global access to it?',
    options: [
      { id: 'a', label: 'Singleton' },
      { id: 'b', label: 'Builder' },
      { id: 'c', label: 'Decorator' },
      { id: 'd', label: 'Mediator' },
    ],
    correctOptionId: 'a',
  },
  {
    id: 2,
    prompt:
      'Which structural pattern wraps an object to add behavior dynamically at runtime?',
    options: [
      { id: 'a', label: 'Facade' },
      { id: 'b', label: 'Decorator' },
      { id: 'c', label: 'Flyweight' },
      { id: 'd', label: 'Bridge' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 3,
    prompt:
      'Which behavioral pattern lets multiple handlers process a request in sequence?',
    options: [
      { id: 'a', label: 'Observer' },
      { id: 'b', label: 'Strategy' },
      { id: 'c', label: 'Chain of Responsibility' },
      { id: 'd', label: 'Template Method' },
    ],
    correctOptionId: 'c',
  },
  {
    id: 4,
    prompt:
      'When you need interchangeable algorithms selected at runtime, which pattern fits best?',
    options: [
      { id: 'a', label: 'Prototype' },
      { id: 'b', label: 'Strategy' },
      { id: 'c', label: 'Proxy' },
      { id: 'd', label: 'Visitor' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 5,
    prompt:
      'Which pattern captures and restores object state to support undo/rollback?',
    options: [
      { id: 'a', label: 'Memento' },
      { id: 'b', label: 'Interpreter' },
      { id: 'c', label: 'Adapter' },
      { id: 'd', label: 'Factory Method' },
    ],
    correctOptionId: 'a',
  },
  {
    id: 6,
    prompt:
      'Which creational pattern separates the construction of a complex object from its representation?',
    options: [
      { id: 'a', label: 'Builder' },
      { id: 'b', label: 'Singleton' },
      { id: 'c', label: 'Observer' },
      { id: 'd', label: 'Composite' },
    ],
    correctOptionId: 'a',
  },
  {
    id: 7,
    prompt:
      'Which pattern converts the interface of a class into another interface clients expect?',
    options: [
      { id: 'a', label: 'Proxy' },
      { id: 'b', label: 'Adapter' },
      { id: 'c', label: 'Command' },
      { id: 'd', label: 'State' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 8,
    prompt:
      'Which pattern notifies dependent objects automatically whenever the subject changes state?',
    options: [
      { id: 'a', label: 'Iterator' },
      { id: 'b', label: 'Abstract Factory' },
      { id: 'c', label: 'Observer' },
      { id: 'd', label: 'Facade' },
    ],
    correctOptionId: 'c',
  },
  {
    id: 9,
    prompt:
      'Which structural pattern offers a simplified entry point to a complex subsystem?',
    options: [
      { id: 'a', label: 'Bridge' },
      { id: 'b', label: 'Facade' },
      { id: 'c', label: 'Mediator' },
      { id: 'd', label: 'Prototype' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 10,
    prompt:
      'Which creational pattern builds new objects by cloning an existing instance?',
    options: [
      { id: 'a', label: 'Prototype' },
      { id: 'b', label: 'Factory Method' },
      { id: 'c', label: 'Flyweight' },
      { id: 'd', label: 'Strategy' },
    ],
    correctOptionId: 'a',
  },
  {
    id: 11,
    prompt:
      'Which structural pattern decouples an abstraction from its implementation so both can vary independently?',
    options: [
      { id: 'a', label: 'Decorator' },
      { id: 'b', label: 'Composite' },
      { id: 'c', label: 'Bridge' },
      { id: 'd', label: 'Memento' },
    ],
    correctOptionId: 'c',
  },
  {
    id: 12,
    prompt:
      'Which pattern supplies a placeholder that controls access to another object?',
    options: [
      { id: 'a', label: 'Proxy' },
      { id: 'b', label: 'Adapter' },
      { id: 'c', label: 'Builder' },
      { id: 'd', label: 'Interpreter' },
    ],
    correctOptionId: 'a',
  },
  {
    id: 13,
    prompt:
      'Which pattern reduces memory use by sharing intrinsic state across many similar objects?',
    options: [
      { id: 'a', label: 'Singleton' },
      { id: 'b', label: 'Flyweight' },
      { id: 'c', label: 'Command' },
      { id: 'd', label: 'Visitor' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 14,
    prompt:
      'Which behavioral pattern defines an algorithm skeleton in a base class and defers steps to subclasses?',
    options: [
      { id: 'a', label: 'State' },
      { id: 'b', label: 'Iterator' },
      { id: 'c', label: 'Mediator' },
      { id: 'd', label: 'Template Method' },
    ],
    correctOptionId: 'd',
  },
  {
    id: 15,
    prompt:
      'Which behavioral pattern adds new operations to an object structure without modifying its classes?',
    options: [
      { id: 'a', label: 'Visitor' },
      { id: 'b', label: 'Observer' },
      { id: 'c', label: 'Chain of Responsibility' },
      { id: 'd', label: 'Decorator' },
    ],
    correctOptionId: 'a',
  },
];

const PRIZES = [
  '$100',
  '$200',
  '$300',
  '$500',
  '$1,000',
  '$2,000',
  '$4,000',
  '$8,000',
  '$16,000',
  '$32,000',
  '$64,000',
  '$125,000',
  '$250,000',
  '$500,000',
  '$1,000,000',
];

const CONFETTI_PIECES = Array.from({ length: 20 }, (_, index) => index);

function winningsForLoss(questionIndex: number): string {
  if (questionIndex === 0) return '$0';
  return PRIZES[questionIndex - 1];
}

export function QuizPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    QUESTIONS[0].options[0].id,
  );
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [winnings, setWinnings] = useState('$0');

  const question = QUESTIONS[questionIndex];
  const questionLabel = useMemo(
    () => `Question ${questionIndex + 1} of ${QUESTIONS.length}`,
    [questionIndex],
  );

  function handleLockAnswer() {
    const isCorrect = selectedOptionId === question.correctOptionId;
    if (isCorrect && questionIndex === QUESTIONS.length - 1) {
      setWinnings(PRIZES[questionIndex]);
      setGameState('won');
      return;
    }

    if (isCorrect) {
      const nextQuestionIndex = questionIndex + 1;
      setQuestionIndex(nextQuestionIndex);
      setSelectedOptionId(QUESTIONS[nextQuestionIndex].options[0].id);
      setWinnings(PRIZES[questionIndex]);
      return;
    }

    setWinnings(winningsForLoss(questionIndex));
    setGameState('lost');
  }

  function restartGame() {
    setQuestionIndex(0);
    setSelectedOptionId(QUESTIONS[0].options[0].id);
    setGameState('playing');
    setWinnings('$0');
  }

  return (
    <main className="quiz-page">
      <Header
        title="Who Wants to Be a Pattern Architect?"
        subtitle="A modern millionaire-style challenge about design patterns."
      />
      <section className="quiz-layout" aria-label="Design patterns quiz">
        <article className="quiz-card" aria-live="polite">
          <p className="quiz-card__meta">
            {gameState === 'playing' ? questionLabel : 'Final result'}
          </p>
          {gameState === 'playing' ? (
            <>
              <h2 className="quiz-card__question">{question.prompt}</h2>
              <ul className="quiz-options" aria-label="Answer options">
                {question.options.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      className="quiz-option"
                      aria-pressed={selectedOptionId === option.id}
                      onClick={() => setSelectedOptionId(option.id)}
                    >
                      <span className="quiz-option__letter">{option.id.toUpperCase()}</span>
                      <span>{option.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="quiz-lock-button"
                onClick={handleLockAnswer}
              >
                Lock answer
              </button>
            </>
          ) : (
            <div
              className={
                gameState === 'won' ? 'quiz-result quiz-result--won' : 'quiz-result'
              }
            >
              {gameState === 'won' ? (
                <div className="quiz-celebration" aria-hidden="true">
                  {CONFETTI_PIECES.map((piece) => (
                    <span
                      key={piece}
                      className="quiz-celebration__piece"
                      style={{
                        left: `${(piece * 100) / CONFETTI_PIECES.length}%`,
                        animationDelay: `${(piece % 5) * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              ) : null}
              <h2>{gameState === 'won' ? 'You won the top prize!' : 'Game over!'}</h2>
              {gameState === 'won' ? (
                <p className="quiz-result__cheer">Congratulations, Pattern Architect!</p>
              ) : null}
              <p>You leave with {winnings}.</p>
              <button type="button" className="quiz-lock-button" onClick={restartGame}>
                Play again
              </button>
            </div>
          )}
        </article>
        <aside className="quiz-ladder" aria-label="Prize ladder">
          <h2>Prize Ladder</h2>
          <ol>
            {PRIZES.map((prize, index) => {
              const isCurrent = questionIndex === index && gameState === 'playing';
              const isReached = index < questionIndex || (gameState === 'won' && index <= questionIndex);
              return (
                <li
                  key={prize}
                  className={
                    isCurrent
                      ? 'quiz-ladder__item quiz-ladder__item--current'
                      : isReached
                        ? 'quiz-ladder__item quiz-ladder__item--reached'
                        : 'quiz-ladder__item'
                  }
                >
                  <span>Q{index + 1}</span>
                  <strong>{prize}</strong>
                </li>
              );
            })}
          </ol>
        </aside>
      </section>
    </main>
  );
}
